import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShieldCheck, CheckCircle2, Clock, FileText, Activity, ChevronRight } from './Icons';
import FighterJetLoader from './FighterJetLoader';

export default function ActivityLog({ onSelectAsset }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  const fetchLogs = (isSilent = false) => {
    if (!isSilent && logs.length === 0) {
      setLoading(true);
    }
    fetch(`/api/activity-log?_t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLogs(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load activity logs:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs(false);

    // Silent background refresh every 5 seconds without triggering UI flicker
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const s = searchTerm.toLowerCase();
      const matchSearch = (
        (log.asset_id && log.asset_id.toLowerCase().includes(s)) ||
        (log.model_name && log.model_name.toLowerCase().includes(s)) ||
        (log.unit && log.unit.toLowerCase().includes(s)) ||
        (log.component && log.component.toLowerCase().includes(s)) ||
        (log.action_title && log.action_title.toLowerCase().includes(s)) ||
        (log.id && log.id.toLowerCase().includes(s))
      );

      const matchType = (
        typeFilter === 'ALL' ||
        (typeFilter === 'DISPATCH' && log.event_type === 'WORK_ORDER_DISPATCH') ||
        (typeFilter === 'HISTORICAL' && log.event_type === 'DEPOT_SERVICE_RECORD')
      );

      const matchUrgency = (
        urgencyFilter === 'ALL' ||
        (log.urgency && log.urgency.toUpperCase() === urgencyFilter.toUpperCase())
      );

      return matchSearch && matchType && matchUrgency;
    });
  }, [logs, searchTerm, typeFilter, urgencyFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const dispatched = logs.filter(l => l.event_type === 'WORK_ORDER_DISPATCH').length;
    const historical = logs.filter(l => l.event_type === 'DEPOT_SERVICE_RECORD').length;
    const immediate = logs.filter(l => l.urgency === 'IMMEDIATE').length;
    return { total, dispatched, historical, immediate };
  }, [logs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Activity Log Banner Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div className="clean-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Activities Logged
            </span>
            <FileText size={18} color="var(--accent-iaf)" />
          </div>
          <div className="mono-num" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Historical depot records & real-time commands
          </div>
        </div>

        <div className="clean-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-ready-text)', textTransform: 'uppercase' }}>
              Dispatched Work Orders
            </span>
            <ShieldCheck size={18} color="var(--status-ready-dot)" />
          </div>
          <div className="mono-num" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--status-ready-text)', marginTop: '6px' }}>
            {stats.dispatched}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Active inventory reservations & roster locks
          </div>
        </div>

        <div className="clean-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-at-risk-text)', textTransform: 'uppercase' }}>
              Immediate Emergencies
            </span>
            <Clock size={18} color="var(--status-at-risk-dot)" />
          </div>
          <div className="mono-num" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--status-at-risk-text)', marginTop: '6px' }}>
            {stats.immediate}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            24-48 Hour grounded platform interventions
          </div>
        </div>

        <div className="clean-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Historical Records
            </span>
            <CheckCircle2 size={18} color="var(--text-secondary)" />
          </div>
          <div className="mono-num" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {stats.historical}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Completed depot maintenance history logs
          </div>
        </div>
      </div>

      {/* Main Activity Log Workspace */}
      <div className="clean-panel" style={{ padding: '24px' }}>
        {/* Header & Controls */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              Military Maintenance Audit Activity Timeline
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Clean, chronological record of dispatched work orders, parts reservations, and technician service notes
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* View Mode Selector */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--bg-subtle)',
              padding: '3px',
              borderRadius: '6px',
              border: '1px solid var(--border-default)'
            }}>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  backgroundColor: viewMode === 'cards' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'cards' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Card Feed View
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  backgroundColor: viewMode === 'table' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Grid Table
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search Asset ID, Model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 12px 6px 30px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Event Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Event Types</option>
              <option value="DISPATCH">Real-time Work Orders</option>
              <option value="HISTORICAL">Historical Service Records</option>
            </select>

            {/* Urgency Filter */}
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Urgencies</option>
              <option value="IMMEDIATE">IMMEDIATE</option>
              <option value="HIGH">HIGH</option>
              <option value="ROUTINE">ROUTINE</option>
            </select>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0', minHeight: '220px' }}>
            <FighterJetLoader variant="inline" size="md" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '15px', fontWeight: 600 }}>No matching activity records found.</p>
          </div>
        ) : viewMode === 'cards' ? (
          /* OPTION 1: CLEAN CARD FEED VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredLogs.map((log, idx) => {
              const isDispatch = log.event_type === 'WORK_ORDER_DISPATCH';
              const isImmediate = log.urgency === 'IMMEDIATE';

              return (
                <div
                  key={log.id + '-' + idx}
                  style={{
                    backgroundColor: isDispatch ? 'var(--accent-iaf-subtle)' : 'var(--bg-surface)',
                    border: isDispatch ? '1px solid var(--accent-iaf)' : '1px solid var(--border-default)',
                    borderRadius: '8px',
                    padding: '18px 20px',
                    transition: 'all 0.15s ease',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {/* Card Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="mono-num" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        📅 {log.timestamp}
                      </span>
                      <span className="mono-num" style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: isDispatch ? 'var(--status-not-ready-bg)' : 'var(--status-ready-bg)',
                        color: isDispatch ? 'var(--status-not-ready-text)' : 'var(--status-ready-text)',
                        border: isDispatch ? '1px solid var(--status-not-ready-border)' : '1px solid var(--status-ready-border)'
                      }}>
                        {log.status}
                      </span>
                      <span className="mono-num" style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: isImmediate ? 'var(--status-not-ready-bg)' : 'var(--bg-subtle)',
                        color: isImmediate ? 'var(--status-not-ready-text)' : 'var(--text-secondary)'
                      }}>
                        {log.urgency}
                      </span>
                    </div>

                    <div className="mono-num" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-iaf)' }}>
                      ID: {log.id}
                    </div>
                  </div>

                  {/* Card Body Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}>
                    {/* Platform & Unit */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        TARGET PLATFORM & SQUADRON
                      </div>
                      <div
                        onClick={() => onSelectAsset && onSelectAsset(log.asset_id)}
                        style={{ cursor: 'pointer', marginTop: '4px' }}
                      >
                        <span className="mono-num" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-iaf)' }}>
                          {log.asset_id}
                        </span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginLeft: '8px' }}>
                          • {log.model_name}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-secondary)',
                          marginLeft: '8px',
                          border: '1px solid var(--border-default)'
                        }}>
                          {log.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        📍 {log.unit}
                      </div>
                    </div>

                    {/* Procedure & Subsystem */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        MAINTENANCE PROCEDURE & SUBSYSTEM
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                        {log.action_title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        🔧 Subsystem: <strong>{log.component}</strong>
                      </div>
                    </div>

                    {/* Crew & Parts */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        ASSIGNED CREW & RESERVED SPARE PARTS
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-iaf)', marginTop: '4px' }}>
                        👷 {log.assigned_crew} ({log.estimated_hours} Hours Labor)
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {log.parts_reserved?.map((p, pidx) => (
                          <span key={pidx} style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            📦 {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Technician Notes Box */}
                  <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>📝 Directive / Technician Log: </strong>
                    <em>"{log.notes}"</em>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* OPTION 2: CLEAN MINIMAL TABLE VIEW */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>DATE</th>
                  <th style={{ padding: '12px' }}>PLATFORM</th>
                  <th style={{ padding: '12px' }}>SQUADRON</th>
                  <th style={{ padding: '12px' }}>PROCEDURE</th>
                  <th style={{ padding: '12px' }}>SUBSYSTEM</th>
                  <th style={{ padding: '12px' }}>CREW & HOURS</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => {
                  const isDispatch = log.event_type === 'WORK_ORDER_DISPATCH';
                  return (
                    <tr key={log.id + '-' + idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px' }} className="mono-num">{log.timestamp.split(' ')[0]}</td>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ color: 'var(--accent-iaf)' }}>{log.asset_id}</strong> • {log.model_name}
                      </td>
                      <td style={{ padding: '12px' }}>{log.unit}</td>
                      <td style={{ padding: '12px' }}>{log.action_title}</td>
                      <td style={{ padding: '12px' }}>{log.component}</td>
                      <td style={{ padding: '12px' }}>{log.assigned_crew} ({log.estimated_hours}h)</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <span className="mono-num" style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: isDispatch ? 'var(--status-not-ready-bg)' : 'var(--status-ready-bg)',
                          color: isDispatch ? 'var(--status-not-ready-text)' : 'var(--status-ready-text)'
                        }}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
