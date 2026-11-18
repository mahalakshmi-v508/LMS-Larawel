<?php

namespace App\Http\Controllers\Api\Ems;

use App\Exceptions\ApiException;
use App\Http\Controllers\Api\ApiController;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmsAttendanceController extends ApiController
{
    /**
     * GET /api/ems/attendance
     */
    public function index(Request $request): JsonResponse
    {
        $query = 'SELECT
                    a.*,
                    u.name AS employee_name,
                    e.employee_code,
                    d.name AS department_name,
                    des.title AS designation_title
                  FROM ems_attendance a
                  JOIN ems_employees e ON a.employee_id = e.id
                  JOIN users u ON e.user_id = u.id
                  JOIN ems_departments d ON e.department_id = d.id
                  JOIN ems_designations des ON e.designation_id = des.id
                  WHERE 1=1';

        $bindings = [];

        if ($request->filled('date')) {
            $query .= ' AND a.attendance_date = ?';
            $bindings[] = $this->dateOnly($request->query('date'));
        }

        if ($request->filled('employee_id')) {
            $query .= ' AND a.employee_id = ?';
            $bindings[] = (int) $request->query('employee_id');
        }

        if ($request->filled('department_id')) {
            $query .= ' AND e.department_id = ?';
            $bindings[] = (int) $request->query('department_id');
        }

        $query .= ' ORDER BY a.attendance_date DESC, u.name ASC';

        return $this->ok(DB::select($query, $bindings));
    }

    /**
     * POST /api/ems/attendance/check-in
     */
    public function checkIn(Request $request): JsonResponse
    {
        $employeeId = $request->input('employee_id');

        if (! $employeeId) {
            throw new ApiException('employee_id is required');
        }

        $today = Carbon::today()->toDateString();
        $now = Carbon::now()->format('H:i:s');
        $workMode = $request->input('work_mode') ?: 'OFFICE';
        $remarks = $request->input('remarks') ?: null;

        DB::insert(
            "INSERT INTO ems_attendance (employee_id, attendance_date, check_in_time, status, work_mode, remarks)
             VALUES (?, ?, CAST(? AS TIME), 'PRESENT', ?, ?)
             ON DUPLICATE KEY UPDATE
                check_in_time = IFNULL(check_in_time, VALUES(check_in_time)),
                work_mode = VALUES(work_mode),
                remarks = IFNULL(?, remarks)",
            [$employeeId, $today, $now, $workMode, $remarks, $remarks]
        );

        $record = DB::selectOne(
            'SELECT * FROM ems_attendance WHERE employee_id = ? AND attendance_date = ?',
            [$employeeId, $today]
        );

        return response()->json([
            'success' => true,
            'message' => 'Check-in recorded',
            'data' => $record,
        ]);
    }

    /**
     * POST /api/ems/attendance/check-out
     */
    public function checkOut(Request $request): JsonResponse
    {
        $employeeId = $request->input('employee_id');

        if (! $employeeId) {
            throw new ApiException('employee_id is required');
        }

        $today = Carbon::today()->toDateString();

        $record = DB::selectOne(
            'SELECT id FROM ems_attendance WHERE employee_id = ? AND attendance_date = ?',
            [$employeeId, $today]
        );

        if (! $record) {
            throw new ApiException('No check-in record found for today.');
        }

        DB::update(
            'UPDATE ems_attendance SET check_out_time = CAST(? AS TIME) WHERE id = ?',
            [Carbon::now()->format('H:i:s'), $record->id]
        );

        return response()->json([
            'success' => true,
            'message' => 'Check-out recorded',
            'data' => DB::selectOne('SELECT * FROM ems_attendance WHERE id = ?', [$record->id]),
        ]);
    }
}
