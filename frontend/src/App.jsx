import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FleetKpiOverview from './components/FleetKpiOverview';
import AssetList from './components/AssetList';
import MaintenancePlanTable from './components/MaintenancePlanTable';
import SquadronMatrix from './components/SquadronMatrix';
import AssetDetailModal from './components/AssetDetailModal';
import ModelEvaluationModal from './components/ModelEvaluationModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [kpis, setKpis] = useState(null);
  const [assets, setAssets] = useState([]);
  const [maintenancePlan, setMaintenancePlan] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [kpiRes, assetsRes, planRes] = await Promise.all([
        fetch('/api/fleet/summary'),
        fetch('/api/assets'),
        fetch('/api/maintenance/plan')
      ]);

      if (kpiRes.ok && assetsRes.ok && planRes.ok) {
        const kpiData = await kpiRes.json();
        const assetsData = await assetsRes.json();
        const planData = await planRes.json();

        setKpis(kpiData);
        setAssets(assetsData.assets || []);
        setMaintenancePlan(planData || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top HUD Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenEvaluation={() => setIsEvalOpen(true)}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
        kpis={kpis}
      />

      {/* Main Command Workspace */}
      <main style={{ flex: 1, padding: '24px 32px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        {/* Fleet KPI Banner */}
        <FleetKpiOverview kpis={kpis} />

        {/* View Switcher */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
            <p className="mono-text" style={{ fontSize: '15px' }}>Initializing HUMS Mission Diagnostics Bus...</p>
          </div>
        ) : (
          <>
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
              />
            )}

            {activeTab === 'matrix' && (
              <SquadronMatrix
                assets={assets}
                onSelectAsset={(id) => setSelectedAssetId(id)}
              />
            )}
          </>
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
