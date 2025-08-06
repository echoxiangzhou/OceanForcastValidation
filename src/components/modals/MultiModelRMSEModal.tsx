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

interface MultiModelRMSEModalProps {
  station: ArgoStation;
  forecastStartDate: string;
  selectedVariable: string;
  onClose: () => void;
}

interface ModelRMSEData {
  leadTime: number[];
  WenHai: number[];
  GLO12: number[];
  OIS: number[];
}

const MultiModelRMSEModal: React.FC<MultiModelRMSEModalProps> = ({
  station,
  forecastStartDate,
  selectedVariable,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [rmseData, setRmseData] = useState<ModelRMSEData | null>(null);

  // 基于图片的变量配置
  const variableConfigs = {
    'T': { 
      title: 'Temperature profile', 
      unit: '°C', 
      yRange: [0.62, 0.74],
      description: '温度剖面RMSE对比'
    },
    'S': { 
      title: 'Salinity profile', 
      unit: 'PSU', 
      yRange: [0.095, 0.107],
      description: '盐度剖面RMSE对比'
    },
    'SST': { 
      title: 'SST', 
      unit: '°C', 
      yRange: [0.45, 0.65],
      description: '海表温度RMSE对比'
    },
    'SLA': { 
      title: 'SLA', 
      unit: 'm', 
      yRange: [0.0748, 0.0876],
      description: '海面高度异常RMSE对比'
    },
    'U': { 
      title: '15-m zonal current', 
      unit: 'm/s', 
      yRange: [0.189, 0.225],
      description: '15米深度东向流速RMSE对比'
    },
    'V': { 
      title: '15-m meridional current', 
      unit: 'm/s', 
      yRange: [0.177, 0.222],
      description: '15米深度北向流速RMSE对比'
    }
  };

  // 模拟多模型RMSE数据生成
  useEffect(() => {
    const loadMultiModelRMSEData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const leadTimes = Array.from({length: 10}, (_, i) => i + 1);
      const config = variableConfigs[selectedVariable as keyof typeof variableConfigs];
      
      if (!config) return;

      // 基于图片数据模拟真实的RMSE曲线
      const mockData: ModelRMSEData = {
        leadTime: leadTimes,
        WenHai: generateModelRMSE('WenHai', selectedVariable, leadTimes, config),
        GLO12: generateModelRMSE('GLO12', selectedVariable, leadTimes, config),
        OIS: generateModelRMSE('2O1S', selectedVariable, leadTimes, config)
      };
      
      setRmseData(mockData);
      setLoading(false);
    };

    loadMultiModelRMSEData();
  }, [selectedVariable, station, forecastStartDate]);

  // 生成符合图片特征的模型RMSE数据
  const generateModelRMSE = (model: string, variable: string, leadTimes: number[], config: any): number[] => {
    const { yRange } = config;
    const [minY, maxY] = yRange;
    
    return leadTimes.map(lt => {
      let baseValue, growth, noise;
      
      // 基于图片中的模式生成数据
      switch (model) {
        case 'WenHai': // 蓝线 - 通常性能最好
          baseValue = minY + (maxY - minY) * 0.1;
          growth = (maxY - minY) * 0.6 * (lt - 1) / 9;
          noise = (Math.random() - 0.5) * (maxY - minY) * 0.02;
          break;
        case 'GLO12': // 红线 - 通常误差较大
          baseValue = minY + (maxY - minY) * 0.15;
          growth = (maxY - minY) * 0.8 * (lt - 1) / 9;
          noise = (Math.random() - 0.5) * (maxY - minY) * 0.03;
          break;
        case '2O1S': // 青色线 - 中等性能
          baseValue = minY + (maxY - minY) * 0.05;
          growth = (maxY - minY) * 0.7 * (lt - 1) / 9;
          noise = (Math.random() - 0.5) * (maxY - minY) * 0.025;
          break;
        default:
          baseValue = minY;
          growth = (maxY - minY) * 0.5 * (lt - 1) / 9;
          noise = 0;
      }
      
      return Math.max(minY, Math.min(maxY, baseValue + growth + noise));
    });
  };

  const config = variableConfigs[selectedVariable as keyof typeof variableConfigs];
  
  if (!config) {
    return null;
  }

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
          max-width: 900px;
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
          margin-bottom: 1rem;
        }

        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #0c2d48;
          margin: 0 0 1rem 0;
          text-align: center;
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

        .station-info {
          text-align: center;
          font-size: 0.875rem;
          color: #6B7280;
          margin-top: 0.5rem;
        }

        .legend-info {
          text-align: center;
          font-size: 0.75rem;
          color: #6B7280;
          margin-top: 1rem;
          padding: 0.75rem;
          background: rgba(177, 212, 224, 0.1);
          border-radius: 6px;
        }
      `}</style>

      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {config.description} - 站位 {station.id}
            </h2>
            <div className="station-info">
              📍 {station.lat.toFixed(2)}°N, {station.lon.toFixed(2)}°E | 
              📅 预报起报: {forecastStartDate} | 
              🌊 {station.region}
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
              <p>正在加载多模型RMSE对比数据...</p>
            </div>
          ) : (
            <div>
              <div className="chart-container">
                <div className="chart-title">{config.title}</div>
                {rmseData && (
                  <Plot
                    data={[
                      {
                        x: rmseData.leadTime,
                        y: rmseData.WenHai,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'WenHai1.0',
                        line: { color: '#1f77b4', width: 2.5 },
                        marker: { size: 4, color: '#1f77b4' }
                      },
                      {
                        x: rmseData.leadTime,
                        y: rmseData.GLO12,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'GLO12',
                        line: { color: '#ff7f0e', width: 2.5 },
                        marker: { size: 4, color: '#ff7f0e' }
                      },
                      {
                        x: rmseData.leadTime,
                        y: rmseData.OIS,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: '2O1S',
                        line: { color: '#2ca02c', width: 2.5 },
                        marker: { size: 4, color: '#2ca02c' }
                      }
                    ]}
                    layout={{
                      width: 800,
                      height: 400,
                      margin: { l: 80, r: 60, t: 20, b: 60 },
                      xaxis: {
                        title: 'Lead Time (days)',
                        showgrid: true,
                        gridcolor: 'rgba(0,0,0,0.1)',
                        range: [0, 10],
                        dtick: 2
                      },
                      yaxis: {
                        title: `RMSE (${config.unit})`,
                        showgrid: true,
                        gridcolor: 'rgba(0,0,0,0.1)',
                        range: config.yRange
                      },
                      showlegend: true,
                      legend: {
                        x: 0.02,
                        y: 0.98,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        bordercolor: 'rgba(0,0,0,0.1)',
                        borderwidth: 1
                      },
                      font: { size: 12 },
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)'
                    }}
                    config={{ displayModeBar: false, responsive: false }}
                  />
                )}
              </div>
              
              <div className="legend-info">
                <strong>模型对比说明：</strong><br/>
                <span style={{color: '#1f77b4'}}>■</span> WenHai1.0 - 问海海洋预报系统 1.0版本<br/>
                <span style={{color: '#ff7f0e'}}>■</span> GLO12 - 全球海洋预报系统<br/>
                <span style={{color: '#2ca02c'}}>■</span> 2O1S - 替代预报系统<br/>
                RMSE值越小表示预报精度越高
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiModelRMSEModal;