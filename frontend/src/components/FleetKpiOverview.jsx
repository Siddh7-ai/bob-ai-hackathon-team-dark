import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Wrench, ShieldAlert } from './Icons';

export default function FleetKpiOverview({ kpis }) {
  if (!kpis) return null;

  const readinessPct = kpis.fleet_readiness_pct || 0;
  const readyCount = kpis.ready_count || 0;
  const atRiskCount = kpis.at_risk_count || 0;
  const notReadyCount = kpis.not_ready_count || 0;
  const totalAssets = kpis.total_assets || 0;
  const maintenanceCount = kpis.critical_maintenance_actions || 0;
  const avgHealth = kpis.average_health_score || 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* KPI 1: Readiness Rate */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fleet Mission Readiness
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <span className="mono-text" style={{ fontSize: '36px', fontWeight: 800, color: readinessPct >= 70 ? 'var(--status-ready)' : 'var(--status-at-risk)' }}>
                {readinessPct}%
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {readyCount}/{totalAssets} Sortie-Ready
              </span>
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle2 size={22} color="var(--status-ready)" />
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '3px',
          marginTop: '16px',
          overflow: 'hidden',
          display: 'flex'
        }}>
          <div style={{ width: `${(readyCount / totalAssets) * 100}%`, background: 'var(--status-ready)' }} />
          <div style={{ width: `${(atRiskCount / totalAssets) * 100}%`, background: 'var(--status-at-risk)' }} />
          <div style={{ width: `${(notReadyCount / totalAssets) * 100}%`, background: 'var(--status-not-ready)' }} />
        </div>
      </div>

      {/* KPI 2: Status Breakdown */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Asset Degradation Tiers
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginTop: '12px'
        }}>
          <div style={{
            background: 'var(--status-ready-bg)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div className="mono-text" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-ready)' }}>
              {readyCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--status-ready)', marginTop: '2px' }}>Ready</div>
          </div>

          <div style={{
            background: 'var(--status-at-risk-bg)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div className="mono-text" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-at-risk)' }}>
              {atRiskCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--status-at-risk)', marginTop: '2px' }}>At-Risk</div>
          </div>

          <div style={{
            background: 'var(--status-not-ready-bg)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div className="mono-text" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-not-ready)' }}>
              {notReadyCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--status-not-ready)', marginTop: '2px' }}>Not-Ready</div>
          </div>
        </div>
      </div>

      {/* KPI 3: Fleet Health Index */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fleet Mean Health Index
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <span className="mono-text" style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {avgHealth}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>/ 100 Index</span>
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(6, 182, 212, 0.3)'
          }}>
            <ShieldAlert size={22} color="var(--accent-cyan)" />
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
          Evaluated against MIL-STD safe vibration, thermal, and oil particle envelopes
        </p>
      </div>

      {/* KPI 4: Pending Interventions */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Prioritised Actions Queue
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <span className="mono-text" style={{ fontSize: '36px', fontWeight: 800, color: notReadyCount > 0 ? 'var(--status-not-ready)' : 'var(--text-primary)' }}>
                {maintenanceCount}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Work Orders Pending
              </span>
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(244, 63, 94, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(244, 63, 94, 0.3)'
          }}>
            <Wrench size={22} color="var(--status-not-ready)" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
          <span className="badge-not-ready mono-text" style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
            {notReadyCount} Grounded
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Requires depot-level intervention
          </span>
        </div>
      </div>
    </div>
  );
}
