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
          { id: 'vibration', label: 'Mechanical: Vibration & Oil Debris' },
          { id: 'thermal', label: 'Thermal: Exhaust Temp & Pressure' },
          { id: 'fuel_rpm', label: 'Dynamics: Fuel Flow & Shaft RPM' }
        ].map((m) => {
          const isActive = activeMetric === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id)}
              style={{
                backgroundColor: isActive ? 'var(--accent-iaf)' : 'var(--bg-subtle)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--accent-iaf)' : '1px solid var(--border-default)',
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
          );
        })}
      </div>

      {/* Recharts Container */}
      <div style={{
        height: '320px',
        width: '100%',
        backgroundColor: 'var(--bg-subtle)',
        borderRadius: '8px',
        padding: '16px 12px 8px 0',
        border: '1px solid var(--border-default)'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          {activeMetric === 'vibration' && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="cycle" stroke="var(--text-muted)" tick={{ fontSize: 11 }} label={{ value: 'Operating Cycle', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'Vib (mm/s)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'Debris (ppm)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-tooltip)', borderColor: 'var(--border-strong)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-tooltip)' }}
                labelStyle={{ color: 'var(--text-tooltip)' }}
              />
              <Legend verticalAlign="top" align="left" height={32} wrapperStyle={{ fontSize: '12px', paddingLeft: '40px' }} />
              <ReferenceLine yAxisId="left" y={2.8} stroke="var(--status-at-risk-dot)" strokeDasharray="4 4" label={{ value: 'Safe Limit 2.8', position: 'insideTopRight', dy: 4, fill: 'var(--status-at-risk-dot)', fontSize: 11, fontWeight: 700 }} />
              <ReferenceLine yAxisId="left" y={4.5} stroke="var(--status-not-ready-dot)" strokeDasharray="3 3" label={{ value: 'Critical 4.5', position: 'insideTopRight', dy: 4, fill: 'var(--status-not-ready-dot)', fontSize: 11, fontWeight: 700 }} />
              <Line yAxisId="left" type="monotone" dataKey="vibration_level" name="Vibration (mm/s)" stroke="var(--accent-iaf)" strokeWidth={2.2} dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="oil_debris_count" name="Oil Debris (ppm)" stroke="var(--status-at-risk-dot)" strokeWidth={1.8} dot={false} isAnimationActive={false} />
            </LineChart>
          )}

          {activeMetric === 'thermal' && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="cycle" stroke="var(--text-muted)" tick={{ fontSize: 11 }} label={{ value: 'Operating Cycle', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'Pressure Ratio', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-tooltip)', borderColor: 'var(--border-strong)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-tooltip)' }}
                labelStyle={{ color: 'var(--text-tooltip)' }}
              />
              <Legend verticalAlign="top" align="left" height={32} wrapperStyle={{ fontSize: '12px', paddingLeft: '40px' }} />
              <ReferenceLine yAxisId="left" y={710} stroke="var(--status-at-risk-dot)" strokeDasharray="4 4" label={{ value: 'Safe Temp 710°C', position: 'insideTopRight', dy: 4, fill: 'var(--status-at-risk-dot)', fontSize: 11, fontWeight: 700 }} />
              <ReferenceLine yAxisId="right" y={12.0} stroke="var(--text-muted)" strokeDasharray="4 4" label={{ value: 'Min Pressure 12.0', position: 'insideTopRight', dy: 14, fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }} />
              <Line yAxisId="left" type="monotone" dataKey="engine_temp_c" name="Exhaust Temp (°C)" stroke="var(--status-not-ready-dot)" strokeWidth={2.2} dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="pressure_ratio" name="Pressure Ratio" stroke="var(--accent-iaf)" strokeWidth={1.8} dot={false} isAnimationActive={false} />
            </LineChart>
          )}

          {activeMetric === 'fuel_rpm' && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="cycle" stroke="var(--text-muted)" tick={{ fontSize: 11 }} label={{ value: 'Operating Cycle', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'Fuel (kg/s)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'RPM', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-tooltip)', borderColor: 'var(--border-strong)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-tooltip)' }}
                labelStyle={{ color: 'var(--text-tooltip)' }}
              />
              <Legend verticalAlign="top" align="left" height={32} wrapperStyle={{ fontSize: '12px', paddingLeft: '40px' }} />
              <ReferenceLine yAxisId="left" y={2.35} stroke="var(--status-at-risk-dot)" strokeDasharray="4 4" label={{ value: 'Safe Fuel 2.35', position: 'insideTopRight', dy: 4, fill: 'var(--status-at-risk-dot)', fontSize: 11, fontWeight: 700 }} />
              <Line yAxisId="left" type="monotone" dataKey="fuel_flow_rate" name="Fuel Flow (kg/s)" stroke="var(--status-ready-dot)" strokeWidth={2.2} dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="rotational_speed_rpm" name="Shaft Speed (RPM)" stroke="var(--accent-iaf)" strokeWidth={1.8} dot={false} isAnimationActive={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
