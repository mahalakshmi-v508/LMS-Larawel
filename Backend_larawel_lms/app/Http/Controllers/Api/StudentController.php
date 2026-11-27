<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentController extends ApiController
{
    /**
     * GET /api/admin/students
     */
    public function index(): JsonResponse
    {
        $rows = DB::select(
            "SELECT
                s.student_id,
                s.user_id,
                s.joining_date,
                s.certification_status,
                u.name,
                u.email,
                u.mobile_number,
                u.account_id,
                u.is_active,
                b.id AS batch_id,
                b.batch_code,
                c.id AS course_id,
                c.course_name
             FROM students s
             INNER JOIN users u ON s.user_id = u.id
             LEFT JOIN batch_students bs_latest ON bs_latest.id = (
                 SELECT bs2.id
                 FROM batch_students bs2
                 WHERE bs2.student_id = s.student_id
                 ORDER BY bs2.assigned_at DESC, bs2.id DESC
                 LIMIT 1
             )
             LEFT JOIN batches b ON b.id = bs_latest.batch_id
             LEFT JOIN courses c ON b.course_id = c.id
             WHERE UPPER(u.role) = 'STUDENT'
             ORDER BY u.name ASC"
        );

        return $this->ok($rows);
    }

    /**
     * POST /api/students
     */
    public function store(Request $request): JsonResponse
    {
        $userId = $request->input('user_id');
        $joiningDate = $request->input('joining_date');
        $certificationStatus = $request->input('certification_status') ?: 'PENDING';

        $user = DB::selectOne('SELECT id, role FROM users WHERE id = ?', [$userId]);

        if (! $user) {
            throw new ApiException(
                "User with id {$userId} does not exist. Please create the user first.",
                404
            );
        }

        if (strtoupper((string) $user->role) !== 'STUDENT') {
            throw new ApiException('A student profile can only be created for a user with the STUDENT role.');
        }

        $existing = DB::selectOne(
            'SELECT student_id FROM students WHERE user_id = ?',
            [$userId]
        );

        if ($existing) {
            throw new ApiException("A student profile already exists for user_id {$userId}.");
        }

        DB::insert(
            'INSERT INTO students (user_id, joining_date, certification_status) VALUES (?, ?, ?)',
            [$userId, $this->dateOnly($joiningDate), $certificationStatus]
        );

        $student = DB::selectOne(
            'SELECT * FROM students WHERE student_id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($student, 201);
    }

    /**
     * GET /api/students/{id}
     */
    public function show(string $id): JsonResponse
    {
        $student = DB::selectOne(
            'SELECT s.student_id, s.joining_date, s.certification_status,
                    u.id AS user_id, u.name, u.mobile_number, u.role, u.is_active
             FROM students s
             INNER JOIN users u ON s.user_id = u.id
             WHERE s.student_id = ?',
            [$id]
        );

        if (! $student) {
            throw new ApiException('Student not found', 404);
        }

        return $this->ok($student);
    }

    /**
     * PUT /api/students/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $student = DB::selectOne(
            'SELECT user_id FROM students WHERE student_id = ?',
            [$id]
        );

        if (! $student) {
            throw new ApiException('Student not found', 404);
        }

        DB::update(
            'UPDATE users SET name = ?, mobile_number = ?, is_active = ? WHERE id = ?',
            [
                $request->input('name'),
                $request->input('mobile_number'),
                $this->bit($request->input('is_active')),
                $student->user_id,
            ]
        );

        DB::update(
            'UPDATE students SET joining_date = ?, certification_status = ? WHERE student_id = ?',
            [
                $this->dateOnly($request->input('joining_date')),
                $request->input('certification_status'),
                $id,
            ]
        );

        $updated = DB::selectOne('SELECT * FROM students WHERE student_id = ?', [$id]);

        return $this->ok($updated);
    }

    /**
     * PUT /api/students/{id}/batch
     */
    public function updateBatch(Request $request, string $id): JsonResponse
    {
        $batchId = $request->input('batch_id');

        if (! $batchId) {
            DB::delete('DELETE FROM batch_students WHERE student_id = ?', [$id]);

            return response()->json([
                'success' => true,
                'message' => 'Student removed from batch successfully',
            ]);
        }

        $batch = DB::selectOne(
            'SELECT id FROM batches WHERE id = ? AND is_active = 1',
            [$batchId]
        );

        if (! $batch) {
            throw new ApiException('Active batch not found', 404);
        }

        DB::delete('DELETE FROM batch_students WHERE student_id = ?', [$id]);
        DB::insert(
            'INSERT INTO batch_students (batch_id, student_id) VALUES (?, ?)',
            [$batchId, $id]
        );

        return response()->json([
            'success' => true,
            'message' => 'Student batch updated successfully',
        ]);
    }

    /**
     * GET /api/students/{id}/admin-details
     */
    public function adminDetails(string $id): JsonResponse
    {
        $profile = DB::selectOne(
            'SELECT s.student_id, s.user_id, s.joining_date, s.certification_status,
                    u.name, u.mobile_number, u.is_active,
                    b.id AS batch_id, b.batch_code, c.course_name
             FROM students s
             INNER JOIN users u ON s.user_id = u.id
             LEFT JOIN batch_students bs_latest ON bs_latest.id = (
                 SELECT bs2.id
                 FROM batch_students bs2
                 WHERE bs2.student_id = s.student_id
                 ORDER BY bs2.assigned_at DESC, bs2.id DESC
                 LIMIT 1
             )
             LEFT JOIN batches b ON b.id = bs_latest.batch_id
             LEFT JOIN courses c ON b.course_id = c.id
             WHERE s.student_id = ?',
            [$id]
        );

        if (! $profile) {
            throw new ApiException('Student not found', 404);
        }

        $attendance = DB::select(
            'SELECT a.*, b.batch_code
             FROM attendance a
             INNER JOIN batches b ON a.batch_id = b.id
             WHERE a.student_id = ?
             ORDER BY a.class_date DESC',
            [$id]
        );

        $assignments = DB::select(
            'SELECT a.id, a.title, a.due_date, sub.submitted_at, sub.marks_obtained
             FROM assignments a
             INNER JOIN batch_students bs ON a.batch_id = bs.batch_id
             LEFT JOIN assignment_submissions sub
                 ON sub.assignment_id = a.id AND sub.student_id = ?
             WHERE bs.student_id = ?
             ORDER BY a.due_date DESC',
            [$id, $id]
        );

        $tests = DB::select(
            'SELECT t.id, t.title, t.total_marks, sub.submitted_at, sub.marks_obtained
             FROM tests t
             INNER JOIN batch_students bs ON t.batch_id = bs.batch_id
             LEFT JOIN test_submissions sub
                 ON sub.test_id = t.id AND sub.student_id = ?
             WHERE bs.student_id = ?
             ORDER BY t.start_time DESC',
            [$id, $id]
        );

        $certificates = DB::select(
            CertificateController::SELECT.' WHERE cert.student_id = ? ORDER BY cert.issued_at DESC',
            [$id]
        );

        return $this->ok([
            'profile' => $profile,
            'attendance' => $attendance,
            'assignments' => $assignments,
            'tests' => $tests,
            'certificates' => array_map(
                [CertificateController::class, 'mapRow'],
                $certificates
            ),
        ]);
    }

    /**
     * GET /api/students/{id}/attendance
     */
    public function attendance(string $id): JsonResponse
    {
        $records = DB::select(
            'SELECT a.*, b.batch_code
             FROM attendance a
             INNER JOIN batches b ON a.batch_id = b.id
             WHERE a.student_id = ?
             ORDER BY a.class_date DESC',
            [$id]
        );

        $total = count($records);
        $present = 0;

        foreach ($records as $record) {
            $status = strtoupper(trim((string) $record->status));
            $status = preg_replace('/[\s-]+/', '_', $status);

            if ($status === 'PRESENT_ONLINE' || $status === 'PRESENT_OFFLINE') {
                $present++;
            }
        }

        $percentage = $total > 0 ? round(($present / $total) * 100, 2) : 0;

        return response()->json([
            'success' => true,
            'total_classes' => $total,
            'present_classes' => $present,
            'attendance_percentage' => $percentage,
            'data' => $records,
        ]);
    }

    /**
     * GET /api/students/{id}/submissions
     */
    public function submissions(string $id): JsonResponse
    {
        $assignments = DB::select(
            'SELECT sub.*, a.title AS assignment_title, a.due_date, a.batch_id
             FROM assignment_submissions sub
             INNER JOIN assignments a ON sub.assignment_id = a.id
             WHERE sub.student_id = ?
             ORDER BY sub.submitted_at DESC',
            [$id]
        );

        $tests = DB::select(
            'SELECT ts.*, t.title AS test_title, t.subject, t.total_marks, t.batch_id
             FROM test_submissions ts
             INNER JOIN tests t ON ts.test_id = t.id
             WHERE ts.student_id = ?
             ORDER BY ts.submitted_at DESC',
            [$id]
        );

        return $this->ok([
            'assignments' => $assignments,
            'tests' => $tests,
        ]);
    }
}
