import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Wrench } from './Icons';
import Tooltip, { InfoIcon } from './Tooltip';

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
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* KPI 1: Readiness Rate */}
      <div className="clean-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Operational Availability
              </span>
              <Tooltip text="Percentage of fleet platforms currently operating within safe MIL-STD envelopes and cleared for flight.">
                <InfoIcon />
              </Tooltip>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span className="mono-num" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {readinessPct}%
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {readyCount}/{totalAssets} Sortie-Ready
              </span>
            </div>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: 'var(--status-ready-bg)',
            color: 'var(--status-ready-text)',
            border: '1px solid var(--status-ready-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Clean monochrome progress bar */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: '2px',
          marginTop: '14px',
          overflow: 'hidden',
          display: 'flex'
        }}>
          <div style={{ width: `${(readyCount / totalAssets) * 100}%`, backgroundColor: 'var(--status-ready-dot)' }} />
          <div style={{ width: `${(atRiskCount / totalAssets) * 100}%`, backgroundColor: 'var(--status-at-risk-dot)' }} />
          <div style={{ width: `${(notReadyCount / totalAssets) * 100}%`, backgroundColor: 'var(--status-not-ready-dot)' }} />
        </div>
      </div>

      {/* KPI 2: Status Breakdown */}
      <div className="clean-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Fleet Readiness Breakdown
          </span>
          <Tooltip text="Assets categorized by remaining operational life and sensor threshold breach status.">
            <InfoIcon />
          </Tooltip>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginTop: '10px'
        }}>
          <div style={{
            backgroundColor: 'var(--status-ready-bg)',
            border: '1px solid var(--status-ready-border)',
            borderRadius: '6px',
            padding: '8px',
            textAlign: 'center'
          }}>
            <div className="mono-num" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-ready-text)' }}>
              {readyCount}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--status-ready-text)', marginTop: '2px' }}>Ready</div>
          </div>

          <div style={{
            backgroundColor: 'var(--status-at-risk-bg)',
            border: '1px solid var(--status-at-risk-border)',
            borderRadius: '6px',
            padding: '8px',
            textAlign: 'center'
          }}>
            <div className="mono-num" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-at-risk-text)' }}>
              {atRiskCount}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--status-at-risk-text)', marginTop: '2px' }}>At-Risk</div>
          </div>

          <div style={{
            backgroundColor: 'var(--status-not-ready-bg)',
            border: '1px solid var(--status-not-ready-border)',
            borderRadius: '6px',
            padding: '8px',
            textAlign: 'center'
          }}>
            <div className="mono-num" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-not-ready-text)' }}>
              {notReadyCount}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--status-not-ready-text)', marginTop: '2px' }}>Not-Ready</div>
          </div>
        </div>
      </div>

      {/* KPI 3: Fleet Mean Health */}
      <div className="clean-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Mean Fleet Health
              </span>
              <Tooltip text="Average composite telemetry health score across all 40 active platforms (100 = nominal factory state).">
                <InfoIcon />
              </Tooltip>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
              <span className="mono-num" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {avgHealth}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ 100 Index</span>
            </div>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span className="mono-num" style={{ fontSize: '13px', fontWeight: 700 }}>IAF</span>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
          Aggregate multi-sensor health score
        </p>
      </div>

      {/* KPI 4: Pending Interventions */}
      <div className="clean-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Maintenance Queue
              </span>
              <Tooltip text="Platforms queued for inspection, depot-level repair, or component overhaul based on multi-factor risk priority.">
                <InfoIcon />
              </Tooltip>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span className="mono-num" style={{ fontSize: '32px', fontWeight: 700, color: notReadyCount > 0 ? 'var(--status-not-ready-text)' : 'var(--text-primary)' }}>
                {maintenanceCount}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Actions Pending
              </span>
            </div>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: 'var(--status-at-risk-bg)',
            color: 'var(--status-at-risk-text)',
            border: '1px solid var(--status-at-risk-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wrench size={18} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'var(--status-not-ready-bg)',
            color: 'var(--status-not-ready-text)',
            border: '1px solid var(--status-not-ready-border)'
          }}>
            {notReadyCount} Grounded
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Requires immediate repair
          </span>
        </div>
      </div>
    </div>
  );
}
