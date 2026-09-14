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
      <div className="clean-panel" style={{ padding: '48px', textAlign: 'center' }}>
        <CheckCircle2 size={36} color="var(--status-ready-dot)" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>All Platforms Within Safe Operating Envelopes</p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          No At-Risk or Not-Ready assets currently requiring unscheduled depot maintenance.
        </p>
      </div>
    );
  }

  return (
    <div className="clean-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
            Deliverable 4: Prioritised Maintenance Action Schedule
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Ranked by Multi-Factor Formula: <code className="mono-num" style={{ color: 'var(--accent-iaf)', backgroundColor: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>Priority Score = Risk Level × Mission Criticality × (1 / TTF)</code>
          </p>
        </div>

        <div className="mono-num" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {plan.length} Interventions Queued
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
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
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: isImmediate ? 'var(--status-not-ready-bg)' : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {/* Rank & Score */}
                  <td style={{ padding: '16px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono-num" style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: isImmediate ? 'var(--status-not-ready-bg)' : (isHigh ? 'var(--status-at-risk-bg)' : 'var(--bg-subtle)'),
                        color: isImmediate ? 'var(--status-not-ready-text)' : (isHigh ? 'var(--status-at-risk-text)' : 'var(--text-primary)'),
                        border: isImmediate ? '1px solid var(--status-not-ready-border)' : (isHigh ? '1px solid var(--status-at-risk-border)' : '1px solid var(--border-default)')
                      }}>
                        #{item.priority_rank}
                      </span>
                      <span className="mono-num" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
                      <span className="mono-num" style={{ fontWeight: 700, color: 'var(--accent-iaf)' }}>
                        {item.asset_id}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {item.asset_type}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          {part}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Time to Failure */}
                  <td style={{ padding: '16px 14px' }}>
                    <div className="mono-num" style={{ fontWeight: 700, color: isImmediate ? 'var(--status-not-ready-text)' : 'var(--text-primary)' }}>
                      {Math.round(item.predicted_rul_cycles)} cycles
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ~{Math.round(item.estimated_days_to_failure)} calendar days
                    </div>
                    <div style={{ fontSize: '11px', color: item.failure_probability_14d >= 0.5 ? 'var(--status-not-ready-text)' : 'var(--status-at-risk-text)', marginTop: '2px' }}>
                      {Math.round(item.failure_probability_14d * 100)}% 14d fail risk
                    </div>
                  </td>

                  {/* Urgency */}
                  <td style={{ padding: '16px 14px' }}>
                    <span className="mono-num" style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontWeight: 700,
                      backgroundColor: isImmediate ? 'var(--status-not-ready-bg)' : (isHigh ? 'var(--status-at-risk-bg)' : 'var(--status-ready-bg)'),
                      color: isImmediate ? 'var(--status-not-ready-text)' : (isHigh ? 'var(--status-at-risk-text)' : 'var(--status-ready-text)'),
                      border: isImmediate ? '1px solid var(--status-not-ready-border)' : (isHigh ? '1px solid var(--status-at-risk-border)' : '1px solid var(--status-ready-border)')
                    }}>
                      {item.urgency}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {item.target_timeline}
                    </div>
                  </td>

                  {/* Action */}
                  <td style={{ padding: '16px 14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.action_recommendation}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Est. Labor: <strong style={{ color: 'var(--text-secondary)' }}>{item.estimated_labor_hours} hours</strong>
                    </div>
                  </td>

                  {/* Action Button */}
                  <td style={{ padding: '16px 14px', textAlign: 'right' }}>
                    {isDispatched ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--status-ready-text)', fontSize: '12px', fontWeight: 600 }}>
                        <CheckCheck size={16} />
                        <span>Dispatched {dispatchedOrders[item.asset_id].time}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDispatch(item.asset_id)}
                        className={isImmediate ? 'btn-primary' : 'btn-secondary'}
                        style={{
                          fontSize: '12px',
                          padding: '6px 12px'
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
