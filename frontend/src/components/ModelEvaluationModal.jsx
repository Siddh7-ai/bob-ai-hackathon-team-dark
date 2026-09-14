import React, { useState, useEffect } from 'react';
import { X, Award, ShieldCheck } from './Icons';
import FighterJetLoader from './FighterJetLoader';

export default function ModelEvaluationModal({ isOpen, onClose }) {
  const [evalData, setEvalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setLoading(true);
      fetch('/api/evaluation')
        .then(res => res.json())
        .then(data => {
          setEvalData(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="clean-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '88vh',
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-iaf-subtle)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-iaf)'
            }}>
              <Award size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                Model Validation & Credibility Metrics
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Evaluated against Held-Out Assets Split (NASA CMAPSS Run-to-Failure Protocol)
              </p>
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

        {evalData && (
          <div>
            {/* Primary Scores Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {/* Deliverable 1 Classifier */}
              <div style={{ backgroundColor: 'var(--status-ready-bg)', border: '1px solid var(--status-ready-border)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--status-ready-text)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Deliverable 1: Classifier Accuracy
                </div>
                <div className="mono-num" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--status-ready-text)', marginTop: '4px' }}>
                  {(evalData.readiness_classifier.accuracy * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Weighted F1-Score: <strong>{evalData.readiness_classifier.f1_weighted?.toFixed(3)}</strong>
                </div>
              </div>

              {/* Deliverable 3 RUL Regressor */}
              <div style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--accent-iaf)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Deliverable 3: RUL Regressor MAE
                </div>
                <div className="mono-num" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {evalData.failure_prediction_rul.mae_cycles} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>cycles</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  RMSE: <strong>{evalData.failure_prediction_rul.rmse_cycles} cycles</strong> (R² = {evalData.failure_prediction_rul.r2_score})
                </div>
              </div>

              {/* Asset Hold-out Count */}
              <div style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Hold-Out Test Assets
                </div>
                <div className="mono-num" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {evalData.test_assets_count} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ {evalData.train_assets_count + evalData.test_assets_count}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Zero data leakage across assets
                </div>
              </div>
            </div>

            {/* Holdout Integrity Explainer */}
            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldCheck size={18} color="var(--status-ready-dot)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Data Leakage Prevention Verification
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                The training and evaluation sets are split strictly <strong>by Asset ID</strong>, never by row. The {evalData.test_assets_count} test platforms (<code>{evalData.test_asset_ids?.slice(0, 5).join(', ')}...</code>) were entirely held out during training. Features consist exclusively of raw sensor telemetry and rolling statistics—the model has zero access to ground-truth <code>failure_cycle</code> or derived labels.
              </p>
            </div>

            {/* Top Features */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)', marginBottom: '10px' }}>
                Top Predictive Features (Gradients & Rolling Telemetry)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                {evalData.readiness_classifier.top_features?.slice(0, 6).map(([feat, imp], i) => (
                  <div key={i} style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px'
                  }}>
                    <span className="mono-num" style={{ color: 'var(--text-primary)', fontSize: '11px' }}>{feat}</span>
                    <span className="mono-num" style={{ color: 'var(--accent-iaf)', fontWeight: 700 }}>{(imp * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CMAPSS Methodology */}
            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '14px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-iaf)', marginBottom: '4px' }}>
                CMAPSS Turbofan Analog & False Positive Control
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                The simulation embeds 3 realistic multivariate failure signatures (bearing friction wear, turbine thermal creep, and pump cavitation) plus 7 clean control assets that maintain normal operating envelopes throughout the simulated window to guarantee false positive resistance.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
