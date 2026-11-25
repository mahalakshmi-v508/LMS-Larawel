// src/services/api.ts
// The Laravel backend exposes the same endpoints under /api.
// Override with VITE_API_BASE when the API runs elsewhere.
const API_BASE = (import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api').replace(/\/+$/, '');

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  otp_code?: string;
  count?: number;
}

export interface User {
  user_id: number;
  id?: number;
  name: string;
  mobile_number: string;
  role: 'ADMIN' | 'TRAINER' | 'STUDENT';
  is_active: boolean;
  student_id?: number;
  certification_status?: string;
  trainer_id?: number;
  specialization?: string;
  batch_id?: number;
  batch_code?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    return await res.json();
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    return { success: false, error: err.message || 'Network error' };
  }
}

export const api = {
  // --- PUBLIC WEBSITE ---
  submitEnquiry: (data: { name: string; email?: string; mobile_number: string; course_interest: string; message?: string }) =>
    request('/enquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // --- 1. AUTHENTICATION (OTP) ---
  sendOtp: (mobile_number: string) =>
    request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile_number }),
    }),

  verifyOtp: (mobile_number: string, otp_code: string) =>
    request<User>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile_number, otp_code }),
    }),

  // --- 2. USERS & PROFILES ---
  getUsers: () => request<any[]>('/users'),
  createUser: (data: { name: string; mobile_number: string; role: string }) =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),

  getStudents: () => request<any[]>('/users'), // filter role STUDENT
  getAdminStudents: () => request<any[]>('/admin/students'),
  getStudentById: (id: number) => request<any>(`/students/${id}`),
  createStudent: (data: { user_id: number; joining_date: string; certification_status?: string }) =>
    request('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id: number, data: { name: string; mobile_number: string; joining_date: string; certification_status: string; is_active: boolean }) =>
    request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStudentBatch: (id: number, batch_id: number | null) =>
    request(`/students/${id}/batch`, { method: 'PUT', body: JSON.stringify({ batch_id }) }),
  getStudentAdminDetails: (id: number) => request<any>(`/students/${id}/admin-details`),

  getTrainers: (includeInactive = false) =>
    request<any[]>(`/trainers${includeInactive ? '?include_inactive=1' : ''}`),
  updateTrainer: (id: number, data: { name: string; mobile_number: string; specialization: string; is_active: boolean }) =>
    request(`/trainers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createTrainer: (data: { user_id: number; specialization: string }) =>
    request('/trainers', { method: 'POST', body: JSON.stringify(data) }),

  // --- 3. COURSES & DAY-WISE CURRICULUM ---
  getCourses: () => request<any[]>('/courses'),
  createCourse: (data: { course_name: string; description?: string; duration_days?: number; course_image_url?: string }) =>
    request('/courses', { method: 'POST', body: JSON.stringify(data) }),

  getCourseDays: (course_id: number) => request<any[]>(`/courses/${course_id}/days`),
  addCourseDay: (course_id: number, data: { day_number: number; title: string; summary?: string }) =>
    request(`/courses/${course_id}/days`, { method: 'POST', body: JSON.stringify(data) }),

  getDayContent: (course_day_id: number) => request<any[]>(`/course-days/${course_day_id}/content`),
  addDayContent: (course_day_id: number, data: { title: string; rich_text_content?: string; video_url?: string; attachment_url?: string }) =>
    request(`/course-days/${course_day_id}/content`, { method: 'POST', body: JSON.stringify(data) }),

  // --- 4. BATCH MANAGEMENT ---
  getBatches: (trainer_id?: number, includeInactive = false) => {
    const params = new URLSearchParams();
    if (trainer_id) params.set('trainer_id', String(trainer_id));
    if (includeInactive) params.set('include_inactive', '1');
    const query = params.toString();
    return request<any[]>(`/batches${query ? `?${query}` : ''}`);
  },
  updateBatchStatus: (id: number, is_active: boolean) =>
    request(`/batches/${id}/status`, { method: 'PUT', body: JSON.stringify({ is_active }) }),
  getBatchById: (id: number) => request<any>(`/batches/${id}`),
  createBatch: (data: { batch_code: string; course_id: number; trainer_id: number; start_date: string; end_date: string }) =>
    request('/batches', { method: 'POST', body: JSON.stringify(data) }),

  getBatchStudents: (batch_id: number) => request<any[]>(`/batches/${batch_id}/students`),
  assignStudentsToBatch: (batch_id: number, student_ids: number[]) =>
    request('/batches/assign-student', { method: 'POST', body: JSON.stringify({ batch_id, student_ids }) }),
  removeStudentsFromBatch: (batch_id: number, student_ids: number[]) =>
    request(`/batches/${batch_id}/students`, { method: 'DELETE', body: JSON.stringify({ student_ids }) }),

  // --- 5. LIVE CLASSES & RECORDINGS ---
  getLiveClasses: (batch_id: number) => request<any[]>(`/batches/${batch_id}/live-classes`),
  scheduleLiveClass: (data: { batch_id: number; course_day_id?: number; class_topic: string; teams_meeting_link: string; start_time: string; end_time: string }) =>
    request('/live-classes', { method: 'POST', body: JSON.stringify(data) }),
  updateLiveClassStatus: (id: number, status: string) =>
    request(`/live-classes/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  getRecordings: (batch_id: number) => request<any[]>(`/batches/${batch_id}/recordings`),
  addRecording: (live_class_id: number, data: { storage_blob_path: string; duration_minutes?: number }) =>
    request(`/live-classes/${live_class_id}/recordings`, { method: 'POST', body: JSON.stringify(data) }),

  // --- 6. HYBRID ATTENDANCE ---
  markAttendance: (data: { batch_id: number; marked_by_trainer_id?: number; class_date: string; records: { student_id: number; status: string }[] }) =>
    request('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  getBatchAttendance: (batch_id: number, date?: string) =>
    request<any[]>(`/batches/${batch_id}/attendance${date ? `?date=${date}` : ''}`),
  getStudentAttendance: (student_id: number) =>
    request<any>(`/students/${student_id}/attendance`),

  // --- 7. ASSIGNMENTS & SUBMISSIONS ---
  getAssignments: (batch_id: number) => request<any[]>(`/batches/${batch_id}/assignments`),
  createAssignment: (data: { batch_id: number; course_day_id?: number; title: string; description?: string; file_attachment_url?: string; due_date: string }) =>
    request('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  submitAssignment: (assignment_id: number, data: { student_id: number; submission_file_url: string }) =>
    request(`/assignments/${assignment_id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  getAssignmentSubmissions: (assignment_id: number) =>
    request<any[]>(`/assignments/${assignment_id}/submissions`),
  gradeAssignmentSubmission: (submission_id: number, data: { marks_obtained: number; trainer_feedback?: string }) =>
    request(`/assignment-submissions/${submission_id}/grade`, { method: 'PUT', body: JSON.stringify(data) }),
  getStudentSubmissions: (student_id: number) =>
    request<{ assignments: any[]; tests: any[] }>(`/students/${student_id}/submissions`),

  // --- 8. TESTS & ASSESSMENTS ---
  getTests: (batch_id: number) => request<any[]>(`/batches/${batch_id}/tests`),
  createTest: (data: { batch_id: number; subject: string; title: string; test_paper_url?: string; start_time: string; end_time: string; total_marks: number }) =>
    request('/tests', { method: 'POST', body: JSON.stringify(data) }),
  submitTest: (test_id: number, data: { student_id: number; answer_sheet_url: string }) =>
    request(`/tests/${test_id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  getTestSubmissions: (test_id: number) =>
    request<any[]>(`/tests/${test_id}/submissions`),
  gradeTestSubmission: (submission_id: number, marks_obtained: number) =>
    request(`/test-submissions/${submission_id}/grade`, { method: 'PUT', body: JSON.stringify({ marks_obtained }) }),

  // --- 9. MESSAGE BOARD / ANNOUNCEMENTS ---
  getAnnouncements: (batch_id: number) => request<any[]>(`/batches/${batch_id}/announcements`),
  createAnnouncement: (data: { batch_id: number; created_by_user_id: number; title: string; content: string; is_pinned?: boolean }) =>
    request('/announcements', { method: 'POST', body: JSON.stringify(data) }),

  // --- 10. REALTIME BATCH CHAT WITH TIMER ---
  getChatRoom: (batch_id: number) => request<any>(`/batches/${batch_id}/chat-room`),
  configureChatRoom: (batch_id: number, data: { is_active: boolean; active_from?: string; active_until?: string }) =>
    request(`/batches/${batch_id}/chat-room`, { method: 'POST', body: JSON.stringify(data) }),
  getChatMessages: (chat_room_id: number) => request<any[]>(`/chat-rooms/${chat_room_id}/messages`),
  sendChatMessage: (chat_room_id: number, data: { sender_user_id: number; message: string }) =>
    request(`/chat-rooms/${chat_room_id}/messages`, { method: 'POST', body: JSON.stringify(data) }),

  // --- 11. CERTIFICATES ---
  issueCertificate: (data: { student_id: number; batch_id: number; course_completed: boolean }) =>
    request<{ id: number; certificate_number: string; student_id: number; batch_id: number; pdf_url: string; attendance_percentage: number }>(
      '/certificates',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  certificateDownloadUrl: (certificate_id: number) =>
    `${API_BASE}/certificates/${certificate_id}/download`,
  certificateViewUrl: (certificate_id: number) =>
    `${API_BASE}/certificates/${certificate_id}/view`,
  getCertificate: (certificate_id: number) =>
    request<{
      id: number;
      certificate_number: string;
      student_id: number;
      batch_id: number;
      issued_at: string;
      pdf_url: string;
      recipient_name: string;
      course_title: string;
      batch_label: string;
      default_recipient_name: string;
      default_course_title: string;
      default_batch_label: string;
    }>(`/certificates/${certificate_id}`),
  updateCertificate: (
    certificate_id: number,
    data: {
      certificate_number?: string;
      recipient_name?: string;
      course_title?: string;
      batch_label?: string;
      issued_at?: string;
    }
  ) => request(`/certificates/${certificate_id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getStudentCertificates: (student_id: number) =>
    request<any[]>(`/students/${student_id}/certificates`),

  // --- 12. EMS (EMPLOYEE MANAGEMENT SYSTEM) ---
  getEmsDepartments: () => request<any[]>('/ems/departments'),
  createEmsDepartment: (data: { name: string; code: string; description?: string }) =>
    request('/ems/departments', { method: 'POST', body: JSON.stringify(data) }),
  getEmsDesignations: (department_id?: number) =>
    request<any[]>(`/ems/designations${department_id ? `?department_id=${department_id}` : ''}`),
  createEmsDesignation: (data: { department_id: number; title: string; grade_level?: string }) =>
    request('/ems/designations', { method: 'POST', body: JSON.stringify(data) }),
  getEmsEmployees: (params?: { department_id?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.department_id) query.append('department_id', String(params.department_id));
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return request<any[]>(`/ems/employees${qs ? `?${qs}` : ''}`);
  },
  getEmsEmployeeById: (id: number) => request<any>(`/ems/employees/${id}`),
  createEmsEmployee: (data: any) => request('/ems/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmsEmployee: (id: number, data: any) => request(`/ems/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Attendance
  getEmsAttendance: (params?: { date?: string; employee_id?: number; department_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.employee_id) query.append('employee_id', String(params.employee_id));
    if (params?.department_id) query.append('department_id', String(params.department_id));
    const qs = query.toString();
    return request<any[]>(`/ems/attendance${qs ? `?${qs}` : ''}`);
  },
  checkInEms: (data: { employee_id: number; work_mode?: string; remarks?: string }) =>
    request('/ems/attendance/check-in', { method: 'POST', body: JSON.stringify(data) }),
  checkOutEms: (data: { employee_id: number }) =>
    request('/ems/attendance/check-out', { method: 'POST', body: JSON.stringify(data) }),

  // Leaves
  getEmsLeaves: (params?: { status?: string; employee_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.employee_id) query.append('employee_id', String(params.employee_id));
    const qs = query.toString();
    return request<any[]>(`/ems/leaves${qs ? `?${qs}` : ''}`);
  },
  applyEmsLeave: (data: any) => request('/ems/leaves', { method: 'POST', body: JSON.stringify(data) }),
  updateEmsLeaveStatus: (id: number, data: { status: string; approved_by?: number; action_remarks?: string }) =>
    request(`/ems/leaves/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),

  // LMS ↔ EMS Bridge / Upskilling
  assignEmsTraining: (data: { employee_id: number; course_id: number; batch_id?: number; training_type?: string; completion_deadline?: string }) =>
    request('/ems/trainings/assign', { method: 'POST', body: JSON.stringify(data) }),
  getEmsEmployeeTrainingProgress: (employee_id: number) =>
    request<any>(`/ems/trainings/employee/${employee_id}`),
  getEmsTrainingSummary: () =>
    request<any>('/ems/trainings/summary'),
};
