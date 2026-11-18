<?php

namespace App\Http\Controllers\Api\Ems;

use App\Exceptions\ApiException;
use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmsDepartmentController extends ApiController
{
    /**
     * GET /api/ems/departments
     */
    public function index(): JsonResponse
    {
        return $this->ok(DB::select(
            "SELECT d.id,
                    d.name,
                    d.code,
                    d.description,
                    d.created_at,
                    COUNT(DISTINCT e.id) AS total_employees
             FROM ems_departments d
             LEFT JOIN ems_employees e ON d.id = e.department_id AND e.status = 'ACTIVE'
             GROUP BY d.id, d.name, d.code, d.description, d.created_at
             ORDER BY d.name ASC"
        ));
    }

    /**
     * POST /api/ems/departments
     */
    public function store(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $code = trim((string) $request->input('code', ''));

        if ($name === '' || $code === '') {
            throw new ApiException('Department name and code are required.');
        }

        DB::insert(
            'INSERT INTO ems_departments (name, code, description) VALUES (?, ?, ?)',
            [$name, strtoupper($code), $request->input('description')]
        );

        $department = DB::selectOne(
            'SELECT * FROM ems_departments WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($department, 201);
    }
}
