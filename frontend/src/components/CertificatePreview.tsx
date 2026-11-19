// src/components/CertificatePreview.tsx
// Renders a certificate as HTML that keeps the exact A4-landscape look of the
// generated PDF, scaled to whatever width it is given (no scrolling needed).
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
        background: '#ffffff',
        borderRadius: '4px',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        color: '#111827',
      } as React.CSSProperties}
    >
      {/* Indigo double border (same as the PDF) */}
      <div style={{ position: 'absolute', inset: '3.2%', border: '0.42cqw solid #4338ca' }} />
      <div style={{ position: 'absolute', inset: '4.6%', border: '0.14cqw solid #a5b4fc' }} />

      <div
        style={{
          position: 'absolute',
          inset: '6%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            marginTop: '2.6cqw',
            fontSize: '2.15cqw',
            fontWeight: 800,
            letterSpacing: '0.42cqw',
            color: '#4338ca',
            whiteSpace: 'nowrap',
          }}
        >
          CERTIFICATE OF COMPLETION
        </div>

        <div style={{ marginTop: '3.4cqw', fontSize: '1.7cqw', color: '#475569' }}>
          This certificate is proudly presented to
        </div>

        <div
          style={{
            marginTop: '1.2cqw',
            fontSize: '4.6cqw',
            fontWeight: 800,
            color: '#111827',
            lineHeight: 1.05,
            maxWidth: '92%',
            overflowWrap: 'anywhere',
          }}
        >
          {name}
        </div>

        <div style={{ marginTop: '1.5cqw', width: '46%', height: '0.13cqw', background: '#cbd5e1' }} />

        <div style={{ marginTop: '1.9cqw', fontSize: '1.7cqw', color: '#475569' }}>
          for successfully completing
        </div>

        <div
          style={{
            marginTop: '0.9cqw',
            fontSize: '3.05cqw',
            fontWeight: 800,
            color: '#312e81',
            maxWidth: '92%',
            overflowWrap: 'anywhere',
          }}
        >
          {course}
        </div>

        <div style={{ marginTop: '1.1cqw', fontSize: '1.4cqw', color: '#475569' }}>
          Batch: {batch}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '7.5%',
          right: '7.5%',
          bottom: '6.5%',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '4%',
          fontSize: '1.3cqw',
          color: '#334155',
        }}
      >
        <span>Issued: {issuedText}</span>
        <span style={{ textAlign: 'right' }}>Certificate No: {certificate.certificate_number}</span>
      </div>
    </div>
  );
};
