<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BatchController extends ApiController
{
    /**
     * GET /api/batches
     */
    public function index(Request $request): JsonResponse
    {
        $includeInactive = $request->query('include_inactive') === '1';

        $query = 'SELECT b.id, b.batch_code, b.start_date, b.end_date, b.is_active, b.created_at,
                         c.id AS course_id, c.course_name,
                         t.trainer_id, u.name AS trainer_name
                  FROM batches b
                  INNER JOIN courses c ON b.course_id = c.id
                  INNER JOIN trainers t ON b.trainer_id = t.trainer_id
                  INNER JOIN users u ON t.user_id = u.id
                  WHERE (? = 1 OR b.is_active = 1)';

        $bindings = [$includeInactive ? 1 : 0];

        if ($request->filled('trainer_id')) {
            $query .= ' AND t.trainer_id = ?';
            $bindings[] = (int) $request->query('trainer_id');
        }

        $query .= ' ORDER BY b.id DESC';

        return $this->ok(DB::select($query, $bindings));
    }

    /**
     * POST /api/batches
     */
    public function store(Request $request): JsonResponse
    {
        $batchCode = trim((string) $request->input('batch_code', ''));
        $courseId = $request->input('course_id');
        $trainerId = $request->input('trainer_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        if ($batchCode === '' || ! $courseId || ! $trainerId || ! $startDate || ! $endDate) {
            throw new ApiException('All fields (batch_code, course_id, trainer_id, start_date, end_date) are required.');
        }

        $course = DB::selectOne('SELECT id FROM courses WHERE id = ?', [$courseId]);

        if (! $course) {
            throw new ApiException("Course with ID {$courseId} does not exist.", 404);
        }

        $trainer = DB::selectOne(
            'SELECT trainer_id FROM trainers WHERE trainer_id = ?',
            [$trainerId]
        );

        if (! $trainer) {
            throw new ApiException("Trainer with ID {$trainerId} does not exist.", 404);
        }

        $existing = DB::selectOne(
            'SELECT id FROM batches WHERE batch_code = ?',
            [$batchCode]
        );

        if ($existing) {
            throw new ApiException("Batch code '{$batchCode}' already exists.");
        }

        DB::insert(
            'INSERT INTO batches (batch_code, course_id, trainer_id, start_date, end_date)
             VALUES (?, ?, ?, ?, ?)',
            [
                $batchCode,
                $courseId,
                $trainerId,
                $this->dateOnly($startDate),
                $this->dateOnly($endDate),
            ]
        );

        $batch = DB::selectOne(
            'SELECT id, batch_code, course_id, trainer_id, start_date, end_date
             FROM batches WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($batch, 201);
    }

    /**
     * GET /api/batches/{id}
     */
    public function show(string $id): JsonResponse
    {
        $batch = DB::selectOne(
            'SELECT b.id, b.batch_code, b.start_date, b.end_date, b.is_active, b.created_at,
                    c.id AS course_id, c.course_name, c.duration_days,
                    t.trainer_id, u.name AS trainer_name, u.mobile_number AS trainer_mobile
             FROM batches b
             INNER JOIN courses c ON b.course_id = c.id
             INNER JOIN trainers t ON b.trainer_id = t.trainer_id
             INNER JOIN users u ON t.user_id = u.id
             WHERE b.id = ?',
            [$id]
        );

        if (! $batch) {
            throw new ApiException('Batch not found', 404);
        }

        return $this->ok($batch);
    }

    /**
     * PUT /api/batches/{id}/status
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $batch = DB::selectOne('SELECT id FROM batches WHERE id = ?', [$id]);

        if (! $batch) {
            throw new ApiException('Batch not found', 404);
        }

        DB::update(
            'UPDATE batches SET is_active = ? WHERE id = ?',
            [$this->bit($request->input('is_active')), $id]
        );

        return $this->ok(DB::selectOne('SELECT * FROM batches WHERE id = ?', [$id]));
    }

    /**
     * GET /api/batches/{id}/students
     */
    public function students(string $id): JsonResponse
    {
        $rows = DB::select(
            'SELECT s.student_id, s.joining_date, s.certification_status,
                    u.id AS user_id, u.name, u.mobile_number, bs.assigned_at
             FROM batch_students bs
             INNER JOIN students s ON bs.student_id = s.student_id
             INNER JOIN users u ON s.user_id = u.id
             WHERE bs.batch_id = ?
             ORDER BY u.name ASC',
            [$id]
        );

        return $this->ok($rows);
    }

    /**
     * DELETE /api/batches/{id}/students
     */
    public function removeStudents(Request $request, string $id): JsonResponse
    {
        $studentIds = $request->input('student_ids');

        if (! is_array($studentIds) || count($studentIds) === 0) {
            throw new ApiException('student_ids must be a non-empty array');
        }

        foreach ($studentIds as $studentId) {
            DB::delete(
                'DELETE FROM batch_students WHERE batch_id = ? AND student_id = ?',
                [$id, $studentId]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Students removed from batch successfully',
        ]);
    }

    /**
     * POST /api/batches/assign-student
     */
    public function assignStudents(Request $request): JsonResponse
    {
        $batchId = $request->input('batch_id');
        $studentIds = $request->input('student_ids');

        if (! $batchId || ! is_array($studentIds) || count($studentIds) === 0) {
            throw new ApiException('Both batch_id and a non-empty student_ids array are required.');
        }

        $batch = DB::selectOne('SELECT id FROM batches WHERE id = ?', [$batchId]);

        if (! $batch) {
            throw new ApiException("Batch with ID {$batchId} does not exist.", 404);
        }

        $assigned = [];
        $skipped = [];

        foreach ($studentIds as $studentId) {
            $student = DB::selectOne(
                'SELECT student_id FROM students WHERE student_id = ?',
                [$studentId]
            );

            if (! $student) {
                $skipped[] = ['student_id' => $studentId, 'reason' => 'Student ID not found'];

                continue;
            }

            $duplicate = DB::selectOne(
                'SELECT id FROM batch_students WHERE batch_id = ? AND student_id = ?',
                [$batchId, $studentId]
            );

            if ($duplicate) {
                $skipped[] = ['student_id' => $studentId, 'reason' => 'Already assigned to this batch'];

                continue;
            }

            DB::insert(
                'INSERT INTO batch_students (batch_id, student_id) VALUES (?, ?)',
                [$batchId, $studentId]
            );

            $assigned[] = $studentId;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'batch_id' => $batchId,
                'assigned_student_ids' => $assigned,
                'skipped' => $skipped,
            ],
        ], 201);
    }
}
