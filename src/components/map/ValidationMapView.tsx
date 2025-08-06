import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 修复Leaflet默认图标问题
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ArgoStation {
  id: string;
  lat: number;
  lon: number;
  status: 'active' | 'inactive';
  lastProfile: string;
  profiles: number;
  region: string;
}

interface ValidationMapViewProps {
  stations: ArgoStation[];
  onStationClick: (station: ArgoStation) => void;
  selectedVariable: string;
}

const ValidationMapView: React.FC<ValidationMapViewProps> = ({ 
  stations, 
  onStationClick, 
  selectedVariable 
}) => {
  // 创建自定义图标
  const createStationIcon = (station: ArgoStation) => {
    const color = station.status === 'active' ? '#059669' : '#9CA3AF';
    const size = station.profiles > 150 ? 12 : 10;
    
    return L.divIcon({
      className: 'custom-station-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background-color: ${color};
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          position: relative;
        ">
          ${station.status === 'active' ? `
            <div style="
              position: absolute;
              top: -2px;
              right: -2px;
              width: 4px;
              height: 4px;
              background-color: #10B981;
              border-radius: 50%;
              animation: pulse 2s infinite;
            "></div>
          ` : ''}
        </div>
      `,
      iconSize: [size + 4, size + 4],
      iconAnchor: [(size + 4) / 2, (size + 4) / 2],
    });
  };

  // 获取变量描述
  const getVariableDescription = (varId: string) => {
    const descriptions: { [key: string]: string } = {
      'T': '温度剖面验证',
      'S': '盐度剖面验证',
      'SST': '海面温度验证',
      'SLA': '海面高度异常验证',
      'U': '东向流速验证',
      'V': '北向流速验证'
    };
    return descriptions[varId] || '未知验证要素';
  };

  return (
    <div style={{ width: '100%', height: 'calc(100% - 60px)', position: 'relative' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        
        .leaflet-container {
          background: #1f2937 !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        .custom-station-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95) !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
        }
        
        .leaflet-popup-content {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .leaflet-popup-close-button {
          color: #6B7280 !important;
          font-size: 18px !important;
        }
        
        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95) !important;
        }
        
        .leaflet-control-zoom a {
          background: rgba(255, 255, 255, 0.9) !important;
          color: #374151 !important;
          border: 1px solid rgba(177, 212, 224, 0.3) !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: white !important;
          color: #145da0 !important;
        }
      `}</style>
      
      <MapContainer
        center={[28.0, 120.0]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        />
        
        {stations.map((station) => (
          <Marker
            key={station.id}
            position={[station.lat, station.lon]}
            icon={createStationIcon(station)}
            eventHandlers={{
              click: () => onStationClick(station),
            }}
          >
            <Popup className="station-popup">
              <div style={{
                padding: '1rem',
                minWidth: '280px',
                fontFamily: 'Inter, sans-serif'
              }}>
                {/* 站位头部信息 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(177, 212, 224, 0.2)'
                }}>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#0c2d48'
                    }}>
                      站位 {station.id}
                    </h3>
                    <p style={{
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.75rem',
                      color: '#6B7280'
                    }}>
                      {station.region}
                    </p>
                  </div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.6875rem',
                    fontWeight: 500,
                    backgroundColor: station.status === 'active' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                    color: station.status === 'active' ? '#059669' : '#6B7280',
                    border: `1px solid ${station.status === 'active' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(156, 163, 175, 0.2)'}`
                  }}>
                    {station.status === 'active' ? '活跃' : '停止'}
                  </span>
                </div>

                {/* 站位详细信息 */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#374151'
                  }}>
                    <div>
                      <strong>纬度:</strong> {station.lat.toFixed(2)}°N
                    </div>
                    <div>
                      <strong>经度:</strong> {station.lon.toFixed(2)}°E
                    </div>
                    <div>
                      <strong>剖面数:</strong> {station.profiles}
                    </div>
                    <div>
                      <strong>最新数据:</strong> {station.lastProfile.split(' ')[0]}
                    </div>
                  </div>
                </div>

                {/* 当前验证要素 */}
                <div style={{
                  background: 'rgba(46, 139, 192, 0.1)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    marginBottom: '0.25rem'
                  }}>
                    当前验证要素
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#145da0'
                  }}>
                    {getVariableDescription(selectedVariable)}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #145da0 0%, #2e8bc0 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStationClick(station);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 93, 160, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    查看RMSE分析
                  </button>
                  <button
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(46, 139, 192, 0.1)',
                      color: '#145da0',
                      border: '1px solid rgba(46, 139, 192, 0.3)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(46, 139, 192, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(46, 139, 192, 0.1)';
                    }}
                  >
                    详情
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ValidationMapView;