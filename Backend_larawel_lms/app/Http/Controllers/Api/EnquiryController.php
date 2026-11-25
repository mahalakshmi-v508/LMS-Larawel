<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnquiryController extends ApiController
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:150'],
            'mobile_number' => ['required', 'string', 'max:20'],
            'course_interest' => ['required', 'string', 'max:150'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::insert(
            'INSERT INTO enquiries (name, email, mobile_number, course_interest, message, created_at)
             VALUES (?, ?, ?, ?, ?, ?)',
            [
                $validated['name'],
                $validated['email'] ?? null,
                $validated['mobile_number'],
                $validated['course_interest'],
                $validated['message'] ?? null,
                now(),
            ]
        );

        return $this->okMessage('Enquiry submitted successfully');
    }
}
