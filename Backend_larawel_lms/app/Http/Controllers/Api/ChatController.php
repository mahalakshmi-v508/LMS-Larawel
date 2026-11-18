<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends ApiController
{
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
