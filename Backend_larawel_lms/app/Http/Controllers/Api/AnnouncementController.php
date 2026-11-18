<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnnouncementController extends ApiController
{
    /**
     * GET /api/batches/{id}/announcements
     */
    public function index(string $id): JsonResponse
    {
        $rows = DB::select(
            'SELECT a.*, u.name AS author_name, u.role AS author_role
             FROM announcements a
             INNER JOIN users u ON a.created_by_user_id = u.id
             WHERE a.batch_id = ?
             ORDER BY a.is_pinned DESC, a.created_at DESC',
            [$id]
        );

        return $this->ok($rows);
    }

    /**
     * POST /api/announcements
     */
    public function store(Request $request): JsonResponse
    {
        $batchId = $request->input('batch_id');
        $userId = $request->input('created_by_user_id');
        $title = $request->input('title');
        $content = $request->input('content');

        if (! $batchId || ! $userId || ! $title || ! $content) {
            throw new ApiException('batch_id, created_by_user_id, title, and content are required');
        }

        DB::insert(
            'INSERT INTO announcements (batch_id, created_by_user_id, title, content, is_pinned)
             VALUES (?, ?, ?, ?, ?)',
            [$batchId, $userId, $title, $content, $this->bit($request->input('is_pinned'))]
        );

        $announcement = DB::selectOne(
            'SELECT * FROM announcements WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($announcement, 201);
    }
}
