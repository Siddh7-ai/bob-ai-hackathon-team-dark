import React, { useMemo } from 'react';

export default function SquadronMatrix({ assets, onSelectAsset }) {
  const squadronGroups = useMemo(() => {
    const groups = {};
    assets.forEach(asset => {
      const u = asset.unit || 'General Command';
      if (!groups[u]) {
        groups[u] = {
          name: u,
          assets: [],
          ready: 0,
          atRisk: 0,
          notReady: 0
        };
      }
      groups[u].assets.push(asset);
      if (asset.status === 'Ready') groups[u].ready++;
      else if (asset.status === 'At-Risk') groups[u].atRisk++;
      else groups[u].notReady++;
    });
    return Object.values(groups);
  }, [assets]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
          Squadron Tactical Operational Availability Matrix
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Combat readiness and asset distribution across designated military air wings and mechanized divisions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {squadronGroups.map((sq) => {
          const total = sq.assets.length;
          const readyPct = Math.round((sq.ready / total) * 100);

          return (
            <div key={sq.name} className="clean-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {sq.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {total} Assigned Platforms
                  </p>
                </div>
                <div className="mono-num" style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: readyPct >= 70 ? 'var(--status-ready-bg)' : 'var(--status-at-risk-bg)',
                  color: readyPct >= 70 ? 'var(--status-ready-text)' : 'var(--status-at-risk-text)',
                  border: readyPct >= 70 ? '1px solid var(--status-ready-border)' : '1px solid var(--status-at-risk-border)'
                }}>
                  {readyPct}% READY
                </div>
              </div>

              {/* Status Breakdown Bar */}
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: '3px',
                overflow: 'hidden',
                display: 'flex',
                marginBottom: '16px'
              }}>
                <div style={{ width: `${(sq.ready / total) * 100}%`, backgroundColor: 'var(--status-ready-dot)' }} />
                <div style={{ width: `${(sq.atRisk / total) * 100}%`, backgroundColor: 'var(--status-at-risk-dot)' }} />
                <div style={{ width: `${(sq.notReady / total) * 100}%`, backgroundColor: 'var(--status-not-ready-dot)' }} />
              </div>

              {/* Assets list pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {sq.assets.map(asset => {
                  const isGrounded = asset.status === 'Not-Ready';
                  const isAtRisk = asset.status === 'At-Risk';
                  return (
                    <button
                      key={asset.asset_id}
                      onClick={() => onSelectAsset(asset.asset_id)}
                      className="mono-num"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: isGrounded 
                          ? '1px solid var(--status-not-ready-border)' 
                          : (isAtRisk ? '1px solid var(--status-at-risk-border)' : '1px solid var(--status-ready-border)'),
                        backgroundColor: isGrounded 
                          ? 'var(--status-not-ready-bg)' 
                          : (isAtRisk ? 'var(--status-at-risk-bg)' : 'var(--status-ready-bg)'),
                        color: isGrounded 
                          ? 'var(--status-not-ready-text)' 
                          : (isAtRisk ? 'var(--status-at-risk-text)' : 'var(--status-ready-text)'),
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease'
                      }}
                    >
                      {asset.asset_id}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
