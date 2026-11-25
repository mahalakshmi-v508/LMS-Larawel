// src/views/LoginView.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Smartphone, KeyRound, ArrowRight, GraduationCap, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onBack?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBack }) => {
  const { loginWithOtp } = useAuth();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.sendOtp(mobile);
      if (res.success) {
        setOtpSent(true);
        if (res.otp_code) {
          setGeneratedOtp(res.otp_code);
          setOtp(res.otp_code); // auto-fill for testing ease
        }
      } else {
        setError(res.message || res.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginWithOtp(mobile, otp);
      if (!res.success) {
        setError(res.message || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at top, #FFF0CE 0%, #FFF9F0 68%)',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {onBack && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onBack}
            style={{ marginBottom: '20px' }}
          >
            ← Back to website
          </button>
        )}
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #650B2B, #8B1639)',
            boxShadow: '0 8px 24px rgba(101, 11, 43, 0.28)',
            marginBottom: '16px',
          }}>
            <GraduationCap size={32} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Welcome to SkillForge LMS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Sign in using your mobile number and OTP
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#DC2626',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">Registered Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <Smartphone size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Enter 10-digit mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Enter student (9090909090), trainer (4545454545), or admin (3434343434)
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || !mobile}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP Code'}
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div style={{
                background: 'var(--success-bg)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
              }}>
                <CheckCircle2 size={20} color="var(--success)" />
                <div style={{ fontSize: '0.825rem', color: '#047857' }}>
                  OTP sent to <strong>{mobile}</strong>!
                  {generatedOtp && <span> (Test Code: <strong>{generatedOtp}</strong>)</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">6-Digit Verification Code</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="text"
                    maxLength={6}
                    className="form-input"
                    placeholder="e.g. 123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ paddingLeft: '40px', letterSpacing: '4px', fontSize: '1.1rem', fontWeight: 700 }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {loading ? 'Verifying...' : 'Verify & Enter LMS'}
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: '12px' }}
              >
                Change Mobile Number
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
