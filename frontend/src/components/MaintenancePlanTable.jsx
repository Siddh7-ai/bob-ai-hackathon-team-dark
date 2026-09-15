import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCheck, CheckCircle2, PackageCheck, X, ShieldCheck, FileText, Shield, Printer, Copy, Lock, Check, Plane, Truck, Wrench, Clock, Award, AlertTriangle } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import FighterJetLoader from './FighterJetLoader';

export default function MaintenancePlanTable({ plan, onSelectAsset, onOrderDispatched, onDataChange }) {
  const [dispatchedOrders, setDispatchedOrders] = useState({});
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [pendingConfirmItem, setPendingConfirmItem] = useState(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [completingAssetId, setCompletingAssetId] = useState(null);

  const handleInitiateCompleteRepair = (item) => {
    const woId = dispatchedOrders[item.asset_id]?.order?.work_order_id || `WO-2026-${(item.asset_id || 'ASSET').replace('-', '').toUpperCase()}`;
    setConfirmModalConfig({
      isOpen: true,
      title: 'Confirm Work Order Completion & Signoff',
      subtitle: `Depot Servicing Signoff for ${item.asset_id}`,
      iconType: 'check',
      badgeText: 'DEPOT SIGNOFF',
      badgeType: 'success',
      summaryItems: [
        { label: 'Platform ID', value: item.asset_id, highlight: true },
        { label: 'Model', value: item.model_name || item.asset_type || 'Platform' },
        { label: 'Subsystem Serviced', value: item.predicted_failing_component || 'Subsystem', color: 'var(--status-ready-text)' },
        { label: 'Work Order ID', value: woId }
      ],
      impactItems: [
        `Registers formal maintenance completion for ${item.asset_id} in depot records.`,
        'Recalibrates sensor envelopes back to nominal baseline tolerances and clears active anomaly alerts.',
        'Restores composite health score to 100% and resets flight readiness roster status.'
      ],
      reflectionItems: [
        'Platform status immediately updates to "Ready" (Flight Ready).',
        'Work order status updates to "COMPLETED" in the unified audit log.',
        'Fleet readiness KPIs dynamically increment across the mission dashboard.'
      ],
      confirmText: 'Confirm & Sign Off Repair',
      confirmColor: 'var(--status-ready-dot)',
      onConfirm: async () => {
        setConfirmModalConfig(null);
        await executeConfirmedCompleteRepair(item, woId);
      }
    });
  };

  const executeConfirmedCompleteRepair = async (item, woId) => {
    const savedScroll = window.scrollY;
    setCompletingAssetId(item.asset_id);
    try {
      const res = await fetch('/api/work-orders/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: item.asset_id,
          work_order_id: woId,
          notes: 'Depot maintenance complete. Subsystem recalibrated to nominal baseline.'
        })
      });

      if (res.ok) {
        setDispatchedOrders(prev => {
          const next = { ...prev };
          delete next[item.asset_id];
          return next;
        });
        if (onOrderDispatched) onOrderDispatched();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error('Failed to complete repair from plan table:', err);
    } finally {
      setCompletingAssetId(null);
      if (savedScroll > 0) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedScroll, behavior: 'instant' });
        });
      }
    }
  };

  // Load existing dispatched work orders from backend on mount
  useEffect(() => {
    setIsOrdersLoading(true);
    fetch(`/api/work-orders?_t=${Date.now()}`)
      .then(res => res.json())
      .then(orders => {
        if (Array.isArray(orders)) {
          const map = {};
          orders.forEach(o => {
            map[o.asset_id] = {
              time: o.dispatched_time || 'Recorded',
              order: o
            };
          });
          setDispatchedOrders(map);
        }
      })
      .catch(err => console.error('Failed to load dispatched work orders:', err))
      .finally(() => {
        setIsOrdersLoading(false);
      });
  }, []);

  // Copy Work Order ID to clipboard helper
  const handleCopyWoId = (woId) => {
    navigator.clipboard.writeText(woId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Step 1: Trigger confirmation prompt
  const handleInitiateDispatch = (item) => {
    setPendingConfirmItem(item);
  };

  // Step 2: Confirmed dispatch execution
  const executeConfirmedDispatch = async (item) => {
    setPendingConfirmItem(null);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const cleanId = (item.asset_id || 'ASSET').replace('-', '').toUpperCase();
    const woId = `WO-2026-${cleanId}`;

    const newOrder = {
      work_order_id: woId,
      asset_id: item.asset_id,
      model_name: item.model_name || item.asset_type || 'Military Platform',
      unit: item.unit || 'Base Squadron',
      action_code: item.action_code || 'DEPOT_MAINTENANCE',
      action_label: item.action_recommendation || 'Depot-Level Repair',
      failing_component: item.predicted_failing_component || 'Subsystem',
      parts_reserved: item.parts_required || [],
      parts_reserved_count: (item.parts_required || []).length,
      estimated_labor_hours: item.estimated_labor_hours || 8,
      urgency: item.urgency || 'HIGH',
      assigned_crew: item.urgency === 'IMMEDIATE' ? 'Alpha Maintenance Squad - Bay 3' : 'Bravo Depot Repair Team - Hangar 2',
      inventory_status: 'RESERVED_FROM_BASE_LOGISTICS',
      flight_roster_status: 'GROUNDED_FOR_MAINTENANCE',
      dispatched_at: new Date().toLocaleString(),
      dispatched_time: timeStr,
      status: 'DISPATCHED'
    };

    // Update UI state instantly
    setDispatchedOrders(prev => ({
      ...prev,
      [item.asset_id]: {
        time: timeStr,
        order: newOrder
      }
    }));
    setActiveReceipt(newOrder);

    // Notify parent App component to update unread badge counter & KPIs
    if (onOrderDispatched) {
      onOrderDispatched(newOrder);
    }

    // Sync to backend API in background
    try {
      const res = await fetch('/api/work-orders/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: item.asset_id,
          action_code: item.action_code,
          action_label: item.action_recommendation,
          failing_component: item.predicted_failing_component,
          parts_required: item.parts_required || [],
          estimated_labor_hours: item.estimated_labor_hours || 8,
          urgency: item.urgency,
          unit: item.unit,
          model_name: item.model_name || item.asset_type
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.work_order) {
          setDispatchedOrders(prev => ({
            ...prev,
            [item.asset_id]: {
              time: data.work_order.dispatched_time || timeStr,
              order: data.work_order
            }
          }));
        }
      }
    } catch (err) {
      console.error('Work Order dispatch API call failed:', err);
    }
  };

  // Filter out any assets that have completed repair and are marked Ready
  const activePlan = (plan || []).filter(item => item.status !== 'Ready' && item.flight_roster_status !== 'FLIGHT_READY');

  if (isOrdersLoading) {
    return (
      <div className="clean-panel" style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <FighterJetLoader variant="inline" size="lg" statusText="LOADING PRIORITISED ACTION QUEUE & WORK ORDERS..." />
      </div>
    );
  }

  if (!activePlan || activePlan.length === 0) {
    return (
      <div className="clean-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>No active maintenance recommendations pending. All operational assets cleared for sortie.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="clean-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Prioritised Maintenance Action Queue
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Sorted by Priority Score: Weighted by Health (40%), Composite Risk (35%), RUL Days (25%).
            </p>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing <strong>{activePlan.length}</strong> flagged assets
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="enterprise-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>RANK</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>ASSET & PLATFORM</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>SQUADRON / UNIT</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>RUL (CYCLES)</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>RISK SCORE</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>FAILING COMPONENT</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>RECOMMENDED ACTION</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>PARTS REQUIRED</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>LABOR</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>WORK ORDER</th>
              </tr>
            </thead>
            <tbody>
              {activePlan.map((item, idx) => {
                const isDispatched = !!dispatchedOrders[item.asset_id];
                const dispatchInfo = dispatchedOrders[item.asset_id];

                return (
                  <tr
                    key={item.asset_id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                      backgroundColor: isDispatched ? 'rgba(16, 185, 129, 0.03)' : 'transparent'
                    }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      #{item.priority_rank || item.rank || (idx + 1)}
                    </td>

                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => onSelectAsset && onSelectAsset(item.asset_id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          textAlign: 'left',
                          color: 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                        className="asset-link-hover"
                      >
                        {item.asset_id}
                      </button>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {item.model_name || item.asset_type}
                      </div>
                    </td>

                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {item.unit}
                    </td>

                    <td style={{ padding: '12px' }}>
                      <span className="mono-num" style={{
                        fontWeight: 700,
                        color: item.predicted_rul_cycles < 20 ? 'var(--status-not-ready-text)' : 'var(--status-at-risk-text)'
                      }}>
                        {item.predicted_rul_cycles} cycles
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ~{item.estimated_days_to_failure} days
                      </div>
                    </td>

                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="mono-num" style={{ fontWeight: 700 }}>
                          {(item.composite_risk_score * 100).toFixed(0)}%
                        </span>
                        <span style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          backgroundColor: item.urgency === 'IMMEDIATE' ? 'var(--status-not-ready-bg)' : 'var(--status-at-risk-bg)',
                          color: item.urgency === 'IMMEDIATE' ? 'var(--status-not-ready-text)' : 'var(--status-at-risk-text)',
                          border: `1px solid ${item.urgency === 'IMMEDIATE' ? 'var(--status-not-ready-border)' : 'var(--status-at-risk-border)'}`
                        }}>
                          {item.urgency}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.predicted_failing_component}
                    </td>

                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {item.action_recommendation}
                    </td>

                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {item.parts_required && item.parts_required.length > 0 ? (
                          item.parts_required.map((part, pIdx) => (
                            <span key={pIdx} style={{
                              fontSize: '10px',
                              backgroundColor: 'var(--bg-subtle)',
                              border: '1px solid var(--border-default)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: 'var(--text-secondary)'
                            }}>
                              {part}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Standard Maintenance Kit</span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {item.estimated_labor_hours} hrs
                    </td>

                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {isDispatched ? (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'var(--status-ready-bg)',
                            color: 'var(--status-ready-text)',
                            border: '1px solid var(--status-ready-border)'
                          }}>
                            <CheckCircle2 size={13} color="var(--status-ready-dot)" />
                            <span>DISPATCHED</span>
                          </span>
                          <button
                            onClick={() => handleInitiateCompleteRepair(item)}
                            disabled={completingAssetId === item.asset_id}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--status-ready-border)',
                              backgroundColor: 'var(--status-ready-bg)',
                              color: 'var(--status-ready-text)',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {completingAssetId === item.asset_id ? 'Completing...' : '✓ Complete Repair'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInitiateDispatch(item)}
                          className={item.urgency === 'IMMEDIATE' ? 'btn-primary' : 'btn-secondary'}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <ShieldCheck size={14} />
                          <span>Dispatch Work Order</span>
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

      {/* Safety Confirmation Modal Prompt */}
      {pendingConfirmItem && (
        <ConfirmationModal
          isOpen={!!pendingConfirmItem}
          onClose={() => setPendingConfirmItem(null)}
          onConfirm={() => executeConfirmedDispatch(pendingConfirmItem)}
          title="Confirm Work Order Dispatch"
          subtitle="Official Military Maintenance Work Order Protocol"
          iconType="wrench"
          badgeText={`${pendingConfirmItem.urgency || 'HIGH'} URGENCY`}
          badgeType={pendingConfirmItem.urgency === 'IMMEDIATE' ? 'danger' : 'warning'}
          summaryItems={[
            { label: 'Platform ID', value: pendingConfirmItem.asset_id, highlight: true },
            { label: 'Model', value: pendingConfirmItem.model_name || pendingConfirmItem.asset_type || 'Military Platform' },
            { label: 'Failing Subsystem', value: pendingConfirmItem.predicted_failing_component || 'Subsystem', color: 'var(--status-not-ready-text)' },
            { label: 'Est. Labor', value: `${pendingConfirmItem.estimated_labor_hours || 8} hours` }
          ]}
          impactItems={[
            `You are about to issue an official military work order for platform ${pendingConfirmItem.asset_id} (${pendingConfirmItem.model_name || pendingConfirmItem.asset_type}).`,
            `Reserves required logistics inventory parts (${(pendingConfirmItem.parts_required || ['Hydraulic Pump Seals', 'Fuel Injection Kit']).join(', ')}).`,
            `Assigns specialized repair crew: ${pendingConfirmItem.urgency === 'IMMEDIATE' ? 'Alpha Maintenance Squad - Bay 3' : 'Bravo Depot Repair Team - Hangar 2'}.`
          ]}
          reflectionItems={[
            `Flight roster status locks to "GROUNDED FOR MAINTENANCE".`,
            `Work order status updates to "DISPATCHED" with full timestamp audit receipt.`,
            `Maintenance Queue KPIs and fleet readiness dynamically update.`
          ]}
          confirmText="Confirm & Issue Work Order"
          confirmColor="var(--accent-iaf)"
        />
      )}

      {/* Completion Confirmation Modal */}
      {confirmModalConfig && (
        <ConfirmationModal
          {...confirmModalConfig}
          onClose={() => setConfirmModalConfig(null)}
        />
      )}

      {/* Official Work Order Dispatch Receipt Certificate Modal */}
      {activeReceipt && createPortal(
        <div className="modal-overlay" onClick={() => setActiveReceipt(null)}>
          <div
            className="clean-panel printable-receipt"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '680px',
              padding: '0',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(27, 63, 139, 0.3)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              borderRadius: '14px'
            }}
          >
            {/* IAF Official Defense Command Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0B192C 0%, #1E3A8A 60%, #0F172A 100%)',
              padding: '20px 28px',
              color: '#FFFFFF',
              borderBottom: '3px solid #D4AF37',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src="/IAF_logo.png"
                    alt="Indian Air Force Crest"
                    style={{ height: '48px', width: 'auto', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}
                  />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#EAB308' }}>
                      INDIAN AIR FORCE • DEPOT MAINTENANCE COMMAND
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0 0', letterSpacing: '0.02em' }}>
                      OFFICIAL DISPATCH CERTIFICATE
                    </h2>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34D399',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34D399', boxShadow: '0 0 8px #34D399' }}></span>
                    ENFORCED
                  </span>
                  <button
                    onClick={() => setActiveReceipt(null)}
                    className="no-print"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px' }}>

              {/* Work Order Monospaced Barcode / ID Strip */}
              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                    WORK ORDER REFERENCE NUMBER
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                    <span className="mono-num" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-iaf)', letterSpacing: '0.04em' }}>
                      {activeReceipt.work_order_id}
                    </span>
                    <button
                      onClick={() => handleCopyWoId(activeReceipt.work_order_id)}
                      className="no-print"
                      style={{
                        background: 'var(--accent-iaf-subtle)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--accent-iaf)',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedId ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedId ? 'Copied!' : 'Copy ID'}</span>
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>SECURITY VERIFICATION</div>
                  <div className="mono-num" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '2px' }}>
                    SEC-HASH: 8F92A-IAF-0926
                  </div>
                </div>
              </div>

              {/* Target Platform & Assigned Maintenance Crew Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                
                {/* Card 1: Target Platform */}
                <div style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-default)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--accent-iaf-subtle)',
                      color: 'var(--accent-iaf)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Plane size={16} />
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                      TARGET PLATFORM
                    </span>
                  </div>

                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {activeReceipt.asset_id} • {activeReceipt.model_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', fontWeight: 500 }}>
                    {activeReceipt.unit}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)' }}>
                    Failing Subsystem: <strong style={{ color: 'var(--text-primary)' }}>{activeReceipt.failing_component}</strong>
                  </div>
                </div>

                {/* Card 2: Assigned Maintenance Crew */}
                <div style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-default)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(234, 179, 8, 0.12)',
                      color: '#B45309',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Wrench size={16} />
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                      ASSIGNED MAINTENANCE CREW
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-iaf)' }}>
                    {activeReceipt.assigned_crew}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Clock size={12} color="var(--accent-iaf)" />
                      <span>Est. Labor: <strong>{activeReceipt.estimated_labor_hours} Hours</strong></span>
                    </span>

                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: activeReceipt.urgency === 'IMMEDIATE' ? 'var(--status-not-ready-bg)' : 'var(--status-at-risk-bg)',
                      color: activeReceipt.urgency === 'IMMEDIATE' ? 'var(--status-not-ready-text)' : 'var(--status-at-risk-text)',
                      border: `1px solid ${activeReceipt.urgency === 'IMMEDIATE' ? 'var(--status-not-ready-border)' : 'var(--status-at-risk-border)'}`
                    }}>
                      {activeReceipt.urgency}
                    </span>
                  </div>
                </div>

              </div>

              {/* 3 Real-World Defense Triggers Execution Panel */}
              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                padding: '18px 20px',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  marginBottom: '14px',
                  letterSpacing: '0.06em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-ready-dot)' }}></span>
                  <span>Automated Military Workflow Triggers Executed</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Trigger 1: Reserved Parts */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      marginTop: '2px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--status-ready-bg)',
                      border: '1px solid var(--status-ready-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CheckCircle2 size={14} color="var(--status-ready-dot)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Logistics Spare Parts Reserved from Base Inventory:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {activeReceipt.parts_reserved && activeReceipt.parts_reserved.length > 0 ? (
                          activeReceipt.parts_reserved.map((part, pIdx) => (
                            <span key={pIdx} className="mono-num" style={{
                              fontSize: '11px',
                              backgroundColor: 'var(--bg-card)',
                              border: '1px solid var(--border-strong)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              color: 'var(--text-primary)',
                              fontWeight: 600
                            }}>
                              📦 {part}
                            </span>
                          ))
                        ) : (
                          <span className="mono-num" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Standard Sensor Calibration Kit</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trigger 2: Flight Roster Lock */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--status-ready-bg)',
                      border: '1px solid var(--status-ready-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CheckCircle2 size={14} color="var(--status-ready-dot)" />
                    </div>
                    <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Flight Roster Lock Status:</span>
                      <span className="mono-num" style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--status-not-ready-bg)',
                        color: 'var(--status-not-ready-text)',
                        border: '1px solid var(--status-not-ready-border)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Lock size={12} />
                        <span>{activeReceipt.flight_roster_status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Trigger 3: Timestamp & Audit Trail */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--status-ready-bg)',
                      border: '1px solid var(--status-ready-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CheckCircle2 size={14} color="var(--status-ready-dot)" />
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Timestamp & Audit Trail Recorded:</span>{' '}
                      <span className="mono-num" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{activeReceipt.dispatched_at}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Digital Seal Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={15} color="var(--accent-iaf)" />
                  <span>Digitally Signed & Locked by <strong>APEX HUMS AI Engine</strong></span>
                </div>

                <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => window.print()}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer size={14} />
                    <span>Print Dispatch PDF</span>
                  </button>

                  <button
                    onClick={() => setActiveReceipt(null)}
                    className="btn-primary"
                    style={{
                      padding: '8px 22px',
                      fontSize: '13px',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #1B3F8B 0%, #1E3A8A 100%)',
                      boxShadow: '0 4px 12px rgba(27, 63, 139, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Acknowledge & Close</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
