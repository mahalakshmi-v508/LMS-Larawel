// src/components/CertificatePreview.tsx
// Renders certificate details over the supplied A4-landscape frame.
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
      <img
        src="/PCS-Outer-Frame.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      <div
        style={{
          position: 'absolute',
          top: '17%',
          left: '14%',
          right: '10%',
          bottom: '13%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 1,
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
          left: '14%',
          right: '16%',
          bottom: '11%',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '4%',
          fontSize: '1.3cqw',
          color: '#334155',
          zIndex: 1,
        }}
      >
        <span>Issued: {issuedText}</span>
        <span style={{ textAlign: 'right' }}>Certificate No: {certificate.certificate_number}</span>
      </div>
    </div>
  );
};
