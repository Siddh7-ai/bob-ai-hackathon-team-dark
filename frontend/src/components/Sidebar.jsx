import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { 
  Activity, 
  Wrench, 
  Zap, 
  ShieldCheck, 
  FileText, 
  BarChart2, 
  RefreshCw, 
  Sun, 
  Moon,
  ChevronRight
} from './Icons';

export default function Sidebar({
  activeTab,
  setActiveTab,
  unreadLogCount = 0,
  onOpenEvaluation,
  onRegenerate,
  isRegenerating,
  kpis,
  theme,
  onToggleTheme
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSimulateConfirm, setShowSimulateConfirm] = useState(false);

  const navItems = [
    {
      id: 'fleet',
      label: 'Fleet Overview',
      icon: Activity,
      count: kpis?.total_assets,
      color: 'var(--accent-iaf)'
    },
    {
      id: 'maintenance',
      label: 'Maintenance Queue',
      icon: Wrench,
      count: kpis?.critical_maintenance_actions,
      alert: true,
      color: 'var(--status-not-ready-text)'
    },
    {
      id: 'sortie',
      label: 'Mission Simulator',
      icon: Zap,
      tag: 'SIM',
      color: 'var(--status-ready-dot)'
    },
    {
      id: 'matrix',
      label: 'Squadron Matrix',
      icon: ShieldCheck,
      color: 'var(--status-ready-text)'
    },
    {
      id: 'log',
      label: 'Activity Log',
      icon: FileText,
      unread: unreadLogCount,
      color: 'var(--text-secondary)'
    }
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: isHovered ? '275px' : '68px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-default)',
        zIndex: 1000,
        transition: 'width 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.22s ease',
        willChange: 'width',
        transform: 'translateZ(0)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: isHovered ? 'var(--shadow-hover)' : 'var(--shadow-sm)',
        overflowX: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Top Section: Branding & Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Brand Header */}
        <div style={{
          height: '68px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          padding: isHovered ? '0 18px' : '0 15px',
          borderBottom: '1px solid var(--border-default)',
          gap: '12px',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          <img
            src="/IAF_logo.png"
            alt="IAF Crest"
            style={{
              height: '36px',
              width: '36px',
              objectFit: 'contain',
              flexShrink: 0,
              filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.25))'
            }}
          />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            opacity: isHovered ? 1 : 0,
            visibility: isHovered ? 'visible' : 'hidden',
            transition: 'opacity 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0.18s linear',
            pointerEvents: isHovered ? 'auto' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                APEX HUMS
              </span>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '3px',
                backgroundColor: 'var(--accent-iaf-subtle)',
                color: 'var(--accent-iaf)',
                border: '1px solid var(--accent-iaf)'
              }}>
                IAF
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Mission Readiness System
            </span>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav style={{ padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const IconComponent = item.icon;
            const hasUnreadLogs = item.id === 'log' && item.unread > 0;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!isHovered ? item.label : ''}
                style={{
                  height: '46px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: isHovered ? '0 12px' : '0 14px',
                  borderRadius: '8px',
                  border: isActive 
                    ? '1px solid var(--accent-iaf)' 
                    : (hasUnreadLogs ? '1px solid rgba(255, 183, 3, 0.6)' : '1px solid transparent'),
                  backgroundColor: isActive 
                    ? 'var(--accent-iaf-subtle)' 
                    : (hasUnreadLogs ? 'rgba(255, 183, 3, 0.08)' : 'transparent'),
                  color: isActive ? 'var(--text-primary)' : (hasUnreadLogs ? '#FFB703' : 'var(--text-secondary)'),
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  overflow: 'visible',
                  whiteSpace: 'nowrap',
                  boxShadow: hasUnreadLogs ? '0 0 12px rgba(255, 183, 3, 0.25)' : 'none'
                }}
              >
                {/* Icon Container with Pulsing Animated Yellow Beacon Dot */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  flexShrink: 0,
                  color: isActive ? 'var(--accent-iaf)' : (hasUnreadLogs ? '#FFB703' : 'currentColor'),
                  position: 'relative'
                }}>
                  <IconComponent 
                    size={19} 
                    style={hasUnreadLogs ? { animation: 'iconGlowPulse 1.5s ease-in-out 4 forwards', color: '#FFB703' } : {}}
                  />

                  {/* Pulsing Animated Yellow Beacon Dot on Icon (Runs 4 times = ~6s when new log arrives, then rests as solid dot) */}
                  {hasUnreadLogs && (
                    <span key={`dot-${item.unread}`} style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '12px',
                      height: '12px',
                      pointerEvents: 'none',
                      zIndex: 20
                    }}>
                      {/* Radar Ping Wave (4 cycles, then rests) */}
                      <span style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        backgroundColor: '#FFB703',
                        animation: 'yellowPing 1.5s cubic-bezier(0, 0, 0.2, 1) 4 forwards'
                      }} />
                      {/* Glowing Solid Core (4 cycles, then rests) */}
                      <span style={{
                        position: 'relative',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#FFB703',
                        border: '1.5px solid var(--bg-surface)',
                        animation: 'yellowDotPulse 1.5s ease-in-out 4 forwards',
                        boxShadow: '0 0 10px #FFB703, 0 0 18px rgba(255, 183, 3, 0.9)'
                      }} />
                    </span>
                  )}
                </div>

                {/* Collapsed Badge Dot Indicator (For non-log alert items e.g. Wrench alert) */}
                {!hasUnreadLogs && item.alert && (
                  <span style={{
                    position: 'absolute',
                    top: '10px',
                    right: '12px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--status-not-ready-dot)',
                    opacity: !isHovered ? 1 : 0,
                    transition: 'opacity 0.15s ease',
                    pointerEvents: 'none'
                  }} />
                )}

                {/* Expanded Label & Badges */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginLeft: '12px',
                  opacity: isHovered ? 1 : 0,
                  visibility: isHovered ? 'visible' : 'hidden',
                  transition: 'opacity 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0.18s linear',
                  pointerEvents: isHovered ? 'auto' : 'none'
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: (isActive || hasUnreadLogs) ? 700 : 500,
                    color: isActive ? 'var(--text-primary)' : (hasUnreadLogs ? '#FFB703' : 'var(--text-secondary)')
                  }}>
                    {item.label}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.unread > 0 && (
                      <span key={`badge-${item.unread}`} className="mono-num" style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: '#FFB703',
                        color: '#000000',
                        border: '1px solid #FFB703',
                        boxShadow: '0 0 10px rgba(255, 183, 3, 0.6)',
                        animation: 'yellowDotPulse 1.5s ease-in-out 4 forwards'
                      }}>
                        {item.unread} NEW
                      </span>
                    )}

                    {item.tag && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--status-ready-bg)',
                        color: 'var(--status-ready-text)',
                        border: '1px solid var(--status-ready-border)'
                      }}>
                        {item.tag}
                      </span>
                    )}

                    {item.count !== undefined && (
                      <span className="mono-num" style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: item.alert ? 'var(--status-not-ready-bg)' : 'var(--bg-subtle)',
                        color: item.alert ? 'var(--status-not-ready-text)' : 'var(--text-muted)',
                        fontWeight: 600
                      }}>
                        {item.count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Command Actions */}
      <div style={{
        padding: '12px 10px 20px 10px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {/* Model Validation Button */}
        <button
          onClick={onOpenEvaluation}
          title={!isHovered ? 'Model Validation Metrics' : ''}
          style={{
            height: '42px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: isHovered ? '0 12px' : '0 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          <div style={{ width: '20px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            <BarChart2 size={18} color="var(--accent-iaf)" />
          </div>
          <span style={{
            marginLeft: '12px',
            fontSize: '12px',
            opacity: isHovered ? 1 : 0,
            visibility: isHovered ? 'visible' : 'hidden',
            transition: 'opacity 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0.18s linear',
            pointerEvents: isHovered ? 'auto' : 'none'
          }}>
            Model Validation
          </span>
        </button>

        {/* Regenerate Telemetry Button */}
        <button
          onClick={() => setShowSimulateConfirm(true)}
          disabled={isRegenerating}
          title={!isHovered ? 'Simulate Live Telemetry Stream' : ''}
          style={{
            height: '42px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: isHovered ? '0 12px' : '0 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          <div style={{ width: '20px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            <RefreshCw size={17} className={isRegenerating ? 'spin' : ''} color="var(--accent-iaf)" />
          </div>
          <span style={{
            marginLeft: '12px',
            fontSize: '12px',
            opacity: isHovered ? 1 : 0,
            visibility: isHovered ? 'visible' : 'hidden',
            transition: 'opacity 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0.18s linear',
            pointerEvents: isHovered ? 'auto' : 'none'
          }}>
            {isRegenerating ? 'Simulating Stream...' : 'Simulate Telemetry'}
          </span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={!isHovered ? `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode` : ''}
          style={{
            height: '42px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: isHovered ? '0 12px' : '0 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          <div style={{ width: '20px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            {theme === 'dark' ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#6366F1" />}
          </div>
          <span style={{
            marginLeft: '12px',
            fontSize: '12px',
            opacity: isHovered ? 1 : 0,
            visibility: isHovered ? 'visible' : 'hidden',
            transition: 'opacity 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0.18s linear',
            pointerEvents: isHovered ? 'auto' : 'none'
          }}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>

      {/* Confirmation Modal for Simulate Telemetry */}
      <ConfirmationModal
        isOpen={showSimulateConfirm}
        onClose={() => setShowSimulateConfirm(false)}
        onConfirm={() => {
          setShowSimulateConfirm(false);
          if (onRegenerate) onRegenerate();
        }}
        title="Confirm Fleet Telemetry Simulation"
        subtitle="Multi-Sensor Ingestion Stream & ML Recalibration"
        iconType="refresh"
        badgeText="TELEMETRY INGESTION"
        badgeType="accent"
        summaryItems={[
          { label: 'Fleet Coverage', value: `${kpis?.total_assets || 40} Platforms`, highlight: true },
          { label: 'Air & Ground Squadrons', value: '8 Formations' },
          { label: 'Active Sensor Envelopes', value: '6 Telemetry Channels' },
          { label: 'ML Prediction Models', value: 'RUL + Risk Regressor' }
        ]}
        impactItems={[
          'Simulates a newly broadcast operational cycle of sensor telemetry (harmonic vibration, EGT exhaust gas temp, hydraulic pressure, fuel flow, oil debris, turbine RPM) across all 40 military platforms.',
          'Processes readings through the HUMS ingestion engine to detect envelope breaches, moving-average drift, and wear progression.',
          'Executes the ML regression and classification pipeline to recalibrate Remaining Useful Life (RUL) cycle estimates and failure probabilities.'
        ]}
        reflectionItems={[
          'All 40 asset detail dashboards will display updated live sensor waveform curves and current health indices.',
          'System-wide readiness KPIs (Operational Availability %, Ready / At-Risk / Not-Ready counts) will re-synchronize in real-time.',
          'The Prioritised Maintenance Action Queue will re-rank work orders based on the fresh telemetry risk scores.',
          'The Combat Sortie Tactical Simulator will re-evaluate platform envelopes against mission profiles.'
        ]}
        confirmText="Confirm & Stream Telemetry"
        confirmColor="var(--accent-iaf)"
        cancelText="Cancel"
        isLoading={isRegenerating}
      />
    </aside>
  );
}
