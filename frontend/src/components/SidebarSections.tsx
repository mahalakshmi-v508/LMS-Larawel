// src/components/SidebarSections.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, Shield, UserCheck, BookOpen, Layers } from 'lucide-react';

const softBadge: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.14)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  color: '#FFFFFF',
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
          background: '#FFFFFF',
          padding: '7px',
          borderRadius: '10px',
          display: 'flex',
          boxShadow: '0 6px 16px rgba(15, 23, 42, 0.2)',
        }}>
          <BookOpen size={20} color="#4F46E5" />
        </div>
        <div style={{
          fontWeight: 800,
          fontSize: '1.15rem',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #FFFFFF, #C7D2FE)',
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
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}>
            <Layers size={13} color="#C7D2FE" />
            Batch: <strong style={{ color: '#FFFFFF' }}>{user.batch_code}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

/** User profile + Logout (moved from Navbar) */
export const SidebarUser: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div style={{
      marginTop: 'auto',
      paddingTop: '16px',
      borderTop: '1px solid rgba(255, 255, 255, 0.16)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#FFFFFF',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {user.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>
          {user.mobile_number}
        </div>
      </div>

      <button
        type="button"
        onClick={logout}
        title="Logout"
        aria-label="Logout"
        style={{
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#FFFFFF',
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
