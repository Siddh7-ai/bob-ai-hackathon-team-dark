import React, { useState } from 'react';
import { CheckCheck, CheckCircle2, PackageCheck } from './Icons';

export default function MaintenancePlanTable({ plan, onSelectAsset }) {
  const [dispatchedOrders, setDispatchedOrders] = useState({});

  const handleDispatch = (assetId) => {
    setDispatchedOrders(prev => ({
      ...prev,
      [assetId]: {
        time: new Date().toLocaleTimeString(),
        status: 'DISPATCHED'
      }
    }));
  };

  if (!plan || plan.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
        <CheckCircle2 size={36} color="var(--status-ready)" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: '16px', fontWeight: 600 }}>All Platforms Within Safe Operating Envelopes</p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          No At-Risk or Not-Ready assets currently requiring unscheduled depot maintenance.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Deliverable 4: Prioritised Maintenance Action Schedule
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Ranked by Multi-Factor Formula: <code className="mono-text" style={{ color: 'var(--accent-cyan)' }}>Priority Score = Risk Level × Mission Criticality × (1 / TTF)</code>
          </p>
        </div>

        <div className="mono-text" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {plan.length} Interventions Queued
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 14px' }}>PRIORITY</th>
              <th style={{ padding: '12px 14px' }}>PLATFORM / UNIT</th>
              <th style={{ padding: '12px 14px' }}>FAILING COMPONENT</th>
              <th style={{ padding: '12px 14px' }}>TIME-TO-FAILURE</th>
              <th style={{ padding: '12px 14px' }}>URGENCY & TIMELINE</th>
              <th style={{ padding: '12px 14px' }}>RECOMMENDED ACTION</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>WORK ORDER</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((item) => {
              const isDispatched = !!dispatchedOrders[item.asset_id];
              const isImmediate = item.urgency === 'IMMEDIATE';
              const isHigh = item.urgency === 'HIGH';

              return (
                <tr
                  key={item.asset_id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: isImmediate ? 'rgba(244, 63, 94, 0.05)' : 'transparent',
                    transition: 'background 0.15s ease'
                  }}
                >
                  {/* Rank & Score */}
                  <td style={{ padding: '16px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono-text" style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: isImmediate ? 'rgba(244, 63, 94, 0.2)' : (isHigh ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)'),
                        color: isImmediate ? 'var(--status-not-ready)' : (isHigh ? 'var(--status-at-risk)' : 'var(--text-primary)')
                      }}>
                        #{item.priority_rank}
                      </span>
                      <span className="mono-text" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.priority_score.toFixed(2)} pts
                      </span>
                    </div>
                  </td>

                  {/* Asset ID & Unit */}
                  <td style={{ padding: '16px 14px' }}>
                    <div
                      onClick={() => onSelectAsset(item.asset_id)}
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                    >
                      <span className="mono-text" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {item.asset_id}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.asset_type}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {item.unit}
                      </div>
                    </div>
                  </td>

                  {/* Failing Component */}
                  <td style={{ padding: '16px 14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.predicted_failing_component}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {item.parts_required?.map((part, pidx) => (
                        <span key={pidx} style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-secondary)'
                        }}>
                          {part}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Time to Failure */}
                  <td style={{ padding: '16px 14px' }}>
                    <div className="mono-text" style={{ fontWeight: 700, color: isImmediate ? 'var(--status-not-ready)' : 'var(--accent-cyan)' }}>
                      {Math.round(item.predicted_rul_cycles)} cycles
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ~{Math.round(item.estimated_days_to_failure)} calendar days
                    </div>
                    <div style={{ fontSize: '11px', color: item.failure_probability_14d >= 0.5 ? 'var(--status-not-ready)' : 'var(--status-at-risk)', marginTop: '2px' }}>
                      {Math.round(item.failure_probability_14d * 100)}% 14d fail risk
                    </div>
                  </td>

                  {/* Urgency */}
                  <td style={{ padding: '16px 14px' }}>
                    <span className={`mono-text ${isImmediate ? 'badge-not-ready' : (isHigh ? 'badge-at-risk' : 'badge-ready')}`} style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      {item.urgency}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {item.target_timeline}
                    </div>
                  </td>

                  {/* Action */}
                  <td style={{ padding: '16px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#E2E8F0' }}>
                      {item.action_recommendation}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Est. Labor: <strong style={{ color: 'var(--text-secondary)' }}>{item.estimated_labor_hours} hours</strong>
                    </div>
                  </td>

                  {/* Action Button */}
                  <td style={{ padding: '16px 14px', textAlign: 'right' }}>
                    {isDispatched ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--status-ready)', fontSize: '12px', fontWeight: 600 }}>
                        <CheckCheck size={16} />
                        <span>Dispatched {dispatchedOrders[item.asset_id].time}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDispatch(item.asset_id)}
                        className={isImmediate ? 'btn-action' : 'btn-secondary'}
                        style={{
                          fontSize: '12px',
                          padding: '6px 12px',
                          background: isImmediate ? 'linear-gradient(135deg, #E11D48, #F43F5E)' : undefined
                        }}
                      >
                        <PackageCheck size={14} />
                        <span>Dispatch Order</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
