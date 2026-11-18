<?php

namespace App\Http\Controllers\Api\Ems;

use App\Exceptions\ApiException;
use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmsDesignationController extends ApiController
{
    /**
     * GET /api/ems/designations
     */
    public function index(Request $request): JsonResponse
    {
        $query = 'SELECT des.id,
                         des.title,
                         des.grade_level,
                         des.department_id,
                         dept.name AS department_name,
                         dept.code AS department_code
                  FROM ems_designations des
                  JOIN ems_departments dept ON des.department_id = dept.id';

        $bindings = [];

        if ($request->filled('department_id')) {
            $query .= ' WHERE des.department_id = ?';
            $bindings[] = (int) $request->query('department_id');
        }

        $query .= ' ORDER BY dept.name, des.title';

        return $this->ok(DB::select($query, $bindings));
    }

    /**
     * POST /api/ems/designations
     */
    public function store(Request $request): JsonResponse
    {
        $departmentId = $request->input('department_id');
        $title = trim((string) $request->input('title', ''));

        if (! $departmentId || $title === '') {
            throw new ApiException('Department ID and Title are required.');
        }

        DB::insert(
            'INSERT INTO ems_designations (department_id, title, grade_level) VALUES (?, ?, ?)',
            [$departmentId, $title, $request->input('grade_level') ?: null]
        );

        $designation = DB::selectOne(
            'SELECT * FROM ems_designations WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($designation, 201);
    }
}
