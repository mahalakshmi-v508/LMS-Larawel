<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class WhatsAppService
{
    public function sendPaymentRequest(
        string $mobileNumber,
        string $studentName,
        string $courseInterest,
        float $amount,
        string $paymentUrl,
        string $qrUrl,
        string $loginUrl,
    ): bool {
        $message = "Hello {$studentName},\n\n"
            ."SkillForge course: {$courseInterest}\n"
            .'Course fee: ₹'.number_format($amount, 2)."\n\n"
            ."Complete payment: {$paymentUrl}\n"
            ."QR code: {$qrUrl}\n"
            ."Login: {$loginUrl}";

        return $this->sendText($mobileNumber, $message);
    }

    public function sendPaymentReceived(
        string $mobileNumber,
        string $studentName,
        string $accountId,
        string $courseInterest,
        float $amount,
        string $paymentReference,
        string $loginUrl,
    ): bool {
        $message = "Hello {$studentName},\n\n"
            ."Payment received for {$courseInterest}.\n"
            .'Amount: ₹'.number_format($amount, 2)."\n"
            .'Student ID: '.$accountId."\n";

        if ($paymentReference !== '') {
            $message .= 'Payment reference: '.$paymentReference."\n";
        }

        $message .= "\nLogin now: {$loginUrl}";

        return $this->sendText($mobileNumber, $message);
    }

    private function sendText(string $mobileNumber, string $message): bool
    {
        $phoneNumberId = trim((string) config('services.whatsapp.phone_number_id'));
        $accessToken = trim((string) config('services.whatsapp.access_token'));
        $recipient = $this->normalizeIndianMobile($mobileNumber);

        if ($phoneNumberId === '' || $accessToken === '' || $recipient === '') {
            report(new \RuntimeException('WhatsApp is not configured or the enquiry has no valid mobile number.'));

            return false;
        }

        $response = Http::withToken($accessToken)
            ->acceptJson()
            ->post("https://graph.facebook.com/v23.0/{$phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                'to' => $recipient,
                'type' => 'text',
                'text' => [
                    'preview_url' => true,
                    'body' => $message,
                ],
            ]);

        if (! $response->successful()) {
            report(new \RuntimeException('WhatsApp send failed: '.$response->status().' '.$response->body()));

            return false;
        }

        return true;
    }

    private function normalizeIndianMobile(string $mobileNumber): string
    {
        $digits = preg_replace('/\D+/', '', trim($mobileNumber)) ?? '';

        if (str_starts_with($digits, '91') && strlen($digits) === 12) {
            return $digits;
        }

        if (strlen($digits) === 10) {
            return '91'.$digits;
        }

        return '';
    }
}
