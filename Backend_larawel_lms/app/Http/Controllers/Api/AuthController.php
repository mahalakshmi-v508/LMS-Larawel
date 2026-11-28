<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuthController extends ApiController
{
    /**
     * POST /api/auth/send-otp
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $mobile = trim((string) $request->input('mobile_number', ''));

        if ($mobile === '') {
            throw new ApiException('Mobile number is required');
        }

        $user = DB::selectOne(
            'SELECT id, name, role, is_active FROM users WHERE mobile_number = ?',
            [$mobile]
        );

        if (! $user) {
            throw new ApiException('No registered account found with this mobile number.', 404);
        }

        if (! (int) $user->is_active) {
            throw new ApiException('Account is deactivated. Please contact admin.', 403);
        }

        // Generate a 6-digit numeric OTP.
        $otpCode = (string) random_int(100000, 999999);

        DB::insert(
            'INSERT INTO user_otps (mobile_number, otp_code, expires_at, is_used, created_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0, NOW())',
            [$mobile, $otpCode]
        );

        return response()->json([
            'success' => true,
            'message' => 'OTP generated and sent successfully (valid for 5 minutes).',
            // Returned so the app can be tested without an SMS gateway.
            'otp_code' => $otpCode,
        ]);
    }

    /**
     * POST /api/auth/verify-otp
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $mobile = trim((string) $request->input('mobile_number', ''));
        $otpCode = trim((string) $request->input('otp_code', ''));

        if ($mobile === '' || $otpCode === '') {
            throw new ApiException('mobile_number and otp_code are required');
        }

        $otp = DB::selectOne(
            'SELECT id
             FROM user_otps
             WHERE mobile_number = ?
               AND otp_code = ?
               AND is_used = 0
               AND expires_at >= NOW()
             ORDER BY id DESC
             LIMIT 1',
            [$mobile, $otpCode]
        );

        if (! $otp) {
            throw new ApiException('Invalid or expired OTP.');
        }

        DB::update('UPDATE user_otps SET is_used = 1 WHERE id = ?', [$otp->id]);

        $user = DB::selectOne(
            'SELECT u.id AS user_id, u.name, u.mobile_number, u.role, u.is_active,
                    s.student_id, s.certification_status,
                    t.trainer_id, t.specialization,
                    b.id AS batch_id, b.batch_code
             FROM users u
             LEFT JOIN students s ON s.user_id = u.id
             LEFT JOIN trainers t ON t.user_id = u.id
             LEFT JOIN batch_students bs ON bs.student_id = s.student_id
             LEFT JOIN batches b ON b.id = bs.batch_id
             WHERE u.mobile_number = ?',
            [$mobile]
        );

        return response()->json([
            'success' => true,
            'message' => 'Authentication successful',
            'data' => $user,
        ]);
    }

    public function studentLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_id' => ['required', 'string', 'max:32'],
            'email' => ['required', 'email', 'max:150'],
        ]);

        $userId = DB::transaction(function () use ($validated) {
            $user = DB::table('users')
                ->whereRaw('UPPER(account_id) = UPPER(?)', [trim($validated['account_id'])])
                ->whereRaw('LOWER(email) = LOWER(?)', [trim($validated['email'])])
                ->whereRaw('UPPER(role) = ?', ['STUDENT'])
                ->lockForUpdate()
                ->first();

            if (! $user || ! (int) $user->is_active) {
                // No account yet? Then the student may simply not have paid.
                $pending = DB::table('enquiries')
                    ->whereRaw('LOWER(email) = LOWER(?)', [trim($validated['email'])])
                    ->whereRaw('LOWER(status) = ?', ['approved'])
                    ->orderByDesc('id')
                    ->first();

                if ($pending && strtoupper((string) ($pending->payment_status ?: 'UNPAID')) !== 'PAID') {
                    $amount = $pending->amount !== null
                        ? '₹'.number_format((float) $pending->amount, 2)
                        : 'the course fee';

                    throw new ApiException(
                        "Payment pending: {$amount} has not been paid yet, so your Student ID has not been generated. Open the payment link or QR code in your WhatsApp message, complete the payment, and your Student ID will be sent to WhatsApp immediately.",
                        402
                    );
                }

                throw new ApiException('Student ID or email is incorrect, or the account is inactive.', 401);
            }

            // Enquiries become students only after the course fee is paid.
            // Legacy approvals that never had a fee/QR set are left untouched.
            if (! empty($user->account_id)) {
                $enquiry = DB::table('enquiries')->where('account_id', $user->account_id)->first();
                $hasFee = $enquiry && ($enquiry->amount !== null || ! empty($enquiry->qr_token));
                $isPaid = $enquiry && strtoupper((string) ($enquiry->payment_status ?: 'UNPAID')) === 'PAID';

                if ($hasFee && ! $isPaid) {
                    $amount = $enquiry->amount !== null
                        ? '₹'.number_format((float) $enquiry->amount, 2)
                        : 'your course fee';

                    throw new ApiException(
                        "Payment pending: {$amount} is not paid yet. Open the QR code or payment link in your WhatsApp message, complete the payment, then sign in.",
                        402
                    );
                }
            }

            $student = DB::table('students')->where('user_id', $user->id)->first();
            if (! $student) {
                $studentData = [
                    'user_id' => $user->id,
                    'joining_date' => now()->toDateString(),
                    'certification_status' => 'PENDING',
                ];
                if (Schema::hasColumn('students', 'created_at')) {
                    $studentData['created_at'] = now();
                }
                if (Schema::hasColumn('students', 'updated_at')) {
                    $studentData['updated_at'] = now();
                }
                DB::table('students')->insert($studentData);
            }

            return (int) $user->id;
        });

        $user = DB::selectOne(
            "SELECT u.id AS user_id, u.name, u.email, u.mobile_number, u.role, u.is_active,
                    u.account_id, s.student_id, s.certification_status,
                    b.id AS batch_id, b.batch_code
             FROM users u
             INNER JOIN students s ON s.user_id = u.id
             LEFT JOIN batch_students bs ON bs.student_id = s.student_id
             LEFT JOIN batches b ON b.id = bs.batch_id
             WHERE u.id = ?
             LIMIT 1",
            [$userId]
        );

        return $this->okMessage('Authentication successful', $user);
    }
}
