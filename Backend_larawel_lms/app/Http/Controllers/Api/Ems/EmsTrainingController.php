<?php

namespace App\Http\Controllers\Api\Ems;

use App\Exceptions\ApiException;
use App\Http\Controllers\Api\ApiController;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmsTrainingController extends ApiController
{
    /**
     * POST /api/ems/trainings/assign
     *
     * The LMS <-> EMS bridge: assign a course/batch to an employee.
     */
    public function assign(Request $request): JsonResponse
    {
        $employeeId = $request->input('employee_id');
        $courseId = $request->input('course_id');

        if (! $employeeId || ! $courseId) {
            throw new ApiException('employee_id and course_id are required');
        }

        $employee = DB::selectOne(
            'SELECT e.id, e.user_id, s.student_id
             FROM ems_employees e
             LEFT JOIN students s ON e.user_id = s.user_id
             WHERE e.id = ?',
            [$employeeId]
        );

        if (! $employee) {
            throw new ApiException('Employee not found', 404);
        }

        $studentId = $employee->student_id;

        if (! $studentId) {
            DB::insert(
                'INSERT INTO students (user_id, joining_date, certification_status) VALUES (?, ?, ?)',
                [$employee->user_id, Carbon::today()->toDateString(), 'PENDING']
            );

            $studentId = (int) DB::getPdo()->lastInsertId();
        }

        $batchId = $request->input('batch_id') ?: null;
        $trainingType = $request->input('training_type') ?: 'ONBOARDING';
        $deadline = $this->dateOnly($request->input('completion_deadline'));

        // MySQL treats NULL values as distinct inside UNIQUE keys, so resolve
        // the "match including a NULL batch_id" case explicitly.
        $existing = DB::selectOne(
            'SELECT id
             FROM ems_employee_trainings
             WHERE employee_id = ?
               AND course_id = ?
               AND (batch_id = ? OR (batch_id IS NULL AND ? IS NULL))
             LIMIT 1',
            [$employeeId, $courseId, $batchId, $batchId]
        );

        if ($existing) {
            DB::update(
                'UPDATE ems_employee_trainings
                 SET training_type = ?, completion_deadline = ?
                 WHERE id = ?',
                [$trainingType, $deadline, $existing->id]
            );

            $trainingId = $existing->id;
        } else {
            DB::insert(
                "INSERT INTO ems_employee_trainings
                    (employee_id, course_id, batch_id, training_type, completion_deadline, status, progress_percentage)
                 VALUES (?, ?, ?, ?, ?, 'ENROLLED', 0.00)",
                [$employeeId, $courseId, $batchId, $trainingType, $deadline]
            );

            $trainingId = DB::getPdo()->lastInsertId();
        }

        // Enroll in batch_students so the LMS student view activates the batch.
        if ($batchId) {
            DB::insert(
                'INSERT IGNORE INTO batch_students (batch_id, student_id) VALUES (?, ?)',
                [$batchId, $studentId]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Training assigned to employee successfully',
            'data' => DB::selectOne('SELECT * FROM ems_employee_trainings WHERE id = ?', [$trainingId]),
        ], 201);
    }

    /**
     * GET /api/ems/trainings/employee/{id}
     */
    public function employeeProgress(string $id): JsonResponse
    {
        $employee = DB::selectOne(
            'SELECT e.id AS employee_id, e.user_id, u.name, s.student_id
             FROM ems_employees e
             JOIN users u ON e.user_id = u.id
             LEFT JOIN students s ON e.user_id = s.user_id
             WHERE e.id = ?',
            [$id]
        );

        if (! $employee) {
            throw new ApiException('Employee not found', 404);
        }

        $studentId = $employee->student_id;

        $trainings = DB::select(
            'SELECT et.*, c.course_name, c.duration_days,
                    b.batch_code, b.start_date AS batch_start_date, b.end_date AS batch_end_date
             FROM ems_employee_trainings et
             JOIN courses c ON et.course_id = c.id
             LEFT JOIN batches b ON et.batch_id = b.id
             WHERE et.employee_id = ?',
            [$id]
        );

        $result = [];

        foreach ($trainings as $training) {
            $attendanceCount = 0;
            $totalSessions = 0;
            $assignmentsSubmitted = 0;
            $totalAssignments = 0;
            $testSubmissions = 0;
            $certificateIssued = false;

            if ($training->batch_id && $studentId) {
                $attendance = DB::selectOne(
                    "SELECT COUNT(*) AS total_records,
                            SUM(CASE WHEN status IN ('PRESENT_ONLINE', 'PRESENT_OFFLINE') THEN 1 ELSE 0 END) AS present_count
                     FROM attendance
                     WHERE student_id = ? AND batch_id = ?",
                    [$studentId, $training->batch_id]
                );

                $attendanceCount = (int) ($attendance->present_count ?? 0);
                $totalSessions = (int) ($attendance->total_records ?? 0);

                $assignments = DB::selectOne(
                    'SELECT
                        (SELECT COUNT(*) FROM assignments WHERE batch_id = ?) AS total_assignments,
                        (SELECT COUNT(*) FROM assignment_submissions sub
                         JOIN assignments a ON sub.assignment_id = a.id
                         WHERE a.batch_id = ? AND sub.student_id = ?) AS submitted_assignments',
                    [$training->batch_id, $training->batch_id, $studentId]
                );

                $totalAssignments = (int) ($assignments->total_assignments ?? 0);
                $assignmentsSubmitted = (int) ($assignments->submitted_assignments ?? 0);

                $testCount = DB::selectOne(
                    'SELECT COUNT(*) AS test_count
                     FROM test_submissions ts
                     JOIN tests t ON ts.test_id = t.id
                     WHERE t.batch_id = ? AND ts.student_id = ?',
                    [$training->batch_id, $studentId]
                );

                $testSubmissions = (int) ($testCount->test_count ?? 0);

                $certificate = DB::selectOne(
                    'SELECT pdf_url, issued_at
                     FROM certificates
                     WHERE student_id = ? AND batch_id = ?',
                    [$studentId, $training->batch_id]
                );

                $certificateIssued = (bool) $certificate;
            }

            $attendancePercentage = $totalSessions > 0
                ? (int) round(($attendanceCount / $totalSessions) * 100)
                : 0;

            $assignmentPercentage = $totalAssignments > 0
                ? (int) round(($assignmentsSubmitted / $totalAssignments) * 100)
                : 0;

            $overallProgress = $totalAssignments > 0
                ? (int) round(($attendancePercentage * 0.5) + ($assignmentPercentage * 0.5))
                : $attendancePercentage;

            $result[] = [
                ...(array) $training,
                'metrics' => [
                    'attendance_percentage' => $attendancePercentage,
                    'attended_sessions' => $attendanceCount,
                    'total_sessions' => $totalSessions,
                    'assignments_submitted' => $assignmentsSubmitted,
                    'total_assignments' => $totalAssignments,
                    'tests_completed' => $testSubmissions,
                    'certificate_issued' => $certificateIssued,
                    'overall_progress' => $overallProgress,
                ],
            ];
        }

        return $this->ok([
            'employee_id' => (int) $id,
            'employee_name' => $employee->name,
            'trainings' => $result,
        ]);
    }

    /**
     * GET /api/ems/trainings/summary
     */
    public function summary(): JsonResponse
    {
        $overview = DB::selectOne(
            "SELECT
                COUNT(DISTINCT e.id) AS total_employees,
                COUNT(DISTINCT et.employee_id) AS employees_in_training,
                COUNT(DISTINCT et.id) AS total_training_enrollments,
                SUM(CASE WHEN et.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_trainings,
                SUM(CASE WHEN et.status IN ('ENROLLED', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS active_trainings,
                SUM(CASE WHEN et.certification_issued = 1 THEN 1 ELSE 0 END) AS certificates_earned
             FROM ems_employees e
             LEFT JOIN ems_employee_trainings et ON e.id = et.employee_id
             WHERE e.status = 'ACTIVE'"
        );

        $departments = DB::select(
            'SELECT
                d.name AS department_name,
                COUNT(DISTINCT e.id) AS department_headcount,
                COUNT(DISTINCT et.employee_id) AS employees_trained,
                AVG(IFNULL(et.progress_percentage, 0)) AS avg_progress
             FROM ems_departments d
             LEFT JOIN ems_employees e ON d.id = e.department_id AND e.status = \'ACTIVE\'
             LEFT JOIN ems_employee_trainings et ON e.id = et.employee_id
             GROUP BY d.name
             ORDER BY department_headcount DESC'
        );

        return $this->ok([
            'overview' => [
                'total_employees' => (int) ($overview->total_employees ?? 0),
                'employees_in_training' => (int) ($overview->employees_in_training ?? 0),
                'total_training_enrollments' => (int) ($overview->total_training_enrollments ?? 0),
                'completed_trainings' => (int) ($overview->completed_trainings ?? 0),
                'active_trainings' => (int) ($overview->active_trainings ?? 0),
                'certificates_earned' => (int) ($overview->certificates_earned ?? 0),
            ],
            'department_breakdown' => array_map(fn (object $department) => [
                ...(array) $department,
                'department_headcount' => (int) $department->department_headcount,
                'employees_trained' => (int) $department->employees_trained,
                'avg_progress' => round((float) $department->avg_progress, 2),
            ], $departments),
        ]);
    }
}
