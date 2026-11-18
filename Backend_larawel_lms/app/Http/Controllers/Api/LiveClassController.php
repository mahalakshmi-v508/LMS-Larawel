<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LiveClassController extends ApiController
{
    /**
     * POST /api/live-classes
     */
    public function store(Request $request): JsonResponse
    {
        $batchId = $request->input('batch_id');
        $topic = $request->input('class_topic');
        $link = $request->input('teams_meeting_link');
        $startTime = $request->input('start_time');
        $endTime = $request->input('end_time');

        if (! $batchId || ! $topic || ! $link || ! $startTime || ! $endTime) {
            throw new ApiException('batch_id, class_topic, teams_meeting_link, start_time, and end_time are required');
        }

        DB::insert(
            'INSERT INTO live_classes
                (batch_id, course_day_id, class_topic, teams_meeting_link, start_time, end_time, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                $batchId,
                $request->input('course_day_id') ?: null,
                $topic,
                $link,
                $this->dateTime($startTime),
                $this->dateTime($endTime),
                'SCHEDULED',
            ]
        );

        $liveClass = DB::selectOne(
            'SELECT * FROM live_classes WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($liveClass, 201);
    }

    /**
     * GET /api/batches/{id}/live-classes
     */
    public function index(string $id): JsonResponse
    {
        $rows = DB::select(
            'SELECT lc.*, cd.day_number, cd.title AS day_title
             FROM live_classes lc
             LEFT JOIN course_days cd ON lc.course_day_id = cd.id
             WHERE lc.batch_id = ?
             ORDER BY lc.start_time DESC',
            [$id]
        );

        return $this->ok($rows);
    }

    /**
     * PUT /api/live-classes/{id}/status
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $status = $request->input('status');

        if (! $status) {
            throw new ApiException('status is required');
        }

        $existing = DB::selectOne('SELECT id FROM live_classes WHERE id = ?', [$id]);

        if (! $existing) {
            throw new ApiException('Live class not found', 404);
        }

        DB::update('UPDATE live_classes SET status = ? WHERE id = ?', [$status, $id]);

        return $this->ok(DB::selectOne('SELECT * FROM live_classes WHERE id = ?', [$id]));
    }

    /**
     * POST /api/live-classes/{id}/recordings
     */
    public function storeRecording(Request $request, string $id): JsonResponse
    {
        $storagePath = $request->input('storage_blob_path');

        if (! $storagePath) {
            throw new ApiException('storage_blob_path is required');
        }

        DB::insert(
            'INSERT INTO class_recordings
                (live_class_id, storage_blob_path, duration_minutes, expiry_date, is_available)
             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 60 DAY), 1)',
            [$id, $storagePath, $request->input('duration_minutes') ?: null]
        );

        $recording = DB::selectOne(
            'SELECT * FROM class_recordings WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($recording, 201);
    }

    /**
     * GET /api/batches/{id}/recordings
     */
    public function recordings(string $id): JsonResponse
    {
        $rows = DB::select(
            'SELECT cr.*, lc.class_topic, lc.start_time AS class_start_time, cd.day_number
             FROM class_recordings cr
             INNER JOIN live_classes lc ON cr.live_class_id = lc.id
             LEFT JOIN course_days cd ON lc.course_day_id = cd.id
             WHERE lc.batch_id = ?
               AND cr.is_available = 1
               AND cr.expiry_date >= NOW()
             ORDER BY cr.created_at DESC',
            [$id]
        );

        return $this->ok($rows);
    }
}
