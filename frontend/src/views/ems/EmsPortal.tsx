// src/views/ems/EmsPortal.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users, Briefcase, Calendar, Clock, Award, Plus, Search,
  CheckCircle2, XCircle, BookOpen,
  Building2, DollarSign, Phone, Mail
} from 'lucide-react';

export const EmsPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'leaves' | 'training_hub' | 'departments'>('employees');

  // Master Data
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [trainingSummary, setTrainingSummary] = useState<any>(null);

  // Filter States
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<any>(null);

  // Modals
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showAssignTrainingModal, setShowAssignTrainingModal] = useState<any>(null);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [notification, setNotification] = useState('');

  // Form states for New Employee
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpMobile, setNewEmpMobile] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpDeptId, setNewEmpDeptId] = useState<number | ''>('');
  const [newEmpDesigId, setNewEmpDesigId] = useState<number | ''>('');
  const [newEmpSalary, setNewEmpSalary] = useState<number>(45000);
  const newEmpType = 'FULL_TIME';
  const [newEmpInitialCourseId, setNewEmpInitialCourseId] = useState<number | ''>('');
  const [newEmpInitialBatchId, setNewEmpInitialBatchId] = useState<number | ''>('');

  // Leave Form
  const [leaveEmpId, setLeaveEmpId] = useState<number | ''>('');
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [leaveFrom, setLeaveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [leaveTo, setLeaveTo] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');

  // Assign Training Form
  const [assignCourseId, setAssignCourseId] = useState<number | ''>('');
  const [assignBatchId, setAssignBatchId] = useState<number | ''>('');
  const [assignTrainingType, setAssignTrainingType] = useState('UPSKILLING');

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const loadAllData = async () => {
    try {
      const [empRes, deptRes, desigRes, cRes, bRes, attRes, lRes, sumRes] = await Promise.all([
        api.getEmsEmployees(),
        api.getEmsDepartments(),
        api.getEmsDesignations(),
        api.getCourses(),
        api.getBatches(),
        api.getEmsAttendance(),
        api.getEmsLeaves(),
        api.getEmsTrainingSummary()
      ]);

      if (empRes.success && empRes.data) setEmployees(empRes.data);
      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
      if (desigRes.success && desigRes.data) setDesignations(desigRes.data);
      if (cRes.success && cRes.data) setCourses(cRes.data);
      if (bRes.success && bRes.data) setBatches(bRes.data);
      if (attRes.success && attRes.data) setAttendance(attRes.data);
      if (lRes.success && lRes.data) setLeaves(lRes.data);
      if (sumRes.success && sumRes.data) setTrainingSummary(sumRes.data);
    } catch (err: any) {
      console.error('Failed to load EMS data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter designations based on selected department in modal
  const filteredDesignations = designations.filter(
    (d) => !newEmpDeptId || d.department_id === Number(newEmpDeptId)
  );

  // Handle Onboard Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpMobile || !newEmpDeptId || !newEmpDesigId) {
      showNotice('Please fill all required fields');
      return;
    }

    try {
      const res = await api.createEmsEmployee({
        name: newEmpName,
        mobile_number: newEmpMobile,
        work_email: newEmpEmail,
        department_id: Number(newEmpDeptId),
        designation_id: Number(newEmpDesigId),
        employment_type: newEmpType,
        salary_monthly: newEmpSalary,
        initial_course_id: newEmpInitialCourseId ? Number(newEmpInitialCourseId) : undefined,
        initial_batch_id: newEmpInitialBatchId ? Number(newEmpInitialBatchId) : undefined
      });

      if (res.success) {
        showNotice(`🎉 Employee ${(res.data as any)?.employee_code || ''} successfully onboarded & linked to LMS!`);
        setShowAddEmpModal(false);
        // Reset form
        setNewEmpName('');
        setNewEmpMobile('');
        setNewEmpEmail('');
        setNewEmpDeptId('');
        setNewEmpDesigId('');
        setNewEmpInitialCourseId('');
        setNewEmpInitialBatchId('');
        loadAllData();
      } else {
        showNotice(`Error: ${res.message || res.error}`);
      }
    } catch (err: any) {
      showNotice(`Failed: ${err.message}`);
    }
  };

  // Handle Check-in
  const handleCheckIn = async (empId: number) => {
    try {
      const res = await api.checkInEms({
        employee_id: empId,
        work_mode: 'OFFICE',
        remarks: 'Direct Portal Check-in'
      });
      if (res.success) {
        showNotice('✅ Attendance check-in recorded!');
        loadAllData();
      } else {
        showNotice(res.message || 'Check-in failed');
      }
    } catch (err: any) {
      showNotice(err.message);
    }
  };

  // Handle Check-out
  const handleCheckOut = async (empId: number) => {
    try {
      const res = await api.checkOutEms({ employee_id: empId });
      if (res.success) {
        showNotice('👋 Check-out recorded!');
        loadAllData();
      } else {
        showNotice(res.message || 'Check-out failed');
      }
    } catch (err: any) {
      showNotice(err.message);
    }
  };

  // Handle Leave Status
  const handleUpdateLeave = async (leaveId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.updateEmsLeaveStatus(leaveId, {
        status,
        action_remarks: `Processed by HR Admin on ${new Date().toLocaleDateString()}`
      });
      if (res.success) {
        showNotice(`Leave marked as ${status}`);
        loadAllData();
      }
    } catch (err: any) {
      showNotice(err.message);
    }
  };

  // Handle Leave Application
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveEmpId || !leaveReason) {
      showNotice('Please select an employee and enter a reason');
      return;
    }

    try {
      const res = await api.applyEmsLeave({
        employee_id: Number(leaveEmpId),
        leave_type: leaveType,
        from_date: leaveFrom,
        to_date: leaveTo,
        total_days: 1,
        reason: leaveReason
      });
      if (res.success) {
        showNotice('Leave request submitted!');
        setShowApplyLeaveModal(false);
        setLeaveReason('');
        loadAllData();
      }
    } catch (err: any) {
      showNotice(err.message);
    }
  };

  // Handle Assign Training
  const handleAssignTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignTrainingModal || !assignCourseId) {
      showNotice('Please select a course');
      return;
    }

    try {
      const res = await api.assignEmsTraining({
        employee_id: showAssignTrainingModal.id,
        course_id: Number(assignCourseId),
        batch_id: assignBatchId ? Number(assignBatchId) : undefined,
        training_type: assignTrainingType
      });

      if (res.success) {
        showNotice(`🎯 LMS Training assigned to ${showAssignTrainingModal.name}!`);
        setShowAssignTrainingModal(null);
        setAssignCourseId('');
        setAssignBatchId('');
        loadAllData();
      }
    } catch (err: any) {
      showNotice(err.message);
    }
  };

  // Open Full Employee Detail View
  const handleViewEmployee = async (empId: number) => {
    try {
      const res = await api.getEmsEmployeeById(empId);
      if (res.success && res.data) {
        setSelectedEmployeeDetail(res.data);
      }
    } catch (err: any) {
      showNotice(err.message);
    }
  };

  // Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = !selectedDeptFilter || String(emp.department_id) === selectedDeptFilter;
    const matchesSearch = !searchQuery ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #10B981, #059669)',
          color: '#FFF',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 9999,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} /> {notification}
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95), rgba(255, 255, 255, 0.98))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="badge badge-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                <Briefcase size={13} /> EMS Core HR + LMS
              </span>
              <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                <Award size={13} /> Single Database Architecture
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
              Employee Management & Upskilling Hub
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Manage employee lifecycles, attendance, leaves, and automate skill training via integrated LMS cohorts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowApplyLeaveModal(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Calendar size={16} /> Apply Leave
            </button>
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              <Plus size={16} /> Onboard Employee
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>TOTAL HEADCOUNT</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
              {employees.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Across {departments.length} Departments
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>IN LMS TRAINING</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--primary)' }}>
              {trainingSummary?.overview?.employees_in_training || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '2px' }}>
              Enrolled in 60-Day Induction
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE TODAY</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--success)' }}>
              {attendance.filter((a) => a.attendance_date?.startsWith(new Date().toISOString().split('T')[0])).length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '2px' }}>
              Checked-in Employees
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>PENDING LEAVES</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--warning)' }}>
              {leaves.filter((l) => l.status === 'PENDING').length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '2px' }}>
              Awaiting Manager Approval
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveTab('employees')}
          className={`btn ${activeTab === 'employees' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Users size={16} /> Employee Directory ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('training_hub')}
          className={`btn ${activeTab === 'training_hub' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Award size={16} /> LMS Training & Upskilling Bridge
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Clock size={16} /> Attendance Register
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Calendar size={16} /> Leave Management
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Building2 size={16} /> Departments & Designations
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: EMPLOYEE DIRECTORY */}
      {/* ==================================================== */}
      {activeTab === 'employees' && (
        <div>
          {/* Filter / Search Toolbar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search by name, EMP code, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px', width: '100%' }}
              />
            </div>

            <select
              className="input-field"
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              style={{ width: '220px' }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Employee Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                className="glass-card"
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
                        {emp.employee_code}
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '2px 0 0 0' }}>
                        {emp.name}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {emp.designation_title} {emp.grade_level ? `(${emp.grade_level})` : ''}
                      </div>
                    </div>

                    <span className={`badge ${emp.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                      {emp.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '6px', margin: '14px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={13} color="var(--primary)" />
                      <span>{emp.department_name} ({emp.department_code})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} color="var(--primary)" />
                      <span>{emp.mobile_number}</span>
                    </div>
                    {emp.work_email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} color="var(--primary)" />
                        <span>{emp.work_email}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <DollarSign size={13} color="var(--success)" />
                      <span>₹{Number(emp.salary_monthly).toLocaleString('en-IN')}/month</span>
                    </div>
                  </div>

                  {/* LMS Training Badge */}
                  <div style={{
                    background: emp.current_course_name ? 'rgba(99, 102, 241, 0.1)' : 'rgba(15, 23, 42, 0.04)',
                    border: `1px solid ${emp.current_course_name ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-subtle)'}`,
                    padding: '10px 12px',
                    borderRadius: '10px',
                    marginBottom: '14px',
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: emp.current_course_name ? 'var(--primary)' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={13} /> LMS TRAINING STATUS
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                      {emp.current_course_name ? emp.current_course_name : 'No active LMS batch assigned'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <button
                    onClick={() => handleViewEmployee(emp.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => setShowAssignTrainingModal(emp)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <BookOpen size={14} /> Assign Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: LMS TRAINING & UPSKILLING BRIDGE */}
      {/* ==================================================== */}
      {activeTab === 'training_hub' && (
        <div>
          <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px' }}>
              Organizational Training & Upskilling Analytics
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Real-time synchronization between LMS classroom engagement (attendance, assignments, test papers) and HR records.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {trainingSummary?.department_breakdown?.map((dept: any) => (
                <div key={dept.department_name} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontWeight: 700 }}>{dept.department_name}</h4>
                    <span className="badge badge-primary">{dept.employees_trained} / {dept.department_headcount} Trained</span>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Average Progress</span>
                      <span>{Math.round(dept.avg_progress || 0)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, Math.round(dept.avg_progress || 0))}%`, height: '100%', background: 'linear-gradient(90deg, #6366F1, #10B981)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enrolled Employees Roster */}
          <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
              Active Employee Learning Enrolments
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '10px' }}>EMPLOYEE</th>
                    <th style={{ padding: '10px' }}>DEPARTMENT</th>
                    <th style={{ padding: '10px' }}>ASSIGNED LMS COURSE</th>
                    <th style={{ padding: '10px' }}>ENROLLED STATUS</th>
                    <th style={{ padding: '10px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 600 }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{emp.employee_code}</div>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {emp.department_name}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {emp.current_course_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                            <BookOpen size={14} />
                            <strong>{emp.current_course_name}</strong>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>Not Enrolled</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {emp.current_course_name ? (
                          <span className="badge badge-success">ACTIVE IN BATCH</span>
                        ) : (
                          <span className="badge badge-secondary">PENDING ONBOARDING</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <button
                          onClick={() => setShowAssignTrainingModal(emp)}
                          className="btn btn-secondary btn-sm"
                        >
                          {emp.current_course_name ? 'Change / Add Batch' : 'Assign LMS Batch'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: ATTENDANCE REGISTER */}
      {/* ==================================================== */}
      {activeTab === 'attendance' && (
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                Daily Attendance Register
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                Track employee check-ins, check-outs, work modes, and hours.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '10px' }}>DATE</th>
                  <th style={{ padding: '10px' }}>EMPLOYEE</th>
                  <th style={{ padding: '10px' }}>DEPARTMENT</th>
                  <th style={{ padding: '10px' }}>CHECK-IN</th>
                  <th style={{ padding: '10px' }}>CHECK-OUT</th>
                  <th style={{ padding: '10px' }}>MODE</th>
                  <th style={{ padding: '10px' }}>STATUS</th>
                  <th style={{ padding: '10px' }}>QUICK ACTION</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const todayRec = attendance.find(
                    (a) => a.employee_id === emp.id && a.attendance_date?.startsWith(todayStr)
                  );

                  return (
                    <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>
                        {todayStr}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 600 }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{emp.employee_code}</div>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {emp.department_name}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {todayRec?.check_in_time ? (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            {String(todayRec.check_in_time).slice(0, 5)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>--:--</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {todayRec?.check_out_time ? (
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            {String(todayRec.check_out_time).slice(0, 5)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>--:--</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span className="badge badge-secondary">
                          {todayRec?.work_mode || 'OFFICE'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {todayRec ? (
                          <span className="badge badge-success">PRESENT</span>
                        ) : (
                          <span className="badge badge-warning">NOT CHECKED IN</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {!todayRec ? (
                          <button
                            onClick={() => handleCheckIn(emp.id)}
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '0.75rem' }}
                          >
                            Check In
                          </button>
                        ) : !todayRec.check_out_time ? (
                          <button
                            onClick={() => handleCheckOut(emp.id)}
                            className="btn btn-sm btn-secondary"
                            style={{ fontSize: '0.75rem' }}
                          >
                            Check Out
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                            <CheckCircle2 size={14} style={{ verticalAlign: 'middle' }} /> Complete
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: LEAVE MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'leaves' && (
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                Leave Requests & Approvals
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                Review, approve, or reject employee leave applications.
              </p>
            </div>
            <button
              onClick={() => setShowApplyLeaveModal(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Submit Leave Request
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '10px' }}>EMPLOYEE</th>
                  <th style={{ padding: '10px' }}>LEAVE TYPE</th>
                  <th style={{ padding: '10px' }}>DATES</th>
                  <th style={{ padding: '10px' }}>DAYS</th>
                  <th style={{ padding: '10px' }}>REASON</th>
                  <th style={{ padding: '10px' }}>STATUS</th>
                  <th style={{ padding: '10px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No leave applications found.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 600 }}>{l.employee_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{l.employee_code} ({l.department_name})</div>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span className="badge badge-secondary">{l.leave_type}</span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {l.from_date?.split('T')[0]} to {l.to_date?.split('T')[0]}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                        {l.total_days}
                      </td>
                      <td style={{ padding: '12px 10px', maxWidth: '240px' }}>
                        {l.reason}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span className={`badge ${l.status === 'APPROVED' ? 'badge-success' : l.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {l.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleUpdateLeave(l.id, 'APPROVED')}
                              className="btn btn-sm btn-success"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateLeave(l.id, 'REJECTED')}
                              className="btn btn-sm btn-danger"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {l.action_remarks || 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: DEPARTMENTS & DESIGNATIONS */}
      {/* ==================================================== */}
      {activeTab === 'departments' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {departments.map((dept) => {
            const deptDesignations = designations.filter((d) => d.department_id === dept.id);

            return (
              <div key={dept.id} className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                    {dept.name}
                  </h3>
                  <span className="badge badge-primary">{dept.code}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {dept.description || 'No description provided.'}
                </p>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px' }}>
                  DESIGNATION HIERARCHY ({deptDesignations.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {deptDesignations.map((desig) => (
                    <div
                      key={desig.id}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span>{desig.title}</span>
                      {desig.grade_level && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                          {desig.grade_level}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ONBOARD EMPLOYEE */}
      {/* ==================================================== */}
      {showAddEmpModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '640px', padding: '28px', borderRadius: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Onboard New Employee</h2>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Creates Employee Profile + LMS Student Account + Auto-enrols into Training
                </p>
              </div>
              <button onClick={() => setShowAddEmpModal(false)} className="btn btn-secondary btn-sm" style={{ borderRadius: '50%', padding: '6px' }}>
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Ramesh Kumar"
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Mobile Number (Used for LMS Login) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    className="input-field"
                    placeholder="10-digit mobile"
                    value={newEmpMobile}
                    onChange={(e) => setNewEmpMobile(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Work Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="ramesh@company.com"
                    value={newEmpEmail}
                    onChange={(e) => setNewEmpEmail(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Monthly Salary (INR)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={newEmpSalary}
                    onChange={(e) => setNewEmpSalary(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Department *
                  </label>
                  <select
                    required
                    className="input-field"
                    value={newEmpDeptId}
                    onChange={(e) => {
                      setNewEmpDeptId(e.target.value ? Number(e.target.value) : '');
                      setNewEmpDesigId('');
                    }}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Designation *
                  </label>
                  <select
                    required
                    className="input-field"
                    value={newEmpDesigId}
                    onChange={(e) => setNewEmpDesigId(e.target.value ? Number(e.target.value) : '')}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Designation</option>
                    {filteredDesignations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} {d.grade_level ? `(${d.grade_level})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LMS Bridge Auto-Enroll Section */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
                  <BookOpen size={16} /> LMS Automated Induction / Upskilling Batch
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Optionally enroll the employee immediately into an LMS course & batch. Their credentials will be active on both portals.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Select Course
                    </label>
                    <select
                      className="input-field"
                      value={newEmpInitialCourseId}
                      onChange={(e) => setNewEmpInitialCourseId(e.target.value ? Number(e.target.value) : '')}
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    >
                      <option value="">No Course (Skip for now)</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.course_name} ({c.duration_days} Days)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Select Batch (Cohort)
                    </label>
                    <select
                      className="input-field"
                      value={newEmpInitialBatchId}
                      onChange={(e) => setNewEmpInitialBatchId(e.target.value ? Number(e.target.value) : '')}
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    >
                      <option value="">No Batch (Assign Later)</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.batch_code} ({b.course_name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                >
                  Confirm & Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ASSIGN TRAINING */}
      {/* ==================================================== */}
      {showAssignTrainingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Assign LMS Course to {showAssignTrainingModal.name}
              </h3>
              <button onClick={() => setShowAssignTrainingModal(null)} className="btn btn-secondary btn-sm">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignTraining}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  LMS Course *
                </label>
                <select
                  required
                  className="input-field"
                  value={assignCourseId}
                  onChange={(e) => setAssignCourseId(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%' }}
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_name} ({c.duration_days} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Batch (Cohort)
                </label>
                <select
                  className="input-field"
                  value={assignBatchId}
                  onChange={(e) => setAssignBatchId(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%' }}
                >
                  <option value="">Select Batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_code} ({b.course_name})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Training Type
                </label>
                <select
                  className="input-field"
                  value={assignTrainingType}
                  onChange={(e) => setAssignTrainingType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="ONBOARDING">ONBOARDING (New Joiner)</option>
                  <option value="UPSKILLING">UPSKILLING (Skill Growth)</option>
                  <option value="COMPLIANCE">COMPLIANCE / MANDATORY</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAssignTrainingModal(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                >
                  Assign Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: APPLY LEAVE */}
      {/* ==================================================== */}
      {showApplyLeaveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Submit Leave Application
              </h3>
              <button onClick={() => setShowApplyLeaveModal(false)} className="btn btn-secondary btn-sm">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyLeave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Employee *
                </label>
                <select
                  required
                  className="input-field"
                  value={leaveEmpId}
                  onChange={(e) => setLeaveEmpId(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%' }}
                >
                  <option value="">Select Employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Leave Type
                </label>
                <select
                  className="input-field"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="EARNED">Earned / Privilege Leave</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={leaveFrom}
                    onChange={(e) => setLeaveFrom(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={leaveTo}
                    onChange={(e) => setLeaveTo(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Reason for Leave *
                </label>
                <textarea
                  required
                  rows={3}
                  className="input-field"
                  placeholder="Explain brief reason..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowApplyLeaveModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: EMPLOYEE FULL PROFILE WITH LMS PROGRESS */}
      {/* ==================================================== */}
      {selectedEmployeeDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '680px', padding: '28px', borderRadius: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-primary">{selectedEmployeeDetail.employee_code}</span>
                <h2 style={{ margin: '6px 0 2px 0', fontSize: '1.4rem', fontWeight: 800 }}>
                  {selectedEmployeeDetail.name}
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {selectedEmployeeDetail.designation_title} • {selectedEmployeeDetail.department_name}
                </div>
              </div>
              <button onClick={() => setSelectedEmployeeDetail(null)} className="btn btn-secondary btn-sm">
                <XCircle size={20} />
              </button>
            </div>

            {/* Profile Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div><strong>Mobile:</strong> {selectedEmployeeDetail.mobile_number}</div>
              <div><strong>Work Email:</strong> {selectedEmployeeDetail.work_email || 'N/A'}</div>
              <div><strong>Joined:</strong> {selectedEmployeeDetail.date_of_joining?.split('T')[0]}</div>
              <div><strong>Salary:</strong> ₹{Number(selectedEmployeeDetail.salary_monthly).toLocaleString('en-IN')}/mo</div>
              <div><strong>Status:</strong> <span className="badge badge-success">{selectedEmployeeDetail.status}</span></div>
              <div><strong>Role:</strong> {selectedEmployeeDetail.employment_type}</div>
            </div>

            {/* Enrolled LMS Trainings */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                <BookOpen size={18} /> LMS Training & Upskilling Journey
              </h3>

              {selectedEmployeeDetail.trainings?.length === 0 ? (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No courses assigned yet.
                </div>
              ) : (
                selectedEmployeeDetail.trainings?.map((t: any) => (
                  <div key={t.id} style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '16px', borderRadius: '12px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                        {t.course_name}
                      </div>
                      <span className="badge badge-primary">{t.training_type}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      <span>Batch: <strong>{t.batch_code || 'Self-Paced'}</strong></span>
                      <span>Duration: <strong>{t.duration_days} Days</strong></span>
                      <span>Enrolled: <strong>{t.enrollment_date?.split('T')[0]}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedEmployeeDetail(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
