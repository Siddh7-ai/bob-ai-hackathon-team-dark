import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Activity, Zap, Wrench, FileText, Shield } from './Icons';

export default function Header({ activeTab, kpis }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const titles = {
    fleet: { title: 'Fleet Telemetry & Health Monitoring', sub: 'Real-time multi-sensor telemetry & RUL predictions across air assets' },
    maintenance: { title: 'Prioritised Maintenance Action Queue', sub: 'Weighted ML ranking based on health score, risk, and remaining cycles' },
    sortie: { title: 'Combat Sortie "What-If" Tactical Planner', sub: 'Simulate mission duration stress and harsh environments across squadrons' },
    matrix: { title: 'Squadron Readiness & Base Matrix', sub: 'Unit-by-unit platform operational availability & depot status' },
    log: { title: 'Activity Audit Trail & Work Orders', sub: 'Unified log of real-time dispatched work orders & historical service records' }
  };

  const current = titles[activeTab] || titles.fleet;

  return (
    <header style={{
      height: '68px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid var(--border-default)',
      backgroundColor: 'var(--bg-surface)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 32px 0 84px',
      transition: 'padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        width: '100%',
        flexWrap: 'nowrap'
      }}>
        {/* Active Section Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              {current.title}
            </h1>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--status-ready-bg)',
              color: 'var(--status-ready-text)',
              border: '1px solid var(--status-ready-border)'
            }}>
              IAF OPERATIONAL SPEC
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
            {current.sub}
          </p>
        </div>

        {/* System Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Operational Availability Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-subtle)',
            padding: '5px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-default)'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-ready-dot)',
              boxShadow: '0 0 8px var(--status-ready-dot)'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
              SYSTEM READY ({kpis?.ready_count || 0}/{kpis?.total_assets || 40} SORTIE CLEARED)
            </span>
          </div>

          {/* Real-time Base Clock */}
          <div className="mono-num" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--accent-iaf)',
            backgroundColor: 'var(--accent-iaf-subtle)',
            padding: '5px 12px',
            borderRadius: '6px',
            border: '1px solid var(--accent-iaf)'
          }}>
            <Clock size={14} />
            <span>{timeStr}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
