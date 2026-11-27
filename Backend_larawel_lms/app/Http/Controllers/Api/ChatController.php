<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends ApiController
{
    public function storeDirect(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sender_user_id' => ['required', 'integer'],
            'recipient_user_id' => ['required', 'integer', 'different:sender_user_id'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $sender = DB::table('users')->where('id', $validated['sender_user_id'])->first();
        $recipient = DB::table('users')->where('id', $validated['recipient_user_id'])->first();

        if (! $sender || ! $recipient) {
            throw new ApiException('Sender or recipient account was not found.', 404);
        }

        $id = DB::table('direct_messages')->insertGetId([
            'sender_user_id' => $validated['sender_user_id'],
            'recipient_user_id' => $validated['recipient_user_id'],
            'message' => trim($validated['message']),
            'sent_at' => now(),
        ]);

        return $this->ok(DB::table('direct_messages')
            ->where('id', $id)
            ->first(), 201);
    }

    public function directMessages(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_a' => ['required', 'integer'],
            'user_b' => ['required', 'integer'],
        ]);

        $rows = DB::table('direct_messages as dm')
            ->join('users as sender', 'sender.id', '=', 'dm.sender_user_id')
            ->leftJoin('users as recipient', 'recipient.id', '=', 'dm.recipient_user_id')
            ->where(function ($query) use ($validated) {
                $query->where(function ($pair) use ($validated) {
                    $pair->where('dm.sender_user_id', $validated['user_a'])
                        ->where('dm.recipient_user_id', $validated['user_b']);
                })->orWhere(function ($pair) use ($validated) {
                    $pair->where('dm.sender_user_id', $validated['user_b'])
                        ->where('dm.recipient_user_id', $validated['user_a']);
                });
            })
            ->select(
                'dm.*',
                'sender.name as sender_name',
                'sender.role as sender_role',
                'recipient.name as recipient_name'
            )
            ->orderBy('dm.sent_at')
            ->get();

        return $this->ok($rows);
    }

    public function directConversations(string $userId): JsonResponse
    {
        $rows = DB::table('direct_messages as dm')
            ->where('dm.sender_user_id', $userId)
            ->orWhere('dm.recipient_user_id', $userId)
            ->get();

        $counterpartIds = collect($rows)
            ->flatMap(fn ($row) => [(int) $row->sender_user_id, (int) $row->recipient_user_id])
            ->filter(fn ($id) => $id !== (int) $userId)
            ->unique()
            ->values();

        $users = $counterpartIds->isEmpty()
            ? collect()
            : DB::table('users')->whereIn('id', $counterpartIds)->get();

        return $this->ok($users);
    }

    public function allDirectConversations(): JsonResponse
    {
        $rows = DB::table('direct_messages as dm')
            ->join('users as sender', 'sender.id', '=', 'dm.sender_user_id')
            ->join('users as recipient', 'recipient.id', '=', 'dm.recipient_user_id')
            ->select(
                'dm.sender_user_id',
                'dm.recipient_user_id',
                'sender.name as sender_name',
                'sender.role as sender_role',
                'recipient.name as recipient_name',
                'recipient.role as recipient_role'
            )
            ->orderByDesc('dm.sent_at')
            ->get();

        $conversations = [];
        foreach ($rows as $row) {
            $ids = [(int) $row->sender_user_id, (int) $row->recipient_user_id];
            sort($ids);
            $key = implode('-', $ids);
            if (! isset($conversations[$key])) {
                $conversations[$key] = [
                    'key' => $key,
                    'user_a' => $ids[0],
                    'user_b' => $ids[1],
                    'sender_name' => $row->sender_name,
                    'sender_role' => $row->sender_role,
                    'recipient_name' => $row->recipient_name,
                    'recipient_role' => $row->recipient_role,
                ];
            }
        }

        return $this->ok(array_values($conversations));
    }
    /**
     * POST /api/batches/{id}/chat-room
     */
    public function configure(Request $request, string $id): JsonResponse
    {
        DB::insert(
            'INSERT INTO chat_rooms (batch_id, is_active, active_from, active_until)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                is_active = VALUES(is_active),
                active_from = VALUES(active_from),
                active_until = VALUES(active_until)',
            [
                $id,
                $request->has('is_active') ? $this->bit($request->input('is_active')) : 1,
                $this->dateTime($request->input('active_from')),
                $this->dateTime($request->input('active_until')),
            ]
        );

        return $this->ok(DB::selectOne(
            'SELECT * FROM chat_rooms WHERE batch_id = ?',
            [$id]
        ));
    }

    /**
     * GET /api/batches/{id}/chat-room
     */
    public function show(string $id): JsonResponse
    {
        $room = DB::selectOne(
            'SELECT cr.*,
                    CASE
                        WHEN cr.is_active = 1
                             AND (cr.active_from IS NULL OR cr.active_from <= NOW())
                             AND (cr.active_until IS NULL OR cr.active_until >= NOW())
                        THEN 1 ELSE 0
                    END AS is_currently_open
             FROM chat_rooms cr
             WHERE cr.batch_id = ?',
            [$id]
        );

        if (! $room) {
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'Chat room not yet initialized for this batch',
            ]);
        }

        return $this->ok($room);
    }

    /**
     * POST /api/chat-rooms/{id}/messages
     */
    public function storeMessage(Request $request, string $id): JsonResponse
    {
        $senderId = $request->input('sender_user_id');
        $message = $request->input('message');

        if (! $senderId || ! $message) {
            throw new ApiException('sender_user_id and message are required');
        }

        $room = DB::selectOne(
            'SELECT cr.*,
                    CASE
                        WHEN cr.is_active = 1
                             AND (cr.active_from IS NULL OR cr.active_from <= NOW())
                             AND (cr.active_until IS NULL OR cr.active_until >= NOW())
                        THEN 1 ELSE 0
                    END AS is_currently_open
             FROM chat_rooms cr
             WHERE cr.id = ?',
            [$id]
        );

        if (! $room) {
            throw new ApiException('Chat room not found', 404);
        }

        if ((int) $room->is_currently_open !== 1) {
            throw new ApiException('Chat is currently closed by the trainer or class timer has expired.', 403);
        }

        DB::insert(
            'INSERT INTO chat_messages (chat_room_id, sender_user_id, message) VALUES (?, ?, ?)',
            [$id, $senderId, $message]
        );

        return $this->ok(DB::selectOne(
            'SELECT * FROM chat_messages WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        ), 201);
    }

    /**
     * GET /api/chat-rooms/{id}/messages
     */
    public function messages(string $id): JsonResponse
    {
        $rows = DB::select(
            'SELECT cm.*, u.name AS sender_name, u.role AS sender_role
             FROM chat_messages cm
             INNER JOIN users u ON cm.sender_user_id = u.id
             WHERE cm.chat_room_id = ?
             ORDER BY cm.sent_at ASC',
            [$id]
        );

        return $this->ok($rows);
    }
}
