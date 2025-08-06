import React, { useState } from 'react';
import ValidationMapView from '../map/ValidationMapView';
import RMSEAnalysisModal from '../modals/RMSEAnalysisModal';
import MultiModelRMSEModal from '../modals/MultiModelRMSEModal';

interface ArgoStation {
  id: string;
  lat: number;
  lon: number;
  status: 'active' | 'inactive';
  lastProfile: string;
  profiles: number;
  region: string;
}

const ValidationView: React.FC = () => {
  const [selectedVariable, setSelectedVariable] = useState('T');
  
  // 默认验证时间范围：近10天
  const today = new Date();
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(today.getDate() - 10);
  
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: tenDaysAgo.toISOString().split('T')[0], // 10天前
    end: today.toISOString().split('T')[0]         // 今天
  });
  
  const [selectedStation, setSelectedStation] = useState<ArgoStation | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showMultiModelModal, setShowMultiModelModal] = useState(false);
  
  // 固定的预报起报日期
  const forecastStartDate = '2025-08-05';

  // 基于rmse_plot.py的变量配置
  const variables = [
    { id: 'T', label: '温度剖面 (T)', unit: '°C', description: '海水温度垂直剖面' },
    { id: 'S', label: '盐度剖面 (S)', unit: 'PSU', description: '海水盐度垂直剖面' },
    { id: 'SST', label: '海面温度 (SST)', unit: '°C', description: '海表面温度' },
    { id: 'SLA', label: '海面高度异常 (SLA)', unit: 'm', description: '海面高度异常' },
    { id: 'U', label: '东向流速 (U)', unit: 'm/s', description: '15米深度东向流速' },
    { id: 'V', label: '北向流速 (V)', unit: 'm/s', description: '15米深度北向流速' }
  ];

  // 模拟Argo站位数据
  const argoStations: ArgoStation[] = [
    { id: '2902123', lat: 25.45, lon: 119.85, status: 'active', lastProfile: '2025-08-05 14:30', profiles: 145, region: '东海' }, // 移至台湾海峡西侧
    { id: '2902124', lat: 24.78, lon: 122.35, status: 'active', lastProfile: '2025-08-05 12:15', profiles: 132, region: '东海' }, // 移至台湾东侧海域
    { id: '2902125', lat: 26.12, lon: 119.88, status: 'inactive', lastProfile: '2025-08-03 09:45', profiles: 89, region: '东海' },
    { id: '2902126', lat: 23.91, lon: 118.76, status: 'active', lastProfile: '2025-08-05 16:20', profiles: 178, region: '南海' },
    { id: '2902127', lat: 31.25, lon: 124.18, status: 'active', lastProfile: '2025-08-05 11:45', profiles: 203, region: '黄海' },
    { id: '2902128', lat: 37.82, lon: 121.55, status: 'active', lastProfile: '2025-08-05 09:30', profiles: 156, region: '渤海' },
    { id: '2902129', lat: 22.15, lon: 115.88, status: 'active', lastProfile: '2025-08-05 15:10', profiles: 234, region: '南海' },
    { id: '2902130', lat: 29.67, lon: 125.43, status: 'inactive', lastProfile: '2025-08-04 13:20', profiles: 98, region: '黄海' }
  ];

  const handleStationClick = (station: ArgoStation) => {
    setSelectedStation(station);
    setShowAnalysisModal(true);
  };

  const handleAnalysisClose = () => {
    setShowAnalysisModal(false);
    setSelectedStation(null);
  };

  const handleMultiModelClose = () => {
    setShowMultiModelModal(false);
    setSelectedStation(null);
  };

  const handleMultiModelAnalysis = () => {
    setShowMultiModelModal(true);
  };

  return (
    <div className="validation-view">
      <style jsx>{`
        .validation-view {
          display: flex;
          height: 100%;
          max-width: 100%;
          gap: 0;
        }

        .left-panel {
          width: 380px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(177, 212, 224, 0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-right: 1.5rem;
        }

        .panel-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(177, 212, 224, 0.2);
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .panel-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #0c2d48;
          margin: 0 0 1rem 0;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .stat-item {
          text-align: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
          border: 1px solid rgba(177, 212, 224, 0.2);
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #145da0;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #6B7280;
        }

        .control-section {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(177, 212, 224, 0.1);
        }

        .section-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0c2d48;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .control-group {
          margin-bottom: 1.5rem;
        }

        .control-label {
          display: block;
          font-size: 0.875rem;
          color: #374151;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .select-control, .input-control {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid rgba(177, 212, 224, 0.3);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.9);
          color: #0c2d48;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .select-control:focus, .input-control:focus {
          outline: none;
          border-color: #2e8bc0;
          box-shadow: 0 0 0 2px rgba(46, 139, 192, 0.1);
        }

        .variable-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .variable-card {
          padding: 0.75rem;
          border: 2px solid rgba(177, 212, 224, 0.2);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .variable-card:hover {
          border-color: rgba(177, 212, 224, 0.4);
          background: rgba(177, 212, 224, 0.05);
        }

        .variable-card.active {
          border-color: #2e8bc0;
          background: rgba(46, 139, 192, 0.1);
        }

        .variable-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0c2d48;
          margin-bottom: 0.25rem;
        }

        .variable-description {
          font-size: 0.6875rem;
          color: #6B7280;
          line-height: 1.2;
        }

        .map-container {
          flex: 1;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(177, 212, 224, 0.3);
          overflow: hidden;
          position: relative;
        }

        .map-header {
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-bottom: 1px solid rgba(177, 212, 224, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .map-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #0c2d48;
          margin: 0;
        }

        .map-legend {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.75rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-active {
          background: #059669;
        }

        .legend-inactive {
          background: #9CA3AF;
        }

        .action-section {
          padding: 1.5rem;
          margin-top: auto;
        }

        .action-button {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #145da0 0%, #2e8bc0 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 0.75rem;
        }

        .action-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .secondary-button {
          background: rgba(46, 139, 192, 0.1);
          color: #145da0;
          border: 1px solid #2e8bc0;
        }

        .secondary-button:hover {
          background: rgba(46, 139, 192, 0.2);
        }

        @media (max-width: 768px) {
          .validation-view {
            flex-direction: column;
          }
          
          .left-panel {
            width: 100%;
            margin-right: 0;
            margin-bottom: 1rem;
            max-height: 400px;
          }
          
          .variable-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* 左侧控制面板 */}
      <div className="left-panel">
        <div className="panel-header">
          <h2 className="panel-title">RMSE验证分析</h2>
          <div className="quick-stats">
            <div className="stat-item">
              <div className="stat-value">{argoStations.filter(s => s.status === 'active').length}</div>
              <div className="stat-label">活跃站位</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{variables.length}</div>
              <div className="stat-label">验证要素</div>
            </div>
          </div>
        </div>

        {/* 验证设置 */}
        <div className="control-section">
          <div className="section-title">验证设置</div>
          
          <div className="control-group">
            <label className="control-label">验证时间范围</label>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem'}}>
              <input 
                type="date"
                className="input-control"
                value={selectedDateRange.start}
                onChange={(e) => setSelectedDateRange(prev => ({...prev, start: e.target.value}))}
                placeholder="开始日期"
              />
              <input 
                type="date"
                className="input-control"
                value={selectedDateRange.end}
                onChange={(e) => setSelectedDateRange(prev => ({...prev, end: e.target.value}))}
                placeholder="结束日期"
              />
            </div>
          </div>
        </div>

        {/* 验证要素选择 */}
        <div className="control-section">
          <div className="section-title">验证要素</div>
          <div className="variable-grid">
            {variables.map(variable => (
              <div
                key={variable.id}
                className={`variable-card ${selectedVariable === variable.id ? 'active' : ''}`}
                onClick={() => setSelectedVariable(variable.id)}
              >
                <div className="variable-label">{variable.label}</div>
                <div className="variable-description">{variable.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="action-section">
          <button 
            className="action-button"
            onClick={() => {
              console.log('开始全部验证', { selectedVariable, selectedDateRange, forecastStartDate });
            }}
          >
            开始验证分析
          </button>
          <button 
            className="action-button secondary-button"
            onClick={handleMultiModelAnalysis}
          >
            多模型RMSE对比
          </button>
          <button className="action-button secondary-button">
            导出验证结果
          </button>
        </div>
      </div>

      {/* 右侧地图容器 */}
      <div className="map-container">
        <div className="map-header">
          <h3 className="map-title">Argo观测站位分布</h3>
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-dot legend-active"></div>
              <span>活跃站位</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot legend-inactive"></div>
              <span>停止站位</span>
            </div>
          </div>
        </div>
        
        <ValidationMapView 
          stations={argoStations}
          onStationClick={handleStationClick}
          selectedVariable={selectedVariable}
        />
      </div>

      {/* RMSE分析弹窗 */}
      {showAnalysisModal && selectedStation && (
        <RMSEAnalysisModal
          station={selectedStation}
          forecastStartDate={forecastStartDate}
          selectedVariable={selectedVariable}
          onClose={handleAnalysisClose}
        />
      )}

      {/* 多模型RMSE对比弹窗 */}
      {showMultiModelModal && (
        <MultiModelRMSEModal
          station={selectedStation || argoStations[0]}
          forecastStartDate={forecastStartDate}
          selectedVariable={selectedVariable}
          onClose={handleMultiModelClose}
        />
      )}
    </div>
  );
};

export default ValidationView;