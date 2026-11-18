<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends ApiController
{
    /**
     * POST /api/attendance
     *
     * Upserts attendance for a batch. `records` is an array of
     * { student_id, status } entries.
     */
    public function store(Request $request): JsonResponse
    {
        $batchId = $request->input('batch_id');
        $classDate = $request->input('class_date');
        $records = $request->input('records');

        if (! $batchId || ! $classDate || ! is_array($records) || count($records) === 0) {
            throw new ApiException('batch_id, class_date, and non-empty records array are required');
        }

        $date = $this->dateOnly($classDate);
        $trainerId = $request->input('marked_by_trainer_id') ?: null;
        $saved = [];

        foreach ($records as $item) {
            // Normalize 'Present - Online' to PRESENT_ONLINE.
            $status = strtoupper(trim((string) ($item['status'] ?? '')));
            $status = preg_replace('/\s*-\s*/', '_', $status);
            $status = preg_replace('/\s+/', '_', $status);

            DB::insert(
                'INSERT INTO attendance (batch_id, student_id, class_date, status, marked_by_trainer_id)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    marked_by_trainer_id = VALUES(marked_by_trainer_id)',
                [$batchId, $item['student_id'], $date, $status, $trainerId]
            );

            $saved[] = DB::selectOne(
                'SELECT * FROM attendance
                 WHERE batch_id = ? AND student_id = ? AND class_date = ?',
                [$batchId, $item['student_id'], $date]
            );
        }

        return response()->json([
            'success' => true,
            'count' => count($saved),
            'data' => $saved,
        ], 201);
    }

    /**
     * GET /api/batches/{id}/attendance
     */
    public function batchSheet(Request $request, string $id): JsonResponse
    {
        $query = 'SELECT a.*, u.name AS student_name, u.mobile_number
                  FROM attendance a
                  INNER JOIN students s ON a.student_id = s.student_id
                  INNER JOIN users u ON s.user_id = u.id
                  WHERE a.batch_id = ?';

        $bindings = [$id];

        if ($request->filled('date')) {
            $query .= ' AND a.class_date = ?';
            $bindings[] = $this->dateOnly($request->query('date'));
        }

        $query .= ' ORDER BY a.class_date DESC, u.name ASC';

        return $this->ok(DB::select($query, $bindings));
    }
}
