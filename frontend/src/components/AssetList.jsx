import React, { useState, useMemo } from 'react';
import { Search, ChevronRight } from './Icons';
import Tooltip, { InfoIcon } from './Tooltip';
import { getAssetRealImage } from '../utils/assetImages';

export default function AssetList({ assets, onSelectAsset }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');

  // Extract unique categories, types and units for dropdowns
  const categories = ['ALL', 'Aircraft', 'Helicopters', 'Vehicles'];

  const availableTypes = useMemo(() => {
    let subset = assets;
    if (categoryFilter !== 'ALL') {
      subset = subset.filter(a => a.category?.toUpperCase() === categoryFilter.toUpperCase());
    }
    const set = new Set(subset.map(a => a.asset_type));
    return ['ALL', ...Array.from(set)];
  }, [assets, categoryFilter]);

  const units = useMemo(() => {
    const set = new Set(assets.map(a => a.unit));
    return ['ALL', ...Array.from(set)];
  }, [assets]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter(item => {
      const matchSearch = (
        item.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.model_name && item.model_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.asset_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.unit.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchCategory = categoryFilter === 'ALL' || item.category?.toUpperCase() === categoryFilter.toUpperCase();
      const matchStatus = statusFilter === 'ALL' || item.status.toUpperCase() === statusFilter.toUpperCase();
      const matchType = typeFilter === 'ALL' || item.asset_type.toUpperCase() === typeFilter.toUpperCase();
      const matchUnit = unitFilter === 'ALL' || item.unit === unitFilter;

      return matchSearch && matchCategory && matchStatus && matchType && matchUnit;
    });
  }, [assets, searchTerm, categoryFilter, statusFilter, typeFilter, unitFilter]);

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
        border: `1px solid ${border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {label}
      </span>
    );
  };

  const getCriticalityLabel = (crit) => {
    if (crit >= 2.8) return 'High';
    if (crit >= 2.0) return 'Medium';
    return 'Standard';
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
        padding: '16px 20px',
        marginBottom: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Row 1: Search & Category Switcher */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search */}
          <div style={{
            position: 'relative',
            flex: '1 1 280px',
            minWidth: '240px'
          }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Model Name, Asset ID, Category, Squadron..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                borderRadius: '6px',
                padding: '8px 12px 8px 34px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* Category Filter Tabs */}
          <div style={{
            display: 'flex',
            gap: '3px',
            backgroundColor: 'var(--bg-subtle)',
            padding: '3px',
            borderRadius: '7px',
            border: '1px solid var(--border-subtle)'
          }}>
            {categories.map((cat) => {
              const isSelected = categoryFilter.toUpperCase() === cat.toUpperCase();
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat.toUpperCase());
                    setTypeFilter('ALL');
                  }}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid var(--border-default)' : '1px solid transparent',
                    borderRadius: '5px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat === 'ALL' ? 'All Platforms' : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Status Filter & Sub-type Dropdowns */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px'
        }}>
          {/* Status Tabs */}
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

          {/* Subtype & Squadron Selects */}
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
              <option value="ALL">All Sub-Types</option>
              {availableTypes.filter(t => t !== 'ALL').map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
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
      </div>

      {/* Assets Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
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
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div>
                {/* 1. REAL IMAGE OF THE VEHICLE / HELICOPTER / AIRCRAFT */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '165px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-subtle)'
                }}>
                  <img
                    src={getAssetRealImage(asset)}
                    alt={asset.model_name || asset.asset_type}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/assets/fighter_jet.jpg';
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />

                  {/* Gradient Scrim for Contrast */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.05) 50%, rgba(0, 0, 0, 0.5) 100%)',
                    pointerEvents: 'none'
                  }} />

                  {/* Top Header Row inside Image: Asset ID + Status Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    right: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span className="mono-num" style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '5px',
                      backgroundColor: 'rgba(15, 23, 42, 0.82)',
                      backdropFilter: 'blur(6px)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      letterSpacing: '0.02em'
                    }}>
                      {asset.asset_id}
                    </span>

                    <div>
                      {getStatusBadge(asset.status)}
                    </div>
                  </div>

                  {/* Bottom Category Tag inside Image */}
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '12px'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(4px)',
                      color: '#F8FAFC',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}>
                      {asset.category || 'Aircraft'} · {asset.asset_type}
                    </span>
                  </div>
                </div>

                {/* 2. DIRECTLY BELOW REAL IMAGE: ACTUAL MODEL NAME & IDENTITY */}
                <div style={{ padding: '16px 18px 0' }}>
                  <div style={{ marginBottom: '14px' }}>
                    {/* Actual Model Name: Bold, Prominent */}
                    <div style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: '1.3',
                      letterSpacing: '-0.01em'
                    }}>
                      {asset.model_name || 'Standard Platform'}
                    </div>
                    {/* Squadron / Unit Name */}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Health Index
                        </span>
                        <Tooltip text="Composite operational health score based on sensor envelope baseline deviation.">
                          <InfoIcon />
                        </Tooltip>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Criticality: <strong style={{ color: 'var(--text-secondary)' }}>{getCriticalityLabel(asset.mission_criticality)}</strong>
                        </span>
                      </div>
                      <div className="mono-num" style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)' }}>
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
              </div>

              {/* 5. FOOTER ROW: One-line plain summary (left) + "View Telemetry →" link (right) */}
              <div style={{
                margin: '0 18px 16px',
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
