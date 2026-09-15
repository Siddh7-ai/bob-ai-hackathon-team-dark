import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Wrench, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  FileText 
} from './Icons';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Command Action',
  subtitle = 'Mission Tactical Execution',
  iconType = 'zap', // 'zap' | 'refresh' | 'wrench' | 'alert' | 'check' | 'clock'
  badgeText = 'OPERATIONAL CONFIRMATION',
  badgeType = 'accent', // 'accent' | 'warning' | 'danger' | 'success'
  summaryItems = [],
  impactItems = [],
  reflectionItems = [],
  confirmText = 'Confirm & Proceed',
  cancelText = 'Cancel / Abort',
  confirmColor = 'linear-gradient(135deg, #1B3F8B 0%, #1E3A8A 100%)',
  isLoading = false,
  dangerMode = false
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'danger':
        return {
          backgroundColor: 'var(--status-not-ready-bg, #FEF2F2)',
          color: 'var(--status-not-ready-text, #991B1B)',
          border: '1px solid var(--status-not-ready-border, #FCA5A5)'
        };
      case 'warning':
        return {
          backgroundColor: 'var(--status-at-risk-bg, #FFFBEB)',
          color: 'var(--status-at-risk-text, #92400E)',
          border: '1px solid var(--status-at-risk-border, #FDE68A)'
        };
      case 'success':
        return {
          backgroundColor: 'var(--status-ready-bg, #F0FDF4)',
          color: 'var(--status-ready-text, #166534)',
          border: '1px solid var(--status-ready-border, #86EFAC)'
        };
      case 'accent':
      default:
        return {
          backgroundColor: 'var(--accent-iaf-subtle, #EFF6FF)',
          color: 'var(--accent-iaf, #1E3A8A)',
          border: '1px solid var(--accent-iaf, #1E3A8A)'
        };
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 5, 15, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        className="clean-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px var(--border-subtle)',
          border: dangerMode ? '1px solid var(--status-not-ready-border)' : '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-surface)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tactical IAF Military Header Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
          padding: '18px 24px',
          color: '#FFFFFF',
          borderBottom: '2px solid #EAB308',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src="/IAF_logo.png" 
              alt="IAF Crest" 
              style={{ height: '36px', width: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))', flexShrink: 0 }} 
            />
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#EAB308' }}>
                INDIAN AIR FORCE • DISPATCH PROTOCOL
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0 0', letterSpacing: '-0.01em' }}>
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease'
            }}
            title="Close dialog (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body with Custom Scroll */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Subtitle / Lead Paragraph */}
          {subtitle && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              {subtitle}
            </p>
          )}

          {/* Inner Content Card Box */}
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Top row with Main Entity Label + Urgency Badge */}
            {summaryItems.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                <span className="mono-num" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-iaf)' }}>
                  {summaryItems[0]?.value} {summaryItems[1]?.value ? `• ${summaryItems[1].value}` : ''}
                </span>
                {badgeText && (
                  <span className="mono-num" style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    ...getBadgeStyle()
                  }}>
                    {badgeText}
                  </span>
                )}
              </div>
            )}

            {/* Key Parameters */}
            {summaryItems.length > 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {summaryItems.slice(2).map((item, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.label}:</strong>{' '}
                    <span style={{ color: item.color || 'inherit' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Impact points */}
            {impactItems.length > 0 && summaryItems.length <= 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {impactItems.map((text, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                    • {text}
                  </div>
                ))}
              </div>
            )}

            {/* Yellow Warning Box */}
            <div style={{
              fontSize: '11px',
              color: 'var(--status-at-risk-text, #854D0E)',
              backgroundColor: 'var(--status-at-risk-bg, #FEF9C3)',
              padding: '10px 14px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid var(--status-at-risk-border, #FDE047)',
              marginTop: '4px'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>
                {reflectionItems[0] || 'Inventory parts will be reserved & flight status will be set to GROUNDED FOR MAINTENANCE.'}
              </span>
            </div>
          </div>

          {/* Additional reflection items */}
          {reflectionItems.length > 1 && (
            <div style={{
              backgroundColor: 'var(--status-ready-bg)',
              border: '1px solid var(--status-ready-border)',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {reflectionItems.slice(1).map((text, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  <CheckCircle2 size={13} color="var(--status-ready-dot)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '9px 18px',
              borderRadius: '6px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '9px 22px',
              borderRadius: '6px',
              border: 'none',
              background: 'linear-gradient(135deg, #1B3F8B 0%, #1E3A8A 100%)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(27, 63, 139, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            {isLoading ? <RefreshCw size={14} className="spin" /> : <ShieldCheck size={16} />}
            <span>{isLoading ? 'Executing Operation...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
