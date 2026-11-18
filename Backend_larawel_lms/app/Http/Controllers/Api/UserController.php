<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends ApiController
{
    /**
     * GET /api/users
     */
    public function index(): JsonResponse
    {
        return $this->ok(DB::select('SELECT * FROM users'));
    }

    /**
     * POST /api/users
     */
    public function store(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $mobile = trim((string) $request->input('mobile_number', ''));
        $role = (string) $request->input('role', '');

        $existing = DB::selectOne(
            'SELECT id FROM users WHERE mobile_number = ?',
            [$mobile]
        );

        if ($existing) {
            throw new ApiException("A user with mobile number {$mobile} already exists.", 409);
        }

        DB::insert(
            'INSERT INTO users (name, mobile_number, role) VALUES (?, ?, ?)',
            [$name, $mobile, $role]
        );

        $user = DB::selectOne('SELECT * FROM users WHERE id = ?', [DB::getPdo()->lastInsertId()]);

        return $this->ok($user, 201);
    }
}
