import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import FleetKpiOverview from './components/FleetKpiOverview';
import AssetList from './components/AssetList';
import MaintenancePlanTable from './components/MaintenancePlanTable';
import SquadronMatrix from './components/SquadronMatrix';
import ActivityLog from './components/ActivityLog';
import AssetDetailModal from './components/AssetDetailModal';
import ModelEvaluationModal from './components/ModelEvaluationModal';
import FighterJetLoader from './components/FighterJetLoader';
import SortiePlanner from './components/SortiePlanner';

import Sidebar from './components/Sidebar';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('apex_hums_theme') || 'dark';
  });
  const [activeTab, setActiveTab] = useState('fleet');
  const [kpis, setKpis] = useState(null);
  const [assets, setAssets] = useState([]);
  const [maintenancePlan, setMaintenancePlan] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(15);
  const [unreadLogCount, setUnreadLogCount] = useState(0);
  const [actionOverlay, setActionOverlay] = useState(null); // { title, message, assetId }
  const [toastNotification, setToastNotification] = useState(null); // { type, title, message }
  const [readLogIds, setReadLogIds] = useState(() => {
    try {
      const saved = localStorage.getItem('iaf_hums_read_log_ids');
      return saved ? new Set(JSON.parse(saved)) : null;
    } catch (e) {
      return null;
    }
  });
  const [unacknowledgedLogIds, setUnacknowledgedLogIds] = useState(new Set());
  const [activeNewLogIds, setActiveNewLogIds] = useState(new Set());

  // Mutable refs to eliminate stale closure bugs inside interval timers & background sync
  const readLogIdsRef = useRef(readLogIds);
  const activeTabRef = useRef(activeTab);
  const unacknowledgedLogIdsRef = useRef(unacknowledgedLogIds);
  const activeNewLogIdsRef = useRef(activeNewLogIds);

  useEffect(() => {
    readLogIdsRef.current = readLogIds;
  }, [readLogIds]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    unacknowledgedLogIdsRef.current = unacknowledgedLogIds;
  }, [unacknowledgedLogIds]);

  useEffect(() => {
    activeNewLogIdsRef.current = activeNewLogIds;
  }, [activeNewLogIds]);

  // Sync activity notifications and calculate exact unread badge count
  const syncActivityNotifications = async () => {
    try {
      const res = await fetch(`/api/activity-log?_t=${Date.now()}`);
      if (res.ok) {
        const logs = await res.json();
        if (Array.isArray(logs)) {
          const currentRead = readLogIdsRef.current;
          const currentTab = activeTabRef.current;

          if (currentRead === null) {
            const initialSet = new Set(logs.map(l => l.id || (l.asset_id + '-' + l.timestamp)));
            readLogIdsRef.current = initialSet;
            setReadLogIds(initialSet);
            localStorage.setItem('iaf_hums_read_log_ids', JSON.stringify([...initialSet]));
            setUnacknowledgedLogIds(new Set());
            setUnreadLogCount(0);
          } else {
            const unread = new Set();
            logs.forEach(l => {
              const logId = l.id || (l.asset_id + '-' + l.timestamp);
              if (!currentRead.has(logId)) {
                unread.add(logId);
              }
            });

            if (currentTab === 'log') {
              if (unread.size > 0) {
                const updated = new Set([...currentRead, ...unread]);
                readLogIdsRef.current = updated;
                setReadLogIds(updated);
                localStorage.setItem('iaf_hums_read_log_ids', JSON.stringify([...updated]));
                setActiveNewLogIds(prev => new Set([...prev, ...unread]));
                setUnacknowledgedLogIds(new Set());
              }
              setUnreadLogCount(0);
            } else {
              setUnacknowledgedLogIds(unread);
              setUnreadLogCount(unread.size);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync activity notifications:', err);
    }
  };

  const markAllLogsAsRead = () => {
    const currentRead = readLogIdsRef.current || new Set();
    const unack = unacknowledgedLogIdsRef.current;
    const activeNew = activeNewLogIdsRef.current;

    const next = new Set(currentRead);
    unack.forEach(id => next.add(id));
    activeNew.forEach(id => next.add(id));

    readLogIdsRef.current = next;
    setReadLogIds(next);
    localStorage.setItem('iaf_hums_read_log_ids', JSON.stringify([...next]));
    setUnacknowledgedLogIds(new Set());
    setActiveNewLogIds(new Set());
    setUnreadLogCount(0);
  };

  const showActionOverlay = (title, message, assetId) => {
    setActionOverlay({ title, message, assetId });
  };

  const hideActionOverlay = () => {
    setActionOverlay(null);
  };

  const showToast = (title, message, type = 'success') => {
    setToastNotification({ title, message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  const handleTabSelect = (tabId) => {
    if (tabId === 'log') {
      setActiveTab('log');
      const unack = unacknowledgedLogIdsRef.current;
      if (unack && unack.size > 0) {
        setActiveNewLogIds(new Set(unack));
        const currentRead = readLogIdsRef.current || new Set();
        const updated = new Set([...currentRead, ...unack]);
        readLogIdsRef.current = updated;
        setReadLogIds(updated);
        localStorage.setItem('iaf_hums_read_log_ids', JSON.stringify([...updated]));
        setUnacknowledgedLogIds(new Set());
      }
      setUnreadLogCount(0);
    } else {
      if (activeTabRef.current === 'log') {
        markAllLogsAsRead();
      }
      setActiveTab(tabId);
    }
  };

  const handleOrderDispatched = () => {
    syncActivityNotifications();
    fetchDashboardData();
  };

  // Sync theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('apex_hums_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchDashboardData = async () => {
    try {
      setLoadProgress(20);
      const t = Date.now();
      
      const kpiPromise = fetch(`/api/fleet/summary?_t=${t}`).then(res => {
        setLoadProgress(prev => Math.max(prev, 55));
        return res;
      });
      const assetsPromise = fetch(`/api/assets?_t=${t}`).then(res => {
        setLoadProgress(prev => Math.max(prev, 80));
        return res;
      });
      const planPromise = fetch(`/api/maintenance/plan?_t=${t}`).then(res => {
        setLoadProgress(prev => Math.max(prev, 95));
        return res;
      });

      const [kpiRes, assetsRes, planRes] = await Promise.all([kpiPromise, assetsPromise, planPromise]);

      if (kpiRes.ok && assetsRes.ok && planRes.ok) {
        const kpiData = await kpiRes.json();
        const assetsData = await assetsRes.json();
        const planData = await planRes.json();

        setKpis(kpiData);
        setAssets(assetsData.assets || []);
        setMaintenancePlan(planData || []);
        setLoadProgress(100);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 350);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    syncActivityNotifications();

    const interval = setInterval(() => {
      syncActivityNotifications();
    }, 5000);

    // Auto-refresh when tab gains focus or visibility changes to prevent desync
    const onSync = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
        syncActivityNotifications();
      }
    };
    window.addEventListener('focus', onSync);
    document.addEventListener('visibilitychange', onSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onSync);
      document.removeEventListener('visibilitychange', onSync);
    };
  }, []);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/regenerate-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_assets: 40, clean_count: 7, seed: Math.floor(Math.random() * 1000) })
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to regenerate telemetry:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading || isRegenerating) {
    return (
      <FighterJetLoader
        variant="fullscreen"
        progress={isRegenerating ? 85 : loadProgress}
        statusText={isRegenerating ? "SIMULATING LIVE TELEMETRY STREAM & RECALIBRATING ML MODELS..." : "INITIALIZING TACTICAL HUMS ENGINE..."}
        subtitleText={isRegenerating 
          ? "This process may take a few moments while sensor streams & ML models recalibrate. Please do not refresh or close this tab/window."
          : "Initializing multi-sensor telemetry engine & loading fleet health predictions."}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Left Hover-Expandable Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabSelect}
        unreadLogCount={unreadLogCount}
        onOpenEvaluation={() => setIsEvalOpen(true)}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
        kpis={kpis}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Top Header Status Bar */}
      <Header
        activeTab={activeTab}
        kpis={kpis}
      />

      {/* Main Command Workspace (Shifted right for 68px sidebar) */}
      <main style={{
        flex: 1,
        padding: '24px 32px 32px 100px',
        maxWidth: '1680px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Fleet KPI Banner */}
        <FleetKpiOverview kpis={kpis} />

        {/* View Switcher */}
        {activeTab === 'fleet' && (
          <AssetList
            assets={assets}
            onSelectAsset={(id) => setSelectedAssetId(id)}
          />
        )}

            {activeTab === 'maintenance' && (
              <MaintenancePlanTable
                plan={maintenancePlan}
                onSelectAsset={(id) => setSelectedAssetId(id)}
                onOrderDispatched={handleOrderDispatched}
                onDataChange={fetchDashboardData}
                showActionOverlay={showActionOverlay}
                hideActionOverlay={hideActionOverlay}
                showToast={showToast}
              />
            )}

            {activeTab === 'sortie' && (
              <SortiePlanner
                assets={assets}
                onSelectAsset={(id) => setSelectedAssetId(id)}
                onOrderDispatched={handleOrderDispatched}
                onDataChange={fetchDashboardData}
                showActionOverlay={showActionOverlay}
                hideActionOverlay={hideActionOverlay}
                showToast={showToast}
              />
            )}

            {activeTab === 'matrix' && (
              <SquadronMatrix
                assets={assets}
                onSelectAsset={(id) => setSelectedAssetId(id)}
              />
            )}

            {activeTab === 'log' && (
              <ActivityLog
                onSelectAsset={(id) => setSelectedAssetId(id)}
                onOrderDispatched={handleOrderDispatched}
                onDataChange={() => {
                  fetchDashboardData();
                  syncActivityNotifications();
                }}
                showActionOverlay={showActionOverlay}
                hideActionOverlay={hideActionOverlay}
                showToast={showToast}
                newLogIds={activeNewLogIds}
                onMarkAllRead={markAllLogsAsRead}
              />
            )}
      </main>

      {/* Detail Drilldown Modal */}
      {selectedAssetId && (
        <AssetDetailModal
          assetId={selectedAssetId}
          onClose={() => setSelectedAssetId(null)}
          onOrderDispatched={handleOrderDispatched}
          onDataChange={fetchDashboardData}
          showActionOverlay={showActionOverlay}
          hideActionOverlay={hideActionOverlay}
          showToast={showToast}
        />
      )}

      {/* Model Evaluation Modal */}
      <ModelEvaluationModal
        isOpen={isEvalOpen}
        onClose={() => setIsEvalOpen(false)}
      />

      {/* Fullscreen Unclickable Action Processing Overlay */}
      {actionOverlay && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100000,
          backgroundColor: 'rgba(0, 5, 15, 0.78)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          userSelect: 'none'
        }}>
          <div className="clean-panel" style={{
            padding: '36px 44px',
            textAlign: 'center',
            maxWidth: '520px',
            width: '90%',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--accent-iaf)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <FighterJetLoader variant="inline" size="md" statusText="" />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {actionOverlay.title}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                {actionOverlay.message}
              </p>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: '4px'
            }}>
              <div style={{
                height: '100%',
                width: '100%',
                backgroundColor: 'var(--accent-iaf)',
                animation: 'pulse 1.5s infinite ease-in-out'
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast Banner */}
      {toastNotification && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '32px',
          zIndex: 9999,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--status-ready-border)',
          borderLeft: '4px solid var(--status-ready-dot)',
          borderRadius: '8px',
          padding: '14px 20px',
          boxShadow: 'var(--shadow-hover)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.25s ease forwards'
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'var(--status-ready-dot)'
          }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {toastNotification.title}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {toastNotification.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
