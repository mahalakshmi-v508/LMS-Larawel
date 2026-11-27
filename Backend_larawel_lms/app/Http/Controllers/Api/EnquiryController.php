<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use App\Mail\StudentAccountApproved;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
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

    public function approve(string $id): JsonResponse
    {
        $account = DB::transaction(function () use ($id) {
            $enquiry = DB::table('enquiries')->where('id', $id)->lockForUpdate()->first();

            if (! $enquiry) {
                throw new ApiException('Enquiry not found.', 404);
            }

            if (empty($enquiry->email)) {
                throw new ApiException('An email address is required before approving this enquiry.', 422);
            }

            if (strtolower((string) $enquiry->status) === 'approved' && ! empty($enquiry->account_id)) {
                $userExists = DB::table('users')->where('account_id', $enquiry->account_id)->exists();
                if (! $userExists) {
                    throw new ApiException('The approved student account could not be found.', 409);
                }

                return [
                    'account_id' => $enquiry->account_id,
                    'email' => $enquiry->email,
                    'name' => $enquiry->name,
                    'course_interest' => $enquiry->course_interest,
                ];
            }

            if (! in_array(strtolower((string) $enquiry->status), ['pending', 'new'], true)) {
                throw new ApiException('Only pending enquiries can be approved.', 409);
            }

            $duplicate = DB::table('users')
                ->where('mobile_number', $enquiry->mobile_number)
                ->orWhere('email', $enquiry->email)
                ->exists();
            if ($duplicate) {
                throw new ApiException('A user already exists with this email address or mobile number.', 409);
            }

            $userData = [
                'name' => $enquiry->name,
                'email' => $enquiry->email,
                'mobile_number' => $enquiry->mobile_number,
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

            DB::table('enquiries')->where('id', $id)->update([
                'status' => 'approved',
                'account_id' => $accountId,
            ]);

            return [
                'account_id' => $accountId,
                'email' => $enquiry->email,
                'name' => $enquiry->name,
                'course_interest' => $enquiry->course_interest,
            ];
        });

        Mail::to($account['email'])->send(new StudentAccountApproved(
            $account['name'],
            $account['account_id'],
            $account['course_interest'],
            rtrim((string) config('app.frontend_url'), '/').'/login'
        ));

        return $this->okMessage('Enquiry approved. Student ID and login link emailed.', [
            'account_id' => $account['account_id'],
            'email' => $account['email'],
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

        DB::table('enquiries')->where('id', $id)->update(['status' => 'rejected']);

        return $this->okMessage('Enquiry rejected.');
    }
}
