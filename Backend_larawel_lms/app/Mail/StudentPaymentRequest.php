<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent when an admin approves an enquiry and sets the course fee.
 *
 * The student ID is intentionally NOT included here — the account is created
 * only after the payment is completed (see StudentPaymentReceived).
 */
class StudentPaymentRequest extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $studentName,
        public string $courseInterest,
        public float $amount,
        public string $paymentUrl,
        public string $loginUrl,
        public string $qrPng = '',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'SkillForge: Complete your course fee payment');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.student-payment-request',
            with: [
                'studentName' => $this->studentName,
                'courseInterest' => $this->courseInterest,
                'amount' => $this->amount,
                'paymentUrl' => $this->paymentUrl,
                'loginUrl' => $this->loginUrl,
                'qrPng' => $this->qrPng,
            ]
        );
    }
}
