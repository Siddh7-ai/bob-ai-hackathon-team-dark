import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FleetKpiOverview from './components/FleetKpiOverview';
import AssetList from './components/AssetList';
import MaintenancePlanTable from './components/MaintenancePlanTable';
import SquadronMatrix from './components/SquadronMatrix';
import ActivityLog from './components/ActivityLog';
import AssetDetailModal from './components/AssetDetailModal';
import ModelEvaluationModal from './components/ModelEvaluationModal';
import FighterJetLoader from './components/FighterJetLoader';

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

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'log') {
      setUnreadLogCount(0);
    }
  };

  const handleOrderDispatched = () => {
    setUnreadLogCount(prev => prev + 1);
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

    // Auto-refresh when tab gains focus or visibility changes to prevent desync
    const onSync = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    };
    window.addEventListener('focus', onSync);
    document.addEventListener('visibilitychange', onSync);

    return () => {
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

  if (isLoading) {
    return (
      <FighterJetLoader
        variant="fullscreen"
        progress={loadProgress}
        statusText="LOADING..."
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Ongoing Transparent Working Loader Overlay when Regenerating Telemetry */}
      {isRegenerating && (
        <div style={{
          position: 'fixed',
          top: '75px',
          right: '32px',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          <FighterJetLoader variant="inline" size="sm" />
        </div>
      )}

      {/* Top Header */}
      <Header
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

      {/* Main Command Workspace */}
      <main style={{ flex: 1, padding: '24px 32px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
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
              />
            )}
      </main>

      {/* Detail Drilldown Modal */}
      {selectedAssetId && (
        <AssetDetailModal
          assetId={selectedAssetId}
          onClose={() => setSelectedAssetId(null)}
        />
      )}

      {/* Model Evaluation Modal */}
      <ModelEvaluationModal
        isOpen={isEvalOpen}
        onClose={() => setIsEvalOpen(false)}
      />
    </div>
  );
}
