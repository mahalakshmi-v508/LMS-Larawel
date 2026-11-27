// src/components/CertificatePreview.tsx
// Renders a certificate as HTML that keeps the exact A4-landscape look of the
// generated PDF (navy / teal / pink template), scaled to whatever width it is
// given (no scrolling needed).
import React from 'react';

export interface CertificatePreviewData {
  certificate_number: string;
  recipient_name?: string;
  course_title?: string;
  batch_label?: string;
  issued_at?: string;
  student_name?: string;
  course_name?: string;
  batch_code?: string;
}

interface CertificatePreviewProps {
  certificate: CertificatePreviewData;
}

const NAVY = '#241D5E';
const TEAL = '#7FCCDE';
const PINK = '#E5206B';
const PANEL = '#F7F7F4';

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({ certificate }) => {
  const name = certificate.recipient_name || certificate.student_name || '';
  const course = certificate.course_title || certificate.course_name || '';
  const batch = certificate.batch_label || certificate.batch_code || '';
  const issued = certificate.issued_at ? new Date(certificate.issued_at) : null;
  const issuedText = issued && !Number.isNaN(issued.getTime())
    ? issued.toLocaleDateString('en-GB')
    : '';

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '1.414 / 1',
        containerType: 'inline-size',
        position: 'relative',
        overflow: 'hidden',
        background: NAVY,
        borderRadius: '6px',
        boxShadow: '0 18px 40px rgba(36, 29, 94, 0.35)',
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        color: '#1B1738',
      } as React.CSSProperties}
    >
      {/* ---- Left colour column ---- */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: '11.8%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '15.5%', background: PINK, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '26%', top: '24%', width: '48%', height: '48%', borderRadius: '50%', border: '0.75cqw solid #FFFFFF', opacity: 0.95 }} />
        </div>
        <div style={{ height: '22%', background: TEAL, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '14%', top: '12%', width: '72%', height: '72%', borderRadius: '50%', border: '1.05cqw solid ' + NAVY }} />
          <div style={{ position: 'absolute', left: '42%', top: '12%', width: '18%', height: '72%', background: NAVY }} />
        </div>
        <div style={{ height: '9%', background: NAVY, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '38%', width: '100%', height: '4.4%', background: PINK }} />
        </div>
        <div style={{ flex: 1, background: NAVY, position: 'relative', overflow: 'hidden' }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${-30 + i * 9}%`,
                bottom: '-45%',
                width: '160%',
                height: '160%',
                borderRadius: '50%',
                border: '0.09cqw solid rgba(255,255,255,0.14)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Top decorative circles */}
      <div style={{ position: 'absolute', left: '2.2%', top: '-1%', width: '7.4%', aspectRatio: '1', borderRadius: '50%', background: TEAL }} />
      <div style={{ position: 'absolute', left: '7.6%', top: '1.4%', width: '9.4%', aspectRatio: '1', borderRadius: '50%', background: PINK }} />
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${13.1 + i * 1.35}%`,
            top: 0,
            width: '0.72%',
            height: '8.2%',
            background: PINK,
          }}
        />
      ))}
      <div style={{ position: 'absolute', left: '19.2%', top: '-2.4%', width: '7.2%', aspectRatio: '1', borderRadius: '50%', background: TEAL }} />

      {/* ---- Ivory content panel (asymmetric rounded corners) ---- */}
      <div
        style={{
          position: 'absolute',
          left: '11.8%',
          top: '13.5%',
          right: '1.6%',
          bottom: '-2%',
          background: PANEL,
          borderTopLeftRadius: '9.2cqw',
          borderBottomRightRadius: '11cqw',
          boxShadow: 'inset 0 0 0 0.12cqw rgba(36, 29, 94, 0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '4.6% 5.2%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7cqw', marginTop: '0.4cqw' }}>
            <div
              style={{
                width: '2.5cqw',
                height: '2.5cqw',
                borderRadius: '0.6cqw',
                background: NAVY,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: TEAL,
                fontSize: '1.35cqw',
                fontWeight: 800,
              }}
            >
              L
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.45cqw', fontWeight: 800, letterSpacing: '0.34cqw', color: NAVY, lineHeight: 1.1 }}>
                CUSTOM LMS
              </div>
              <div style={{ fontSize: '0.78cqw', letterSpacing: '0.24cqw', color: '#7A7A8C', fontWeight: 600 }}>
                LEARN • PRACTICE • GROW
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.2cqw', fontSize: '1.12cqw', letterSpacing: '0.52cqw', color: PINK, fontWeight: 700 }}>
            CERTIFICATE OF COMPLETION
          </div>

          <div style={{ marginTop: '2.6cqw', fontSize: '1.62cqw', color: '#5B5870' }}>
            This certificate is proudly presented to
          </div>

          <div
            style={{
              marginTop: '1cqw',
              fontSize: '4.4cqw',
              fontWeight: 800,
              color: NAVY,
              lineHeight: 1.06,
              maxWidth: '90%',
              overflowWrap: 'anywhere',
              letterSpacing: '-0.02cqw',
            }}
          >
            {name}
          </div>

          <div style={{ marginTop: '1.6cqw', display: 'flex', alignItems: 'center', gap: '0.8cqw', width: '62%' }}>
            <div style={{ flex: 1, height: '0.11cqw', background: 'rgba(36, 29, 94, 0.18)' }} />
            <div style={{ width: '0.55cqw', height: '0.55cqw', borderRadius: '50%', background: PINK }} />
            <div style={{ flex: 1, height: '0.11cqw', background: 'rgba(36, 29, 94, 0.18)' }} />
          </div>

          <div style={{ marginTop: '1.9cqw', fontSize: '1.6cqw', color: '#5B5870' }}>
            for successfully completing
          </div>

          <div
            style={{
              marginTop: '0.8cqw',
              fontSize: '2.9cqw',
              fontWeight: 800,
              color: '#B0154F',
              maxWidth: '92%',
              overflowWrap: 'anywhere',
            }}
          >
            {course}
          </div>

          <div style={{ marginTop: '1.15cqw', fontSize: '1.34cqw', color: '#5B5870' }}>
            Batch: <strong style={{ color: NAVY }}>{batch}</strong>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 'auto',
              width: '100%',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '2cqw',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.2cqw', color: '#5B5870' }}>
                Issued on <strong style={{ color: NAVY }}>{issuedText}</strong>
              </div>
              <div style={{ fontSize: '1.05cqw', color: '#8A8797', marginTop: '0.25cqw' }}>
                Certificate No: {certificate.certificate_number}
              </div>
            </div>

            {/* Seal */}
            <div
              style={{
                width: '7.4cqw',
                height: '7.4cqw',
                borderRadius: '50%',
                border: '0.22cqw solid ' + PINK,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: NAVY,
                background: 'rgba(229, 32, 107, 0.06)',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: '0.95cqw', fontWeight: 800, letterSpacing: '0.12cqw' }}>CERTIFIED</div>
              <div style={{ fontSize: '0.72cqw', color: '#5B5870' }}>CUSTOM LMS</div>
            </div>

            {/* Signature */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.35cqw', fontWeight: 700, color: NAVY, fontStyle: 'italic' }}>
                Custom LMS
              </div>
              <div style={{ width: '13cqw', height: '0.12cqw', background: 'rgba(36, 29, 94, 0.3)', margin: '0.45cqw auto 0.35cqw' }} />
              <div style={{ fontSize: '1.02cqw', color: '#5B5870' }}>Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
