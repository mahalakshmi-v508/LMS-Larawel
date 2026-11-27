// src/views/admin/AdminPortal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { CertificatePreview } from '../../components/CertificatePreview';
import { SidebarBrand, SidebarUser } from '../../components/SidebarSections';
import { useAuth } from '../../context/AuthContext';
import {
  Users, UserCheck, BookOpen, Layers, Plus, Calendar, Video, FileText, CheckCircle2, Briefcase,
  Eye, Pencil, X, Download, Bell, Menu, ChevronDown, GraduationCap, ArrowUpRight, Sparkles,
  ClipboardList, Check, XCircle
} from 'lucide-react';
import { EmsPortal } from '../ems/EmsPortal';

export const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'enquiries' | 'trainers' | 'courses' | 'batches' | 'curriculum' | 'ems'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => (typeof window === 'undefined' ? true : window.innerWidth > 1024));

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth <= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Data states
  const [adminStudents, setAdminStudents] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [processingEnquiryId, setProcessingEnquiryId] = useState<number | null>(null);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseDays, setCourseDays] = useState<any[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [dayContents, setDayContents] = useState<any[]>([]);

  // Form states
  const [newStudentMobile, setNewStudentMobile] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newTrainerMobile, setNewTrainerMobile] = useState('');
  const [newTrainerName, setNewTrainerName] = useState('');
  const [newTrainerSpec, setNewTrainerSpec] = useState('Full Stack Web Development');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseImageUrl, setNewCourseImageUrl] = useState('');
  const [newCourseDuration, setNewCourseDuration] = useState(60);
  const [newBatchCode, setNewBatchCode] = useState('');
  const [newBatchCourseId, setNewBatchCourseId] = useState<number | ''>('');
  const [newBatchTrainerId, setNewBatchTrainerId] = useState<number | ''>('');
  const [newBatchStartDate, setNewBatchStartDate] = useState('2026-09-01');
  const [newBatchEndDate, setNewBatchEndDate] = useState('2026-11-30');

  // Curriculum form states
  const [newDayNumber, setNewDayNumber] = useState(1);
  const [newDayTitle, setNewDayTitle] = useState('');
  const [newDaySummary, setNewDaySummary] = useState('');
  const [newContentTitle, setNewContentTitle] = useState('');
  const [newContentRichText, setNewContentRichText] = useState('');
  const [newContentVideoUrl, setNewContentVideoUrl] = useState('');
  const [newContentAttachmentUrl, setNewContentAttachmentUrl] = useState('');

  const [notification, setNotification] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [studentEditName, setStudentEditName] = useState('');
  const [studentEditMobile, setStudentEditMobile] = useState('');
  const [studentEditJoiningDate, setStudentEditJoiningDate] = useState('');
  const [studentEditCertification, setStudentEditCertification] = useState('PENDING');
  const [studentEditActive, setStudentEditActive] = useState(true);
  const [studentEditBatchId, setStudentEditBatchId] = useState<number | ''>('');
  const [courseCompletionConfirmed, setCourseCompletionConfirmed] = useState(false);
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  const [issuedCertificateId, setIssuedCertificateId] = useState<number | null>(null);
  const [previewCertificate, setPreviewCertificate] = useState<any>(null);
  const [editingCertificate, setEditingCertificate] = useState<any>(null);
  const [savingCertificate, setSavingCertificate] = useState(false);
  const [certForm, setCertForm] = useState({
    certificate_number: '',
    recipient_name: '',
    course_title: '',
    batch_label: '',
    issued_at: '',
  });
  const [managedBatchId, setManagedBatchId] = useState<number | null>(null);
  const [managedBatchStudents, setManagedBatchStudents] = useState<any[]>([]);
  const [batchStudentIds, setBatchStudentIds] = useState<number[]>([]);
  const loadedData = useRef(new Set<string>());

  const getNextDayNumber = (days: any[]) => {
    const highestDayNumber = days.reduce(
      (highest, day) => Math.max(highest, Number(day.day_number) || 0),
      0
    );
    return highestDayNumber + 1;
  };

  const loadAdminEnquiries = async (force = false) => {
    if (!force && loadedData.current.has('enquiries')) return;
    loadedData.current.add('enquiries');
    const res = await api.getAdminEnquiries();
    if (res.success && res.data) {
      setEnquiries(res.data);
    } else {
      loadedData.current.delete('enquiries');
      showNotice(`Could not load enquiries: ${res.message || res.error || 'Request failed'}`);
    }
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleApproveEnquiry = async (enquiryId: number) => {
    setProcessingEnquiryId(enquiryId);
    const res = await api.approveEnquiry(enquiryId);
    setProcessingEnquiryId(null);
    if (!res.success || !res.data) {
      showNotice(`Approval failed: ${res.message || res.error || 'Request failed'}`);
      return;
    }
    showNotice(`Approved. Student ID ${res.data.account_id} was emailed to ${res.data.email}.`);
    await Promise.all([loadAdminEnquiries(true), loadAdminStudents(true)]);
  };

  const handleRejectEnquiry = async (enquiryId: number) => {
    setProcessingEnquiryId(enquiryId);
    const res = await api.rejectEnquiry(enquiryId);
    setProcessingEnquiryId(null);
    if (!res.success) {
      showNotice(`Rejection failed: ${res.message || res.error || 'Request failed'}`);
      return;
    }
    showNotice('Enquiry rejected.');
    await loadAdminEnquiries(true);
  };

  const loadAdminStudents = async (force = false) => {
    if (!force && loadedData.current.has('adminStudents')) return;
    loadedData.current.add('adminStudents');
    const res = await api.getAdminStudents();
    if (res.success && res.data) {
      setAdminStudents(res.data);
    } else {
      loadedData.current.delete('adminStudents');
    }
  };

  const loadTrainers = async (force = false) => {
    if (!force && loadedData.current.has('trainers')) return;
    loadedData.current.add('trainers');
    const res = await api.getTrainers(true);
    if (res.success && res.data) {
      setTrainers(res.data);
    } else {
      loadedData.current.delete('trainers');
    }
  };

  const loadCourses = async (force = false) => {
    if (!force && loadedData.current.has('courses')) return;
    loadedData.current.add('courses');
    const res = await api.getCourses();
    if (res.success && res.data) {
      setCourses(res.data);
      if (res.data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(res.data[0].id);
      }
    } else {
      loadedData.current.delete('courses');
    }
  };

  const loadBatches = async (force = false) => {
    if (!force && loadedData.current.has('batches')) return;
    loadedData.current.add('batches');
    const res = await api.getBatches(undefined, true);
    if (res.success && res.data) {
      setBatches(res.data);
    } else {
      loadedData.current.delete('batches');
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      Promise.all([loadTrainers(), loadCourses(), loadBatches(), loadAdminEnquiries()])
        .catch((err) => console.error(err));
    } else if (activeTab === 'students') {
      Promise.all([loadAdminStudents(), loadBatches()])
        .catch((err) => console.error(err));
    } else if (activeTab === 'enquiries') {
      loadAdminEnquiries().catch((err) => console.error(err));
    } else if (activeTab === 'trainers') {
      loadTrainers().catch((err) => console.error(err));
    } else if (activeTab === 'courses' || activeTab === 'curriculum') {
      loadCourses().catch((err) => console.error(err));
    } else if (activeTab === 'batches') {
      Promise.all([loadBatches(), loadCourses(), loadTrainers(), loadAdminStudents()])
        .catch((err) => console.error(err));
    }
  }, [activeTab]);

  const openStudentDetails = async (student: any) => {
    setSelectedStudent(student);
    setCourseCompletionConfirmed(false);
    setIssuedCertificateId(null);
    setStudentEditName(student.name || '');
    setStudentEditMobile(student.mobile_number || '');
    setStudentEditJoiningDate(student.joining_date ? String(student.joining_date).split('T')[0] : '');
    setStudentEditCertification(student.certification_status || 'PENDING');
    setStudentEditActive(Boolean(student.is_active));
    setStudentEditBatchId(student.batch_id || '');
    const res = await api.getStudentAdminDetails(student.student_id);
    if (res.success && res.data) {
      setStudentDetails(res.data);
    } else {
      showNotice(`Error: ${res.message || res.error}`);
    }
  };

  const handleIssueCertificate = async () => {
    if (!selectedStudent?.batch_id || !courseCompletionConfirmed) return;
    setIssuingCertificate(true);
    const res = await api.issueCertificate({
      student_id: selectedStudent.student_id,
      batch_id: selectedStudent.batch_id,
      course_completed: true,
    });
    setIssuingCertificate(false);
    if (!res.success || !res.data) {
      showNotice(`Certificate not issued: ${res.message || res.error || 'Request failed'}`);
      return;
    }
    setIssuedCertificateId(res.data.id);
    setStudentEditCertification('CERTIFIED');
    showNotice(`Certificate ${res.data.certificate_number} issued (${res.data.attendance_percentage}% attendance).`);
    await loadAdminStudents(true);
    if (selectedStudent) {
      const refreshed = await api.getStudentAdminDetails(selectedStudent.student_id);
      if (refreshed.success && refreshed.data) setStudentDetails(refreshed.data);
    }
  };

  const openCertificateEditor = (cert: any) => {
    const issued = cert.issued_at ? new Date(cert.issued_at) : null;
    const localDate = issued && !Number.isNaN(issued.getTime())
      ? `${issued.getFullYear()}-${String(issued.getMonth() + 1).padStart(2, '0')}-${String(issued.getDate()).padStart(2, '0')}`
      : '';
    setEditingCertificate(cert);
    setCertForm({
      certificate_number: cert.certificate_number || '',
      recipient_name: cert.recipient_name || cert.default_recipient_name || '',
      course_title: cert.course_title || cert.default_course_title || '',
      batch_label: cert.batch_label || cert.default_batch_label || '',
      issued_at: localDate,
    });
  };

  const handleSaveCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCertificate) return;
    setSavingCertificate(true);
    const res = await api.updateCertificate(editingCertificate.id, {
      certificate_number: certForm.certificate_number,
      recipient_name: certForm.recipient_name,
      course_title: certForm.course_title,
      batch_label: certForm.batch_label,
      issued_at: certForm.issued_at || undefined,
    });
    setSavingCertificate(false);
    if (!res.success) {
      showNotice(`Certificate update failed: ${res.message || res.error || 'Request failed'}`);
      return;
    }
    showNotice(`Certificate ${certForm.certificate_number} updated and PDF regenerated.`);
    setEditingCertificate(null);
    if (selectedStudent) {
      const refreshed = await api.getStudentAdminDetails(selectedStudent.student_id);
      if (refreshed.success && refreshed.data) setStudentDetails(refreshed.data);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const res = await api.updateStudent(selectedStudent.student_id, {
      name: studentEditName,
      mobile_number: studentEditMobile,
      joining_date: studentEditJoiningDate,
      certification_status: studentEditCertification,
      is_active: studentEditActive,
    });
    if (res.success) {
      const batchRes = await api.updateStudentBatch(
        selectedStudent.student_id,
        studentEditBatchId ? Number(studentEditBatchId) : null
      );
      if (!batchRes.success) {
        showNotice(`Student updated, but batch update failed: ${batchRes.message || batchRes.error}`);
        return;
      }
      showNotice(`Student ${studentEditName} updated successfully!`);
      await loadAdminStudents(true);
      const refreshed = await api.getStudentAdminDetails(selectedStudent.student_id);
      if (refreshed.success && refreshed.data) {
        setStudentDetails(refreshed.data);
        setSelectedStudent(refreshed.data.profile);
      }
    } else {
      showNotice(`Error: ${res.message || res.error}`);
    }
  };

  // Load course days when course changes
  useEffect(() => {
    if (activeTab === 'curriculum' && selectedCourseId) {
      api.getCourseDays(selectedCourseId).then((res) => {
        if (res.success && res.data) {
          setCourseDays(res.data);
          setNewDayNumber(getNextDayNumber(res.data));
          if (res.data.length > 0) {
            setSelectedDayId(res.data[0].id);
          } else {
            setSelectedDayId(null);
            setDayContents([]);
          }
        }
      });
    }
  }, [activeTab, selectedCourseId]);

  // Load day content when day changes
  useEffect(() => {
    if (activeTab === 'curriculum' && selectedDayId) {
      api.getDayContent(selectedDayId).then((res) => {
        if (res.success && res.data) {
          setDayContents(res.data);
        }
      });
    }
  }, [activeTab, selectedDayId]);

  // Handle Add Student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const userRes = await api.createUser({ name: newStudentName, mobile_number: newStudentMobile, role: 'STUDENT' });
    if (userRes.success && userRes.data) {
      const studentRes = await api.createStudent({ user_id: (userRes.data as any).id, joining_date: new Date().toISOString().split('T')[0] });
      if (studentRes.success) {
        showNotice(`Student ${newStudentName} created successfully!`);
        setNewStudentName('');
        setNewStudentMobile('');
        await loadAdminStudents(true);
      } else {
        showNotice(`Error: ${studentRes.message || studentRes.error}`);
      }
    } else {
      showNotice(`Error: ${userRes.message || userRes.error}`);
    }
  };

  // Handle Add Trainer
  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    const userRes = await api.createUser({ name: newTrainerName, mobile_number: newTrainerMobile, role: 'TRAINER' });
    if (userRes.success && userRes.data) {
      const trainerRes = await api.createTrainer({ user_id: (userRes.data as any).id, specialization: newTrainerSpec });
      if (trainerRes.success) {
        showNotice(`Trainer ${newTrainerName} created successfully!`);
        setNewTrainerName('');
        setNewTrainerMobile('');
        await loadTrainers(true);
      } else {
        showNotice(`Error: ${trainerRes.message || trainerRes.error}`);
      }
    } else {
      showNotice(`Error: ${userRes.message || userRes.error}`);
    }
  };

  // Handle Add Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createCourse({
      course_name: newCourseName,
      description: newCourseDescription,
      duration_days: newCourseDuration,
      course_image_url: newCourseImageUrl,
    });
    if (res.success) {
      showNotice(`Course ${newCourseName} created!`);
      setNewCourseName('');
      setNewCourseDescription('');
      setNewCourseImageUrl('');
      await loadCourses(true);
    } else {
      showNotice(`Error: ${res.message || res.error}`);
    }
  };

  // Handle Add Batch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchCourseId || !newBatchTrainerId) {
      showNotice('Please select course and trainer');
      return;
    }
    const res = await api.createBatch({
      batch_code: newBatchCode,
      course_id: Number(newBatchCourseId),
      trainer_id: Number(newBatchTrainerId),
      start_date: newBatchStartDate,
      end_date: newBatchEndDate,
    });
    if (res.success) {
      showNotice(`Batch ${newBatchCode} created successfully!`);
      setNewBatchCode('');
      await loadBatches(true);
    } else {
      showNotice(`Error: ${res.message || res.error}`);
    }
  };

  const handleToggleTrainer = async (trainer: any) => {
    const res = await api.updateTrainer(trainer.trainer_id, {
      name: trainer.name,
      mobile_number: trainer.mobile_number,
      specialization: trainer.specialization || '',
      is_active: !trainer.is_active,
    });
    if (res.success) {
      showNotice(`Trainer ${trainer.name} ${trainer.is_active ? 'deactivated' : 'activated'}.`);
      await loadTrainers(true);
    } else {
      showNotice(`Error: ${res.message || res.error}`);
    }
  };

  const handleToggleBatch = async (batch: any) => {
    const res = await api.updateBatchStatus(batch.id, !batch.is_active);
    if (res.success) {
      showNotice(`Batch ${batch.batch_code} ${batch.is_active ? 'deactivated' : 'activated'}.`);
      await loadBatches(true);
    } else {
      showNotice(`Error: ${res.message || res.error}`);
    }
  };

  const openBatchStudents = async (batchId: number) => {
    const res = await api.getBatchStudents(batchId);
    if (res.success && res.data) {
      setManagedBatchId(batchId);
      setManagedBatchStudents(res.data);
      setBatchStudentIds(res.data.map((student: any) => student.student_id));
    } else {
      showNotice(`Error: ${res.message || res.error}`);
    }
  };

  const handleSaveBatchStudents = async () => {
    if (!managedBatchId) return;
    const currentIds = managedBatchStudents.map((student) => student.student_id);
    const addedIds = batchStudentIds.filter((id) => !currentIds.includes(id));
    const removedIds = currentIds.filter((id) => !batchStudentIds.includes(id));
    if (addedIds.length > 0) {
      await api.assignStudentsToBatch(managedBatchId, addedIds);
    }
    if (removedIds.length > 0) {
      await api.removeStudentsFromBatch(managedBatchId, removedIds);
    }
    showNotice('Batch students updated successfully.');
    await Promise.all([loadAdminStudents(true), openBatchStudents(managedBatchId)]);
  };

  // Handle Add Curriculum Day
  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    const res = await api.addCourseDay(selectedCourseId, {
      day_number: Number(newDayNumber),
      title: newDayTitle,
      summary: newDaySummary,
    });
    if (res.success) {
      showNotice(`Day ${newDayNumber} added!`);
      setNewDayTitle('');
      setNewDaySummary('');
      // Reload days
      const daysRes = await api.getCourseDays(selectedCourseId);
      if (daysRes.success && daysRes.data) {
        setCourseDays(daysRes.data);
        setNewDayNumber(getNextDayNumber(daysRes.data));
      }
    }
  };

  // Handle Add Content Item to Day
  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayId) return;
    const res = await api.addDayContent(selectedDayId, {
      title: newContentTitle,
      rich_text_content: newContentRichText,
      video_url: newContentVideoUrl,
      attachment_url: newContentAttachmentUrl,
    });
    if (res.success) {
      showNotice('Content item added to day!');
      setNewContentTitle('');
      setNewContentRichText('');
      setNewContentVideoUrl('');
      setNewContentAttachmentUrl('');
      // Reload content
      const cRes = await api.getDayContent(selectedDayId);
      if (cRes.success && cRes.data) setDayContents(cRes.data);
    }
  };

  const goToTab = (tab: 'dashboard' | 'students' | 'enquiries' | 'trainers' | 'courses' | 'batches' | 'curriculum' | 'ems') => {
    setActiveTab(tab);
    if (window.innerWidth <= 1024) setSidebarOpen(false);
  };

  const studentsList = adminStudents;

  return (
    <div className={`admin-shell${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`} style={{
        width: '240px',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <SidebarBrand />

        <div className="sidebar-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        
        <button
          onClick={() => goToTab('dashboard')}
          className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          <Layers size={16} /> Dashboard
        </button>

        <button
          onClick={() => goToTab('students')}
          className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          <Users size={16} /> Students ({studentsList.length})
        </button>

        <button
          onClick={() => goToTab('enquiries')}
          className={`btn ${activeTab === 'enquiries' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          <ClipboardList size={16} /> Enquiries ({enquiries.filter((enquiry) => ['pending', 'new'].includes(String(enquiry.status).toLowerCase())).length})
        </button>

        <button
          onClick={() => goToTab('trainers')}
          className={`btn ${activeTab === 'trainers' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          <UserCheck size={16} /> Trainers ({trainers.length})
        </button>

        <button
          onClick={() => goToTab('courses')}
          className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          <BookOpen size={16} /> Courses ({courses.length})
        </button>

        <button
          onClick={() => goToTab('batches')}
          className={`btn ${activeTab === 'batches' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          <Calendar size={16} /> Batches ({batches.length})
        </button>

        <button
          onClick={() => goToTab('curriculum')}
          className={`btn ${activeTab === 'curriculum' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          <FileText size={16} /> Curriculum (60 Days)
        </button>

        <div style={{ margin: '12px 0 6px', padding: '12px 12px 4px', borderTop: '1px solid rgba(255, 255, 255, 0.14)', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.55)', letterSpacing: '0.05em' }}>
          EMS ENTERPRISE HR
        </div>

        <button
          onClick={() => goToTab('ems')}
          className={`btn ${activeTab === 'ems' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          <Briefcase size={16} /> Staff & EMS Hub
        </button>
        </div>

        <SidebarUser />
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="topbar-icon-btn"
            aria-label="Toggle sidebar"
            aria-expanded={sidebarOpen}
            title="Toggle sidebar"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <Menu size={19} />
          </button>

          <div className="topbar-spacer" />

          <button type="button" className="topbar-icon-btn" aria-label="Notifications" title="Notifications">
            <Bell size={18} />
            <span className="notif-badge" />
          </button>

          <div className="topbar-user" title={user?.name}>
            <span className="topbar-avatar">
              {(user?.name || 'A').trim().charAt(0).toUpperCase()}
            </span>
            <div className="topbar-user-meta">
              <span className="topbar-name">{user?.name || 'Admin'}</span>
              <span className="topbar-role">Administrator</span>
            </div>
            <ChevronDown size={16} className="topbar-chevron" />
          </div>
        </header>

        <main className="admin-content">
        {notification && (
          <div className="notice-toast">
            <CheckCircle2 size={18} />
            {notification}
          </div>
        )}

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="dash">
            <section className="welcome-banner">
              <div className="welcome-copy">
                <span className="welcome-eyebrow">
                  <Sparkles size={13} /> Admin Dashboard
                </span>
                <h1 className="welcome-title">Welcome Back, Admin!</h1>
                <p className="welcome-subtitle">
                  Here's a quick overview of your students, trainers, courses and batches — all in one place.
                </p>
                <div className="welcome-chips">
                  <span className="welcome-chip"><Users size={14} /> {studentsList.length} Students</span>
                  <span className="welcome-chip"><Layers size={14} /> {batches.length} Batches</span>
                  <span className="welcome-chip"><BookOpen size={14} /> {courses.length} Courses</span>
                </div>
              </div>
              <div className="welcome-art" aria-hidden="true">
                <span className="welcome-blob welcome-blob-1" />
                <span className="welcome-blob welcome-blob-2" />
                <div className="welcome-illustration">
                  <GraduationCap size={68} strokeWidth={1.5} />
                </div>
              </div>
            </section>

            <div className="dash-section-head">
              <span className="accent-bar" />
              <h2 className="dash-section-title">System Overview</h2>
            </div>

            <div className="stats-grid">
              {[
                { label: 'Total Students', value: studentsList.length, sub: 'Batch-based enrollment', tone: 'purple', icon: <Users size={22} /> },
                { label: 'Active Batches', value: batches.length, sub: 'Running concurrently', tone: 'peach', icon: <Layers size={22} /> },
                { label: 'Trainers', value: trainers.length, sub: 'Assigned to batches', tone: 'mint', icon: <UserCheck size={22} /> },
                { label: 'Courses', value: courses.length, sub: '60-Day Curriculums', tone: 'pink', icon: <BookOpen size={22} /> },
              ].map((card) => (
                <div key={card.label} className={`stat-card tone-${card.tone}`}>
                  <span className="stat-icon">{card.icon}</span>
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-sub">{card.sub}</div>
                  <span className="stat-arrow"><ArrowUpRight size={15} /></span>
                </div>
              ))}
            </div>

            {/* Quick Summary Panels */}
            <div className="dash-grid">
              <section className="panel">
                <div className="panel-head">
                  <div className="panel-title-wrap">
                    <span className="accent-bar" />
                    <h3 className="panel-title">Active Batches</h3>
                  </div>
                  <button type="button" className="view-all-btn" onClick={() => goToTab('batches')}>
                    View All <ArrowUpRight size={14} />
                  </button>
                </div>
                <div className="panel-list">
                  {batches.length === 0 ? (
                    <div className="panel-empty">No active batches yet.</div>
                  ) : (
                    batches.map((b) => (
                      <div key={b.id} className="panel-row">
                        <span className="row-icon row-icon-purple"><Layers size={18} /></span>
                        <div className="row-text">
                          <div className="row-title">Batch {b.batch_code}</div>
                          <div className="row-meta">{b.course_name} • Trainer: {b.trainer_name}</div>
                        </div>
                        <span className="badge badge-success">ACTIVE</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <div className="panel-title-wrap">
                    <span className="accent-bar" />
                    <h3 className="panel-title">Available Courses</h3>
                  </div>
                  <button type="button" className="view-all-btn" onClick={() => goToTab('courses')}>
                    View All <ArrowUpRight size={14} />
                  </button>
                </div>
                <div className="panel-list">
                  {courses.length === 0 ? (
                    <div className="panel-empty">No courses available yet.</div>
                  ) : (
                    courses.map((c) => (
                      <div key={c.id} className="panel-row">
                        <span className="row-icon row-icon-pink"><BookOpen size={18} /></span>
                        <div className="row-text">
                          <div className="row-title">{c.course_name}</div>
                          <div className="row-meta">Duration: {c.duration_days || 60} Days</div>
                        </div>
                        <button
                          onClick={() => { setSelectedCourseId(c.id); setActiveTab('curriculum'); }}
                          className="view-all-btn"
                        >
                          View Days
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* 2. STUDENTS TAB */}
        {activeTab === 'students' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Student Management (§ 4)</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              {/* Students Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Mobile Number</th>
                      <th>Batch</th>
                      <th>Course</th>
                      <th>Joining Date</th>
                      <th>Status</th>
                      <th>Certification</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((s) => (
                      <tr key={s.student_id || s.id}>
                        <td>{s.account_id || `#${s.student_id || s.id}`}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.email || '—'}</td>
                        <td>{s.mobile_number}</td>
                        <td>{s.batch_code || 'Unassigned'}</td>
                        <td>{s.course_name || '—'}</td>
                        <td>{s.joining_date ? String(s.joining_date).split('T')[0] : '—'}</td>
                        <td>
                          <span className={`badge ${s.is_active ? 'badge-success' : 'badge-warning'}`}>
                            {s.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{s.certification_status || 'PENDING'}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => openStudentDetails(s)}>
                            View / Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Add New Student</h3>
                <form onSubmit={handleCreateStudent}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} required placeholder="e.g. John Doe" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input className="form-input" value={newStudentMobile} onChange={(e) => setNewStudentMobile(e.target.value)} required placeholder="10-digit mobile" />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    <Plus size={16} /> Register Student
                  </button>
                </form>
              </div>
            </div>

            {selectedStudent && (
              <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
                  Student Profile: {selectedStudent.name}
                </h3>
                <form onSubmit={handleUpdateStudent}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <input className="form-input" value={studentEditName} onChange={(e) => setStudentEditName(e.target.value)} placeholder="Full name" required />
                    <input className="form-input" value={studentEditMobile} onChange={(e) => setStudentEditMobile(e.target.value)} placeholder="Mobile number" required />
                    <input type="date" className="form-input" value={studentEditJoiningDate} onChange={(e) => setStudentEditJoiningDate(e.target.value)} required />
                    <div>
                      <label className="form-label">Certification Status</label>
                      <span className={`badge ${studentEditCertification === 'CERTIFIED' ? 'badge-success' : 'badge-warning'}`}>
                        {studentEditCertification}
                      </span>
                    </div>
                    <select className="form-select" value={studentEditBatchId} onChange={(e) => setStudentEditBatchId(e.target.value ? Number(e.target.value) : '')}>
                      <option value="">Unassigned</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>{batch.batch_code} - {batch.course_name}</option>
                      ))}
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={studentEditActive} onChange={(e) => setStudentEditActive(e.target.checked)} />
                      Active student
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button type="submit" className="btn btn-primary">Save Student</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setSelectedStudent(null)}>Close</button>
                  </div>
                </form>

                {studentDetails && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px' }}>
                    <div>
                      <h4>Attendance</h4>
                      <p>{studentDetails.attendance?.length || 0} attendance records</p>
                    </div>
                    <div>
                      <h4>Assignments</h4>
                      <p>{studentDetails.assignments?.filter((item: any) => item.submitted_at).length || 0} submitted / {studentDetails.assignments?.length || 0} total</p>
                    </div>
                    <div>
                      <h4>Tests</h4>
                      <p>{studentDetails.tests?.filter((item: any) => item.submitted_at).length || 0} submitted / {studentDetails.tests?.length || 0} total</p>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '24px', padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                  <h4 style={{ marginBottom: '8px' }}>Course Certificate</h4>

                  {studentDetails?.certificates?.length > 0 && (
                    <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                      {studentDetails.certificates.map((cert: any) => (
                        <div
                          key={cert.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                            flexWrap: 'wrap',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: 'var(--success-bg)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cert.certificate_number}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {cert.course_title} • {cert.batch_label} • Issued {new Date(cert.issued_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPreviewCertificate(cert)}>
                              <Eye size={14} /> View
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openCertificateEditor(cert)}>
                              <Pencil size={14} /> Edit
                            </button>
                            <a className="btn btn-secondary btn-sm" href={api.certificateDownloadUrl(cert.id)}>
                              <Download size={14} /> PDF
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                    Issuing checks the student has at least 75% attendance in the assigned batch. Confirm course completion before issuing.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="checkbox"
                      checked={courseCompletionConfirmed}
                      onChange={(e) => setCourseCompletionConfirmed(e.target.checked)}
                    />
                    I confirm the student completed the course syllabus.
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!selectedStudent.batch_id || !courseCompletionConfirmed || issuingCertificate}
                      onClick={handleIssueCertificate}
                    >
                      {issuingCertificate ? 'Issuing...' : 'Issue Certificate PDF'}
                    </button>
                    {issuedCertificateId && (
                      <a
                        className="btn btn-secondary"
                        href={api.certificateDownloadUrl(issuedCertificateId)}
                      >
                        Download PDF
                      </a>
                    )}
                    {!selectedStudent.batch_id && (
                      <span style={{ color: 'var(--warning)', fontSize: '0.8rem' }}>Assign the student to a batch first.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'enquiries' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Student Enquiries</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Review course enquiries and approve or reject applicants.</p>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => loadAdminEnquiries(true)}>
                Refresh
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Course Interest</th>
                    <th>Message</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((enquiry) => {
                    const status = String(enquiry.status || 'pending').toLowerCase();
                    const isAwaitingReview = status === 'pending' || status === 'new';
                    const isProcessing = processingEnquiryId === Number(enquiry.id);
                    return (
                      <tr key={enquiry.id}>
                        <td style={{ fontWeight: 600 }}>{enquiry.name}</td>
                        <td>{enquiry.email || '—'}</td>
                        <td>{enquiry.mobile_number}</td>
                        <td>{enquiry.course_interest}</td>
                        <td>{enquiry.message || '—'}</td>
                        <td>{enquiry.created_at ? String(enquiry.created_at).split('T')[0] : '—'}</td>
                        <td>
                          <span className={`badge ${status === 'approved' ? 'badge-success' : status === 'rejected' ? 'badge-warning' : 'badge-primary'}`}>
                            {status.toUpperCase()}
                          </span>
                          {enquiry.account_id && <div style={{ marginTop: '4px', fontSize: '0.78rem' }}>{enquiry.account_id}</div>}
                        </td>
                        <td>
                          {isAwaitingReview ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                disabled={isProcessing}
                                onClick={() => handleApproveEnquiry(Number(enquiry.id))}
                              >
                                <Check size={14} /> {isProcessing ? 'Working...' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                disabled={isProcessing}
                                onClick={() => handleRejectEnquiry(Number(enquiry.id))}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          ) : status === 'approved' ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              disabled={isProcessing}
                              onClick={() => handleApproveEnquiry(Number(enquiry.id))}
                            >
                              {isProcessing ? 'Sending...' : 'Resend ID Email'}
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {enquiries.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No enquiries yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 3. TRAINERS TAB */}
        {activeTab === 'trainers' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Trainer Management (§ 5)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {trainers.map((t) => (
                  <div key={t.trainer_id} className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{t.name}</div>
                    <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginTop: '4px' }}>
                      {t.specialization || 'Lead Instructor'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Phone: {t.mobile_number}
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '12px', width: '100%' }}
                      onClick={() => handleToggleTrainer(t)}
                    >
                      {t.is_active ? 'Deactivate Trainer' : 'Activate Trainer'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Add New Trainer</h3>
                <form onSubmit={handleCreateTrainer}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={newTrainerName} onChange={(e) => setNewTrainerName(e.target.value)} required placeholder="e.g. Dr. Alex Smith" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input className="form-input" value={newTrainerMobile} onChange={(e) => setNewTrainerMobile(e.target.value)} required placeholder="10-digit mobile" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <input className="form-input" value={newTrainerSpec} onChange={(e) => setNewTrainerSpec(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    <Plus size={16} /> Add Trainer
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 4. COURSES TAB */}
        {activeTab === 'courses' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Course Management (§ 7)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {courses.map((c) => (
                  <div key={c.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span className="badge badge-info" style={{ marginBottom: '12px' }}>{c.duration_days || 60} Days Course</span>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '8px' }}>{c.course_name}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
                        {c.description || 'Comprehensive day-by-day practical learning path.'}
                      </p>
                    </div>
                    <button
                      onClick={() => { setSelectedCourseId(c.id); setActiveTab('curriculum'); }}
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '20px', width: '100%' }}
                    >
                      Manage Day-Wise Curriculum
                    </button>
                  </div>
                ))}
              </div>

              <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Create Course</h3>
                <form onSubmit={handleCreateCourse}>
                  <div className="form-group">
                    <label className="form-label">Course Title</label>
                    <input className="form-input" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} required placeholder="e.g. Python Full Stack" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (Days)</label>
                    <input type="number" className="form-input" value={newCourseDuration} onChange={(e) => setNewCourseDuration(Number(e.target.value))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" value={newCourseDescription} onChange={(e) => setNewCourseDescription(e.target.value)} placeholder="Describe the course..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Course Image URL</label>
                    <input className="form-input" value={newCourseImageUrl} onChange={(e) => setNewCourseImageUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    <Plus size={16} /> Create Course
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 5. BATCHES TAB */}
        {activeTab === 'batches' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Batch Management (§ 6)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Batch Code</th>
                      <th>Course</th>
                      <th>Trainer</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{b.batch_code}</td>
                        <td>{b.course_name}</td>
                        <td>{b.trainer_name}</td>
                        <td>{b.start_date ? new Date(b.start_date).toLocaleDateString() : 'N/A'}</td>
                        <td>{b.end_date ? new Date(b.end_date).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <span className={`badge ${b.is_active ? 'badge-success' : 'badge-warning'}`}>
                            {b.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openBatchStudents(b.id)}>
                              Students
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleToggleBatch(b)}>
                              {b.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Create Batch</h3>
                <form onSubmit={handleCreateBatch}>
                  <div className="form-group">
                    <label className="form-label">Batch Code</label>
                    <input className="form-input" value={newBatchCode} onChange={(e) => setNewBatchCode(e.target.value)} required placeholder="e.g. PY-2026-02" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select Course</label>
                    <select className="form-select" value={newBatchCourseId} onChange={(e) => setNewBatchCourseId(Number(e.target.value))} required>
                      <option value="">-- Choose Course --</option>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.course_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select Trainer</label>
                    <select className="form-select" value={newBatchTrainerId} onChange={(e) => setNewBatchTrainerId(Number(e.target.value))} required>
                      <option value="">-- Choose Trainer --</option>
                      {trainers.map((t) => <option key={t.trainer_id} value={t.trainer_id}>{t.name} ({t.specialization})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-input" value={newBatchStartDate} onChange={(e) => setNewBatchStartDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-input" value={newBatchEndDate} onChange={(e) => setNewBatchEndDate(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    <Plus size={16} /> Create Batch
                  </button>
                </form>
              </div>

              {managedBatchId && (
                <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
                    Manage Batch Students
                  </h3>
                  {studentsList.map((student) => (
                    <label key={student.student_id || student.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        checked={batchStudentIds.includes(student.student_id || student.id)}
                        onChange={(e) => {
                          const studentId = student.student_id || student.id;
                          setBatchStudentIds((ids) => e.target.checked
                            ? [...ids, studentId]
                            : ids.filter((id) => id !== studentId));
                        }}
                      />
                      {student.name}
                    </label>
                  ))}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button className="btn btn-primary" onClick={handleSaveBatchStudents}>Save Students</button>
                    <button className="btn btn-secondary" onClick={() => setManagedBatchId(null)}>Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. CURRICULUM EDITOR TAB (§ 8) */}
        {activeTab === 'curriculum' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Day-wise Curriculum Builder (Day 1..60)</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Select a course and manage day-by-day learning content, videos, and materials.
                </div>
              </div>

              {/* Course Selector */}
              <select
                className="form-select"
                style={{ width: '260px' }}
                value={selectedCourseId || ''}
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.course_name} ({c.duration_days || 60} Days)</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 340px', gap: '20px' }}>
              {/* Day List */}
              <div className="glass-card" style={{ padding: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  COURSE DAYS ({courseDays.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {courseDays.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDayId(d.id)}
                      className={`btn btn-sm ${selectedDayId === d.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '10px 12px' }}
                    >
                      <strong>Day {d.day_number}:</strong> {d.title}
                    </button>
                  ))}
                </div>

                {/* Add Day Form */}
                <form onSubmit={handleAddDay} style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>+ Add New Day</div>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Day #"
                    value={newDayNumber}
                    onChange={(e) => setNewDayNumber(Number(e.target.value))}
                    style={{ marginBottom: '8px' }}
                    required
                  />
                  <input
                    className="form-input"
                    placeholder="Day Topic Title"
                    value={newDayTitle}
                    onChange={(e) => setNewDayTitle(e.target.value)}
                    style={{ marginBottom: '8px' }}
                    required
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>Add Day</button>
                </form>
              </div>

              {/* Day Content Viewer */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
                  {courseDays.find((d) => d.id === selectedDayId)?.title ? `Day Content: ${courseDays.find((d) => d.id === selectedDayId)?.title}` : 'Select a Day'}
                </h3>

                {dayContents.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '40px' }}>
                    No learning materials uploaded for this day yet. Add notes or video using the form on the right.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {dayContents.map((c) => (
                      <div key={c.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>{c.title}</div>
                        {c.rich_text_content && (
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                            {c.rich_text_content}
                          </div>
                        )}
                        {c.video_url && (
                          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <Video size={16} color="var(--info)" />
                            <a href={c.video_url} target="_blank" rel="noreferrer" style={{ color: 'var(--info)' }}>
                              Watch Video Lecture
                            </a>
                          </div>
                        )}
                        {c.attachment_url && (
                          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <FileText size={16} color="var(--warning)" />
                            <a href={c.attachment_url} target="_blank" rel="noreferrer" style={{ color: 'var(--warning)' }}>
                              Download Material Cheatsheet / PDF
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Content to Day Form */}
              <div className="glass-card" style={{ padding: '20px', height: 'fit-content' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>+ Add Day Material</h4>
                <form onSubmit={handleAddContent}>
                  <div className="form-group">
                    <label className="form-label">Material Title</label>
                    <input className="form-input" value={newContentTitle} onChange={(e) => setNewContentTitle(e.target.value)} required placeholder="e.g. Setup Guide & Video" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lecture Notes / Summary</label>
                    <textarea className="form-textarea" value={newContentRichText} onChange={(e) => setNewContentRichText(e.target.value)} placeholder="Enter key points..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Video URL</label>
                    <input className="form-input" value={newContentVideoUrl} onChange={(e) => setNewContentVideoUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Attachment URL (PDF/Doc)</label>
                    <input className="form-input" value={newContentAttachmentUrl} onChange={(e) => setNewContentAttachmentUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <button type="submit" disabled={!selectedDayId} className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    Publish to Day
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Employee Management System (EMS) */}
        {activeTab === 'ems' && <EmsPortal />}
        </main>
      </div>

      {/* Certificate preview modal */}
      {previewCertificate && (
        <div
          onClick={() => setPreviewCertificate(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{
              width: 'min(1000px, 100%)',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: 0,
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div>
                <div style={{ fontWeight: 800 }}>Certificate #{previewCertificate.certificate_number}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {previewCertificate.recipient_name} • {previewCertificate.course_title} • {previewCertificate.batch_label}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a
                  href={`${api.certificateViewUrl(previewCertificate.id)}#view=FitH`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                >
                  <Eye size={16} /> Open PDF
                </a>
                <a href={api.certificateDownloadUrl(previewCertificate.id)} className="btn btn-primary">
                  <Download size={16} /> Download
                </a>
                <button type="button" className="btn btn-secondary" onClick={() => setPreviewCertificate(null)}>
                  <X size={16} /> Close
                </button>
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: '#F1F5F9',
              display: 'flex',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <div style={{ width: 'min(100%, calc((92vh - 130px) * 1.414))' }}>
                <CertificatePreview certificate={previewCertificate} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate edit modal */}
      {editingCertificate && (
        <div
          onClick={() => setEditingCertificate(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{ width: 'min(560px, 100%)', maxHeight: '88vh', overflowY: 'auto', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Edit Certificate</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingCertificate(null)}>
                <X size={14} /> Close
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              These details are printed on the certificate. Saving regenerates the PDF. Leave a field empty to fall back to the student's real data.
            </p>

            <form onSubmit={handleSaveCertificate}>
              <div className="form-group">
                <label className="form-label">Certificate Number</label>
                <input
                  className="form-input"
                  value={certForm.certificate_number}
                  onChange={(e) => setCertForm({ ...certForm, certificate_number: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Student Name (printed)</label>
                <input
                  className="form-input"
                  value={certForm.recipient_name}
                  placeholder={editingCertificate.default_recipient_name}
                  onChange={(e) => setCertForm({ ...certForm, recipient_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Course Title (printed)</label>
                <input
                  className="form-input"
                  value={certForm.course_title}
                  placeholder={editingCertificate.default_course_title}
                  onChange={(e) => setCertForm({ ...certForm, course_title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Batch Label (printed)</label>
                <input
                  className="form-input"
                  value={certForm.batch_label}
                  placeholder={editingCertificate.default_batch_label}
                  onChange={(e) => setCertForm({ ...certForm, batch_label: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Issue Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={certForm.issued_at}
                  onChange={(e) => setCertForm({ ...certForm, issued_at: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={savingCertificate}>
                  {savingCertificate ? 'Saving...' : 'Save & Regenerate PDF'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPreviewCertificate(editingCertificate)}
                >
                  <Eye size={16} /> Preview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
