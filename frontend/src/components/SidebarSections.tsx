// src/components/SidebarSections.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, Shield, UserCheck, BookOpen, Layers } from 'lucide-react';

const softBadge: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.12)',
  border: '1px solid rgba(255, 255, 255, 0.22)',
  color: '#FFFFFF',
};

const roleLabel = (role?: string | null) => {
  switch (role) {
    case 'ADMIN':
      return 'Administrator';
    case 'TRAINER':
      return 'Trainer';
    case 'STUDENT':
      return 'Student';
    default:
      return 'Member';
  }
};

/** Brand + Active Portal badge + Active Batch chip (moved from Navbar) */
export const SidebarBrand: React.FC = () => {
  const { user, role } = useAuth();

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge" style={softBadge}><Shield size={12} /> Admin Portal</span>;
      case 'TRAINER':
        return <span className="badge" style={softBadge}><UserCheck size={12} /> Trainer Portal</span>;
      case 'STUDENT':
        return <span className="badge" style={softBadge}><GraduationCap size={12} /> Student Portal</span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '0 4px', marginBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #FFF4DE 0%, #FCE9B9 100%)',
          padding: '8px',
          borderRadius: '12px',
          display: 'flex',
          border: '1px solid rgba(233, 165, 43, 0.28)',
          boxShadow: '0 6px 16px rgba(233, 165, 43, 0.18)',
        }}>
          <BookOpen size={20} color="#650B2B" />
        </div>
        <div style={{
          fontWeight: 800,
          fontSize: '1.15rem',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #FFFFFF, #FFE8B0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          SkillForge LMS
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
        {getRoleBadge()}

        {user?.batch_code && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: 'rgba(255, 255, 255, 0.72)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
          }}>
            <Layers size={13} color="#F9A8D4" />
            Batch: <strong style={{ color: '#FFFFFF' }}>{user.batch_code}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

/** User profile + Logout (moved from Navbar) */
export const SidebarUser: React.FC = () => {
  const { user, logout, role } = useAuth();
  if (!user) return null;

  const initial = (user.name || 'U').trim().charAt(0).toUpperCase();

  return (
    <div style={{
      marginTop: 'auto',
      paddingTop: '16px',
      borderTop: '1px solid rgba(255, 255, 255, 0.14)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      <div style={{
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFE8B0, #F4BE59)',
        color: '#650B2B',
        fontWeight: 800,
        fontSize: '0.95rem',
        border: '1px solid rgba(101, 11, 43, 0.12)',
      }}>
        {initial}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#FFFFFF',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }} title={user.name}>
          {user.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)' }} title={user.mobile_number}>
          {roleLabel(role)}
        </div>
      </div>

      <button
        type="button"
        onClick={logout}
        title="Logout"
        aria-label="Logout"
        style={{
          padding: '8px',
          borderRadius: '10px',
          border: '1px solid rgba(233, 165, 43, 0.4)',
          background: 'rgba(252, 233, 185, 0.14)',
          color: '#FFD77A',
          cursor: 'pointer',
          display: 'flex',
          transition: 'var(--transition)',
        }}
      >
        <LogOut size={16} />
      </button>
    </div>
  );
};
