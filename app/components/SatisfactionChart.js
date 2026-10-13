"use client";

import { useState } from 'react';

export default function SatisfactionChart({ memberUtilities }) {
  const [activeView, setActiveView] = useState('both'); // 'line', 'bar', 'both'

  if (!memberUtilities || Object.keys(memberUtilities).length === 0) {
    return null;
  }

  const entries = Object.entries(memberUtilities);
  const data = entries.map(([uid, rawUtil], idx) => {
    const util = typeof rawUtil === 'number' ? rawUtil : parseFloat(rawUtil) || 0;
    const label = uid.startsWith('u_')
      ? `Traveler ${parseInt(uid.replace('u_', '')) + 1}`
      : uid.startsWith('U')
      ? `Traveler ${uid.replace('U', '')}`
      : uid;
    const shortLabel = uid.startsWith('u_')
      ? `T${parseInt(uid.replace('u_', '')) + 1}`
      : uid;

    return {
      uid,
      label,
      shortLabel,
      util,
      percentage: Math.round((util / 5.0) * 100),
      idx
    };
  });

  const utils = data.map((d) => d.util);
  const count = data.length;
  const avgUtil = utils.reduce((a, b) => a + b, 0) / count;
  const minUtil = Math.min(...utils);
  const maxUtil = Math.max(...utils);
  const disparity = (maxUtil - minUtil).toFixed(2);

  // SVG Chart Dimensions
  const svgWidth = 680;
  const svgHeight = 240;
  const paddingLeft = 55;
  const paddingRight = 45;
  const paddingTop = 35;
  const paddingBottom = 45;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index) => {
    if (count <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (count - 1)) * chartWidth;
  };

  const getY = (val) => {
    const clamped = Math.max(0, Math.min(5, val));
    return paddingTop + chartHeight - (clamped / 5.0) * chartHeight;
  };

  // Build Line Path
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.util) }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  
  // Build Area Path under line
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${paddingTop + chartHeight} L ${points[0].x.toFixed(1)} ${paddingTop + chartHeight} Z`
    : '';

  const yAvg = getY(avgUtil);

  return (
    <div style={{ marginTop: '2.5rem' }} className="animate-fade-in">
      {/* Header and Toggle Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem',
        marginBottom: '1.2rem' 
      }}>
        <div>
          <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📈</span> Individual Member Satisfaction (Utility & Fairness)
          </h4>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Nash Bargaining utility distribution across all {count} group members (Scale: 0.0 - 5.0)
          </p>
        </div>

        {/* View Switcher Buttons */}
        <div style={{ 
          display: 'inline-flex', 
          background: 'rgba(255,255,255,0.06)', 
          padding: '4px', 
          borderRadius: '10px', 
          border: '1px solid rgba(255,255,255,0.1)' 
        }}>
          <button
            type="button"
            onClick={() => setActiveView('line')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: activeView === 'line' ? '600' : '400',
              background: activeView === 'line' ? 'var(--primary)' : 'transparent',
              color: activeView === 'line' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            📈 Line Graph
          </button>
          <button
            type="button"
            onClick={() => setActiveView('bar')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: activeView === 'bar' ? '600' : '400',
              background: activeView === 'bar' ? 'var(--primary)' : 'transparent',
              color: activeView === 'bar' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            📊 Bar Chart
          </button>
          <button
            type="button"
            onClick={() => setActiveView('both')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: activeView === 'both' ? '600' : '400',
              background: activeView === 'both' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
              color: activeView === 'both' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            ✨ Both Views
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
        gap: '0.75rem', 
        marginBottom: '1.5rem' 
      }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.6rem 0.9rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Satisfaction</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
            {avgUtil.toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({Math.round((avgUtil / 5.0) * 100)}%)</span>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.6rem 0.9rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Least Misery (Min)</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8' }}>
            {minUtil.toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({Math.round((minUtil / 5.0) * 100)}%)</span>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.6rem 0.9rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Peak Satisfaction (Max)</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {maxUtil.toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({Math.round((maxUtil / 5.0) * 100)}%)</span>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.6rem 0.9rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fairness Disparity</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#a855f7' }}>
            Δ {disparity} <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{disparity <= 1.0 ? '(Fair)' : '(Balanced)'}</span>
          </div>
        </div>
      </div>

      {/* LINE GRAPH SECTION */}
      {(activeView === 'line' || activeView === 'both') && (
        <div style={{ 
          background: 'rgba(15, 23, 42, 0.65)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '14px', 
          padding: '1.5rem', 
          marginBottom: activeView === 'both' ? '1.5rem' : '0',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)' }}>
              📈 Satisfaction Trendline & Distribution Curve
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                Member Utility
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '2px', background: '#10b981', display: 'inline-block', borderTop: '2px dashed #10b981' }}></span>
                Group Average
              </span>
            </div>
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              style={{ width: '100%', height: 'auto', minWidth: '480px', display: 'block' }}
            >
              <defs>
                {/* Gradient for Line */}
                <linearGradient id="satisfactionLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>

                {/* Gradient for Area Fill */}
                <linearGradient id="satisfactionAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#6366f1" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>

                {/* Glow Filter */}
                <filter id="pointGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Horizontal Grid Lines & Y-Axis Labels */}
              {[5.0, 4.0, 3.0, 2.0, 1.0, 0.0].map((level) => {
                const y = getY(level);
                return (
                  <g key={level}>
                    <line 
                      x1={paddingLeft} 
                      y1={y} 
                      x2={paddingLeft + chartWidth} 
                      y2={y} 
                      stroke="rgba(255,255,255,0.08)" 
                      strokeWidth={level === 0 ? "1.5" : "1"}
                      strokeDasharray={level === 0 ? "none" : "3 3"} 
                    />
                    <text 
                      x={paddingLeft - 10} 
                      y={y + 3.5} 
                      fill="rgba(255,255,255,0.4)" 
                      fontSize="10" 
                      textAnchor="end"
                    >
                      {level.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Group Average Benchmark Dashed Line */}
              <line 
                x1={paddingLeft} 
                y1={yAvg} 
                x2={paddingLeft + chartWidth} 
                y2={yAvg} 
                stroke="#10b981" 
                strokeWidth="1.5" 
                strokeDasharray="5 4" 
              />
              <text 
                x={paddingLeft + chartWidth + 5} 
                y={yAvg + 3.5} 
                fill="#10b981" 
                fontSize="10" 
                fontWeight="bold"
              >
                Avg {avgUtil.toFixed(2)}
              </text>

              {/* Area Fill Under Curve */}
              {areaD && (
                <path 
                  d={areaD} 
                  fill="url(#satisfactionAreaGrad)" 
                />
              )}

              {/* Main Connecting Curve / Line */}
              {pathD && (
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke="url(#satisfactionLineGrad)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Data Nodes & Values */}
              {data.map((d, i) => {
                const cx = getX(i);
                const cy = getY(d.util);

                return (
                  <g key={d.uid}>
                    {/* Vertical guideline */}
                    <line 
                      x1={cx} 
                      y1={cy} 
                      x2={cx} 
                      y2={paddingTop + chartHeight} 
                      stroke="rgba(255,255,255,0.06)" 
                      strokeWidth="1" 
                      strokeDasharray="2 2" 
                    />

                    {/* Outer glowing halo */}
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r="8" 
                      fill="rgba(14, 165, 233, 0.25)" 
                      stroke="#0ea5e9" 
                      strokeWidth="1.5"
                      filter="url(#pointGlow)"
                    />

                    {/* Core node */}
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r="4.5" 
                      fill="#ffffff" 
                      stroke="#0ea5e9" 
                      strokeWidth="2" 
                    />

                    {/* Utility Value Label Above Point */}
                    <rect 
                      x={cx - 18} 
                      y={cy - 24} 
                      width="36" 
                      height="17" 
                      rx="4" 
                      fill="rgba(15, 23, 42, 0.85)" 
                      stroke="rgba(14, 165, 233, 0.4)" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={cx} 
                      y={cy - 12} 
                      fill="#38bdf8" 
                      fontSize="10.5" 
                      fontWeight="bold" 
                      textAnchor="middle"
                    >
                      {d.util.toFixed(2)}
                    </text>

                    {/* Member Label Below X-Axis */}
                    <text 
                      x={cx} 
                      y={paddingTop + chartHeight + 18} 
                      fill="#cbd5e1" 
                      fontSize="11" 
                      fontWeight="600" 
                      textAnchor="middle"
                    >
                      {d.label}
                    </text>

                    {/* Percentage Score */}
                    <text 
                      x={cx} 
                      y={paddingTop + chartHeight + 32} 
                      fill="#94a3b8" 
                      fontSize="9.5" 
                      textAnchor="middle"
                    >
                      {d.percentage}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* BAR CHART SECTION */}
      {(activeView === 'bar' || activeView === 'both') && (
        <div style={{ 
          background: 'rgba(15, 23, 42, 0.65)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '14px', 
          padding: '1.5rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--secondary)' }}>
              📊 Bar Chart Comparison
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Max Score: 5.00
            </span>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'flex-end', 
            height: '180px', 
            background: 'rgba(0,0,0,0.2)', 
            padding: '1.25rem 1rem 0.75rem 1rem', 
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {data.map((d) => {
              const barHeight = Math.max(5, (d.util / 5.0) * 100);

              return (
                <div 
                  key={d.uid} 
                  style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    height: '100%',
                    justifyContent: 'flex-end'
                  }}
                >
                  {/* Score Above Bar */}
                  <div style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold', 
                    color: '#38bdf8', 
                    marginBottom: '0.35rem' 
                  }}>
                    {d.util.toFixed(2)}
                  </div>

                  {/* Vertical Bar */}
                  <div 
                    style={{ 
                      width: '75%', 
                      maxWidth: '45px',
                      height: `${barHeight}%`, 
                      background: 'linear-gradient(to top, var(--primary), #4facfe)', 
                      borderRadius: '6px 6px 0 0', 
                      transition: 'all 0.4s ease',
                      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                    }}
                    title={`${d.label}: ${d.util.toFixed(2)} / 5.0 (${d.percentage}%)`}
                  ></div>

                  {/* Member Label Below Bar */}
                  <div style={{ 
                    marginTop: '0.6rem', 
                    fontSize: '0.8rem', 
                    fontWeight: '600',
                    color: '#cbd5e1', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {d.label}
                  </div>

                  {/* Percentage Below Label */}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {d.percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
