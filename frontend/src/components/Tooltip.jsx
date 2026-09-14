import React, { useState } from 'react';

export default function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          style={{
            position: 'absolute',
            bottom: '125%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--bg-tooltip, #18181B)',
            color: 'var(--text-tooltip, #FAFAFA)',
            fontSize: '11px',
            lineHeight: '1.4',
            padding: '6px 10px',
            borderRadius: '6px',
            whiteSpace: 'normal',
            width: 'max-content',
            maxWidth: '240px',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-subtle, #3F3F46)',
            pointerEvents: 'none',
            textAlign: 'center'
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export function InfoIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, cursor: 'help' }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
