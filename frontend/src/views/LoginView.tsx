// src/views/LoginView.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Smartphone, KeyRound, ArrowRight, GraduationCap, CheckCircle2, Mail, BadgeCheck,
  CreditCard, AlertCircle, ShieldCheck, Wallet,
} from 'lucide-react';

interface LoginViewProps {
  onBack?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBack }) => {
  const { loginWithOtp, loginWithStudentAccount } = useAuth();
  const [loginMode, setLoginMode] = useState<'student' | 'otp'>('student');
  const [accountId, setAccountId] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const [paymentToken, setPaymentToken] = useState('');
  const [payment, setPayment] = useState<any | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('pay') || '';
    if (!token) return;

    setPaymentToken(token);
    setPaymentLoading(true);
    api.getEnquiryPayment(token)
      .then((res) => {
        if (res.success && res.data) {
          setPayment(res.data);
          setPaymentDone(String(res.data.payment_status || '').toUpperCase() === 'PAID');
          if (res.data.account_id) setAccountId(res.data.account_id);
          if (res.data.email) setEmail(res.data.email);
        } else {
          setPaymentError(res.message || res.error || 'This payment link is not valid.');
        }
      })
      .finally(() => setPaymentLoading(false));
  }, []);

  const handlePayNow = async () => {
    if (!paymentToken) return;
    setPaying(true);
    setPaymentError('');
    const res = await api.payEnquiry(paymentToken);
    setPaying(false);
    if (!res.success || !res.data) {
      setPaymentError(res.message || res.error || 'Payment failed. Please try again.');
      return;
    }
    setPayment(res.data);
    setPaymentDone(true);
    if (res.data.account_id) setAccountId(res.data.account_id);
    if (res.data.email) setEmail(res.data.email);
  };

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

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginWithStudentAccount(accountId, email);
      if (!res.success) {
        setError(res.message || 'Student ID or email is incorrect');
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
            Sign in with your student ID, or use mobile OTP for staff
          </p>
        </div>

        {/* Payment step reached from the QR code / WhatsApp payment link */}
        {paymentToken && (
          <div
            className="glass-card"
            style={{
              padding: '24px',
              marginBottom: '20px',
              border: '1px solid rgba(200, 149, 43, 0.42)',
              background: 'linear-gradient(135deg, #FFF9EE 0%, #FDEFD8 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                background: 'linear-gradient(135deg, #7A1430, #4B0B1E)',
                color: '#F3C15B', display: 'grid', placeItems: 'center',
              }}>
                <Wallet size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.02rem' }}>Course Fee Payment</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Complete the payment to activate your student account</div>
              </div>
            </div>

            {paymentLoading && (
              <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>Loading payment details…</div>
            )}

            {paymentError && (
              <div style={{
                display: 'flex', gap: '8px', alignItems: 'flex-start',
                background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#B91C1C', padding: '10px 12px', borderRadius: '10px',
                fontSize: '0.82rem', marginBottom: '12px',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{paymentError}</span>
              </div>
            )}

            {payment && (
              <>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                  background: '#FFFFFF', border: '1px solid var(--border-subtle)',
                  borderRadius: '12px', padding: '12px 14px', marginBottom: '12px',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{payment.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {payment.course_interest}
                      {payment.account_id ? ` • ${payment.account_id}` : ' • Student ID created after payment'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>Amount</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#B0154F' }}>₹{Number(payment.amount || 0).toFixed(2)}</div>
                  </div>
                </div>

                {paymentDone ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: 'var(--success-bg)', border: '1px solid var(--success-border)',
                      color: 'var(--success-text)', padding: '12px', borderRadius: '10px',
                      fontSize: '0.85rem', fontWeight: 600,
                    }}>
                      <ShieldCheck size={18} /> Payment received — your Student ID has been sent to WhatsApp.
                    </div>
                    {payment.account_id && (
                      <div style={{
                        textAlign: 'center', background: '#FFFFFF',
                        border: '1px dashed rgba(122, 20, 48, 0.35)', borderRadius: '10px', padding: '12px',
                      }}>
                        <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700 }}>
                          Your Student ID
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>
                          {payment.account_id}
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      It has been pre-filled below — just click Sign in.
                    </div>
                  </div>
                ) : (
                  <>
                    {/* The same UPI QR card that is shared on WhatsApp — amount already baked in */}
                    {paymentToken && (
                      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                        <img
                          src={api.enquiryQrUrl(paymentToken)}
                          alt="Scan to pay the course fee"
                          style={{
                            width: '100%',
                            maxWidth: '280px',
                            borderRadius: '14px',
                            display: 'block',
                            margin: '0 auto',
                            boxShadow: '0 10px 26px rgba(27, 27, 27, 0.28)',
                          }}
                        />
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                          Amount already filled in — scan &amp; confirm
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                      disabled={paying}
                      onClick={handlePayNow}
                    >
                      <CreditCard size={18} />
                      {paying ? 'Processing payment…' : `Pay ₹${Number(payment.amount || 0).toFixed(2)} now`}
                    </button>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center' }}>
                      You can sign in only after the payment is completed.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        )}

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

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              type="button"
              className={`btn ${loginMode === 'student' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => { setLoginMode('student'); setError(''); }}
            >
              Student ID
            </button>
            <button
              type="button"
              className={`btn ${loginMode === 'otp' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => { setLoginMode('otp'); setOtpSent(false); setError(''); }}
            >
              Staff OTP
            </button>
          </div>

          {loginMode === 'student' ? (
            <form onSubmit={handleStudentLogin}>
              <div className="form-group">
                <label className="form-label">Student ID</label>
                <div style={{ position: 'relative' }}>
                  <BadgeCheck size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. STU000123"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Registered Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Email used for your enquiry"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !accountId || !email}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {loading ? 'Signing in...' : 'Sign in as Student'}
                <ArrowRight size={18} />
              </button>
            </form>
          ) : !otpSent ? (
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
