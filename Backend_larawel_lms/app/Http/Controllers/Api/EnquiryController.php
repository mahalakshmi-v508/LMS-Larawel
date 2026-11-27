<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use App\Services\PaymentQrCardService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class EnquiryController extends ApiController
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150'],
            'mobile_number' => ['required', 'string', 'max:20'],
            'course_interest' => ['required', 'string', 'max:150'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::table('enquiries')->insert([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'mobile_number' => $validated['mobile_number'],
            'course_interest' => $validated['course_interest'],
            'message' => $validated['message'] ?? null,
            'created_at' => now(),
            'status' => 'pending',
            'payment_status' => 'UNPAID',
        ]);

        return $this->okMessage('Enquiry submitted successfully');
    }

    public function index(): JsonResponse
    {
        $enquiries = DB::table('enquiries')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return $this->ok($enquiries);
    }

    /**
     * Approve an enquiry.
     *
     * The admin sets the course fee. We generate a payment token + a UPI style
     * QR card (with the amount already baked in) and send it to the student on WhatsApp.
     *
     * The student account / student ID is NOT created here — it is created only
     * after the fee is actually paid (see pay() / markPaid()).
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['nullable', 'numeric', 'min:1', 'max:9999999'],
        ]);

        $result = DB::transaction(function () use ($id, $validated) {
            $enquiry = DB::table('enquiries')->where('id', $id)->lockForUpdate()->first();

            if (! $enquiry) {
                throw new ApiException('Enquiry not found.', 404);
            }

            if (empty($enquiry->mobile_number)) {
                throw new ApiException('A mobile/WhatsApp number is required before approving this enquiry.', 422);
            }

            $amountInput = $validated['amount'] ?? $enquiry->amount;
            if ($amountInput === null || $amountInput === '') {
                throw new ApiException('Please enter the course fee amount before approving this enquiry.', 422);
            }
            $amount = round((float) $amountInput, 2);

            if (strtoupper((string) ($enquiry->payment_status ?: 'UNPAID')) === 'PAID') {
                throw new ApiException('This enquiry has already been paid. The student account already exists.', 409);
            }

            // Re-sending / updating the amount of an already approved enquiry.
            $alreadyApproved = strtolower((string) $enquiry->status) === 'approved';

            if (! $alreadyApproved && ! in_array(strtolower((string) $enquiry->status), ['pending', 'new'], true)) {
                throw new ApiException('Only pending enquiries can be approved.', 409);
            }

            $duplicate = DB::table('users')
                ->whereRaw('LOWER(email) = LOWER(?)', [$enquiry->email])
                ->orWhere('mobile_number', $enquiry->mobile_number)
                ->exists();
            if ($duplicate) {
                throw new ApiException('A user already exists with this email address or mobile number.', 409);
            }

            $token = $enquiry->qr_token ?: $this->newToken();

            DB::table('enquiries')->where('id', $id)->update([
                'status' => 'approved',
                'amount' => $amount,
                'payment_status' => 'UNPAID',
                'qr_token' => $token,
                'updated_at' => now(),
            ]);

            return [
                'account_id' => null,
                'email' => $enquiry->email,
                'mobile_number' => $enquiry->mobile_number,
                'name' => $enquiry->name,
                'course_interest' => $enquiry->course_interest,
                'amount' => $amount,
                'qr_token' => $token,
                'payment_status' => 'UNPAID',
            ];
        });

        $paymentUrl = $this->paymentUrl($result['qr_token'], (float) $result['amount']);
        $whatsappSent = app(WhatsAppService::class)->sendPaymentRequest(
            mobileNumber: $result['mobile_number'] ?? '',
            studentName: $result['name'],
            courseInterest: $result['course_interest'],
            amount: (float) $result['amount'],
            paymentUrl: $paymentUrl,
            qrUrl: $this->qrUrl($result['qr_token']),
            loginUrl: $this->loginUrl($result['qr_token']),
        );

        $message = $whatsappSent
            ? 'Enquiry approved. The ₹'.number_format((float) $result['amount'], 2).' payment details were sent to WhatsApp '.$result['mobile_number'].'. The Student ID will be created automatically once the fee is paid.'
            : 'Enquiry approved, but the WhatsApp message could not be sent. Check WhatsApp settings and use "Resend WhatsApp".';

        return $this->okMessage($message, [
            'account_id' => null,
            'email' => $result['email'],
            'amount' => (float) $result['amount'],
            'payment_status' => $result['payment_status'],
            'qr_token' => $result['qr_token'],
            'payment_url' => $paymentUrl,
            'mobile_number' => $result['mobile_number'] ?? null,
            'whatsapp_sent' => $whatsappSent,
            'mail_sent' => $whatsappSent,
        ]);
    }

    public function reject(string $id): JsonResponse
    {
        $enquiry = DB::table('enquiries')->where('id', $id)->first();
        if (! $enquiry) {
            throw new ApiException('Enquiry not found.', 404);
        }

        if (! in_array(strtolower((string) $enquiry->status), ['pending', 'new'], true)) {
            throw new ApiException('Only pending enquiries can be rejected.', 409);
        }

        DB::table('enquiries')->where('id', $id)->update(['status' => 'rejected', 'updated_at' => now()]);

        return $this->okMessage('Enquiry rejected.');
    }

    /**
     * Admin: change the fee amount of an approved enquiry.
     */
    public function updateAmount(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:9999999'],
        ]);

        $enquiry = DB::table('enquiries')->where('id', $id)->first();
        if (! $enquiry) {
            throw new ApiException('Enquiry not found.', 404);
        }

        $amount = round((float) $validated['amount'], 2);
        DB::table('enquiries')->where('id', $id)->update([
            'amount' => $amount,
            'updated_at' => now(),
        ]);

        return $this->okMessage('Fee amount updated.', ['amount' => $amount]);
    }

    /**
     * Admin: confirm that the fee has been received (bank transfer / cash).
     * This also creates the student account and sends the Student ID on WhatsApp.
     */
    public function markPaid(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'payment_reference' => ['nullable', 'string', 'max:64'],
        ]);

        $enquiry = DB::table('enquiries')->where('id', $id)->first();
        if (! $enquiry) {
            throw new ApiException('Enquiry not found.', 404);
        }

        if (strtolower((string) $enquiry->status) !== 'approved') {
            throw new ApiException('Only approved enquiries can be marked as paid.', 409);
        }

        $result = DB::transaction(function () use ($id, $enquiry, $validated) {
            DB::table('enquiries')->where('id', $id)->update([
                'payment_status' => 'PAID',
                'paid_at' => now(),
                'payment_reference' => $validated['payment_reference'] ?? $enquiry->payment_reference ?? ('ADMIN'.strtoupper(Str::random(8))),
                'updated_at' => now(),
            ]);

            $accountId = $this->createStudentAccount($enquiry);

            DB::table('enquiries')->where('id', $id)->update([
                'account_id' => $accountId,
                'updated_at' => now(),
            ]);

            return DB::table('enquiries')->where('id', $id)->first();
        });

        $whatsappSent = $this->sendPaymentReceived($result);

        return $this->okMessage(
            $whatsappSent
                ? 'Payment marked as received. Student ID '.$result->account_id.' sent to WhatsApp '.$result->mobile_number.'.'
                : 'Payment marked as received, but the Student ID could not be sent on WhatsApp.',
            $this->paymentPayload($result) + ['whatsapp_sent' => $whatsappSent, 'mail_sent' => $whatsappSent]
        );
    }

    /**
     * Public: look up the fee + student details behind a payment token (QR).
     */
    public function paymentInfo(string $token): JsonResponse
    {
        $enquiry = DB::table('enquiries')->where('qr_token', $token)->first();
        if (! $enquiry) {
            throw new ApiException('This payment link is not valid.', 404);
        }

        return $this->ok($this->paymentPayload($enquiry));
    }

    /**
     * Public: the rendered QR card image for a payment token.
     */
    public function qrImage(string $token): Response
    {
        $enquiry = DB::table('enquiries')->where('qr_token', $token)->first();
        if (! $enquiry) {
            throw new ApiException('This payment link is not valid.', 404);
        }

        $amount = $enquiry->amount !== null ? (float) $enquiry->amount : 0.0;
        $png = $this->qrCard($enquiry->name, $amount, $this->paymentUrl($token, $amount));

        return response($png, 200, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'no-store, max-age=0',
        ]);
    }

    /**
     * Public: complete the payment for the token.
     *
     * The student account is created only here — i.e. only after the money is
     * paid — and the student ID is sent on WhatsApp straight away.
     */
    public function pay(Request $request, string $token): JsonResponse
    {
        $validated = $request->validate([
            'payment_reference' => ['nullable', 'string', 'max:64'],
        ]);

        $enquiry = DB::table('enquiries')->where('qr_token', $token)->first();
        if (! $enquiry) {
            throw new ApiException('This payment link is not valid.', 404);
        }

        if (strtoupper((string) ($enquiry->payment_status ?: 'UNPAID')) === 'PAID') {
            return $this->okMessage('Payment already completed.', $this->paymentPayload($enquiry));
        }

        if ($enquiry->amount === null || (float) $enquiry->amount <= 0) {
            throw new ApiException('The course fee has not been set for this enquiry yet. Please contact the institute.', 422);
        }

        $reference = $validated['payment_reference'] ?? 'UPI'.strtoupper(Str::random(10));

        $result = DB::transaction(function () use ($enquiry, $reference) {
            DB::table('enquiries')->where('id', $enquiry->id)->update([
                'payment_status' => 'PAID',
                'paid_at' => now(),
                'payment_reference' => $reference,
                'updated_at' => now(),
            ]);

            $accountId = $this->createStudentAccount($enquiry);

            DB::table('enquiries')->where('id', $enquiry->id)->update([
                'account_id' => $accountId,
                'updated_at' => now(),
            ]);

            return DB::table('enquiries')->where('id', $enquiry->id)->first();
        });

        $whatsappSent = $this->sendPaymentReceived($result);

        return $this->okMessage(
            'Payment received. Your Student ID is '.$result->account_id.' — it has been sent to WhatsApp '.$result->mobile_number.'.',
            $this->paymentPayload($result) + ['whatsapp_sent' => $whatsappSent, 'mail_sent' => $whatsappSent]
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Create (or reuse) the student user + student row and return the
     * generated student ID (e.g. STU000019).
     */
    private function createStudentAccount(object $enquiry): string
    {
        $existing = DB::table('users')
            ->whereRaw('LOWER(email) = LOWER(?)', [$enquiry->email])
            ->first();

        if ($existing) {
            $accountId = (string) ($existing->account_id ?? '');
            if ($accountId === '') {
                $accountId = 'STU'.str_pad((string) $existing->id, 6, '0', STR_PAD_LEFT);
                DB::table('users')->where('id', $existing->id)->update([
                    'account_id' => $accountId,
                    'is_active' => 1,
                    'updated_at' => now(),
                ]);
            }

            $this->ensureStudentRow((int) $existing->id);

            return $accountId;
        }

        $userData = [
            'name' => mb_substr((string) $enquiry->name, 0, 100),
            'email' => $enquiry->email,
            'mobile_number' => mb_substr((string) $enquiry->mobile_number, 0, 15),
            'role' => 'STUDENT',
            'is_active' => 1,
            'account_id' => null,
        ];
        if (Schema::hasColumn('users', 'password')) {
            $userData['password'] = bcrypt(Str::random(48));
        }
        if (Schema::hasColumn('users', 'created_at')) {
            $userData['created_at'] = now();
        }
        if (Schema::hasColumn('users', 'updated_at')) {
            $userData['updated_at'] = now();
        }

        $userId = DB::table('users')->insertGetId($userData);
        $accountId = 'STU'.str_pad((string) $userId, 6, '0', STR_PAD_LEFT);
        DB::table('users')->where('id', $userId)->update(['account_id' => $accountId]);

        $this->ensureStudentRow((int) $userId);

        return $accountId;
    }

    private function ensureStudentRow(int $userId): void
    {
        if (DB::table('students')->where('user_id', $userId)->exists()) {
            return;
        }

        $studentData = [
            'user_id' => $userId,
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

    /**
     * Send the "payment received + here is your Student ID" WhatsApp message.
     */
    private function sendPaymentReceived(object $enquiry): bool
    {
        try {
            return app(WhatsAppService::class)->sendPaymentReceived(
                mobileNumber: (string) $enquiry->mobile_number,
                studentName: (string) $enquiry->name,
                accountId: (string) $enquiry->account_id,
                courseInterest: (string) $enquiry->course_interest,
                amount: $enquiry->amount !== null ? (float) $enquiry->amount : 0.0,
                paymentReference: (string) ($enquiry->payment_reference ?? ''),
                loginUrl: $this->loginUrl((string) $enquiry->qr_token),
            );
        } catch (\Throwable $e) {
            report($e);

            return false;
        }
    }

    /**
     * Render the dark UPI QR card. Falls back to a plain QR if GD is missing.
     */
    private function qrCard(string $name, float $amount, string $payload): string
    {
        try {
            return app(PaymentQrCardService::class)->render($payload, $name, $amount);
        } catch (\Throwable $e) {
            report($e);

            return app(\App\Services\QrCodeService::class)->png($payload, 520, 10);
        }
    }

    private function paymentPayload(object $enquiry): array
    {
        return [
            'id' => (int) $enquiry->id,
            'name' => $enquiry->name,
            'email' => $enquiry->email,
            'account_id' => $enquiry->account_id,
            'has_account' => ! empty($enquiry->account_id),
            'course_interest' => $enquiry->course_interest,
            'amount' => $enquiry->amount !== null ? (float) $enquiry->amount : null,
            'payment_status' => strtoupper((string) ($enquiry->payment_status ?: 'UNPAID')),
            'payment_reference' => $enquiry->payment_reference,
            'paid_at' => $enquiry->paid_at,
            'status' => $enquiry->status,
            'mobile_number' => $enquiry->mobile_number,
            'qr_url' => ! empty($enquiry->qr_token) ? '/api/enquiries/payment/'.$enquiry->qr_token.'/qr' : null,
        ];
    }

    private function newToken(): string
    {
        return Str::lower(Str::random(40));
    }

    /**
     * The QR payload itself already carries the token *and* the amount, so a
     * scan opens the payment page with the fee pre-filled.
     */
    private function paymentUrl(string $token, float $amount): string
    {
        $base = rtrim((string) config('app.frontend_url'), '/');

        return $base.'/login?pay='.urlencode($token).'&amount='.number_format($amount, 2, '.', '');
    }

    private function loginUrl(string $token): string
    {
        $base = rtrim((string) config('app.frontend_url'), '/');

        return $base.'/login?pay='.urlencode($token);
    }

    private function qrUrl(string $token): string
    {
        return rtrim((string) config('app.url'), '/').'/api/enquiries/payment/'.urlencode($token).'/qr';
    }
}
