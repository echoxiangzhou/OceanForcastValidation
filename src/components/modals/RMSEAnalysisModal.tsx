import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

interface ArgoStation {
  id: string;
  lat: number;
  lon: number;
  status: 'active' | 'inactive';
  lastProfile: string;
  profiles: number;
  region: string;
}

interface RMSEAnalysisModalProps {
  station: ArgoStation;
  forecastStartDate: string;
  selectedVariable: string;
  onClose: () => void;
}

interface RMSEData {
  leadTime: number[];
  rmse: number[];
  bias?: number[];
  correlation?: number[];
}

interface ProfileRMSE {
  depth: number[];
  rmse: number[];
}

const RMSEAnalysisModal: React.FC<RMSEAnalysisModalProps> = ({
  station,
  forecastStartDate,
  selectedVariable,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [rmseData, setRmseData] = useState<RMSEData | null>(null);
  const [profileData, setProfileData] = useState<ProfileRMSE | null>(null);
  const [selectedLeadTime, setSelectedLeadTime] = useState(1);
  
  // 基于rmse_plot.py的深度分层
  const depthBins = [
    5, 10, 16, 22, 28, 34, 40, 46, 52, 59, 66, 73, 80, 87, 94, 101,
    113, 125, 137, 149, 161, 173, 185, 197, 217, 237, 257, 277, 297,
    322, 347, 372, 397, 422, 447, 472, 497, 522, 547, 572, 602, 634
  ];

  // 模拟RMSE数据加载
  useEffect(() => {
    const loadRMSEData = async () => {
      setLoading(true);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟生成RMSE数据（基于rmse_plot.py的逻辑）
      const leadTimes = Array.from({length: 10}, (_, i) => i + 1);
      const mockRmseData: RMSEData = {
        leadTime: leadTimes,
        rmse: generateMockRMSE(selectedVariable, leadTimes),
        bias: generateMockBias(selectedVariable, leadTimes),
        correlation: generateMockCorrelation(selectedVariable, leadTimes)
      };
      
      // 剖面数据（仅对T和S变量）
      const mockProfileData: ProfileRMSE | null = ['T', 'S'].includes(selectedVariable) ? {
        depth: depthBins,
        rmse: generateMockProfileRMSE(selectedVariable, depthBins, selectedLeadTime)
      } : null;
      
      setRmseData(mockRmseData);
      setProfileData(mockProfileData);
      setLoading(false);
    };

    loadRMSEData();
  }, [selectedVariable, station, forecastStartDate, selectedLeadTime]);

  // 生成模拟RMSE数据的函数
  const generateMockRMSE = (variable: string, leadTimes: number[]): number[] => {
    const baseRMSE = {
      'T': 0.8, 'S': 0.12, 'SST': 0.75, 'SLA': 0.08, 'U': 0.15, 'V': 0.14
    }[variable] || 1.0;
    
    return leadTimes.map(lt => 
      baseRMSE + (lt - 1) * 0.02 + Math.random() * 0.1 - 0.05
    );
  };

  const generateMockBias = (variable: string, leadTimes: number[]): number[] => {
    return leadTimes.map(lt => 
      (Math.random() - 0.5) * 0.2 + lt * 0.01
    );
  };

  const generateMockCorrelation = (variable: string, leadTimes: number[]): number[] => {
    return leadTimes.map(lt => 
      0.95 - (lt - 1) * 0.02 + (Math.random() - 0.5) * 0.05
    );
  };

  const generateMockProfileRMSE = (variable: string, depths: number[], leadTime: number): number[] => {
    const surfaceRMSE = variable === 'T' ? 0.8 : 0.12;
    return depths.map(depth => {
      const depthEffect = Math.exp(-depth / 200); // 表层误差较大，深层较小
      const leadEffect = 1 + (leadTime - 1) * 0.1; // 预报时效越长误差越大
      return surfaceRMSE * depthEffect * leadEffect + Math.random() * 0.1;
    });
  };

  const getVariableInfo = (varId: string) => {
    const info = {
      'T': { name: '温度剖面', unit: '°C', color: '#EF4444' },
      'S': { name: '盐度剖面', unit: 'PSU', color: '#3B82F6' },
      'SST': { name: '海面温度', unit: '°C', color: '#F59E0B' },
      'SLA': { name: '海面高度异常', unit: 'm', color: '#10B981' },
      'U': { name: '东向流速', unit: 'm/s', color: '#8B5CF6' },
      'V': { name: '北向流速', unit: 'm/s', color: '#EC4899' }
    };
    return info[varId as keyof typeof info] || { name: '未知', unit: '', color: '#6B7280' };
  };

  const varInfo = getVariableInfo(selectedVariable);

  return (
    <div className="rmse-modal-overlay">
      <style jsx>{`
        .rmse-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .modal-content {
          background: rgba(255, 255, 255, 0.98);
          border-radius: 12px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(177, 212, 224, 0.3);
          width: 100%;
          max-width: 1200px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: 1.5rem 2rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-bottom: 1px solid rgba(177, 212, 224, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #0c2d48;
          margin: 0;
        }

        .station-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          color: #6B7280;
          margin-top: 0.5rem;
        }

        .close-button {
          width: 40px;
          height: 40px;
          border: none;
          background: rgba(107, 114, 128, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6B7280;
          font-size: 1.25rem;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          transform: scale(1.1);
        }

        .modal-body {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .chart-container {
          background: white;
          border: 1px solid rgba(177, 212, 224, 0.2);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #0c2d48;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 400px;
          flex-direction: column;
          gap: 1rem;
          color: #6B7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(46, 139, 192, 0.3);
          border-radius: 50%;
          border-top: 3px solid #2e8bc0;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {varInfo.name} RMSE 分析 - 站位 {station.id}
            </h2>
            <div className="station-info">
              <span>📍 {station.lat.toFixed(2)}°N, {station.lon.toFixed(2)}°E</span>
              <span>📅 预报起报: {forecastStartDate}</span>
              <span>🌊 {station.region}</span>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>正在计算RMSE数据...</p>
              <p style={{fontSize: '0.75rem', opacity: 0.7}}>
                处理预报时效 1-10天的验证数据
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              {/* RMSE vs 预报时效图 */}
              <div className="chart-container">
                <div className="chart-title">
                  RMSE vs 预报时效
                  <span style={{
                    fontSize: '0.75rem',
                    color: varInfo.color,
                    backgroundColor: `${varInfo.color}20`,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    {varInfo.unit}
                  </span>
                </div>
                {rmseData && (
                  <div style={{ height: '350px' }}>
                    <Plot
                      data={[
                        {
                          x: rmseData.leadTime,
                          y: rmseData.rmse,
                          type: 'scatter',
                          mode: 'lines+markers',
                          name: `RMSE (${varInfo.unit})`,
                          line: { color: varInfo.color, width: 3 },
                          marker: { size: 6, color: varInfo.color }
                        },
                        ...(rmseData.bias ? [{
                          x: rmseData.leadTime,
                          y: rmseData.bias,
                          type: 'scatter',
                          mode: 'lines+markers',
                          name: `偏差 (${varInfo.unit})`,
                          yaxis: 'y2',
                          line: { color: '#F59E0B', width: 2 },
                          marker: { size: 4, color: '#F59E0B' }
                        }] : []),
                        ...(rmseData.correlation ? [{
                          x: rmseData.leadTime,
                          y: rmseData.correlation,
                          type: 'scatter',
                          mode: 'lines+markers',
                          name: '相关系数',
                          yaxis: 'y3',
                          line: { color: '#10B981', width: 2 },
                          marker: { size: 4, color: '#10B981' }
                        }] : [])
                      ]}
                      layout={{
                        width: undefined,
                        height: 350,
                        margin: { l: 60, r: 60, t: 30, b: 50 },
                        xaxis: {
                          title: '预报时效 (天)',
                          showgrid: true,
                          gridcolor: 'rgba(0,0,0,0.1)'
                        },
                        yaxis: {
                          title: `RMSE (${varInfo.unit})`,
                          showgrid: true,
                          gridcolor: 'rgba(0,0,0,0.1)',
                          titlefont: { color: varInfo.color },
                          tickfont: { color: varInfo.color }
                        },
                        ...(rmseData.bias && {
                          yaxis2: {
                            title: `偏差 (${varInfo.unit})`,
                            overlaying: 'y',
                            side: 'right',
                            position: 0.85,
                            titlefont: { color: '#F59E0B' },
                            tickfont: { color: '#F59E0B' }
                          }
                        }),
                        ...(rmseData.correlation && {
                          yaxis3: {
                            title: '相关系数',
                            overlaying: 'y',
                            side: 'right',
                            position: 1,
                            titlefont: { color: '#10B981' },
                            tickfont: { color: '#10B981' }
                          }
                        }),
                        showlegend: true,
                        legend: {
                          x: 0.02,
                          y: 0.98,
                          bgcolor: 'rgba(255,255,255,0.8)',
                          bordercolor: 'rgba(0,0,0,0.1)',
                          borderwidth: 1
                        },
                        font: { size: 11 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)'
                      }}
                      config={{ displayModeBar: false, responsive: true }}
                      useResizeHandler={true}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                )}
              </div>

              {/* RMSE vs 深度剖面图 (仅对T和S变量) */}
              {profileData && (
                <div className="chart-container">
                  <div className="chart-title">
                    RMSE vs 深度剖面
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6B7280',
                      backgroundColor: 'rgba(107, 114, 128, 0.1)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      预报时效: {selectedLeadTime} 天
                    </span>
                  </div>
                  <div style={{ height: '350px' }}>
                    <Plot
                      data={[{
                        x: profileData.rmse,
                        y: profileData.depth,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: `${varInfo.name} RMSE`,
                        line: { color: varInfo.color, width: 3 },
                        marker: { size: 4, color: varInfo.color },
                        orientation: 'h'
                      }]}
                      layout={{
                        width: undefined,
                        height: 350,
                        margin: { l: 60, r: 30, t: 30, b: 50 },
                        xaxis: {
                          title: `RMSE (${varInfo.unit})`,
                          showgrid: true,
                          gridcolor: 'rgba(0,0,0,0.1)'
                        },
                        yaxis: {
                          title: '深度 (m)',
                          showgrid: true,
                          gridcolor: 'rgba(0,0,0,0.1)',
                          autorange: 'reversed' // 深度轴向下为正
                        },
                        showlegend: false,
                        font: { size: 11 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)'
                      }}
                      config={{ displayModeBar: false, responsive: true }}
                      useResizeHandler={true}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                  {/* 预报时效选择器 */}
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.75rem' }}>
                      选择预报时效查看不同时效下的深度剖面RMSE
                    </p>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(5, 1fr)', 
                      gap: '0.5rem',
                      maxWidth: '400px',
                      margin: '0 auto'
                    }}>
                      {Array.from({length: 10}, (_, i) => i + 1).map(day => (
                        <button
                          key={day}
                          onClick={() => setSelectedLeadTime(day)}
                          style={{
                            padding: '0.5rem',
                            border: selectedLeadTime === day ? `2px solid ${varInfo.color}` : '1px solid rgba(177, 212, 224, 0.3)',
                            background: selectedLeadTime === day ? `${varInfo.color}20` : 'rgba(255, 255, 255, 0.5)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            color: selectedLeadTime === day ? varInfo.color : '#6B7280',
                            fontWeight: selectedLeadTime === day ? '600' : '400'
                          }}
                        >
                          {day}天
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RMSEAnalysisModal;