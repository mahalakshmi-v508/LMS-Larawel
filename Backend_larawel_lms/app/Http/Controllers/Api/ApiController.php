<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

abstract class ApiController extends Controller
{
    /**
     * Standard success envelope: { success: true, data: ... }
     */
    protected function ok(mixed $data = null, int $status = 200, array $extra = []): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $data] + $extra, $status);
    }

    /**
     * Success envelope with a message.
     */
    protected function okMessage(string $message, mixed $data = null, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * Convert an incoming date-time (usually an ISO-8601 string from the browser)
     * into the MySQL DATETIME format in the application timezone.
     */
    protected function dateTime(mixed $value, ?string $default = null): ?string
    {
        if ($value === null || $value === '') {
            return $default;
        }

        return Carbon::parse($value)
            ->setTimezone(config('app.timezone'))
            ->format('Y-m-d H:i:s');
    }

    /**
     * Convert an incoming value into a MySQL DATE string.
     */
    protected function dateOnly(mixed $value, ?string $default = null): ?string
    {
        if ($value === null || $value === '') {
            return $default;
        }

        return Carbon::parse($value)->format('Y-m-d');
    }

    protected function bit(mixed $value): int
    {
        return $value ? 1 : 0;
    }
}
