// src/views/trainer/TrainerPortal.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SidebarBrand, SidebarUser } from '../../components/SidebarSections';
import {
  Video, CheckSquare, FileText, Award, MessageSquare, Bell, Clock, BookOpen,
  ExternalLink, CheckCircle2
} from 'lucide-react';

export const TrainerPortal: React.FC = () => {
  const { user, selectedBatchId, setSelectedBatchId } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'classes' | 'recordings' | 'attendance' | 'assignments' | 'tests' | 'chat' | 'announcements'>('classes');

  const [batches, setBatches] = useState<any[]>([]);
  const currentBatchId = selectedBatchId || (batches.length > 0 ? batches[0].id : 2);

  // Module states
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, string>>({});
  const [assignments, setAssignments] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Record<number, any[]>>({});
  const [testSubmissions, setTestSubmissions] = useState<Record<number, any[]>>({});
  const [assignmentGrades, setAssignmentGrades] = useState<Record<number, { marks: string; feedback: string }>>({});
  const [testGrades, setTestGrades] = useState<Record<number, string>>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [chatType, setChatType] = useState<'direct' | 'batch'>('batch');
  const [selectedDirectStudentId, setSelectedDirectStudentId] = useState<number | null>(null);
  const [directChatMessages, setDirectChatMessages] = useState<any[]>([]);
  const [directChatMessage, setDirectChatMessage] = useState('');

  // Form states
  const [newTopic, setNewTopic] = useState('');
  const [newTeamsLink, setNewTeamsLink] = useState('https://teams.microsoft.com/l/meetup-join/sample-lms');
  const [newStartTime, setNewStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [newEndTime, setNewEndTime] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));

  const [newRecUrl, setNewRecUrl] = useState('');
  const newRecDuration = 60;

  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDesc, setNewAssignDesc] = useState('');
  const [newAssignFile, setNewAssignFile] = useState('');
  const [newAssignDayId, setNewAssignDayId] = useState<number | ''>('');
  const [newAssignDue, setNewAssignDue] = useState(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16));
  const [courseDays, setCourseDays] = useState<any[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseImageUrl, setNewCourseImageUrl] = useState('');
  const [newCourseDuration, setNewCourseDuration] = useState(60);

  const [newTestSubject, setNewTestSubject] = useState('Python Core');
  const [newTestTitle, setNewTestTitle] = useState('Weekly Assessment #1');
  const [newTestPaperUrl, setNewTestPaperUrl] = useState('');
  const [newTestMarks, setNewTestMarks] = useState(100);

  const [newAnnounceTitle, setNewAnnounceTitle] = useState('');
  const [newAnnounceContent, setNewAnnounceContent] = useState('');
  const [newAnnouncePinned, setNewAnnouncePinned] = useState(false);

  // Chat Room Timer Config
  const [chatActive, setChatActive] = useState(true);
  const [chatActiveUntil, setChatActiveUntil] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));

  const [notice, setNotice] = useState('');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

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
    } else {
      showNotice(res.message || 'Unable to create course.');
    }
  };

  // Load student submissions for every assignment/test in the batch
  const loadSubmissions = async (assignList: any[], testList: any[]) => {
    const assignPairs = await Promise.all(
      assignList.map(async (a) => {
        const res = await api.getAssignmentSubmissions(a.id);
        return [a.id, res.success && res.data ? res.data : []] as const;
      })
    );
    const testPairs = await Promise.all(
      testList.map(async (t) => {
        const res = await api.getTestSubmissions(t.id);
        return [t.id, res.success && res.data ? res.data : []] as const;
      })
    );

    setAssignmentSubmissions(Object.fromEntries(assignPairs));
    setTestSubmissions(Object.fromEntries(testPairs));

    const assignDraft: Record<number, { marks: string; feedback: string }> = {};
    for (const [, subs] of assignPairs) {
      for (const sub of subs as any[]) {
        assignDraft[sub.id] = {
          marks: sub.marks_obtained !== null && sub.marks_obtained !== undefined ? String(sub.marks_obtained) : '',
          feedback: sub.trainer_feedback || '',
        };
      }
    }
    setAssignmentGrades(assignDraft);

    const testDraft: Record<number, string> = {};
    for (const [, subs] of testPairs) {
      for (const sub of subs as any[]) {
        testDraft[sub.id] = sub.marks_obtained !== null && sub.marks_obtained !== undefined ? String(sub.marks_obtained) : '';
      }
    }
    setTestGrades(testDraft);
  };

  const handleGradeAssignment = async (submissionId: number, assignmentId: number) => {
    const draft = assignmentGrades[submissionId] || { marks: '', feedback: '' };
    if (draft.marks.trim() === '') {
      showNotice('Enter marks before saving.');
      return;
    }
    const res = await api.gradeAssignmentSubmission(submissionId, {
      marks_obtained: Number(draft.marks),
      trainer_feedback: draft.feedback,
    });
    if (res.success) {
      showNotice('Assignment marks saved!');
      const refreshed = await api.getAssignmentSubmissions(assignmentId);
      if (refreshed.success && refreshed.data) {
        setAssignmentSubmissions((prev) => ({ ...prev, [assignmentId]: refreshed.data as any[] }));
      }
    } else {
      showNotice(res.message || res.error || 'Unable to save marks.');
    }
  };

  const handleGradeTest = async (submissionId: number, testId: number) => {
    const marks = testGrades[submissionId];
    if (marks === undefined || marks.trim() === '') {
      showNotice('Enter marks before saving.');
      return;
    }
    const res = await api.gradeTestSubmission(submissionId, Number(marks));
    if (res.success) {
      showNotice('Test marks saved!');
      const refreshed = await api.getTestSubmissions(testId);
      if (refreshed.success && refreshed.data) {
        setTestSubmissions((prev) => ({ ...prev, [testId]: refreshed.data as any[] }));
      }
    } else {
      showNotice(res.message || res.error || 'Unable to save marks.');
    }
  };

  const loadBatchData = async (batchId: number) => {
    try {
      const [lcRes, rRes, sRes, aRes, tRes, annRes, crRes] = await Promise.all([
        api.getLiveClasses(batchId),
        api.getRecordings(batchId),
        api.getBatchStudents(batchId),
        api.getAssignments(batchId),
        api.getTests(batchId),
        api.getAnnouncements(batchId),
        api.getChatRoom(batchId),
      ]);

      if (lcRes.success && lcRes.data) setLiveClasses(lcRes.data);
      if (rRes.success && rRes.data) setRecordings(rRes.data);
      if (sRes.success && sRes.data) {
        setStudents(sRes.data);
        // Default attendance
        const defaultAtt: Record<number, string> = {};
        sRes.data.forEach((s: any) => {
          defaultAtt[s.student_id] = 'PRESENT_ONLINE';
        });
        setAttendanceRecords(defaultAtt);
      }
      const loadedAssignments = aRes.success && aRes.data ? aRes.data : [];
      const loadedTests = tRes.success && tRes.data ? tRes.data : [];
      if (aRes.success && aRes.data) setAssignments(loadedAssignments);
      if (tRes.success && tRes.data) setTests(loadedTests);
      loadSubmissions(loadedAssignments, loadedTests);
      if (annRes.success && annRes.data) setAnnouncements(annRes.data);
      if (crRes.success && crRes.data) {
        setChatRoom(crRes.data);
        if (crRes.data.id) {
          const msgRes = await api.getChatMessages(crRes.data.id);
          if (msgRes.success && msgRes.data) setChatMessages(msgRes.data);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    api.getBatches(user?.trainer_id).then((res) => {
      if (res.success && res.data) {
        setBatches(res.data);
        if (res.data.length > 0 && !res.data.some((batch) => batch.id === selectedBatchId)) {
          setSelectedBatchId(res.data[0].id);
        }
      }
    });
  }, [user?.trainer_id]);

  useEffect(() => {
    if (currentBatchId) {
      loadBatchData(currentBatchId);
    }
  }, [currentBatchId]);

  useEffect(() => {
    const batch = batches.find((item) => item.id === currentBatchId);
    if (!batch?.course_id) {
      setCourseDays([]);
      return;
    }
    api.getCourseDays(batch.course_id).then((res) => {
      if (res.success && res.data) setCourseDays(res.data);
    });
  }, [batches, currentBatchId]);

  // Handle Schedule Class
  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.scheduleLiveClass({
      batch_id: currentBatchId,
      course_day_id: newAssignDayId ? Number(newAssignDayId) : undefined,
      class_topic: newTopic,
      teams_meeting_link: newTeamsLink,
      start_time: new Date(newStartTime).toISOString(),
      end_time: new Date(newEndTime).toISOString(),
    });
    if (res.success) {
      showNotice('Microsoft Teams live class scheduled!');
      setNewTopic('');
      loadBatchData(currentBatchId);
    }
  };

  // Handle Add Recording
  const handleAddRecording = async (classId: number) => {
    if (!newRecUrl) {
      showNotice('Please enter recording URL/blob path');
      return;
    }
    const res = await api.addRecording(classId, {
      storage_blob_path: newRecUrl,
      duration_minutes: Number(newRecDuration),
    });
    if (res.success) {
      showNotice('Recording uploaded! Protected by 60-Day retention policy.');
      setNewRecUrl('');
      loadBatchData(currentBatchId);
    }
  };

  // Handle Mark Attendance
  const handleSaveAttendance = async () => {
    const records = Object.entries(attendanceRecords).map(([sId, status]) => ({
      student_id: Number(sId),
      status,
    }));
    const res = await api.markAttendance({
      batch_id: currentBatchId,
      marked_by_trainer_id: user?.trainer_id || 11,
      class_date: attendanceDate,
      records,
    });
    if (res.success) {
      showNotice(`Attendance saved for ${records.length} students!`);
    } else {
      showNotice(`Error saving attendance: ${res.message || res.error}`);
    }
  };

  // Handle Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createAssignment({
      batch_id: currentBatchId,
      title: newAssignTitle,
      description: newAssignDesc,
      file_attachment_url: newAssignFile,
      due_date: new Date(newAssignDue).toISOString(),
    });
    if (res.success) {
      showNotice('Assignment created!');
      setNewAssignTitle('');
      setNewAssignDesc('');
      setNewAssignDayId('');
      loadBatchData(currentBatchId);
    }
  };

  // Handle Create Test
  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createTest({
      batch_id: currentBatchId,
      subject: newTestSubject,
      title: newTestTitle,
      test_paper_url: newTestPaperUrl,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 86400000 * 2).toISOString(),
      total_marks: Number(newTestMarks),
    });
    if (res.success) {
      showNotice('Weekly Test Paper published!');
      setNewTestTitle('');
      loadBatchData(currentBatchId);
    }
  };

  // Handle Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createAnnouncement({
      batch_id: currentBatchId,
      created_by_user_id: user?.id || user?.user_id || 2,
      title: newAnnounceTitle,
      content: newAnnounceContent,
      is_pinned: newAnnouncePinned,
    });
    if (res.success) {
      showNotice('Announcement posted to batch!');
      setNewAnnounceTitle('');
      setNewAnnounceContent('');
      loadBatchData(currentBatchId);
    }
  };

  // Handle Chat Timer Configuration
  const handleUpdateChatRoom = async () => {
    const res = await api.configureChatRoom(currentBatchId, {
      is_active: chatActive,
      active_from: new Date().toISOString(),
      active_until: new Date(chatActiveUntil).toISOString(),
    });
    if (res.success) {
      showNotice(`Batch Chat is now ${chatActive ? 'OPEN with timer' : 'CLOSED'}`);
      loadBatchData(currentBatchId);
    }
  };

  // Handle Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatRoom?.id || !newChatMessage.trim()) return;
    const res = await api.sendChatMessage(chatRoom.id, {
      sender_user_id: user?.id || user?.user_id || 2,
      message: newChatMessage,
    });
    if (res.success) {
      setNewChatMessage('');
      const msgRes = await api.getChatMessages(chatRoom.id);
      if (msgRes.success && msgRes.data) setChatMessages(msgRes.data);
    } else {
      showNotice(`Chat blocked: ${res.message}`);
    }
  };

  const loadDirectMessages = async (studentUserId: number) => {
    const senderId = user?.id || user?.user_id;
    if (!senderId) return;
    const res = await api.getDirectMessages(senderId, studentUserId);
    if (res.success && res.data) setDirectChatMessages(res.data);
  };

  useEffect(() => {
    if (chatType !== 'direct' || !selectedDirectStudentId) return;
    loadDirectMessages(selectedDirectStudentId);
    const interval = window.setInterval(() => loadDirectMessages(selectedDirectStudentId), 3000);
    return () => window.clearInterval(interval);
  }, [chatType, selectedDirectStudentId]);

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const senderId = user?.id || user?.user_id;
    if (!senderId || !selectedDirectStudentId || !directChatMessage.trim()) return;

    const res = await api.sendDirectMessage({
      sender_user_id: senderId,
      recipient_user_id: selectedDirectStudentId,
      message: directChatMessage,
    });

    if (res.success) {
      setDirectChatMessage('');
      await loadDirectMessages(selectedDirectStudentId);
    } else {
      showNotice(res.message || 'Unable to send direct message.');
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{
        width: '240px',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <SidebarBrand />

        <div className="sidebar-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Batch Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.55)', letterSpacing: '0.05em' }}>
            ASSIGNED BATCH
          </label>
          <select
            className="form-select"
            style={{ marginTop: '6px', fontSize: '0.85rem' }}
            value={currentBatchId}
            onChange={(e) => setSelectedBatchId(Number(e.target.value))}
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>Batch {b.batch_code} ({b.course_name})</option>
            ))}
          </select>
        </div>

        <button onClick={() => setActiveTab('classes')} className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }}>
          <Video size={16} /> Live Classes (Teams)
        </button>

        <button onClick={() => setActiveTab('courses')} className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }}>
          <BookOpen size={16} /> Course Management
        </button>

        <button onClick={() => setActiveTab('recordings')} className={`btn ${activeTab === 'recordings' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }}>
          <Clock size={16} /> 60-Day Recordings
        </button>

        <button onClick={() => setActiveTab('attendance')} className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }}>
          <CheckSquare size={16} /> Hybrid Attendance
        </button>

        <button onClick={() => setActiveTab('assignments')} className={`btn ${activeTab === 'assignments' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }}>
          <FileText size={16} /> Day Assignments
        </button>

        <button onClick={() => setActiveTab('tests')} className={`btn ${activeTab === 'tests' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }}>
          <Award size={16} /> Weekly Tests
        </button>

        <button onClick={() => setActiveTab('chat')} className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }}>
          <MessageSquare size={16} /> Batch Chat & Timer
        </button>

        <button onClick={() => setActiveTab('announcements')} className={`btn ${activeTab === 'announcements' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }}>
          <Bell size={16} /> Message Board
        </button>
        </div>

        <SidebarUser />
      </aside>

      {/* Main Area */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {notice && (
          <div style={{
            background: 'var(--success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#047857',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <CheckCircle2 size={18} /> {notice}
          </div>
        )}

        {activeTab === 'courses' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Create Course</h2>
            <div className="glass-card" style={{ padding: '24px', maxWidth: '640px' }}>
              <form onSubmit={handleCreateCourse}>
                <div className="form-group">
                  <label className="form-label">Course Name</label>
                  <input className="form-input" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={newCourseDescription} onChange={(e) => setNewCourseDescription(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (Days)</label>
                  <input type="number" min="1" className="form-input" value={newCourseDuration} onChange={(e) => setNewCourseDuration(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Course Image URL</label>
                  <input className="form-input" value={newCourseImageUrl} onChange={(e) => setNewCourseImageUrl(e.target.value)} placeholder="https://..." />
                </div>
                <button className="btn btn-primary" type="submit">Create Course</button>
              </form>
            </div>
          </div>
        )}

        {/* 1. LIVE CLASSES TAB (§ 9) */}
        {activeTab === 'classes' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>
              Microsoft Teams Live Classroom (§ 9)
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {liveClasses.length === 0 ? (
                  <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No classes scheduled for this batch yet. Use the schedule form to create one.
                  </div>
                ) : (
                  liveClasses.map((lc) => (
                    <div key={lc.id} className="glass-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span className={`badge ${lc.status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>
                            {lc.status}
                          </span>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '8px' }}>{lc.class_topic}</h3>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Start: {new Date(lc.start_time).toLocaleString()} • End: {new Date(lc.end_time).toLocaleString()}
                          </div>
                        </div>

                        <a
                          href={lc.teams_meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary btn-sm"
                        >
                          <ExternalLink size={14} /> Join Teams Meeting
                        </a>
                      </div>

                      {/* Quick Recording Uploader for Completed Class */}
                      <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                        <input
                          className="form-input"
                          placeholder="Paste Recording Video URL / Azure Blob link..."
                          onChange={(e) => setNewRecUrl(e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                        />
                        <button onClick={() => handleAddRecording(lc.id)} className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                          Upload 60-Day Recording
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Schedule Class Form */}
              <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Schedule Live Class</h3>
                <form onSubmit={handleScheduleClass}>
                  <div className="form-group">
                    <label className="form-label">Topic / Lecture Name</label>
                    <input className="form-input" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} required placeholder="e.g. Day 12: React Hooks Deep Dive" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Microsoft Teams Meeting Link</label>
                    <input className="form-input" value={newTeamsLink} onChange={(e) => setNewTeamsLink(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input type="datetime-local" className="form-input" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input type="datetime-local" className="form-input" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    Schedule Live Class
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 2. 60-DAY RECORDINGS TAB (§ 11 & 12) */}
        {activeTab === 'recordings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>60-Day Live Class Recordings (§ 11, 12)</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Auto-retention policy: Recordings are retained for exactly 60 days before lifecycle deletion.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {recordings.map((r) => (
                <div key={r.id} className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="badge badge-warning">
                      <Clock size={12} /> 60-Day Retained
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Expires: {new Date(r.expiry_date).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{r.class_topic || 'Live Lecture'}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0 16px' }}>
                    Duration: {r.duration_minutes || 60} mins • Stored in Azure Blob
                  </div>

                  <a
                    href={r.storage_blob_path}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                  >
                    <Video size={14} /> Watch Recording
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. HYBRID ATTENDANCE TAB (§ 10 & 15) */}
        {activeTab === 'attendance' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Hybrid Attendance Register (§ 10 & 15)</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Support: Present - Online, Present - Offline, Absent, Leave.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="date"
                  className="form-input"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={{ width: '180px' }}
                />
                <button onClick={handleSaveAttendance} className="btn btn-primary">
                  Save Attendance Sheet
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Mobile</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const currentStatus = attendanceRecords[s.student_id] || 'PRESENT_ONLINE';
                    return (
                      <tr key={s.student_id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{s.mobile_number}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setAttendanceRecords({ ...attendanceRecords, [s.student_id]: 'PRESENT_ONLINE' })}
                              className={`btn btn-sm ${currentStatus === 'PRESENT_ONLINE' ? 'btn-primary' : 'btn-secondary'}`}
                            >
                              Online
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttendanceRecords({ ...attendanceRecords, [s.student_id]: 'PRESENT_OFFLINE' })}
                              className={`btn btn-sm ${currentStatus === 'PRESENT_OFFLINE' ? 'btn-success' : 'btn-secondary'}`}
                            >
                              Offline
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttendanceRecords({ ...attendanceRecords, [s.student_id]: 'ABSENT' })}
                              className={`btn btn-sm ${currentStatus === 'ABSENT' ? 'btn-danger' : 'btn-secondary'}`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttendanceRecords({ ...attendanceRecords, [s.student_id]: 'LEAVE' })}
                              className={`btn btn-sm ${currentStatus === 'LEAVE' ? 'btn-warning' : 'btn-secondary'}`}
                            >
                              Leave
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. DAY-WISE ASSIGNMENTS TAB (§ 13) */}
        {activeTab === 'assignments' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Day-Wise Assignments (§ 13)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {assignments.map((a) => {
                  const subs = assignmentSubmissions[a.id] || [];
                  return (
                    <div key={a.id} className="glass-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <span className="badge badge-info">Due: {new Date(a.due_date).toLocaleDateString()}</span>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '8px' }}>{a.title}</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{a.description}</p>
                        </div>
                        <span className={`badge ${subs.length > 0 ? 'badge-success' : 'badge-secondary'}`} style={{ whiteSpace: 'nowrap' }}>
                          {subs.length} submission{subs.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.04em' }}>
                          STUDENT SUBMISSIONS
                        </div>
                        {subs.length === 0 ? (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                            No student has submitted this task yet.
                          </div>
                        ) : (
                          <div className="table-container">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Student</th>
                                  <th>Submitted</th>
                                  <th>Work</th>
                                  <th>Marks</th>
                                  <th>Feedback</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {subs.map((sub: any) => {
                                  const draft = assignmentGrades[sub.id] || { marks: '', feedback: '' };
                                  return (
                                    <tr key={sub.id}>
                                      <td style={{ fontWeight: 600 }}>{sub.student_name}</td>
                                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '-'}
                                      </td>
                                      <td>
                                        {sub.submission_file_url ? (
                                          <a
                                            href={sub.submission_file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                          >
                                            Open <ExternalLink size={12} />
                                          </a>
                                        ) : '-'}
                                      </td>
                                      <td>
                                        <input
                                          className="form-input"
                                          style={{ width: '80px' }}
                                          type="number"
                                          min={0}
                                          value={draft.marks}
                                          placeholder="0"
                                          onChange={(e) => setAssignmentGrades((prev) => ({
                                            ...prev,
                                            [sub.id]: {
                                              ...(prev[sub.id] || { marks: '', feedback: '' }),
                                              marks: e.target.value,
                                            },
                                          }))}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          className="form-input"
                                          style={{ minWidth: '160px' }}
                                          value={draft.feedback}
                                          placeholder="Feedback..."
                                          onChange={(e) => setAssignmentGrades((prev) => ({
                                            ...prev,
                                            [sub.id]: {
                                              ...(prev[sub.id] || { marks: '', feedback: '' }),
                                              feedback: e.target.value,
                                            },
                                          }))}
                                        />
                                      </td>
                                      <td>
                                        <button
                                          type="button"
                                          className="btn btn-primary btn-sm"
                                          onClick={() => handleGradeAssignment(sub.id, a.id)}
                                        >
                                          {sub.marks_obtained !== null && sub.marks_obtained !== undefined ? 'Update' : 'Save'}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Post New Assignment</h3>
                <form onSubmit={handleCreateAssignment}>
                  <div className="form-group">
                    <label className="form-label">Assignment Title</label>
                    <input className="form-input" value={newAssignTitle} onChange={(e) => setNewAssignTitle(e.target.value)} required placeholder="e.g. Day 5: Loops Assignment" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Task Description</label>
                    <textarea className="form-textarea" value={newAssignDesc} onChange={(e) => setNewAssignDesc(e.target.value)} placeholder="Provide instructions..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Course Day</label>
                    <select className="form-select" value={newAssignDayId} onChange={(e) => setNewAssignDayId(e.target.value ? Number(e.target.value) : '')}>
                      <option value="">General batch assignment</option>
                      {courseDays.map((day) => (
                        <option key={day.id} value={day.id}>Day {day.day_number}: {day.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Attachment URL (PDF/Code)</label>
                    <input className="form-input" value={newAssignFile} onChange={(e) => setNewAssignFile(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input type="datetime-local" className="form-input" value={newAssignDue} onChange={(e) => setNewAssignDue(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    Publish Assignment
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 5. WEEKLY TESTS TAB (§ 14) */}
        {activeTab === 'tests' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Weekly Subject Test Papers (§ 14)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {tests.map((t) => {
                  const subs = testSubmissions[t.id] || [];
                  return (
                    <div key={t.id} className="glass-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <span className="badge badge-warning">Subject: {t.subject}</span>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '8px' }}>{t.title}</h3>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Total Marks: {t.total_marks}
                          </div>
                        </div>
                        <span className={`badge ${subs.length > 0 ? 'badge-success' : 'badge-secondary'}`} style={{ whiteSpace: 'nowrap' }}>
                          {subs.length} answer sheet{subs.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.04em' }}>
                          STUDENT ANSWER SHEETS
                        </div>
                        {subs.length === 0 ? (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                            No student has submitted this test yet.
                          </div>
                        ) : (
                          <div className="table-container">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Student</th>
                                  <th>Submitted</th>
                                  <th>Answer Sheet</th>
                                  <th>Marks ({t.total_marks})</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {subs.map((sub: any) => (
                                  <tr key={sub.id}>
                                    <td style={{ fontWeight: 600 }}>{sub.student_name}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '-'}
                                    </td>
                                    <td>
                                      {sub.answer_sheet_url ? (
                                        <a
                                          href={sub.answer_sheet_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        >
                                          Open <ExternalLink size={12} />
                                        </a>
                                      ) : '-'}
                                    </td>
                                    <td>
                                      <input
                                        className="form-input"
                                        style={{ width: '90px' }}
                                        type="number"
                                        min={0}
                                        max={t.total_marks}
                                        value={testGrades[sub.id] ?? ''}
                                        placeholder="0"
                                        onChange={(e) => setTestGrades((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                                      />
                                    </td>
                                    <td>
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleGradeTest(sub.id, t.id)}
                                      >
                                        {sub.marks_obtained !== null && sub.marks_obtained !== undefined ? 'Update' : 'Save'}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Upload Test Paper</h3>
                <form onSubmit={handleCreateTest}>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input className="form-input" value={newTestSubject} onChange={(e) => setNewTestSubject(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Test Title</label>
                    <input className="form-input" value={newTestTitle} onChange={(e) => setNewTestTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Test Paper Document URL</label>
                    <input className="form-input" value={newTestPaperUrl} onChange={(e) => setNewTestPaperUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Marks</label>
                    <input type="number" className="form-input" value={newTestMarks} onChange={(e) => setNewTestMarks(Number(e.target.value))} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    Upload Test Paper
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 6. BATCH CHAT WITH TIMER TAB (§ 16) */}
        {activeTab === 'chat' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Trainer Messages</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className={`btn btn-sm ${chatType === 'direct' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setChatType('direct')}>
                  Direct Chat
                </button>
                <button type="button" className={`btn btn-sm ${chatType === 'batch' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setChatType('batch')}>
                  Batch Chat
                </button>
              </div>
            </div>

            {chatType === 'direct' && (
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', height: '550px' }}>
                <div className="glass-card" style={{ padding: '12px', overflowY: 'auto' }}>
                  <div style={{ fontWeight: 700, marginBottom: '10px' }}>Batch Students</div>
                  {students.map((student) => (
                    <button
                      type="button"
                      key={student.user_id}
                      onClick={() => setSelectedDirectStudentId(Number(student.user_id))}
                      className={`btn btn-sm ${selectedDirectStudentId === Number(student.user_id) ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '8px' }}
                    >
                      {student.name}
                    </button>
                  ))}
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700 }}>
                    {students.find((student) => Number(student.user_id) === selectedDirectStudentId)?.name || 'Select a student'}
                  </div>
                  <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {!selectedDirectStudentId ? (
                      <div style={{ color: 'var(--text-dim)', textAlign: 'center', margin: 'auto' }}>Choose a student to start direct chat.</div>
                    ) : directChatMessages.length === 0 ? (
                      <div style={{ color: 'var(--text-dim)', textAlign: 'center', margin: 'auto' }}>No direct messages yet.</div>
                    ) : directChatMessages.map((message) => (
                      <div key={message.id} style={{
                        maxWidth: '75%',
                        alignSelf: message.sender_role === 'TRAINER' ? 'flex-end' : 'flex-start',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: message.sender_role === 'TRAINER' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.04)',
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>{message.sender_name}</div>
                        <div>{message.message}</div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendDirectMessage} style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px' }}>
                    <input className="form-input" value={directChatMessage} onChange={(event) => setDirectChatMessage(event.target.value)} placeholder="Write a direct message..." disabled={!selectedDirectStudentId} />
                    <button type="submit" className="btn btn-primary" disabled={!selectedDirectStudentId}>Send</button>
                  </form>
                </div>
              </div>
            )}

            {chatType === 'batch' && (
              <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Realtime Batch Chat with Class Timer</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Trainer controls the chat availability window for students during live sessions.
                </div>
              </div>

              {/* Master Toggle & Timer config */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={chatActive}
                    onChange={(e) => setChatActive(e.target.checked)}
                  />
                  Chat Enabled
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={chatActiveUntil}
                  onChange={(e) => setChatActiveUntil(e.target.value)}
                  style={{ width: '210px' }}
                />
                <button onClick={handleUpdateChatRoom} className="btn btn-primary btn-sm">
                  Apply Timer Window
                </button>
              </div>
            </div>

            {/* Chat Box */}
            <div className="glass-card" style={{ height: '550px', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ fontWeight: 700 }}>Batch {currentBatchId} Chat Stream</div>
                <span className={`badge ${chatRoom?.is_currently_open === 1 ? 'badge-success' : 'badge-danger'}`}>
                  {chatRoom?.is_currently_open === 1 ? '● LIVE / OPEN' : '○ CLOSED BY TIMER'}
                </span>
              </div>

              {/* Messages List */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', textAlign: 'center', margin: 'auto' }}>
                    No messages yet. Send a message to start class discussion!
                  </div>
                ) : (
                  chatMessages.map((m) => (
                    <div key={m.id} style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: m.sender_role === 'TRAINER' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      maxWidth: '75%',
                      alignSelf: m.sender_role === 'TRAINER' ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: m.sender_role === 'TRAINER' ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '4px' }}>
                        {m.sender_name} ({m.sender_role})
                      </div>
                      <div style={{ fontSize: '0.9rem' }}>{m.message}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px' }}>
                <input
                  className="form-input"
                  placeholder="Type a message to batch students..."
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  Send Message
                </button>
              </form>
            </div>
            </>
            )}
          </div>
        )}

        {/* 7. ANNOUNCEMENTS TAB (§ 17) */}
        {activeTab === 'announcements' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Message Board & Announcements (§ 17)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {announcements.map((a) => (
                  <div key={a.id} className="glass-card" style={{ padding: '20px', borderLeft: a.is_pinned ? '4px solid var(--primary)' : '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{a.title}</h3>
                      {a.is_pinned && <span className="badge badge-primary">PINNED</span>}
                    </div>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                      {a.content}
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '12px' }}>
                      Posted by: {a.author_name} ({a.author_role}) • {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Broadcast Announcement</h3>
                <form onSubmit={handleCreateAnnouncement}>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" value={newAnnounceTitle} onChange={(e) => setNewAnnounceTitle(e.target.value)} required placeholder="e.g. Schedule Change" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message Content</label>
                    <textarea className="form-textarea" value={newAnnounceContent} onChange={(e) => setNewAnnounceContent(e.target.value)} required placeholder="Write details..." />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={newAnnouncePinned} onChange={(e) => setNewAnnouncePinned(e.target.checked)} />
                      Pin to top of board
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Post Announcement
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
