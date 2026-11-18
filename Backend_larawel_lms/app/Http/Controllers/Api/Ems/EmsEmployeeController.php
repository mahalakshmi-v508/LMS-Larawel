<?php

namespace App\Http\Controllers\Api\Ems;

use App\Exceptions\ApiException;
use App\Http\Controllers\Api\ApiController;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmsEmployeeController extends ApiController
{
    /**
     * GET /api/ems/employees
     */
    public function index(Request $request): JsonResponse
    {
        $query = 'SELECT
                    e.id,
                    e.user_id,
                    e.employee_code,
                    u.name,
                    u.mobile_number,
                    u.role AS user_role,
                    e.work_email,
                    e.employment_type,
                    e.status,
                    e.date_of_joining,
                    e.salary_monthly,
                    d.id AS department_id,
                    d.name AS department_name,
                    d.code AS department_code,
                    des.id AS designation_id,
                    des.title AS designation_title,
                    des.grade_level,
                    m.name AS reporting_manager_name,
                    (
                        SELECT COUNT(*)
                        FROM ems_employee_trainings et
                        WHERE et.employee_id = e.id
                    ) AS enrolled_trainings_count,
                    (
                        SELECT c.course_name
                        FROM ems_employee_trainings et
                        JOIN courses c ON et.course_id = c.id
                        WHERE et.employee_id = e.id
                        ORDER BY et.id DESC
                        LIMIT 1
                    ) AS current_course_name
                  FROM ems_employees e
                  JOIN users u ON e.user_id = u.id
                  JOIN ems_departments d ON e.department_id = d.id
                  JOIN ems_designations des ON e.designation_id = des.id
                  LEFT JOIN ems_employees mgr_emp ON e.reporting_manager_id = mgr_emp.id
                  LEFT JOIN users m ON mgr_emp.user_id = m.id
                  WHERE 1=1';

        $bindings = [];

        if ($request->filled('department_id')) {
            $query .= ' AND e.department_id = ?';
            $bindings[] = (int) $request->query('department_id');
        }

        if ($request->filled('status')) {
            $query .= ' AND e.status = ?';
            $bindings[] = (string) $request->query('status');
        }

        if ($request->filled('search')) {
            $query .= ' AND (u.name LIKE ? OR e.employee_code LIKE ? OR e.work_email LIKE ? OR u.mobile_number LIKE ?)';
            $term = '%'.$request->query('search').'%';
            array_push($bindings, $term, $term, $term, $term);
        }

        $query .= ' ORDER BY e.id DESC';

        return $this->ok(DB::select($query, $bindings));
    }

    /**
     * GET /api/ems/employees/{id}
     */
    public function show(string $id): JsonResponse
    {
        $employee = DB::selectOne(
            'SELECT
                e.*,
                u.name,
                u.mobile_number,
                u.role AS user_role,
                d.name AS department_name,
                d.code AS department_code,
                des.title AS designation_title,
                des.grade_level,
                m.name AS reporting_manager_name
             FROM ems_employees e
             JOIN users u ON e.user_id = u.id
             JOIN ems_departments d ON e.department_id = d.id
             JOIN ems_designations des ON e.designation_id = des.id
             LEFT JOIN ems_employees mgr_emp ON e.reporting_manager_id = mgr_emp.id
             LEFT JOIN users m ON mgr_emp.user_id = m.id
             WHERE e.id = ?',
            [$id]
        );

        if (! $employee) {
            throw new ApiException('Employee not found', 404);
        }

        $trainings = DB::select(
            'SELECT
                et.*,
                c.course_name,
                c.duration_days,
                b.batch_code,
                b.start_date AS batch_start_date,
                b.end_date AS batch_end_date
             FROM ems_employee_trainings et
             JOIN courses c ON et.course_id = c.id
             LEFT JOIN batches b ON et.batch_id = b.id
             WHERE et.employee_id = ?
             ORDER BY et.id DESC',
            [$id]
        );

        $attendance = DB::select(
            'SELECT * FROM ems_attendance
             WHERE employee_id = ?
             ORDER BY attendance_date DESC
             LIMIT 10',
            [$id]
        );

        $leaves = DB::select(
            'SELECT * FROM ems_leaves
             WHERE employee_id = ?
             ORDER BY from_date DESC
             LIMIT 10',
            [$id]
        );

        return $this->ok([
            ...(array) $employee,
            'trainings' => $trainings,
            'recent_attendance' => $attendance,
            'recent_leaves' => $leaves,
        ]);
    }

    /**
     * POST /api/ems/employees
     *
     * Onboards an employee, creating the user + student profile at once.
     */
    public function store(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $mobile = trim((string) $request->input('mobile_number', ''));
        $departmentId = $request->input('department_id');
        $designationId = $request->input('designation_id');

        if ($name === '' || $mobile === '' || ! $departmentId || ! $designationId) {
            throw new ApiException('Name, mobile_number, department_id, and designation_id are required.');
        }

        $dateOfJoining = $this->dateOnly($request->input('date_of_joining'), Carbon::today()->toDateString());

        $result = DB::transaction(function () use ($request, $name, $mobile, $departmentId, $designationId, $dateOfJoining) {
            // 1. Reuse the user when the mobile number already exists.
            $existingUser = DB::selectOne(
                'SELECT id, role FROM users WHERE mobile_number = ?',
                [$mobile]
            );

            if ($existingUser) {
                $userId = (int) $existingUser->id;

                $existingEmployee = DB::selectOne(
                    'SELECT id FROM ems_employees WHERE user_id = ?',
                    [$userId]
                );

                if ($existingEmployee) {
                    throw new ApiException("An employee profile already exists for mobile number {$mobile}.");
                }
            } else {
                DB::insert(
                    'INSERT INTO users (name, mobile_number, role) VALUES (?, ?, ?)',
                    [$name, $mobile, 'EMPLOYEE']
                );

                $userId = (int) DB::getPdo()->lastInsertId();
            }

            // 2. Ensure an LMS student profile exists so the employee can use the classroom.
            $student = DB::selectOne(
                'SELECT student_id FROM students WHERE user_id = ?',
                [$userId]
            );

            if (! $student) {
                DB::insert(
                    'INSERT INTO students (user_id, joining_date, certification_status) VALUES (?, ?, ?)',
                    [$userId, $dateOfJoining, 'PENDING']
                );

                $studentId = (int) DB::getPdo()->lastInsertId();
            } else {
                $studentId = (int) $student->student_id;
            }

            // 3. Generate a unique employee code: EMP-{DEPT_CODE}-{YEAR}-{AUTO_ID}
            $department = DB::selectOne(
                'SELECT code FROM ems_departments WHERE id = ?',
                [$departmentId]
            );

            $departmentCode = $department->code ?? 'ORG';
            $year = date('Y');

            $total = (int) (DB::selectOne('SELECT COUNT(*) AS total FROM ems_employees')->total ?? 0);
            $employeeCode = sprintf('EMP-%s-%s-%03d', $departmentCode, $year, $total + 1);

            // 4. Insert the employee record.
            DB::insert(
                'INSERT INTO ems_employees (
                    user_id, employee_code, department_id, designation_id,
                    reporting_manager_id, employment_type, status, date_of_joining,
                    work_email, emergency_contact, address, salary_monthly
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $userId,
                    $employeeCode,
                    $departmentId,
                    $designationId,
                    $request->input('reporting_manager_id') ?: null,
                    $request->input('employment_type') ?: 'FULL_TIME',
                    $request->input('status') ?: 'ACTIVE',
                    $dateOfJoining,
                    $request->input('work_email') ?: null,
                    $request->input('emergency_contact') ?: null,
                    $request->input('address') ?: null,
                    $request->input('salary_monthly') ?: 0,
                ]
            );

            $employeeId = (int) DB::getPdo()->lastInsertId();

            // 5. Optional: auto-enroll in an initial LMS course/batch.
            if ($request->filled('initial_course_id')) {
                DB::insert(
                    'INSERT INTO ems_employee_trainings (employee_id, course_id, batch_id, training_type)
                     VALUES (?, ?, ?, ?)',
                    [
                        $employeeId,
                        $request->input('initial_course_id'),
                        $request->input('initial_batch_id') ?: null,
                        'ONBOARDING',
                    ]
                );

                if ($request->filled('initial_batch_id')) {
                    DB::insert(
                        'INSERT IGNORE INTO batch_students (batch_id, student_id) VALUES (?, ?)',
                        [$request->input('initial_batch_id'), $studentId]
                    );
                }
            }

            $employee = DB::selectOne('SELECT * FROM ems_employees WHERE id = ?', [$employeeId]);

            return [
                ...(array) $employee,
                'name' => $name,
                'mobile_number' => $mobile,
                'student_id' => $studentId,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Employee created and provisioned with LMS access successfully',
            'data' => $result,
        ], 201);
    }

    /**
     * PUT /api/ems/employees/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $existing = DB::selectOne('SELECT id FROM ems_employees WHERE id = ?', [$id]);

        if (! $existing) {
            throw new ApiException('Employee not found', 404);
        }

        DB::update(
            'UPDATE ems_employees
             SET department_id = IFNULL(?, department_id),
                 designation_id = IFNULL(?, designation_id),
                 reporting_manager_id = ?,
                 employment_type = IFNULL(?, employment_type),
                 status = IFNULL(?, status),
                 work_email = IFNULL(?, work_email),
                 emergency_contact = IFNULL(?, emergency_contact),
                 address = IFNULL(?, address),
                 salary_monthly = IFNULL(?, salary_monthly),
                 updated_at = NOW()
             WHERE id = ?',
            [
                $request->input('department_id'),
                $request->input('designation_id'),
                $request->input('reporting_manager_id') ?: null,
                $request->input('employment_type'),
                $request->input('status'),
                $request->input('work_email') ?: null,
                $request->input('emergency_contact') ?: null,
                $request->input('address') ?: null,
                $request->input('salary_monthly'),
                $id,
            ]
        );

        return $this->ok(DB::selectOne('SELECT * FROM ems_employees WHERE id = ?', [$id]));
    }
}
