import React, { useState, useMemo } from 'react';
import { Search, ChevronRight } from './Icons';
import AssetIcon from './AssetIcon';
import Tooltip, { InfoIcon } from './Tooltip';

export default function AssetList({ assets, onSelectAsset }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');

  // Extract unique units for dropdown
  const units = useMemo(() => {
    const set = new Set(assets.map(a => a.unit));
    return ['ALL', ...Array.from(set)];
  }, [assets]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter(item => {
      const matchSearch = (
        item.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.asset_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.model_name && item.model_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.unit.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchStatus = statusFilter === 'ALL' || item.status.toUpperCase() === statusFilter.toUpperCase();
      const matchType = typeFilter === 'ALL' || item.asset_type.toUpperCase() === typeFilter.toUpperCase();
      const matchUnit = unitFilter === 'ALL' || item.unit === unitFilter;

      return matchSearch && matchStatus && matchType && matchUnit;
    });
  }, [assets, searchTerm, statusFilter, typeFilter, unitFilter]);

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
        fontWeight: 600,
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

  const getCriticalityLabel = (crit) => {
    if (crit >= 3.0) return 'High';
    if (crit >= 2.0) return 'Medium';
    return 'Low';
  };

  const getHealthBarColor = (status) => {
    if (status === 'Ready') return 'var(--status-ready-dot)';
    if (status === 'At-Risk') return 'var(--status-at-risk-dot)';
    return 'var(--status-not-ready-dot)';
  };

  return (
    <div>
      {/* Controls / Filter Bar */}
      <div className="clean-panel" style={{
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          flex: '1 1 240px',
          minWidth: '220px'
        }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by Asset ID, Model or Squadron..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '7px 12px 7px 34px',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '3px',
          backgroundColor: 'var(--bg-subtle)',
          padding: '3px',
          borderRadius: '7px',
          border: '1px solid var(--border-subtle)'
        }}>
          {['ALL', 'READY', 'AT-RISK', 'NOT-READY'].map((st) => {
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--border-default)' : '1px solid transparent',
                  borderRadius: '5px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            );
          })}
        </div>

        {/* Dropdown Selects */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Platform Types</option>
            <option value="Fighter Jet Engine">Fighter Jet Engine</option>
            <option value="Transport Helicopter">Transport Helicopter</option>
            <option value="Armoured Vehicle">Armoured Vehicle</option>
          </select>

          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {units.map(u => (
              <option key={u} value={u}>{u === 'ALL' ? 'All Squadrons' : u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '18px'
      }}>
        {filteredAssets.map((asset) => {
          const health = asset.health_score || 100;
          const sensors = asset.latest_sensors || {};
          const vibBreach = sensors.vibration_level > 2.8;
          const tempBreach = sensors.engine_temp_c > 710;
          const debrisBreach = sensors.oil_debris_count > 18;
          const daysToFailure = Math.round(asset.estimated_days_to_failure || 0);

          // Plain-English 1-line status summary
          let statusSummary = '';
          if (asset.status === 'Ready') {
            statusSummary = 'All telemetry within safe operating limits • Cleared for flight';
          } else if (asset.status === 'At-Risk') {
            statusSummary = `${daysToFailure} days to failure • Early wear in ${asset.predicted_failing_component || 'subsystem'}`;
          } else {
            statusSummary = `Critical: ~${daysToFailure} days to failure • Urgent repair: ${asset.predicted_failing_component || 'subsystem'}`;
          }

          return (
            <div
              key={asset.asset_id}
              className="clean-panel"
              onClick={() => onSelectAsset(asset.asset_id)}
              style={{
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                {/* 1. HEADER ROW: Silhouette icon (left) + Status badge (right) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-primary)',
                    flexShrink: 0
                  }}>
                    <AssetIcon type={asset.asset_type} imageUrl={asset.image_url} size={42} />
                  </div>

                  <div>
                    {getStatusBadge(asset.status)}
                  </div>
                </div>

                {/* 2. IDENTITY BLOCK (directly below header) */}
                <div style={{ marginBottom: '14px' }}>
                  {/* Asset ID: bold, largest text */}
                  <div className="mono-num" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {asset.asset_id}
                  </div>
                  {/* Platform type + specific model name on one line */}
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {asset.asset_type} <span style={{ opacity: 0.4 }}>·</span> <span style={{ color: 'var(--text-primary)' }}>{asset.model_name || 'Standard Mk-1'}</span>
                  </div>
                  {/* Squadron/unit name, smaller, muted grey */}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {asset.unit}
                  </div>
                </div>

                {/* 3. HEALTH BLOCK */}
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '6px',
                  marginBottom: '14px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Health Index
                      </span>
                      <Tooltip text="Composite operational health score based on sensor baseline deviation.">
                        <InfoIcon />
                      </Tooltip>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Criticality: <strong style={{ color: 'var(--text-secondary)' }}>{getCriticalityLabel(asset.mission_criticality)}</strong>
                      </span>
                    </div>
                    <div className="mono-num" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {health}%
                    </div>
                  </div>

                  {/* Progress bar in muted status color only (max saturation #4ADE80 dark / #166534 light) */}
                  <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--border-default)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${health}%`,
                      height: '100%',
                      backgroundColor: getHealthBarColor(asset.status),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* 4. SENSOR ROW — three equal-width mini-cards: Vibration / Exhaust Temp / Oil Debris */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginBottom: '14px'
                }}>
                  {/* Vibration */}
                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vibration</span>
                      {vibBreach && (
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--status-not-ready-dot)'
                        }} title="Above safe 2.8 mm/s envelope" />
                      )}
                    </div>
                    <div className="mono-num" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {sensors.vibration_level?.toFixed(2)} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>mm/s</span>
                    </div>
                  </div>

                  {/* Exhaust Temp */}
                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Exhaust Temp</span>
                      {tempBreach && (
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--status-not-ready-dot)'
                        }} title="Above safe 710°C envelope" />
                      )}
                    </div>
                    <div className="mono-num" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {sensors.engine_temp_c?.toFixed(0)} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>°C</span>
                    </div>
                  </div>

                  {/* Oil Debris */}
                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Oil Debris</span>
                      {debrisBreach && (
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--status-not-ready-dot)'
                        }} title="Above safe 18 ppm envelope" />
                      )}
                    </div>
                    <div className="mono-num" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {sensors.oil_debris_count?.toFixed(0)} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ppm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. FOOTER ROW: One-line plain summary (left) + "View Telemetry →" link (right) */}
              <div style={{
                paddingTop: '12px',
                borderTop: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: asset.status === 'Not-Ready' ? 'var(--status-not-ready-text)' : (asset.status === 'At-Risk' ? 'var(--status-at-risk-text)' : 'var(--text-secondary)'),
                  fontWeight: asset.status === 'Ready' ? 400 : 500,
                  lineHeight: '1.4',
                  flex: 1
                }}>
                  {statusSummary}
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--accent-iaf)',
                  whiteSpace: 'nowrap'
                }}>
                  <span>View Telemetry</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
