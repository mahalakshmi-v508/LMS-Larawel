// src/components/Navbar.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, Shield, UserCheck, BookOpen, Layers } from 'lucide-react';

export const Navbar: React.FC<{ activeBatchCode?: string }> = ({ activeBatchCode }) => {
  const { user, role, logout } = useAuth();

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge badge-danger"><Shield size={12} /> Admin Portal</span>;
      case 'TRAINER':
        return <span className="badge badge-warning"><UserCheck size={12} /> Trainer Portal</span>;
      case 'STUDENT':
        return <span className="badge badge-primary"><GraduationCap size={12} /> Student Portal</span>;
      default:
        return null;
    }
  };

  return (
    <header style={{
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Brand & Active Portal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 800,
          fontSize: '1.2rem',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #A5B4FC, #6366F1, #8B5CF6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#FFF',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
          }}>
            <BookOpen size={20} color="#FFFFFF" />
          </div>
          SkillForge LMS
        </div>

        {getRoleBadge()}

        {activeBatchCode && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.04)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)'
          }}>
            <Layers size={13} color="var(--primary)" />
            Batch: <strong style={{ color: 'var(--text-main)' }}>{activeBatchCode}</strong>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.mobile_number}</div>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Logout"
              style={{ padding: '8px' }}
            >
              <LogOut size={16} color="var(--danger)" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
