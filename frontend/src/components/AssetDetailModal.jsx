import React, { useState, useEffect } from 'react';
import { X, FileText, Cpu } from './Icons';
import AssetIcon from './AssetIcon';
import SensorTelemetryCharts from './SensorTelemetryCharts';
import { getAssetRealImage } from '../utils/assetImages';
import FighterJetLoader from './FighterJetLoader';

export default function AssetDetailModal({ assetId, onClose }) {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (assetId) {
      document.body.style.overflow = 'hidden';
      setLoading(true);
      
      Promise.all([
        fetch(`/api/assets/${assetId}`).then(res => res.ok ? res.json() : null),
        fetch('/api/work-orders').then(res => res.ok ? res.json() : [])
      ])
        .then(([data, orders]) => {
          if (data) setDetailData(data);
          if (Array.isArray(orders)) {
            const match = orders.find(o => o.asset_id.toUpperCase() === assetId.toUpperCase());
            setWorkOrder(match || null);
          }
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [assetId]);

  if (!assetId) return null;

  const getStatusBadge = (status) => {
    let bg, text, border, label;
    if (status === 'Ready') {
      bg = 'var(--status-ready-bg)';
      text = 'var(--status-ready-text)';
      border = 'var(--status-ready-border)';
      label = 'READY';
    } else if (status === 'At-Risk') {
      bg = 'var(--status-at-risk-bg)';
      text = 'var(--status-at-risk-text)';
      border = 'var(--status-at-risk-border)';
      label = 'AT-RISK';
    } else {
      bg = 'var(--status-not-ready-bg)';
      text = 'var(--status-not-ready-text)';
      border = 'var(--status-not-ready-border)';
      label = 'NOT-READY';
    }

    return (
      <span style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        padding: '3px 10px',
        borderRadius: '5px',
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`
      }}>
        {label}
      </span>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="clean-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '90vh',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          overscrollBehavior: 'contain',
          padding: '28px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-hover)'
        }}
      >
        {/* Modal Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {detailData && detailData.asset && (
              <div style={{
                width: '120px',
                height: '75px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                flexShrink: 0
              }}>
                <img
                  src={getAssetRealImage(detailData.asset)}
                  alt={detailData.asset.model_name || detailData.asset.asset_type}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/assets/fighter_jet.jpg';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="mono-num" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-iaf)' }}>
                  {assetId}
                </span>
                {detailData && getStatusBadge(detailData.asset.status)}
              </div>
              {detailData && (
                <div style={{ marginTop: '3px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {detailData.asset.model_name}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {detailData.asset.category} · {detailData.asset.asset_type} · {detailData.asset.unit} · Serviced {detailData.asset.last_service_date}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px', borderRadius: '6px' }}
            aria-label="Close Modal"
          >
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0', minHeight: '180px' }}>
            <FighterJetLoader variant="inline" size="sm" />
          </div>
        )}

        {error && (
          <div style={{ padding: '20px', backgroundColor: 'var(--status-not-ready-bg)', color: 'var(--status-not-ready-text)', border: '1px solid var(--status-not-ready-border)', borderRadius: '8px' }}>
            Failed to load asset telemetry: {error}
          </div>
        )}

        {detailData && (
          <div>
            {/* Active Dispatched Work Order Banner */}
            {workOrder && (
              <div style={{
                backgroundColor: 'var(--status-ready-bg)',
                border: '1px solid var(--status-ready-border)',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="mono-num" style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--status-ready-dot)',
                    color: '#FFFFFF'
                  }}>
                    {workOrder.work_order_id}
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--status-ready-text)' }}>
                      OFFICIAL WORK ORDER DISPATCHED: {workOrder.action_label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Assigned Crew: <strong>{workOrder.assigned_crew}</strong> ({workOrder.estimated_labor_hours}h) · Flight Roster Status: <strong style={{ color: 'var(--status-not-ready-text)' }}>{workOrder.flight_roster_status}</strong>
                    </div>
                  </div>
                </div>

                <div className="mono-num" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Dispatched {workOrder.dispatched_time}
                </div>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>COMPOSITE HEALTH</div>
                <div className="mono-num" style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: detailData.asset.status === 'Ready' ? 'var(--status-ready-text)' : (detailData.asset.status === 'At-Risk' ? 'var(--status-at-risk-text)' : 'var(--status-not-ready-text)'),
                  marginTop: '4px'
                }}>
                  {detailData.asset.health_score}%
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>PREDICTED RUL</div>
                <div className="mono-num" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {Math.round(detailData.asset.predicted_rul_cycles)} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>cycles</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  ~{Math.round(detailData.asset.estimated_days_to_failure)} operational days
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>14-DAY FAILURE RISK</div>
                <div className="mono-num" style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: detailData.asset.failure_probability_14d >= 0.5 ? 'var(--status-not-ready-text)' : 'var(--status-ready-text)',
                  marginTop: '4px'
                }}>
                  {Math.round(detailData.asset.failure_probability_14d * 100)}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  30d window: {Math.round(detailData.asset.failure_probability_30d * 100)}%
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>SUSPECTED SUBSYSTEM</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {detailData.asset.predicted_failing_component || 'Nominal Assembly'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Drive signature detected
                </div>
              </div>
            </div>

            {/* AI Diagnostic Explanation Layer (Deliverable 2) */}
            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderLeft: '4px solid var(--accent-iaf)',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Cpu size={18} color="var(--accent-iaf)" />
                <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--accent-iaf)', textTransform: 'uppercase' }}>
                  AI Diagnostic & Explanation Layer (Deliverable 2)
                </span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: '14px' }}>
                {detailData.asset.executive_summary}
              </p>

              {/* Action Recommendation */}
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '14px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Commander Action Directive</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '3px' }}>
                  {detailData.asset.action_recommendation}
                </div>
              </div>

              {/* Contributing Sensor Breaches */}
              {detailData.asset.top_contributing_factors?.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>
                    Top Contributing Threshold Breaches
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {detailData.asset.top_contributing_factors.map((f, idx) => (
                      <div key={idx} style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.label}</span>
                          <span className="mono-num" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                            {f.current_value} {f.unit} vs safe {f.threshold} {f.unit}
                          </span>
                        </div>
                        <span className="mono-num" style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: f.breach_pct > 50 ? 'var(--status-not-ready-text)' : 'var(--status-at-risk-text)'
                        }}>
                          +{f.breach_pct}% BREACH
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Run-to-Failure Telemetry Series (Deliverable 3 Visual) */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                  Sensor Telemetry Degradation Curves (CMAPSS Run-to-Failure)
                </h3>
                <span className="mono-num" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {detailData.telemetry_history.length} cycles logged
                </span>
              </div>
              <SensorTelemetryCharts telemetryHistory={detailData.telemetry_history} />
            </div>

            {/* Historical Maintenance Log */}
            {detailData.service_history?.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FileText size={16} color="var(--text-secondary)" />
                  <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                    Historical Service Log & Depot Remarks
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detailData.service_history.map((srv) => (
                    <div key={srv.record_id} style={{
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '12px 16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span className="mono-num" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-iaf)' }}>
                          {srv.record_id} • {srv.service_type}
                        </span>
                        <span className="mono-num" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {srv.service_date}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Serviced Component: <strong style={{ color: 'var(--text-primary)' }}>{srv.component_serviced}</strong>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                        "{srv.technician_notes}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
