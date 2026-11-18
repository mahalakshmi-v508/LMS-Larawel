<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssignmentController extends ApiController
{
    /**
     * GET /api/batches/{id}/assignments
     */
    public function index(string $id): JsonResponse
    {
        $rows = DB::select(
            'SELECT a.*, cd.day_number, cd.title AS day_title
             FROM assignments a
             LEFT JOIN course_days cd ON a.course_day_id = cd.id
             WHERE a.batch_id = ?
             ORDER BY a.due_date ASC',
            [$id]
        );

        return $this->ok($rows);
    }

    /**
     * POST /api/assignments
     */
    public function store(Request $request): JsonResponse
    {
        $batchId = $request->input('batch_id');
        $title = $request->input('title');
        $dueDate = $request->input('due_date');

        if (! $batchId || ! $title || ! $dueDate) {
            throw new ApiException('batch_id, title, and due_date are required');
        }

        DB::insert(
            'INSERT INTO assignments
                (batch_id, course_day_id, title, description, file_attachment_url, due_date)
             VALUES (?, ?, ?, ?, ?, ?)',
            [
                $batchId,
                $request->input('course_day_id') ?: null,
                $title,
                $request->input('description'),
                $request->input('file_attachment_url'),
                $this->dateTime($dueDate),
            ]
        );

        $assignment = DB::selectOne(
            'SELECT * FROM assignments WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($assignment, 201);
    }

    /**
     * POST /api/assignments/{id}/submit
     */
    public function submit(Request $request, string $id): JsonResponse
    {
        $studentId = $request->input('student_id');
        $fileUrl = $request->input('submission_file_url');

        if (! $studentId || ! $fileUrl) {
            throw new ApiException('student_id and submission_file_url are required');
        }

        DB::insert(
            'INSERT INTO assignment_submissions (assignment_id, student_id, submission_file_url)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
                submission_file_url = VALUES(submission_file_url),
                submitted_at = NOW(),
                marks_obtained = NULL,
                trainer_feedback = NULL',
            [$id, $studentId, $fileUrl]
        );

        $submission = DB::selectOne(
            'SELECT * FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
            [$id, $studentId]
        );

        return $this->ok($submission, 201);
    }

    /**
     * GET /api/assignments/{id}/submissions
     */
    public function submissions(string $id): JsonResponse
    {
        $rows = DB::select(
            'SELECT sub.*, u.name AS student_name, u.mobile_number
             FROM assignment_submissions sub
             INNER JOIN students s ON sub.student_id = s.student_id
             INNER JOIN users u ON s.user_id = u.id
             WHERE sub.assignment_id = ?
             ORDER BY sub.submitted_at DESC',
            [$id]
        );

        return $this->ok($rows);
    }

    /**
     * PUT /api/assignment-submissions/{id}/grade
     */
    public function grade(Request $request, string $id): JsonResponse
    {
        $submission = DB::selectOne(
            'SELECT id FROM assignment_submissions WHERE id = ?',
            [$id]
        );

        if (! $submission) {
            throw new ApiException('Submission not found', 404);
        }

        DB::update(
            'UPDATE assignment_submissions
             SET marks_obtained = ?, trainer_feedback = ?
             WHERE id = ?',
            [
                $request->input('marks_obtained'),
                $request->input('trainer_feedback') ?: null,
                $id,
            ]
        );

        return $this->ok(DB::selectOne(
            'SELECT * FROM assignment_submissions WHERE id = ?',
            [$id]
        ));
    }
}
