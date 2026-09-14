import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShieldCheck, CheckCircle2, Clock, FileText, Activity, ChevronRight, Printer, X } from './Icons';
import FighterJetLoader from './FighterJetLoader';

export default function ActivityLog({ onSelectAsset }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [selectedLogForPrint, setSelectedLogForPrint] = useState(null);

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

  // Handle printing all filtered audit logs
  const handlePrintAll = () => {
    window.print();
  };

  // Handle printing a single activity/work order receipt
  const handlePrintSingle = (log, e) => {
    if (e) e.stopPropagation();
    setSelectedLogForPrint(log);
  };

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
          justifyContent: 'space-between',
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
            {/* Print All Audit Logs Button */}
            <button
              onClick={handlePrintAll}
              className="no-print"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid var(--accent-iaf)',
                backgroundColor: 'var(--accent-iaf-subtle)',
                color: 'var(--accent-iaf)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Print full filtered activity audit log report"
            >
              <Printer size={15} />
              Print Audit Log ({filteredLogs.length})
            </button>

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
            <div style={{ position: 'relative', width: '220px' }}>
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={(e) => handlePrintSingle(log, e)}
                        className="no-print"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title="Print single Work Order docket / service receipt"
                      >
                        <Printer size={13} />
                        Print Receipt
                      </button>
                      <div className="mono-num" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-iaf)' }}>
                        ID: {log.id}
                      </div>
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
                  <th style={{ padding: '12px' }}>STATUS</th>
                  <th style={{ padding: '12px', textAlign: 'right' }} className="no-print">ACTION</th>
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
                      <td style={{ padding: '12px' }}>
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
                      <td style={{ padding: '12px', textAlign: 'right' }} className="no-print">
                        <button
                          onClick={(e) => handlePrintSingle(log, e)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-default)',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-primary)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <Printer size={12} /> Print
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single Activity / Work Order Printable Docket Modal */}
      {selectedLogForPrint && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="clean-panel printable-receipt" style={{
            width: '100%',
            maxWidth: '680px',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            borderRadius: '10px',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            position: 'relative'
          }}>
            {/* Modal Control Header (Hidden when printing) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A', fontWeight: 700, fontSize: '13px' }}>
                <Printer size={16} /> Official Maintenance Document Print Preview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#1E3A8A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={14} /> Print Docket
                </button>
                <button
                  onClick={() => setSelectedLogForPrint(null)}
                  style={{
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Content Docket */}
            <div style={{ padding: '6px' }}>
              {/* IAF Official Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1E3A8A', paddingBottom: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src="/IAF_logo.png" alt="IAF Logo" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 900, color: '#1E3A8A', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      INDIAN AIR FORCE • HUMS MAINTENANCE DEPOT
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                      OFFICIAL WORK ORDER & ACTIVITY AUDIT DOCKET
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>DOCKET REFERENCE</div>
                  <div className="mono-num" style={{ fontSize: '15px', fontWeight: 800, color: '#1E3A8A' }}>{selectedLogForPrint.id}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Date: {selectedLogForPrint.timestamp}</div>
                </div>
              </div>

              {/* Platform & Status Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PLATFORM IDENTIFIER</div>
                  <div className="mono-num" style={{ fontSize: '16px', fontWeight: 800, color: '#1E3A8A', marginTop: '2px' }}>{selectedLogForPrint.asset_id}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{selectedLogForPrint.model_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>SQUADRON / UNIT</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{selectedLogForPrint.unit}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Category: {selectedLogForPrint.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>ROSTER STATUS & URGENCY</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', backgroundColor: selectedLogForPrint.event_type === 'WORK_ORDER_DISPATCH' ? '#FEE2E2' : '#DCFCE7', color: selectedLogForPrint.event_type === 'WORK_ORDER_DISPATCH' ? '#991B1B' : '#166534' }}>
                      {selectedLogForPrint.status}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#E2E8F0', color: '#334155' }}>
                      {selectedLogForPrint.urgency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Directive Details */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#1E3A8A', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  1. ACTION DIRECTIVE & SUBSYSTEM SPECIFICATION
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #CBD5E1' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569', width: '30%' }}>Procedure Title</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A' }}>{selectedLogForPrint.action_title}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Target Subsystem</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A' }}>{selectedLogForPrint.component}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Assigned Maintenance Crew</td>
                      <td style={{ padding: '8px 12px', color: '#0F172A' }}>{selectedLogForPrint.assigned_crew} ({selectedLogForPrint.estimated_hours} Hours Labor)</td>
                    </tr>
                    <tr style={{ backgroundColor: '#F8FAFC' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Reserved Spare Parts</td>
                      <td style={{ padding: '8px 12px', color: '#0F172A' }}>
                        {selectedLogForPrint.parts_reserved && selectedLogForPrint.parts_reserved.length > 0
                          ? selectedLogForPrint.parts_reserved.join(', ')
                          : 'Standard Calibration & Service Kit'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Technician Notes */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#1E3A8A', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  2. COMMAND DIRECTIVE / TECHNICIAN LOG NOTES
                </div>
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '12px 14px', fontSize: '12px', color: '#1E293B', fontStyle: 'italic', lineHeight: '1.6' }}>
                  "{selectedLogForPrint.notes}"
                </div>
              </div>

              {/* Signatures & Official Stamp */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px', paddingTop: '20px', borderTop: '1px dashed #94A3B8' }}>
                <div>
                  <div style={{ height: '35px' }}></div>
                  <div style={{ borderTop: '1px solid #475569', paddingTop: '4px', fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                    OFFICER-IN-CHARGE SIGNATURE
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>Base Maintenance Squadron Command</div>
                </div>
                <div>
                  <div style={{ height: '35px' }}></div>
                  <div style={{ borderTop: '1px solid #475569', paddingTop: '4px', fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                    CHIEF LOGISTICS AUTHORIZATION
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>Depot Supply & Inventory Approval</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
