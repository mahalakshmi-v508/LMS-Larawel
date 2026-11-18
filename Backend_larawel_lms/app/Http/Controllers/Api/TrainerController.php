<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TrainerController extends ApiController
{
    /**
     * GET /api/trainers
     */
    public function index(Request $request): JsonResponse
    {
        $includeInactive = $request->query('include_inactive') === '1';

        $rows = DB::select(
            'SELECT t.trainer_id,
                    t.specialization,
                    u.id AS user_id,
                    u.name,
                    u.mobile_number,
                    u.role,
                    u.is_active
             FROM trainers t
             INNER JOIN users u ON t.user_id = u.id
             WHERE (? = 1 OR u.is_active = 1)',
            [$includeInactive ? 1 : 0]
        );

        return $this->ok($rows);
    }

    /**
     * POST /api/trainers
     */
    public function store(Request $request): JsonResponse
    {
        $userId = $request->input('user_id');
        $specialization = $request->input('specialization');

        $user = DB::selectOne('SELECT id FROM users WHERE id = ?', [$userId]);

        if (! $user) {
            throw new ApiException("User with id {$userId} does not exist.", 404);
        }

        $existing = DB::selectOne(
            'SELECT trainer_id FROM trainers WHERE user_id = ?',
            [$userId]
        );

        if ($existing) {
            throw new ApiException("Trainer profile already exists for user_id {$userId}");
        }

        DB::insert(
            'INSERT INTO trainers (user_id, specialization) VALUES (?, ?)',
            [$userId, $specialization]
        );

        $trainer = DB::selectOne(
            'SELECT * FROM trainers WHERE trainer_id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($trainer, 201);
    }

    /**
     * GET /api/trainers/{id}
     */
    public function show(string $id): JsonResponse
    {
        $trainer = DB::selectOne(
            'SELECT t.trainer_id,
                    t.specialization,
                    u.id AS user_id,
                    u.name,
                    u.mobile_number,
                    u.role,
                    u.is_active
             FROM trainers t
             INNER JOIN users u ON t.user_id = u.id
             WHERE t.trainer_id = ?',
            [$id]
        );

        if (! $trainer) {
            throw new ApiException("Trainer with ID {$id} not found.", 404);
        }

        return $this->ok($trainer);
    }

    /**
     * PUT /api/trainers/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $trainer = DB::selectOne(
            'SELECT user_id FROM trainers WHERE trainer_id = ?',
            [$id]
        );

        if (! $trainer) {
            throw new ApiException('Trainer not found', 404);
        }

        DB::update(
            'UPDATE users SET name = ?, mobile_number = ?, is_active = ? WHERE id = ?',
            [
                $request->input('name'),
                $request->input('mobile_number'),
                $this->bit($request->input('is_active')),
                $trainer->user_id,
            ]
        );

        DB::update(
            'UPDATE trainers SET specialization = ? WHERE trainer_id = ?',
            [$request->input('specialization'), $id]
        );

        $updated = DB::selectOne('SELECT * FROM trainers WHERE trainer_id = ?', [$id]);

        return $this->ok($updated);
    }
}
