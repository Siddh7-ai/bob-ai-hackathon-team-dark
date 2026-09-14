import React from 'react';
import { Shield, Activity, RefreshCw, BarChart2 } from './Icons';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onOpenEvaluation, 
  onRegenerate, 
  isRegenerating,
  kpis 
}) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10, 16, 29, 0.92)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '16px 32px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Left: Branding & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
            border: '1px solid var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(6, 182, 212, 0.25)'
          }}>
            <Shield size={24} color="#06B6D4" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                APEX <span style={{ color: 'var(--accent-cyan)' }}>HUMS</span>
              </h1>
              <span className="mono-text" style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(6, 182, 212, 0.1)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.25)'
              }}>
                v1.0 MIL-SPEC
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <div className="radar-pulse" style={{ background: 'var(--status-ready)' }} />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                NASA CMAPSS Run-to-Failure Telemetry Pipeline • 40 Active Platforms
              </p>
            </div>
          </div>
        </div>

        {/* Center: View Navigation */}
        <nav style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '10px',
          padding: '4px',
          border: '1px solid var(--border-subtle)'
        }}>
          {[
            { id: 'fleet', label: 'Fleet Telemetry Grid', count: kpis?.total_assets },
            { id: 'maintenance', label: 'Prioritised Maintenance Queue', count: kpis?.critical_maintenance_actions, alert: true },
            { id: 'matrix', label: 'Squadron Readiness' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="mono-text" style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: tab.alert ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: tab.alert ? 'var(--status-not-ready)' : 'var(--text-primary)'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={onOpenEvaluation}
            title="Inspect Model Validation Report & Metrics"
          >
            <BarChart2 size={16} color="var(--accent-cyan)" />
            <span>Model Validation</span>
          </button>

          <button
            className="btn-action"
            onClick={onRegenerate}
            disabled={isRegenerating}
            title="Simulate New Run-to-Failure Fleet Cycles"
          >
            <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
            <span>{isRegenerating ? 'Simulating...' : 'Simulate Telemetry'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
