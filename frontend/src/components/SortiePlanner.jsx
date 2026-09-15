import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Thermometer, 
  Compass, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  RefreshCw, 
  FileText, 
  Zap, 
  Shield,
  Activity,
  Wrench,
  X
} from './Icons';
import FighterJetLoader from './FighterJetLoader';
import ConfirmationModal from './ConfirmationModal';

export default function SortiePlanner({ assets = [], onSelectAsset, onOrderDispatched, onDataChange, showActionOverlay, hideActionOverlay, showToast }) {
  const [durationHours, setDurationHours] = useState(8);
  const [environment, setEnvironment] = useState('STANDARD'); // STANDARD | DESERT_HEAT | HIGH_ALTITUDE_LEH
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | CLEARED | HIGH_RISK
  const [expandedAssetId, setExpandedAssetId] = useState(null);
  const [simResults, setSimResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dispatchingAsset, setDispatchingAsset] = useState(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (title, msg) => {
    if (showToast) {
      showToast(title, msg || '');
    } else {
      setToastMessage(msg ? `${title}: ${msg}` : title);
      setTimeout(() => setToastMessage(null), 4500);
    }
  };

  // Extract unique squadrons for filter
  const uniqueUnits = useMemo(() => {
    const set = new Set(assets.map(a => a.unit).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [assets]);

  // Synchronized simulation fallback with realistic system telemetry
  const computeSimulationFallback = () => {
    const envMultiplier = environment === 'DESERT_HEAT' ? 1.35 : (environment === 'HIGH_ALTITUDE_LEH' ? 1.25 : 1.0);
    const requiredRul = Math.round(Number(durationHours) * 2.2 * envMultiplier);

    const filtered = (assets || []).filter(a => unitFilter === 'ALL' || (a.unit && a.unit.toLowerCase() === unitFilter.toLowerCase()));
    
    let suitableCount = 0;
    const assessed = filtered.map(a => {
      const rul = a.predicted_rul_cycles || 185;
      const currStatus = a.status || 'Ready';
      const healthScore = parseFloat(a.health_score || 85);
      const compositeRisk = parseFloat(a.composite_risk_score || 0);
      const failProb14d = parseFloat(a.failure_probability_14d || 0.05);
      const failingComp = a.predicted_failing_component || 'High-Stress Subsystem';
      const diagReason = a.component_diagnosis_reason || '';
      const breachedSensors = currStatus === 'Ready' ? [] : (a.breached_sensors || []);
      const topFactors = a.top_contributing_factors || [];

      // Realistic Combat Survivability calculation based on actual system health
      let survivability = 100;
      let isSuitable = false;

      if (currStatus === 'Under-Maintenance' || currStatus === 'Not-Ready') {
        if (currStatus === 'Under-Maintenance') {
          survivability = 0; // Grounded in depot
        } else {
          survivability = Math.max(5, Math.min(30, Math.round(healthScore * (1.0 - failProb14d) * 0.3)));
        }
        isSuitable = false;
      } else if (currStatus === 'At-Risk') {
        const baseRatio = Math.min(1.0, rul / Math.max(1, requiredRul));
        const envPenalty = (envMultiplier - 1.0) * 0.5;
        const calcSurv = Math.round(healthScore * baseRatio * (1.0 - Math.max(compositeRisk, 0.15)) * (1.0 - envPenalty));
        survivability = Math.max(10, Math.min(80, calcSurv));
        isSuitable = false;
      } else { // Ready
        const baseRatio = rul / Math.max(1, requiredRul);
        if (baseRatio >= 1.0) {
          survivability = 100;
          isSuitable = true;
        } else {
          survivability = Math.max(15, Math.min(95, Math.round(baseRatio * 100)));
          isSuitable = false;
        }
      }

      // Build Real System Diagnostic Message
      const breachSummary = breachedSensors.length > 0 
        ? breachedSensors.slice(0, 2).map(b => (b.sensor || '').replace('_', ' ')).join(', ')
        : '';

      let warningMsg = '';
      if (currStatus === 'Under-Maintenance') {
        warningMsg = `Depot Grounded: Active servicing for ${failingComp}. Platform unavailable until repair clearance.`;
      } else if (currStatus === 'Not-Ready') {
        warningMsg = `Critical Telemetry Fault: ${failingComp} failure risk (${healthScore}% health). Breached: ${breachSummary || 'Critical sensor limit'}.`;
      } else if (currStatus === 'At-Risk') {
        warningMsg = `At-Risk Subsystem Degradation: ${failingComp} (${diagReason || 'abnormal sensor drift'}). Breached: ${breachSummary || 'Threshold warning'}.`;
      } else if (rul < requiredRul) {
        warningMsg = `Insufficient Mission RUL: ${rul} cycles available vs ${requiredRul} cycles required under ${environment} (${Math.round(envMultiplier * 100)}% stress).`;
      } else {
        warningMsg = `Nominal Flight Envelope: ${rul} cycles available (exceeds ${requiredRul} req). Health ${healthScore}%. All sensor channels clear.`;
      }

      if (isSuitable) suitableCount += 1;

      return {
        asset_id: a.asset_id,
        model_name: a.model_name || a.asset_type || 'Military Platform',
        category: a.category || 'Defense Platform',
        unit: a.unit || 'Base Squadron',
        current_status: currStatus,
        health_score: healthScore,
        composite_risk_score: compositeRisk,
        predicted_failing_component: failingComp,
        component_diagnosis_reason: diagReason,
        breached_sensors: breachedSensors,
        top_contributing_factors: topFactors,
        predicted_rul_cycles: rul,
        required_rul_cycles: requiredRul,
        survivability_pct: survivability,
        is_suitable: isSuitable,
        mission_clearance_status: isSuitable ? 'CLEARED' : 'RISK_HIGH',
        warning: warningMsg,
        latest_sensors: a.latest_sensors
      };
    });

    const totalCount = assessed.length;
    const clearanceRate = totalCount > 0 ? Math.round((suitableCount / totalCount) * 1000) / 10 : 0;

    return {
      scenario: {
        duration_hours: Number(durationHours),
        environment: environment,
        required_rul_cycles: requiredRul,
        env_multiplier: envMultiplier
      },
      summary: {
        total_assessed: totalCount,
        suitable_count: suitableCount,
        high_risk_count: totalCount - suitableCount,
        mission_clearance_rate_pct: clearanceRate
      },
      assessed_assets: assessed
    };
  };

  const runSimulation = async () => {
    const savedScroll = window.scrollY;
    if (!simResults) {
      setLoading(true);
    }
    try {
      const res = await fetch('/api/sortie/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_hours: Number(durationHours),
          environment: environment,
          unit_filter: unitFilter
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimResults(data);
      } else {
        setSimResults(computeSimulationFallback());
      }
    } catch (err) {
      console.error('Sortie simulation fallback to local calculation:', err);
      setSimResults(computeSimulationFallback());
    } finally {
      setLoading(false);
      if (savedScroll > 0) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedScroll, behavior: 'instant' });
        });
      }
    }
  };

  useEffect(() => {
    runSimulation();
  }, [durationHours, environment, unitFilter, assets]);

  // Quick Dispatch Pre-emptive Work Order from Sortie Planner
  const executeQuickDispatch = async (asset) => {
    const savedScroll = window.scrollY;
    setDispatchingAsset(asset.asset_id);
    if (showActionOverlay) {
      showActionOverlay(
        `DISPATCHING WORK ORDER FOR ${asset.asset_id}`,
        `Reserving logistics inventory, assigning maintenance crew, and locking flight roster status...`,
        asset.asset_id
      );
    }
    try {
      const res = await fetch('/api/work-orders/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: asset.asset_id,
          action_code: 'SORTIE_PREEMPTIVE_MAINTENANCE',
          action_label: 'Sortie Pre-emptive Overhaul',
          failing_component: asset.predicted_failing_component || 'High-Stress Subsystem',
          parts_required: ['Pre-flight Calibration Kit', 'Hydraulic Seals'],
          estimated_labor_hours: 6,
          urgency: 'HIGH',
          unit: asset.unit,
          model_name: asset.model_name
        })
      });

      if (res.ok) {
        if (onOrderDispatched) onOrderDispatched();
        if (onDataChange) await onDataChange();
        await runSimulation();
        triggerToast(
          `WORK ORDER DISPATCHED: ${asset.asset_id}`,
          `Pre-emptive work order issued for ${asset.asset_id}. Grounded for servicing.`
        );
      }
    } catch (err) {
      console.error('Pre-emptive dispatch failed:', err);
    } finally {
      setDispatchingAsset(null);
      if (hideActionOverlay) hideActionOverlay();
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedScroll, behavior: 'instant' });
      });
    }
  };

  const handleQuickDispatch = (asset) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Confirm Pre-emptive Work Order',
      subtitle: `Pre-flight Servicing Dispatch for ${asset.asset_id}`,
      iconType: 'wrench',
      badgeText: 'PRE-EMPTIVE DISPATCH',
      badgeType: 'warning',
      summaryItems: [
        { label: 'Platform ID', value: asset.asset_id, highlight: true },
        { label: 'Model', value: asset.model_name || 'Military Platform' },
        { label: 'Failing Subsystem', value: asset.predicted_failing_component || 'High-Stress Subsystem', color: 'var(--status-not-ready-text)' },
        { label: 'Est. Labor', value: '6 hours' }
      ],
      impactItems: [
        `Issues pre-emptive work order for ${asset.asset_id} prior to mission launch.`,
        'Reserves pre-flight calibration kit & high-temp seals from logistics inventory.',
        'Grounds platform for depot servicing until maintenance signoff.'
      ],
      reflectionItems: [
        'Flight roster status locks to "GROUNDED FOR MAINTENANCE".',
        'Work order status updates to "DISPATCHED" in the audit log.',
        'Activity notification badge increments on the sidebar.'
      ],
      confirmText: 'Confirm & Issue Pre-emptive Order',
      confirmColor: 'var(--accent-iaf)',
      onConfirm: async () => {
        setConfirmModalConfig(null);
        await executeQuickDispatch(asset);
      }
    });
  };

  // Quick Complete Repair from Sortie Planner
  const executeQuickCompleteRepair = async (asset) => {
    const savedScroll = window.scrollY;
    setDispatchingAsset(asset.asset_id);
    if (showActionOverlay) {
      showActionOverlay(
        `COMPLETING SERVICING FOR ${asset.asset_id}`,
        `Recalibrating sensor telemetry, restoring flight clearance, and updating fleet KPIs...`,
        asset.asset_id
      );
    }
    try {
      const res = await fetch('/api/work-orders/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: asset.asset_id,
          notes: 'Sortie preparation complete. Asset health recalibrated & cleared for flight.'
        })
      });

      if (res.ok) {
        if (onOrderDispatched) onOrderDispatched();
        if (onDataChange) await onDataChange();
        await runSimulation();
        triggerToast(
          `PLATFORM ${asset.asset_id} RESTORED TO FLIGHT READY`,
          `Servicing completed for ${asset.asset_id}. Cleared for tactical sortie.`
        );
      }
    } catch (err) {
      console.error('Complete repair failed:', err);
    } finally {
      setDispatchingAsset(null);
      if (hideActionOverlay) hideActionOverlay();
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedScroll, behavior: 'instant' });
      });
    }
  };

  const handleQuickCompleteRepair = (asset) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Confirm Work Order Signoff',
      subtitle: `Servicing Completion Signoff for ${asset.asset_id}`,
      iconType: 'check',
      badgeText: 'SORTIE SIGNOFF',
      badgeType: 'success',
      summaryItems: [
        { label: 'Platform ID', value: asset.asset_id, highlight: true },
        { label: 'Model', value: asset.model_name || 'Military Platform' },
        { label: 'Subsystem Serviced', value: asset.predicted_failing_component || 'Subsystem', color: 'var(--status-ready-text)' }
      ],
      impactItems: [
        `Registers formal maintenance completion for ${asset.asset_id}.`,
        'Recalibrates sensor telemetry back to nominal baseline tolerances.',
        'Restores composite health score and resets flight clearance roster.'
      ],
      reflectionItems: [
        'Platform status immediately updates to "Ready" (Flight Ready).',
        'Work order status updates to "COMPLETED" in the unified audit log.',
        'Sortie clearance rate KPI percentage recalculates dynamically.'
      ],
      confirmText: 'Confirm & Sign Off Servicing',
      confirmColor: 'var(--status-ready-dot)',
      onConfirm: async () => {
        setConfirmModalConfig(null);
        await executeQuickCompleteRepair(asset);
      }
    });
  };

  // Direct Trigger: Recalculate Scenario Button
  const handleRequestRecalculate = async () => {
    setLoading(true);
    await runSimulation();
    triggerToast('Combat sortie scenario successfully recalculated.');
  };

  // Direct Trigger: Duration Buttons
  const handleSelectDuration = (targetHours, optLabel) => {
    if (targetHours === durationHours) return;
    setDurationHours(targetHours);
    triggerToast(`Mission duration updated to ${optLabel}.`);
  };

  // Confirmation Trigger: Pre-emptive Maintenance Dispatch
  const handleRequestDispatch = (asset, e) => {
    if (e) e.stopPropagation();
    const failingComp = asset.predicted_failing_component || 'High-Stress Subsystem';
    const breachList = (asset.breached_sensors || []).map(b => b.sensor ? b.sensor.replace(/_/g, ' ').toUpperCase() : '').filter(Boolean).join(', ');

    setConfirmModalConfig({
      isOpen: true,
      title: 'Confirm Pre-emptive Work Order Dispatch',
      subtitle: `Lock Roster & Issue Urgent Servicing for ${asset.asset_id}`,
      iconType: 'alert',
      badgeText: 'MAINTENANCE DISPATCH',
      badgeType: 'danger',
      dangerMode: true,
      summaryItems: [
        { label: 'Platform ID', value: asset.asset_id, highlight: true },
        { label: 'Model', value: asset.model_name },
        { label: 'Squadron', value: asset.unit },
        { label: 'Suspect Component', value: failingComp, color: 'var(--status-not-ready-text)' },
        { label: 'Current Health', value: `${asset.health_score || 85}%` },
        { label: 'Available RUL', value: `${asset.predicted_rul_cycles} cycles` }
      ],
      impactItems: [
        `Generates an official pre-emptive maintenance work order (Action: SORTIE_PREEMPTIVE_MAINTENANCE) targeting ${failingComp}.`,
        `Reserves pre-flight calibration kits, hydraulic seals, and schedules base depot technician crew.`,
        `Locks ${asset.asset_id}'s flight roster status to prevent sortie deployment and avoid in-flight breakdown.`
      ],
      reflectionItems: [
        `Platform status changes from "${asset.current_status}" to "Under-Maintenance" (Depot Grounded).`,
        `Work order will appear in the Prioritised Maintenance Queue and permanent Activity Audit Log.`,
        `Sortie clearance status will update to "HIGH RISK / UNFIT (Depot Grounded)" until maintenance is completed.`
      ],
      confirmText: 'Confirm & Dispatch Work Order',
      confirmColor: 'var(--status-not-ready-dot)',
      onConfirm: async () => {
        setConfirmModalConfig(null);
        await handleQuickDispatch(asset);
        triggerToast(`Work order dispatched for ${asset.asset_id}. Grounded for servicing.`);
      }
    });
  };

  // Confirmation Trigger: Complete Repair & Mark Ready
  const handleRequestCompleteRepair = (asset, e) => {
    if (e) e.stopPropagation();
    const servicingComp = asset.predicted_failing_component || 'Subsystem';

    setConfirmModalConfig({
      isOpen: true,
      title: 'Confirm Maintenance Signoff & Flight Return',
      subtitle: `Restore Health & Clear ${asset.asset_id} for Combat Sortie`,
      iconType: 'check',
      badgeText: 'RETURN TO SERVICE',
      badgeType: 'success',
      summaryItems: [
        { label: 'Platform ID', value: asset.asset_id, highlight: true },
        { label: 'Model', value: asset.model_name },
        { label: 'Squadron', value: asset.unit },
        { label: 'Serviced Subsystem', value: servicingComp, color: 'var(--status-ready-text)' }
      ],
      impactItems: [
        `Signs off depot maintenance order: "Sortie preparation complete. Asset health recalibrated & cleared for flight."`,
        `Recalibrates sensor envelopes back to nominal baseline tolerances and clears active telemetry anomaly alerts.`,
        `Restores composite health index to 100.0% and resets RUL baseline.`
      ],
      reflectionItems: [
        `Platform status immediately updates to "Ready" (Flight Ready).`,
        `Platform clears the combat sortie envelope and is marked "✓ SORTIE CLEARED".`,
        `Fleet Readiness KPI and Squadron Operational Availability percentages increase.`,
        `Permanent completion record stamped into the Activity Audit Trail.`
      ],
      confirmText: 'Confirm & Clear for Flight',
      confirmColor: 'var(--status-ready-dot)',
      onConfirm: async () => {
        setConfirmModalConfig(null);
        await handleQuickCompleteRepair(asset);
        triggerToast(`${asset.asset_id} repair completed. Restored to FLIGHT READY.`);
      }
    });
  };

  // Filter assessed assets by tab
  const displayedAssets = useMemo(() => {
    if (!simResults?.assessed_assets) return [];
    if (statusFilter === 'CLEARED') {
      return simResults.assessed_assets.filter(a => a.is_suitable);
    }
    if (statusFilter === 'HIGH_RISK') {
      return simResults.assessed_assets.filter(a => !a.is_suitable);
    }
    return simResults.assessed_assets;
  }, [simResults, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '32px',
          zIndex: 99999,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--accent-iaf)',
          borderRadius: '8px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.25s ease-out'
        }}>
          <CheckCircle2 size={18} color="var(--status-ready-dot)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {toastMessage}
          </span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', marginLeft: '8px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Simulation Controls Panel */}
      <div className="clean-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={20} color="var(--accent-iaf)" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Mission Sortie "What-If" Planner
              </h2>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--status-ready-bg)',
                color: 'var(--status-ready-text)',
                border: '1px solid var(--status-ready-border)'
              }}>
                COMBAT TACTICAL SIMULATOR
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Simulate operational strain across mission durations & extreme environments to predict mid-sortie platform clearance rates.
            </p>
          </div>

          <button
            onClick={handleRequestRecalculate}
            disabled={loading}
            className="btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '9px 18px', 
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Simulating...' : 'Recalculate Scenario'}</span>
          </button>
        </div>

        {/* Control Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          padding: '16px',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: '8px',
          border: '1px solid var(--border-default)'
        }}>
          {/* Duration Selector */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              ⏱️ Sortie Duration Stress
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {[
                { hours: 4, label: '4h (CAP Patrol)' },
                { hours: 8, label: '8h (Strike Ops)' },
                { hours: 16, label: '16h (Long Range)' }
              ].map(opt => (
                <button
                  key={opt.hours}
                  onClick={() => handleSelectDuration(opt.hours, opt.label)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: durationHours === opt.hours ? '1px solid var(--accent-iaf)' : '1px solid var(--border-default)',
                    backgroundColor: durationHours === opt.hours ? 'var(--accent-iaf-subtle)' : 'var(--bg-surface)',
                    color: durationHours === opt.hours ? 'var(--accent-iaf)' : 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: durationHours === opt.hours ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Operational Environment Selector */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              🌡️ Operational Environment
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="iaf-select"
              style={{ width: '100%' }}
            >
              <option value="STANDARD">Standard Baseline (Nominal Temp & Altitude)</option>
              <option value="DESERT_HEAT">Thar / Border Desert Heat (+35% RUL Stress Multiplier)</option>
              <option value="HIGH_ALTITUDE_LEH">Leh / Ladakh Cold Thin Air (+25% RUL Stress Multiplier)</option>
            </select>
          </div>

          {/* Squadron Unit Target Filter */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              🎯 Target Squadron / Unit
            </label>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="iaf-select"
              style={{ width: '100%' }}
            >
              {uniqueUnits.map(unit => (
                <option key={unit} value={unit}>
                  {unit === 'ALL' ? 'Entire Fleet (All Squadrons)' : unit}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Simulation Results Workspace */}
      {!simResults && loading ? (
        <div className="clean-panel" style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', width: '100%' }}>
          <FighterJetLoader variant="inline" size="lg" statusText="RUNNING COMBAT SORTIE SIMULATION..." />
        </div>
      ) : simResults && (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '450px' }}>
          {/* Summary KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '16px'
          }}>
            {/* Clearance Rate KPI */}
            <div className="clean-panel" style={{ padding: '20px', borderLeft: '4px solid var(--status-ready-dot)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Mission Clearance Rate
                </span>
                <ShieldCheck size={20} color="var(--status-ready-dot)" />
              </div>
              <div className="mono-num" style={{ fontSize: '32px', fontWeight: 800, color: simResults.summary.mission_clearance_rate_pct >= 75 ? 'var(--status-ready-text)' : 'var(--status-not-ready-text)', marginTop: '4px' }}>
                {simResults.summary.mission_clearance_rate_pct}%
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${simResults.summary.mission_clearance_rate_pct}%`,
                  backgroundColor: simResults.summary.mission_clearance_rate_pct >= 75 ? 'var(--status-ready-dot)' : 'var(--status-not-ready-dot)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                {simResults.summary.suitable_count} of {simResults.summary.total_assessed} platforms cleared for sortie
              </div>
            </div>

            {/* Cleared Platforms */}
            <div className="clean-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-ready-text)', textTransform: 'uppercase' }}>
                  Cleared Platforms
                </span>
                <CheckCircle2 size={20} color="var(--status-ready-dot)" />
              </div>
              <div className="mono-num" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--status-ready-text)', marginTop: '4px' }}>
                {simResults.summary.suitable_count}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Sufficient RUL envelope for mission profile
              </div>
            </div>

            {/* High-Risk / Grounded Count */}
            <div className="clean-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-not-ready-text)', textTransform: 'uppercase' }}>
                  Unsuitable / Grounded
                </span>
                <ShieldAlert size={20} color="var(--status-not-ready-dot)" />
              </div>
              <div className="mono-num" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--status-not-ready-text)', marginTop: '4px' }}>
                {simResults.summary.high_risk_count}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Require servicing before launch clearance
              </div>
            </div>

            {/* Scenario Threshold Info */}
            <div className="clean-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-iaf)', textTransform: 'uppercase' }}>
                  Required RUL Baseline
                </span>
                <Clock size={20} color="var(--accent-iaf)" />
              </div>
              <div className="mono-num" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {simResults.scenario.required_rul_cycles} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>cycles</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Environment stress factor: <strong>{(simResults.scenario.env_multiplier * 100).toFixed(0)}%</strong>
              </div>
            </div>
          </div>

          {/* Evaluated Roster Table Card */}
          <div className="clean-panel" style={{ padding: '20px' }}>
            {/* Header & Quick Triage Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Platform Mission Clearance Roster ({simResults.assessed_assets.length} Total)
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Tactical evaluation based on real-time HUMS sensor telemetry & ML health indices
                </div>
              </div>

              {/* Roster Filter Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-subtle)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                {[
                  { id: 'ALL', label: `All (${simResults.summary.total_assessed})` },
                  { id: 'CLEARED', label: `Cleared (${simResults.summary.suitable_count})` },
                  { id: 'HIGH_RISK', label: `High Risk / Grounded (${simResults.summary.high_risk_count})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: statusFilter === tab.id ? 'var(--bg-surface)' : 'transparent',
                      color: statusFilter === tab.id ? 'var(--accent-iaf)' : 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: statusFilter === tab.id ? 700 : 500,
                      cursor: 'pointer',
                      boxShadow: statusFilter === tab.id ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Container with Sticky Table Headers */}
            <div style={{ overflowX: 'auto', maxHeight: '680px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    backgroundColor: 'var(--bg-surface)',
                    borderBottom: '2px solid var(--border-default)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                    color: 'var(--text-muted)'
                  }}>
                    <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>PLATFORM</th>
                    <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>SQUADRON</th>
                    <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>FLEET STATUS</th>
                    <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>AVAILABLE RUL</th>
                    <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>REQUIRED RUL</th>
                    <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>SURVIVABILITY</th>
                    <th style={{ padding: '12px 14px' }}>MISSION CLEARANCE & SYSTEM DIAGNOSIS</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>COMMAND ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAssets.map(asset => {
                    const isCleared = asset.is_suitable;
                    const isUnderMaint = asset.current_status === 'Under-Maintenance' || asset.current_status === 'Not-Ready';
                    const isExpanded = expandedAssetId === asset.asset_id;

                    return (
                      <React.Fragment key={asset.asset_id}>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: isExpanded ? 'var(--bg-subtle)' : 'transparent' }} className="table-row-hover">
                          {/* Platform ID & Model */}
                          <td style={{ padding: '12px 14px' }}>
                            <button
                              onClick={() => onSelectAsset && onSelectAsset(asset.asset_id)}
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                              title="Drill down into asset telemetry"
                            >
                              <span className="mono-num" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-iaf)' }}>
                                {asset.asset_id}
                              </span>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {asset.model_name}
                              </div>
                            </button>
                          </td>

                          {/* Squadron */}
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                            {asset.unit}
                          </td>

                          {/* Current Fleet Status Badge */}
                          <td style={{ padding: '12px 14px' }}>
                            <span className="mono-num" style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                              backgroundColor: asset.current_status === 'Ready' 
                                ? 'var(--status-ready-bg)' 
                                : (asset.current_status === 'At-Risk' ? 'var(--status-at-risk-bg)' : 'var(--status-not-ready-bg)'),
                              color: asset.current_status === 'Ready' 
                                ? 'var(--status-ready-text)' 
                                : (asset.current_status === 'At-Risk' ? 'var(--status-at-risk-text)' : 'var(--status-not-ready-text)'),
                              border: `1px solid ${
                                asset.current_status === 'Ready' 
                                  ? 'var(--status-ready-border)' 
                                  : (asset.current_status === 'At-Risk' ? 'var(--status-at-risk-border)' : 'var(--status-not-ready-border)')
                              }`
                            }}>
                              {asset.current_status}
                            </span>
                          </td>

                          {/* Available RUL */}
                          <td style={{ padding: '12px 14px' }} className="mono-num">
                            <strong style={{ color: asset.predicted_rul_cycles < simResults.scenario.required_rul_cycles ? 'var(--status-not-ready-text)' : 'var(--text-primary)' }}>
                              {asset.predicted_rul_cycles}
                            </strong> <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>cycles</span>
                          </td>

                          {/* Required RUL */}
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }} className="mono-num">
                            {asset.required_rul_cycles} cycles
                          </td>

                          {/* Realistic Survivability Score */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '85px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span className="mono-num" style={{ 
                                  fontWeight: 800, 
                                  fontSize: '12px',
                                  color: asset.survivability_pct >= 75 
                                    ? 'var(--status-ready-text)' 
                                    : (asset.survivability_pct > 0 ? 'var(--status-at-risk-text)' : 'var(--status-not-ready-text)') 
                                }}>
                                  {asset.survivability_pct}%
                                </span>
                                {asset.survivability_pct === 0 && (
                                  <span style={{ fontSize: '9px', color: 'var(--status-not-ready-text)', fontWeight: 700 }}>
                                    GROUNDED
                                  </span>
                                )}
                              </div>
                              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%',
                                  width: `${asset.survivability_pct}%`,
                                  backgroundColor: asset.survivability_pct >= 75 
                                    ? 'var(--status-ready-dot)' 
                                    : (asset.survivability_pct > 0 ? 'var(--status-at-risk-dot)' : 'var(--status-not-ready-dot)'),
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                            </div>
                          </td>

                          {/* Mission Clearance Status Pill & REAL System Diagnostic Explanation */}
                          <td style={{ padding: '12px 14px', maxWidth: '380px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="mono-num" style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                backgroundColor: isCleared ? 'var(--status-ready-bg)' : 'var(--status-not-ready-bg)',
                                color: isCleared ? 'var(--status-ready-text)' : 'var(--status-not-ready-text)',
                                border: `1px solid ${isCleared ? 'var(--status-ready-border)' : 'var(--status-not-ready-border)'}`
                              }}>
                                {isCleared ? '✓ SORTIE CLEARED' : '⚠️ HIGH RISK / UNFIT'}
                              </span>

                              {asset.health_score !== undefined && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: 'var(--text-muted)'
                                }}>
                                  Health: <strong style={{ color: asset.health_score >= 90 ? 'var(--status-ready-text)' : 'var(--status-not-ready-text)' }}>{asset.health_score}%</strong>
                                </span>
                              )}
                            </div>

                            {/* Real System Reason */}
                            <div style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.4 }}>
                              {asset.warning}
                            </div>

                            {/* Real Breached Sensors Badges from Live System */}
                            {asset.current_status !== 'Ready' && asset.breached_sensors && asset.breached_sensors.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px' }}>
                                {asset.breached_sensors.map((b, bIdx) => (
                                  <span key={bIdx} style={{
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    backgroundColor: 'var(--status-not-ready-bg)',
                                    color: 'var(--status-not-ready-text)',
                                    border: '1px solid var(--status-not-ready-border)'
                                  }}>
                                    ⚠️ {b.sensor ? b.sensor.replace(/_/g, ' ').toUpperCase() : 'SENSOR'}: {b.value} (Limit {b.threshold} {b.unit || ''})
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Quick Command Action */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {isUnderMaint ? (
                              <button
                                onClick={(e) => handleRequestCompleteRepair(asset, e)}
                                disabled={dispatchingAsset === asset.asset_id}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '5px',
                                  border: '1px solid var(--status-ready-border)',
                                  backgroundColor: 'var(--status-ready-bg)',
                                  color: 'var(--status-ready-text)',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <CheckCircle2 size={12} />
                                <span>{dispatchingAsset === asset.asset_id ? 'Updating...' : 'Complete Repair & Mark Ready'}</span>
                              </button>
                            ) : !isCleared ? (
                              <button
                                onClick={(e) => handleRequestDispatch(asset, e)}
                                disabled={dispatchingAsset === asset.asset_id}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '5px',
                                  border: '1px solid var(--status-not-ready-border)',
                                  backgroundColor: 'var(--status-not-ready-bg)',
                                  color: 'var(--status-not-ready-text)',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <ShieldAlert size={12} />
                                <span>{dispatchingAsset === asset.asset_id ? 'Dispatching...' : 'Dispatch Pre-emptive Servicing'}</span>
                              </button>
                            ) : (
                              <span style={{ 
                                fontSize: '11px', 
                                color: 'var(--status-ready-text)', 
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--status-ready-bg)'
                              }}>
                                ✓ Flight Ready
                              </span>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Confirmation Modal */}
      {confirmModalConfig && (
        <ConfirmationModal
          {...confirmModalConfig}
          onClose={() => setConfirmModalConfig(null)}
        />
      )}
    </div>
  );
}
