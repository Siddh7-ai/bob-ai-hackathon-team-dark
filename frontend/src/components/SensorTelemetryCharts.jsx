import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';

export default function SensorTelemetryCharts({ telemetryHistory }) {
  const [activeMetric, setActiveMetric] = useState('vibration');

  if (!telemetryHistory || telemetryHistory.length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '24px' }}>No telemetry records available.</div>;
  }

  // Downsample if more than 150 points for smooth performance
  const data = telemetryHistory.length > 150 
    ? telemetryHistory.filter((_, idx) => idx % 2 === 0 || idx === telemetryHistory.length - 1)
    : telemetryHistory;

  return (
    <div>
      {/* Metric Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { id: 'vibration', label: 'Mechanical: Vibration & Oil Debris', color: '#06B6D4' },
          { id: 'thermal', label: 'Thermal: Exhaust Temp & Pressure', color: '#F43F5E' },
          { id: 'fuel_rpm', label: 'Dynamics: Fuel Flow & Shaft RPM', color: '#10B981' }
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveMetric(m.id)}
            style={{
              background: activeMetric === m.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: activeMetric === m.id ? '#FFFFFF' : 'var(--text-secondary)',
              border: activeMetric === m.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Recharts Container */}
      <div style={{
        height: '320px',
        width: '100%',
        background: 'rgba(5, 10, 20, 0.6)',
        borderRadius: '10px',
        padding: '16px 12px 8px 0',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          {activeMetric === 'vibration' && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis dataKey="cycle" stroke="#64748B" tick={{ fontSize: 11 }} label={{ value: 'Operating Cycle', position: 'insideBottom', offset: -4, fill: '#64748B', fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#06B6D4" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'Vib (mm/s)', angle: -90, position: 'insideLeft', fill: '#06B6D4', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'Debris (ppm)', angle: 90, position: 'insideRight', fill: '#F59E0B', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0B132B', borderColor: 'rgba(6, 182, 212, 0.3)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#94A3B8' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <ReferenceLine yAxisId="left" y={2.8} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Safe Limit 2.8', fill: '#F59E0B', fontSize: 10 }} />
              <ReferenceLine yAxisId="left" y={4.5} stroke="#F43F5E" strokeDasharray="3 3" label={{ value: 'Critical 4.5', fill: '#F43F5E', fontSize: 10 }} />
              <Line yAxisId="left" type="monotone" dataKey="vibration_level" name="Vibration (mm/s)" stroke="#06B6D4" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="oil_debris_count" name="Oil Debris (ppm)" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          )}

          {activeMetric === 'thermal' && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis dataKey="cycle" stroke="#64748B" tick={{ fontSize: 11 }} label={{ value: 'Operating Cycle', position: 'insideBottom', offset: -4, fill: '#64748B', fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#F43F5E" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#F43F5E', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#38BDF8" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'Pressure Ratio', angle: 90, position: 'insideRight', fill: '#38BDF8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0B132B', borderColor: 'rgba(244, 63, 94, 0.3)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#94A3B8' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <ReferenceLine yAxisId="left" y={710} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Safe Temp 710°C', fill: '#F59E0B', fontSize: 10 }} />
              <ReferenceLine yAxisId="right" y={12.0} stroke="#38BDF8" strokeDasharray="4 4" label={{ value: 'Min Pressure 12.0', fill: '#38BDF8', fontSize: 10 }} />
              <Line yAxisId="left" type="monotone" dataKey="engine_temp_c" name="Exhaust Temp (°C)" stroke="#F43F5E" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="pressure_ratio" name="Pressure Ratio" stroke="#38BDF8" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          )}

          {activeMetric === 'fuel_rpm' && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis dataKey="cycle" stroke="#64748B" tick={{ fontSize: 11 }} label={{ value: 'Operating Cycle', position: 'insideBottom', offset: -4, fill: '#64748B', fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#10B981" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'Fuel (kg/s)', angle: -90, position: 'insideLeft', fill: '#10B981', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#A78BFA" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'RPM', angle: 90, position: 'insideRight', fill: '#A78BFA', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0B132B', borderColor: 'rgba(16, 185, 129, 0.3)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#94A3B8' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <ReferenceLine yAxisId="left" y={2.35} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Safe Fuel 2.35', fill: '#F59E0B', fontSize: 10 }} />
              <Line yAxisId="left" type="monotone" dataKey="fuel_flow_rate" name="Fuel Flow (kg/s)" stroke="#10B981" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="rotational_speed_rpm" name="Shaft Speed (RPM)" stroke="#A78BFA" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
