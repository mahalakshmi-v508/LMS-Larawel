<?php

namespace Tests\Feature;

use App\Mail\StudentAccountApproved;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class EnquiryApprovalTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('students');
        Schema::dropIfExists('batch_students');
        Schema::dropIfExists('batches');
        Schema::dropIfExists('enquiries');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->string('mobile_number', 20);
            $table->string('role', 20);
            $table->boolean('is_active')->default(true);
            $table->string('account_id', 32)->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('students', function (Blueprint $table) {
            $table->bigIncrements('student_id');
            $table->unsignedBigInteger('user_id');
            $table->date('joining_date')->nullable();
            $table->string('certification_status')->default('PENDING');
        });

        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_code');
        });

        Schema::create('batch_students', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('batch_id');
        });

        Schema::create('enquiries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('mobile_number', 20);
            $table->string('course_interest');
            $table->text('message')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->string('status', 20)->default('pending');
            $table->string('account_id', 32)->nullable();
        });
    }

    public function test_approval_emails_login_details_and_first_login_creates_student_profile(): void
    {
        Mail::fake();
        $enquiryId = $this->createEnquiry('NEW');

        $this->postJson("/api/admin/enquiries/{$enquiryId}/approve")
            ->assertOk()
            ->assertJsonPath('data.account_id', 'STU000001')
            ->assertJsonPath('data.email', 'student@example.com');

        $this->assertDatabaseHas('users', [
            'account_id' => 'STU000001',
            'email' => 'student@example.com',
            'role' => 'STUDENT',
        ]);
        $this->assertDatabaseCount('students', 0);
        $this->assertDatabaseHas('enquiries', [
            'id' => $enquiryId,
            'status' => 'approved',
            'account_id' => 'STU000001',
        ]);

        Mail::assertSent(StudentAccountApproved::class, function (StudentAccountApproved $mail) {
            return $mail->hasTo('student@example.com')
                && $mail->accountId === 'STU000001'
                && $mail->loginUrl === 'http://localhost:5173/login';
        });

        $this->postJson("/api/admin/enquiries/{$enquiryId}/approve")->assertOk();
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('students', 0);
        Mail::assertSent(StudentAccountApproved::class, 2);

        $this->postJson('/api/auth/student-login', [
            'account_id' => 'STU000001',
            'email' => 'student@example.com',
        ])->assertOk();
        $this->assertDatabaseCount('students', 1);
    }

    public function test_rejection_does_not_create_a_student_account(): void
    {
        $enquiryId = $this->createEnquiry();

        $this->postJson("/api/admin/enquiries/{$enquiryId}/reject")
            ->assertOk()
            ->assertJsonPath('message', 'Enquiry rejected.');

        $this->assertDatabaseHas('enquiries', ['id' => $enquiryId, 'status' => 'rejected']);
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('students', 0);
    }

    public function test_student_login_requires_matching_account_id_and_email(): void
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Example Student',
            'email' => 'student@example.com',
            'password' => bcrypt('unused-password'),
            'mobile_number' => '0123456789',
            'role' => 'STUDENT',
            'is_active' => true,
            'account_id' => 'STU000001',
        ]);
        $this->postJson('/api/auth/student-login', [
            'account_id' => 'STU000001',
            'email' => 'wrong@example.com',
        ])->assertUnauthorized();
        $this->assertDatabaseCount('students', 0);

        $this->postJson('/api/auth/student-login', [
            'account_id' => 'STU000001',
            'email' => 'student@example.com',
        ])->assertOk()
            ->assertJsonPath('data.role', 'STUDENT')
            ->assertJsonPath('data.account_id', 'STU000001');
        $this->assertDatabaseCount('students', 1);
    }

    private function createEnquiry(string $status = 'pending'): int
    {
        return DB::table('enquiries')->insertGetId([
            'name' => 'Example Student',
            'email' => 'student@example.com',
            'mobile_number' => '0123456789',
            'course_interest' => 'Digital Marketing',
            'message' => 'Please contact me.',
            'created_at' => now(),
            'status' => $status,
        ]);
    }
}
