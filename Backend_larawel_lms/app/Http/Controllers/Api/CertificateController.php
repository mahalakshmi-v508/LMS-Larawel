<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class CertificateController extends ApiController
{
    /**
     * Shared join used by every certificate endpoint.
     */
    public const SELECT = 'SELECT cert.id, cert.certificate_number, cert.student_id, cert.batch_id, cert.issued_at, cert.pdf_url,
                                  cert.recipient_name, cert.course_title, cert.batch_label,
                                  u.name AS student_name, c.course_name, b.batch_code
                           FROM certificates cert
                           INNER JOIN students s ON cert.student_id = s.student_id
                           INNER JOIN users u ON s.user_id = u.id
                           INNER JOIN batches b ON cert.batch_id = b.id
                           INNER JOIN courses c ON b.course_id = c.id';

    /**
     * Convert a joined certificate row into the shape the frontend expects.
     */
    public static function mapRow(object $row): array
    {
        $recipientName = trim((string) ($row->recipient_name ?? '')) ?: $row->student_name;
        $courseTitle = trim((string) ($row->course_title ?? '')) ?: $row->course_name;
        $batchLabel = trim((string) ($row->batch_label ?? '')) ?: $row->batch_code;

        return [
            'id' => (int) $row->id,
            'certificate_number' => $row->certificate_number,
            'student_id' => (int) $row->student_id,
            'batch_id' => (int) $row->batch_id,
            'issued_at' => $row->issued_at,
            'pdf_url' => $row->pdf_url,
            'recipient_name' => $recipientName,
            'course_title' => $courseTitle,
            'batch_label' => $batchLabel,
            'default_recipient_name' => $row->student_name,
            'default_course_title' => $row->course_name,
            'default_batch_label' => $row->batch_code,
        ];
    }

    /**
     * POST /api/certificates
     */
    public function issue(Request $request): JsonResponse
    {
        $studentId = $request->input('student_id');
        $batchId = $request->input('batch_id');

        if (! $studentId || ! $batchId || ! $request->boolean('course_completed')) {
            throw new ApiException('student_id, batch_id, and confirmed course completion are required');
        }

        $enrollment = DB::selectOne(
            "SELECT s.student_id, u.name AS student_name, c.course_name, b.batch_code
             FROM students s
             INNER JOIN users u ON s.user_id = u.id AND UPPER(u.role) = 'STUDENT'
             INNER JOIN batch_students bs ON bs.student_id = s.student_id
             INNER JOIN batches b ON b.id = bs.batch_id
             INNER JOIN courses c ON c.id = b.course_id
             WHERE s.student_id = ? AND b.id = ?",
            [$studentId, $batchId]
        );

        if (! $enrollment) {
            throw new ApiException('Student is not assigned to this batch.', 404);
        }

        $attendance = DB::selectOne(
            "SELECT
                COUNT(*) AS total_classes,
                SUM(CASE
                    WHEN UPPER(REPLACE(REPLACE(LTRIM(RTRIM(status)), ' ', '_'), '-', '_'))
                         IN ('PRESENT_ONLINE', 'PRESENT_OFFLINE')
                    THEN 1 ELSE 0
                END) AS present_classes
             FROM attendance
             WHERE student_id = ? AND batch_id = ?",
            [$studentId, $batchId]
        );

        $totalClasses = (int) ($attendance->total_classes ?? 0);
        $presentClasses = (int) ($attendance->present_classes ?? 0);
        $attendancePercentage = $totalClasses > 0 ? ($presentClasses / $totalClasses) * 100 : 0;

        if ($attendancePercentage < 75) {
            throw new ApiException(sprintf(
                'Certificate requires at least 75%% attendance. Current attendance: %s%%.',
                number_format($attendancePercentage, 2, '.', '')
            ));
        }

        $existing = DB::selectOne(
            'SELECT id, certificate_number
             FROM certificates
             WHERE student_id = ? AND batch_id = ?
             ORDER BY issued_at DESC
             LIMIT 1',
            [$studentId, $batchId]
        );

        $created = false;

        if ($existing) {
            $certificateId = (int) $existing->id;
            $certificateNumber = $existing->certificate_number;
        } else {
            $certificateNumber = 'CERT-'.date('Y').'-S'.$studentId.'-B'.$batchId;

            DB::insert(
                'INSERT INTO certificates (certificate_number, student_id, batch_id, pdf_url)
                 VALUES (?, ?, ?, NULL)',
                [$certificateNumber, $studentId, $batchId]
            );

            $certificateId = (int) DB::getPdo()->lastInsertId();
            $created = true;
        }

        $pdfUrl = '/api/certificates/'.$certificateId.'/download';

        try {
            $this->writePdf($certificateId, [
                'certificate_number' => $certificateNumber,
                'student_name' => $enrollment->student_name,
                'course_name' => $enrollment->course_name,
                'batch_code' => $enrollment->batch_code,
                'issued_at' => now(),
            ]);

            DB::update(
                'UPDATE certificates SET pdf_url = ? WHERE id = ?',
                [$pdfUrl, $certificateId]
            );

            DB::update(
                "UPDATE students SET certification_status = 'CERTIFIED' WHERE student_id = ?",
                [$studentId]
            );
        } catch (\Throwable $e) {
            if ($created) {
                DB::delete('DELETE FROM certificates WHERE id = ?', [$certificateId]);
            }

            throw $e;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $certificateId,
                'certificate_number' => $certificateNumber,
                'student_id' => (int) $studentId,
                'batch_id' => (int) $batchId,
                'pdf_url' => $pdfUrl,
                'attendance_percentage' => round($attendancePercentage, 2),
            ],
        ], $created ? 201 : 200);
    }

    /**
     * GET /api/certificates/{id}
     */
    public function show(string $id): JsonResponse
    {
        $row = $this->loadById($id);

        if (! $row) {
            throw new ApiException('Certificate not found', 404);
        }

        return $this->ok(self::mapRow($row));
    }

    /**
     * GET /api/students/{id}/certificates
     */
    public function forStudent(string $id): JsonResponse
    {
        $rows = DB::select(
            'SELECT cert.*, b.batch_code, c.course_name, u.name AS student_name
             FROM certificates cert
             INNER JOIN batches b ON cert.batch_id = b.id
             INNER JOIN courses c ON b.course_id = c.id
             INNER JOIN students s ON cert.student_id = s.student_id
             INNER JOIN users u ON s.user_id = u.id
             WHERE cert.student_id = ?
             ORDER BY cert.issued_at DESC',
            [$id]
        );

        return $this->ok(array_map([self::class, 'mapRow'], $rows));
    }

    /**
     * PUT /api/certificates/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $existing = $this->loadById($id);

        if (! $existing) {
            throw new ApiException('Certificate not found', 404);
        }

        $fields = [];
        $bindings = [];

        if ($request->has('certificate_number')) {
            $value = trim((string) $request->input('certificate_number'));

            if ($value === '') {
                throw new ApiException('Certificate number cannot be empty');
            }

            $fields[] = 'certificate_number = ?';
            $bindings[] = $value;
        }

        if ($request->has('recipient_name')) {
            $fields[] = 'recipient_name = ?';
            $bindings[] = trim((string) $request->input('recipient_name')) ?: null;
        }

        if ($request->has('course_title')) {
            $fields[] = 'course_title = ?';
            $bindings[] = trim((string) $request->input('course_title')) ?: null;
        }

        if ($request->has('batch_label')) {
            $fields[] = 'batch_label = ?';
            $bindings[] = trim((string) $request->input('batch_label')) ?: null;
        }

        if ($request->has('issued_at')) {
            $raw = trim((string) $request->input('issued_at'));
            $current = Carbon::parse($existing->issued_at);
            $parsed = Carbon::parse($raw);

            // A date-only edit keeps the original time of day.
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
                $sameDay = $current->toDateString() === $parsed->toDateString();

                $parsed = $sameDay
                    ? $parsed->setTime((int) $current->format('H'), (int) $current->format('i'), (int) $current->format('s'))
                    : $parsed->setTime(9, 0, 0);
            }

            $fields[] = 'issued_at = ?';
            $bindings[] = $parsed->format('Y-m-d H:i:s');
        }

        if (count($fields) === 0) {
            throw new ApiException('Nothing to update');
        }

        $bindings[] = $id;

        try {
            DB::update(
                'UPDATE certificates SET '.implode(', ', $fields).' WHERE id = ?',
                $bindings
            );
        } catch (QueryException $e) {
            if ((int) ($e->errorInfo[1] ?? 0) === 1062) {
                throw new ApiException('That certificate number is already used by another certificate');
            }

            throw $e;
        }

        $updated = $this->loadById($id);

        if (! $updated) {
            throw new ApiException('Certificate not found', 404);
        }

        // Regenerate the PDF so the file matches the edited details.
        $pdfUrl = $this->writePdfFromRow($updated);

        return $this->ok(self::mapRow($updated));
    }

    /**
     * GET /api/certificates/{id}/download
     */
    public function download(string $id): Response
    {
        return $this->sendPdf($id, 'attachment');
    }

    /**
     * GET /api/certificates/{id}/view
     */
    public function view(string $id): Response
    {
        return $this->sendPdf($id, 'inline');
    }

    private function sendPdf(string $id, string $disposition): Response
    {
        $row = $this->loadById($id);

        if (! $row) {
            throw new ApiException('Certificate PDF not found', 404);
        }

        $filePath = $this->pdfPath((int) $row->id);

        // Older rows may point at a PDF that was never written - rebuild it on demand.
        if (! File::exists($filePath)) {
            $pdfUrl = $this->writePdfFromRow($row);

            if ($row->pdf_url !== $pdfUrl) {
                DB::update(
                    'UPDATE certificates SET pdf_url = ? WHERE id = ?',
                    [$pdfUrl, $row->id]
                );
            }
        }

        return response()->file($filePath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => sprintf('%s; filename="%s.pdf"', $disposition, $row->certificate_number),
        ]);
    }

    private function loadById(string|int $id): ?object
    {
        return DB::selectOne(self::SELECT.' WHERE cert.id = ?', [$id]);
    }

    private function pdfPath(int $certificateId): string
    {
        return storage_path('app/certificates/certificate-'.$certificateId.'.pdf');
    }

    /**
     * (Re)write certificate-<id>.pdf from the joined database row.
     */
    private function writePdfFromRow(object $row): string
    {
        $data = self::mapRow($row);

        $this->writePdf((int) $row->id, [
            'certificate_number' => $data['certificate_number'],
            'student_name' => $data['recipient_name'],
            'course_name' => $data['course_title'],
            'batch_code' => $data['batch_label'],
            'issued_at' => Carbon::parse($row->issued_at),
        ]);

        return '/api/certificates/'.$row->id.'/download';
    }

    private function writePdf(int $certificateId, array $certificate): void
    {
        $path = $this->pdfPath($certificateId);
        File::ensureDirectoryExists(dirname($path));

        Pdf::loadView('pdf.certificate', $certificate)
            ->setPaper('a4', 'landscape')
            ->save($path);
    }
}
