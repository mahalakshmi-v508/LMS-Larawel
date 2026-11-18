<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TestController extends ApiController
{
    /**
     * GET /api/batches/{id}/tests
     */
    public function index(string $id): JsonResponse
    {
        return $this->ok(DB::select(
            'SELECT * FROM tests WHERE batch_id = ? ORDER BY start_time DESC',
            [$id]
        ));
    }

    /**
     * POST /api/tests
     */
    public function store(Request $request): JsonResponse
    {
        $batchId = $request->input('batch_id');
        $subject = $request->input('subject');
        $title = $request->input('title');
        $startTime = $request->input('start_time');
        $endTime = $request->input('end_time');
        $totalMarks = $request->input('total_marks');

        if (! $batchId || ! $subject || ! $title || ! $startTime || ! $endTime || $totalMarks === null) {
            throw new ApiException('batch_id, subject, title, start_time, end_time, and total_marks are required');
        }

        DB::insert(
            'INSERT INTO tests
                (batch_id, subject, title, test_paper_url, start_time, end_time, total_marks)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                $batchId,
                $subject,
                $title,
                $request->input('test_paper_url') ?: null,
                $this->dateTime($startTime),
                $this->dateTime($endTime),
                $totalMarks,
            ]
        );

        $test = DB::selectOne(
            'SELECT * FROM tests WHERE id = ?',
            [DB::getPdo()->lastInsertId()]
        );

        return $this->ok($test, 201);
    }

    /**
     * POST /api/tests/{id}/submit
     */
    public function submit(Request $request, string $id): JsonResponse
    {
        $studentId = $request->input('student_id');
        $answerSheetUrl = $request->input('answer_sheet_url');

        if (! $studentId || ! $answerSheetUrl) {
            throw new ApiException('student_id and answer_sheet_url are required');
        }

        DB::insert(
            'INSERT INTO test_submissions (test_id, student_id, answer_sheet_url)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
                answer_sheet_url = VALUES(answer_sheet_url),
                submitted_at = NOW(),
                marks_obtained = NULL',
            [$id, $studentId, $answerSheetUrl]
        );

        $submission = DB::selectOne(
            'SELECT * FROM test_submissions WHERE test_id = ? AND student_id = ?',
            [$id, $studentId]
        );

        return $this->ok($submission, 201);
    }

    /**
     * GET /api/tests/{id}/submissions
     */
    public function submissions(string $id): JsonResponse
    {
        $rows = DB::select(
            'SELECT ts.*, u.name AS student_name, u.mobile_number
             FROM test_submissions ts
             INNER JOIN students s ON ts.student_id = s.student_id
             INNER JOIN users u ON s.user_id = u.id
             WHERE ts.test_id = ?
             ORDER BY ts.submitted_at DESC',
            [$id]
        );

        return $this->ok($rows);
    }

    /**
     * PUT /api/test-submissions/{id}/grade
     */
    public function grade(Request $request, string $id): JsonResponse
    {
        $submission = DB::selectOne(
            'SELECT id FROM test_submissions WHERE id = ?',
            [$id]
        );

        if (! $submission) {
            throw new ApiException('Test submission not found', 404);
        }

        DB::update(
            'UPDATE test_submissions SET marks_obtained = ? WHERE id = ?',
            [$request->input('marks_obtained'), $id]
        );

        return $this->ok(DB::selectOne(
            'SELECT * FROM test_submissions WHERE id = ?',
            [$id]
        ));
    }
}
