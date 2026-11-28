<?php

use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BatchController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\EnquiryController;
use App\Http\Controllers\Api\Ems\EmsAttendanceController;
use App\Http\Controllers\Api\Ems\EmsDepartmentController;
use App\Http\Controllers\Api\Ems\EmsDesignationController;
use App\Http\Controllers\Api\Ems\EmsEmployeeController;
use App\Http\Controllers\Api\Ems\EmsLeaveController;
use App\Http\Controllers\Api\Ems\EmsTrainingController;
use App\Http\Controllers\Api\LiveClassController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\TestController;
use App\Http\Controllers\Api\TrainerController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| LMS + EMS API
|--------------------------------------------------------------------------
| The route names and response shapes mirror the original Node/Express
| backend so the existing React frontend works without changes.
*/

// 1. Authentication (mobile + OTP)
Route::post('auth/send-otp', [AuthController::class, 'sendOtp']);
Route::post('auth/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('auth/student-login', [AuthController::class, 'studentLogin']);

// Public website
Route::post('enquiries', [EnquiryController::class, 'store']);
Route::get('enquiries/payment/{token}/qr', [EnquiryController::class, 'qrImage']);
Route::get('enquiries/payment/{token}', [EnquiryController::class, 'paymentInfo']);
Route::post('enquiries/payment/{token}', [EnquiryController::class, 'pay']);
Route::get('admin/enquiries', [EnquiryController::class, 'index']);
Route::post('admin/enquiries/{id}/approve', [EnquiryController::class, 'approve']);
Route::post('admin/enquiries/{id}/reject', [EnquiryController::class, 'reject']);
Route::put('admin/enquiries/{id}/amount', [EnquiryController::class, 'updateAmount']);
Route::post('admin/enquiries/{id}/mark-paid', [EnquiryController::class, 'markPaid']);

// 2. Users, students and trainers
Route::get('users', [UserController::class, 'index']);
Route::post('users', [UserController::class, 'store']);

Route::get('admin/students', [StudentController::class, 'index']);
Route::post('students', [StudentController::class, 'store']);
Route::get('students/{id}/admin-details', [StudentController::class, 'adminDetails']);
Route::get('students/{id}/attendance', [StudentController::class, 'attendance']);
Route::get('students/{id}/submissions', [StudentController::class, 'submissions']);
Route::get('students/{id}/certificates', [CertificateController::class, 'forStudent']);
Route::get('students/{id}', [StudentController::class, 'show']);
Route::put('students/{id}/batch', [StudentController::class, 'updateBatch']);
Route::put('students/{id}', [StudentController::class, 'update']);

Route::get('trainers', [TrainerController::class, 'index']);
Route::post('trainers', [TrainerController::class, 'store']);
Route::get('trainers/{id}', [TrainerController::class, 'show']);
Route::put('trainers/{id}', [TrainerController::class, 'update']);

// 3. Courses and day-wise curriculum
Route::get('courses', [CourseController::class, 'index']);
Route::post('courses', [CourseController::class, 'store']);
Route::get('courses/{id}/days', [CourseController::class, 'days']);
Route::post('courses/{id}/days', [CourseController::class, 'storeDay']);
Route::get('course-days/{id}/content', [CourseController::class, 'content']);
Route::post('course-days/{id}/content', [CourseController::class, 'storeContent']);

// 4. Batches
Route::get('batches', [BatchController::class, 'index']);
Route::post('batches', [BatchController::class, 'store']);
Route::post('batches/assign-student', [BatchController::class, 'assignStudents']);
Route::get('batches/{id}/students', [BatchController::class, 'students']);
Route::delete('batches/{id}/students', [BatchController::class, 'removeStudents']);
Route::put('batches/{id}/status', [BatchController::class, 'updateStatus']);
Route::get('batches/{id}', [BatchController::class, 'show']);

// 5. Live classes and recordings
Route::post('live-classes', [LiveClassController::class, 'store']);
Route::put('live-classes/{id}/status', [LiveClassController::class, 'updateStatus']);
Route::post('live-classes/{id}/recordings', [LiveClassController::class, 'storeRecording']);
Route::get('batches/{id}/live-classes', [LiveClassController::class, 'index']);
Route::get('batches/{id}/recordings', [LiveClassController::class, 'recordings']);

// 6. Hybrid attendance
Route::post('attendance', [AttendanceController::class, 'store']);
Route::get('batches/{id}/attendance', [AttendanceController::class, 'batchSheet']);

// 7. Assignments and submissions
Route::get('batches/{id}/assignments', [AssignmentController::class, 'index']);
Route::post('assignments', [AssignmentController::class, 'store']);
Route::post('assignments/{id}/submit', [AssignmentController::class, 'submit']);
Route::get('assignments/{id}/submissions', [AssignmentController::class, 'submissions']);
Route::put('assignment-submissions/{id}/grade', [AssignmentController::class, 'grade']);

// 8. Tests and assessments
Route::get('batches/{id}/tests', [TestController::class, 'index']);
Route::post('tests', [TestController::class, 'store']);
Route::post('tests/{id}/submit', [TestController::class, 'submit']);
Route::get('tests/{id}/submissions', [TestController::class, 'submissions']);
Route::put('test-submissions/{id}/grade', [TestController::class, 'grade']);

// 9. Message board / announcements
Route::get('batches/{id}/announcements', [AnnouncementController::class, 'index']);
Route::post('announcements', [AnnouncementController::class, 'store']);

// 10. Batch chat with timer
Route::get('batches/{id}/chat-room', [ChatController::class, 'show']);
Route::post('batches/{id}/chat-room', [ChatController::class, 'configure']);
Route::get('chat-rooms/{id}/messages', [ChatController::class, 'messages']);
Route::post('chat-rooms/{id}/messages', [ChatController::class, 'storeMessage']);
Route::post('direct-messages', [ChatController::class, 'storeDirect']);
Route::get('direct-messages', [ChatController::class, 'directMessages']);
Route::get('direct-conversations/{userId}', [ChatController::class, 'directConversations']);
Route::get('direct-conversations', [ChatController::class, 'allDirectConversations']);

// 11. Certificates
Route::post('certificates', [CertificateController::class, 'issue']);
Route::get('certificates/{id}/download', [CertificateController::class, 'download']);
Route::get('certificates/{id}/view', [CertificateController::class, 'view']);
Route::get('certificates/{id}', [CertificateController::class, 'show']);
Route::put('certificates/{id}', [CertificateController::class, 'update']);

// 12. EMS (Employee Management System)
Route::prefix('ems')->group(function () {
    Route::get('departments', [EmsDepartmentController::class, 'index']);
    Route::post('departments', [EmsDepartmentController::class, 'store']);

    Route::get('designations', [EmsDesignationController::class, 'index']);
    Route::post('designations', [EmsDesignationController::class, 'store']);

    Route::get('employees', [EmsEmployeeController::class, 'index']);
    Route::post('employees', [EmsEmployeeController::class, 'store']);
    Route::get('employees/{id}', [EmsEmployeeController::class, 'show']);
    Route::put('employees/{id}', [EmsEmployeeController::class, 'update']);

    Route::get('attendance', [EmsAttendanceController::class, 'index']);
    Route::post('attendance/check-in', [EmsAttendanceController::class, 'checkIn']);
    Route::post('attendance/check-out', [EmsAttendanceController::class, 'checkOut']);

    Route::get('leaves', [EmsLeaveController::class, 'index']);
    Route::post('leaves', [EmsLeaveController::class, 'store']);
    Route::put('leaves/{id}/status', [EmsLeaveController::class, 'updateStatus']);

    Route::post('trainings/assign', [EmsTrainingController::class, 'assign']);
    Route::get('trainings/employee/{id}', [EmsTrainingController::class, 'employeeProgress']);
    Route::get('trainings/summary', [EmsTrainingController::class, 'summary']);
});
