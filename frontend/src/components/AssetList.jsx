import React, { useState, useMemo } from 'react';
import { Search, Plane, Shield, Truck, AlertCircle, Clock, ChevronRight, Activity } from './Icons';

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
        item.unit.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchStatus = statusFilter === 'ALL' || item.status.toUpperCase() === statusFilter.toUpperCase();
      const matchType = typeFilter === 'ALL' || item.asset_type.toUpperCase() === typeFilter.toUpperCase();
      const matchUnit = unitFilter === 'ALL' || item.unit === unitFilter;

      return matchSearch && matchStatus && matchType && matchUnit;
    });
  }, [assets, searchTerm, statusFilter, typeFilter, unitFilter]);

  const getPlatformIcon = (type) => {
    if (type.includes('Jet')) return <Plane size={18} color="var(--accent-cyan)" />;
    if (type.includes('Helicopter')) return <Activity size={18} color="#38BDF8" />;
    return <Truck size={18} color="#A78BFA" />;
  };

  const getStatusBadge = (status) => {
    if (status === 'Ready') {
      return <span className="mono-text badge-ready" style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>READY</span>;
    }
    if (status === 'At-Risk') {
      return <span className="mono-text badge-at-risk" style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>AT-RISK</span>;
    }
    return <span className="mono-text badge-not-ready" style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>NOT-READY</span>;
  };

  return (
    <div>
      {/* Controls Bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          flex: '1 1 240px',
          minWidth: '220px'
        }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search Asset ID, Platform or Unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              padding: '8px 12px 8px 36px',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '8px' }}>
          {['ALL', 'READY', 'AT-RISK', 'NOT-READY'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                background: statusFilter === st ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                color: statusFilter === st ? '#FFFFFF' : 'var(--text-secondary)',
                border: statusFilter === st ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Platform Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
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

          {/* Squadron Filter */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {units.map(u => (
              <option key={u} value={u}>{u === 'ALL' ? 'All Squadrons / Units' : u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {filteredAssets.map((asset) => {
          const isGrounded = asset.status === 'Not-Ready';
          const isAtRisk = asset.status === 'At-Risk';
          const health = asset.health_score || 100;
          const sensors = asset.latest_sensors || {};
          const vibBreach = sensors.vibration_level > 2.8;
          const tempBreach = sensors.engine_temp_c > 710;
          const debrisBreach = sensors.oil_debris_count > 18;

          return (
            <div
              key={asset.asset_id}
              className="glass-panel"
              onClick={() => onSelectAsset(asset.asset_id)}
              style={{
                padding: '20px',
                cursor: 'pointer',
                borderColor: isGrounded ? 'rgba(244, 63, 94, 0.4)' : (isAtRisk ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'),
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Header: ID, Platform, Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {getPlatformIcon(asset.asset_type)}
                  </div>
                  <div>
                    <span className="mono-text" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {asset.asset_id}
                    </span>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {asset.asset_type}
                    </p>
                  </div>
                </div>
                {getStatusBadge(asset.status)}
              </div>

              {/* Squadron & Mission Criticality */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                <span style={{ maxWidth: '190px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {asset.unit}
                </span>
                <span className="mono-text" style={{
                  color: asset.mission_criticality >= 3.0 ? 'var(--status-not-ready)' : (asset.mission_criticality >= 2.0 ? 'var(--status-at-risk)' : 'var(--text-secondary)')
                }}>
                  CRIT {asset.mission_criticality}x
                </span>
              </div>

              {/* Health Score Bar */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Health Integrity</span>
                  <span className="mono-text" style={{
                    fontWeight: 700,
                    color: health >= 80 ? 'var(--status-ready)' : (health >= 50 ? 'var(--status-at-risk)' : 'var(--status-not-ready)')
                  }}>
                    {health}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${health}%`,
                    height: '100%',
                    background: health >= 80 ? 'var(--status-ready)' : (health >= 50 ? 'var(--status-at-risk)' : 'var(--status-not-ready)')
                  }} />
                </div>
              </div>

              {/* Live Sensor Mini-Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '10px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '8px',
                marginBottom: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Vibration</div>
                  <div className="mono-text" style={{ fontSize: '12px', fontWeight: 600, color: vibBreach ? 'var(--status-not-ready)' : 'var(--text-primary)' }}>
                    {sensors.vibration_level?.toFixed(2)} mm/s
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Temp</div>
                  <div className="mono-text" style={{ fontSize: '12px', fontWeight: 600, color: tempBreach ? 'var(--status-not-ready)' : 'var(--text-primary)' }}>
                    {sensors.engine_temp_c?.toFixed(0)} °C
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Oil Debris</div>
                  <div className="mono-text" style={{ fontSize: '12px', fontWeight: 600, color: debrisBreach ? 'var(--status-not-ready)' : 'var(--text-primary)' }}>
                    {sensors.oil_debris_count?.toFixed(0)} ppm
                  </div>
                </div>
              </div>

              {/* RUL & Action Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--accent-cyan)" />
                  <div>
                    <span className="mono-text" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {Math.round(asset.predicted_rul_cycles)} cyc
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                      (~{Math.round(asset.estimated_days_to_failure)}d)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  <span>Drilldown</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '16px', fontWeight: 600 }}>No matching assets found</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Try adjusting your search query or status filter.</p>
        </div>
      )}
    </div>
  );
}
