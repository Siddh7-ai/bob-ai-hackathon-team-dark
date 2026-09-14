import React from 'react';
import { Shield, RefreshCw, BarChart2, Sun, Moon } from './Icons';

export default function Header({ 
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
  return (
    <header style={{
      borderBottom: '1px solid var(--border-default)',
      backgroundColor: 'var(--bg-surface)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 32px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        overflowX: 'auto'
      }}>
        {/* Left: Branding & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <img 
            src="/IAF_logo.png" 
            alt="Indian Air Force Logo" 
            style={{
              height: '38px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2))'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                APEX HUMS
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)'
              }}>
                IAF Operational Spec
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
              Health & Usage Monitoring System • NASA CMAPSS Analog
            </p>
          </div>
        </div>

        {/* Center: View Navigation */}
        <nav style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: 'var(--bg-subtle)',
          padding: '3px',
          borderRadius: '7px',
          border: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}>
          {[
            { id: 'fleet', label: 'Fleet Telemetry', count: kpis?.total_assets },
            { id: 'maintenance', label: 'Prioritised Maintenance', count: kpis?.critical_maintenance_actions, alert: true },
            { id: 'matrix', label: 'Squadron Readiness' },
            { id: 'log', label: 'Activity Audit Log', unread: unreadLogCount }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                  padding: '6px 14px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <span>{tab.label}</span>

                {/* Unread Dispatch Notification Badge */}
                {tab.unread > 0 && (
                  <span className="mono-num" style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--status-not-ready-bg)',
                    color: 'var(--status-not-ready-text)',
                    border: '1px solid var(--status-not-ready-border)',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
                  }}>
                    {tab.unread} NEW
                  </span>
                )}

                {tab.count !== undefined && (
                  <span className="mono-num" style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: tab.alert ? 'var(--status-not-ready-bg)' : 'var(--bg-subtle)',
                    color: tab.alert ? 'var(--status-not-ready-text)' : 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Theme Toggle & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="btn-secondary"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{ padding: '7px 10px', borderRadius: '6px' }}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            className="btn-secondary"
            onClick={onOpenEvaluation}
            title="Inspect Model Validation Report & Held-Out Test Metrics"
          >
            <BarChart2 size={15} />
            <span>Model Validation</span>
          </button>

          <button
            className="btn-primary"
            onClick={onRegenerate}
            disabled={isRegenerating}
            title="Simulate New Run-to-Failure Fleet Cycles"
          >
            <RefreshCw size={15} className={isRegenerating ? 'animate-spin' : ''} />
            <span>{isRegenerating ? 'Simulating...' : 'Simulate Telemetry'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
