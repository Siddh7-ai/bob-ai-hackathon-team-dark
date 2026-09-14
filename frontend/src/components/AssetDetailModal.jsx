import React, { useState, useEffect } from 'react';
import { X, Clock, FileText, Cpu } from './Icons';
import SensorTelemetryCharts from './SensorTelemetryCharts';

export default function AssetDetailModal({ assetId, onClose }) {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!assetId) return;
    setLoading(true);
    fetch(`/api/assets/${assetId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        setDetailData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [assetId]);

  if (!assetId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          background: '#0B1220',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Modal Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="mono-text" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {assetId}
              </span>
              {detailData && (
                <span className={`mono-text badge-${detailData.asset.status.toLowerCase().replace(' ', '-')}`} style={{
                  fontSize: '12px',
                  padding: '3px 12px',
                  borderRadius: '6px',
                  fontWeight: 700
                }}>
                  {detailData.asset.status.toUpperCase()}
                </span>
              )}
            </div>
            {detailData && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {detailData.asset.asset_type} • {detailData.asset.unit} • Last Serviced {detailData.asset.last_service_date}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p className="mono-text">Interrogating HUMS telemetry bus for {assetId}...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '24px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--status-not-ready)', borderRadius: '8px' }}>
            Failed to load asset telemetry: {error}
          </div>
        )}

        {detailData && (
          <div>
            {/* Quick Metrics Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>COMPOSITE HEALTH</div>
                <div className="mono-text" style={{ fontSize: '22px', fontWeight: 800, color: detailData.asset.health_score >= 80 ? 'var(--status-ready)' : 'var(--status-not-ready)', marginTop: '4px' }}>
                  {detailData.asset.health_score}%
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PREDICTED RUL</div>
                <div className="mono-text" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                  {Math.round(detailData.asset.predicted_rul_cycles)} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>cycles</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  ~{Math.round(detailData.asset.estimated_days_to_failure)} operational days
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>14-DAY FAILURE RISK</div>
                <div className="mono-text" style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: detailData.asset.failure_probability_14d >= 0.5 ? 'var(--status-not-ready)' : 'var(--status-ready)',
                  marginTop: '4px'
                }}>
                  {Math.round(detailData.asset.failure_probability_14d * 100)}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  30d window: {Math.round(detailData.asset.failure_probability_30d * 100)}%
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SUSPECTED SUBSYSTEM</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {detailData.asset.predicted_failing_component || 'Nominal Assembly'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Drive signature detected
                </div>
              </div>
            </div>

            {/* AI Diagnostic Explanation Box (Deliverable 2) */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.06), rgba(15, 23, 42, 0.8))',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Cpu size={18} color="var(--accent-cyan)" />
                <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                  AI Diagnostic & Explanation Layer (Deliverable 2)
                </span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: '14px' }}>
                {detailData.asset.executive_summary}
              </p>

              {/* Action Recommendation */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '12px 16px',
                borderRadius: '8px',
                borderLeft: '4px solid var(--accent-cyan)',
                marginBottom: '14px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Commander Action Directive</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0', marginTop: '2px' }}>
                  {detailData.asset.action_recommendation}
                </div>
              </div>

              {/* Contributing Sensor Breaches */}
              {detailData.asset.top_contributing_factors?.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Top Contributing Threshold Breaches
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {detailData.asset.top_contributing_factors.map((f, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.label}</span>
                          <span className="mono-text" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                            {f.current_value} {f.unit} vs safe {f.threshold} {f.unit}
                          </span>
                        </div>
                        <span className="mono-text" style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: f.breach_pct > 50 ? 'var(--status-not-ready)' : 'var(--status-at-risk)'
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
                <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Sensor Telemetry Degradation Curves (CMAPSS Run-to-Failure)
                </h3>
                <span className="mono-text" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
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
                  <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Historical Service Log & Depot Remarks
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detailData.service_history.map((srv) => (
                    <div key={srv.record_id} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '12px 16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span className="mono-text" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                          {srv.record_id} • {srv.service_type}
                        </span>
                        <span className="mono-text" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
