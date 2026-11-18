<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseController extends ApiController
{
    /**
     * GET /api/courses
     */
    public function index(): JsonResponse
    {
        return $this->ok(DB::select('SELECT * FROM courses WHERE is_active = 1'));
    }

    /**
     * POST /api/courses
     */
    public function store(Request $request): JsonResponse
    {
        $courseName = trim((string) $request->input('course_name', ''));

        if ($courseName === '') {
            throw new ApiException('Course name is required.');
        }

        $existing = DB::selectOne(
            'SELECT id FROM courses WHERE course_name = ?',
            [$courseName]
        );

        if ($existing) {
            throw new ApiException("Course with name '{$courseName}' already exists.");
        }

        DB::insert(
            'INSERT INTO courses (course_name, description, duration_days, course_image_url)
             VALUES (?, ?, ?, ?)',
            [
                $courseName,
                $request->input('description'),
                $request->input('duration_days') ?: 60,
                $request->input('course_image_url'),
            ]
        );

        $course = DB::selectOne(
            'SELECT * FROM courses WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($course, 201);
    }

    /**
     * GET /api/courses/{id}/days
     */
    public function days(string $id): JsonResponse
    {
        $rows = DB::select(
            'SELECT id, course_id, day_number, title, summary
             FROM course_days
             WHERE course_id = ?
             ORDER BY day_number ASC',
            [$id]
        );

        return $this->ok($rows);
    }

    /**
     * POST /api/courses/{id}/days
     */
    public function storeDay(Request $request, string $id): JsonResponse
    {
        DB::insert(
            'INSERT INTO course_days (course_id, day_number, title, summary)
             VALUES (?, ?, ?, ?)',
            [
                $id,
                $request->input('day_number'),
                $request->input('title'),
                $request->input('summary'),
            ]
        );

        $day = DB::selectOne(
            'SELECT * FROM course_days WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($day, 201);
    }

    /**
     * GET /api/course-days/{id}/content
     */
    public function content(string $id): JsonResponse
    {
        $rows = DB::select(
            'SELECT id, course_day_id, title, rich_text_content, video_url, attachment_url, is_published, created_at
             FROM course_contents
             WHERE course_day_id = ? AND is_published = 1
             ORDER BY id ASC',
            [$id]
        );

        return $this->ok($rows);
    }

    /**
     * POST /api/course-days/{id}/content
     */
    public function storeContent(Request $request, string $id): JsonResponse
    {
        DB::insert(
            'INSERT INTO course_contents (course_day_id, title, rich_text_content, video_url, attachment_url)
             VALUES (?, ?, ?, ?, ?)',
            [
                $id,
                $request->input('title'),
                $request->input('rich_text_content'),
                $request->input('video_url'),
                $request->input('attachment_url'),
            ]
        );

        $content = DB::selectOne(
            'SELECT * FROM course_contents WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($content, 201);
    }
}
