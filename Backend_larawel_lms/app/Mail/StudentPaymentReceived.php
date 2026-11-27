<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent the moment the fee is confirmed. This is where the Student ID is
 * generated and delivered.
 *
 * The subject starts with "Re:" on purpose so Gmail/Outlook thread it together
 * with the original payment-request email.
 */
class StudentPaymentReceived extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $studentName,
        public string $accountId,
        public string $courseInterest,
        public float $amount,
        public string $paymentReference = '',
        public string $loginUrl = '',
        public string $studentEmail = '',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Re: SkillForge: Complete your course fee payment');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.student-payment-received',
            with: [
                'studentName' => $this->studentName,
                'accountId' => $this->accountId,
                'courseInterest' => $this->courseInterest,
                'amount' => $this->amount,
                'paymentReference' => $this->paymentReference,
                'loginUrl' => $this->loginUrl,
                'studentEmail' => $this->studentEmail,
            ]
        );
    }
}
