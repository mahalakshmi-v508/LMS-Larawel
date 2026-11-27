<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentAccountApproved extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $studentName,
        public string $accountId,
        public string $courseInterest,
        public string $loginUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your SkillForge student account is approved');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.student-account-approved',
            with: [
                'studentName' => $this->studentName,
                'accountId' => $this->accountId,
                'courseInterest' => $this->courseInterest,
                'loginUrl' => $this->loginUrl,
            ]
        );
    }
}
