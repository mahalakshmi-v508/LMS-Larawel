<?php

namespace App\Http\Controllers\Api\Ems;

use App\Exceptions\ApiException;
use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmsLeaveController extends ApiController
{
    /**
     * GET /api/ems/leaves
     */
    public function index(Request $request): JsonResponse
    {
        $query = 'SELECT
                    l.*,
                    u.name AS employee_name,
                    e.employee_code,
                    d.name AS department_name,
                    des.title AS designation_title,
                    approver_u.name AS approved_by_name
                  FROM ems_leaves l
                  JOIN ems_employees e ON l.employee_id = e.id
                  JOIN users u ON e.user_id = u.id
                  JOIN ems_departments d ON e.department_id = d.id
                  JOIN ems_designations des ON e.designation_id = des.id
                  LEFT JOIN ems_employees approver_emp ON l.approved_by = approver_emp.id
                  LEFT JOIN users approver_u ON approver_emp.user_id = approver_u.id
                  WHERE 1=1';

        $bindings = [];

        if ($request->filled('status')) {
            $query .= ' AND l.status = ?';
            $bindings[] = (string) $request->query('status');
        }

        if ($request->filled('employee_id')) {
            $query .= ' AND l.employee_id = ?';
            $bindings[] = (int) $request->query('employee_id');
        }

        $query .= ' ORDER BY l.id DESC';

        return $this->ok(DB::select($query, $bindings));
    }

    /**
     * POST /api/ems/leaves
     */
    public function store(Request $request): JsonResponse
    {
        $employeeId = $request->input('employee_id');
        $leaveType = $request->input('leave_type');
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');
        $reason = $request->input('reason');

        if (! $employeeId || ! $leaveType || ! $fromDate || ! $toDate || ! $reason) {
            throw new ApiException('All leave fields are required');
        }

        DB::insert(
            "INSERT INTO ems_leaves (employee_id, leave_type, from_date, to_date, total_days, reason, status)
             VALUES (?, ?, ?, ?, ?, ?, 'PENDING')",
            [
                $employeeId,
                $leaveType,
                $this->dateOnly($fromDate),
                $this->dateOnly($toDate),
                $request->input('total_days') ?: 1,
                $reason,
            ]
        );

        return $this->ok(DB::selectOne(
            'SELECT * FROM ems_leaves WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        ), 201);
    }

    /**
     * PUT /api/ems/leaves/{id}/status
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $status = $request->input('status');

        if (! in_array($status, ['APPROVED', 'REJECTED'], true)) {
            throw new ApiException('Status must be APPROVED or REJECTED');
        }

        $leave = DB::selectOne('SELECT id FROM ems_leaves WHERE id = ?', [$id]);

        if (! $leave) {
            throw new ApiException('Leave application not found', 404);
        }

        DB::update(
            'UPDATE ems_leaves
             SET status = ?, approved_by = ?, action_remarks = ?
             WHERE id = ?',
            [
                $status,
                $request->input('approved_by') ?: null,
                $request->input('action_remarks') ?: null,
                $id,
            ]
        );

        return $this->ok(DB::selectOne('SELECT * FROM ems_leaves WHERE id = ?', [$id]));
    }
}
