import React, { useEffect, useState } from 'react';
import { getLevelName } from '../types/matrix';

interface TrendData {
  date: string;
  level: number;
  confidence: number;
  evidenceCount: number;
}

interface TrendVisualizationProps {
  developer: string;
  category: string;
  row: string;
  onClose: () => void;
}

const TrendVisualization: React.FC<TrendVisualizationProps> = ({ 
  developer, 
  category, 
  row, 
  onClose 
}) => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendData();
  }, [developer, category, row]);

  const fetchTrendData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock API call - in real implementation this would fetch historical data
      // Generate mock trend data for the last 6 months
      const mockData: TrendData[] = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        
        // Simulate progression with some randomness
        const baseLevel = 2;
        const progression = Math.max(0, (5 - i) * 0.3 + Math.random() * 0.5);
        const level = Math.min(4, Math.floor(baseLevel + progression));
        const confidence = Math.min(0.95, 0.4 + progression * 0.1 + Math.random() * 0.1);
        const evidenceCount = Math.max(1, Math.floor(progression * 3 + Math.random() * 2));
        
        mockData.push({
          date: date.toISOString(),
          level,
          confidence,
          evidenceCount
        });
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setTrendData(mockData);
    } catch (err) {
      setError('Failed to load trend data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: '2-digit' 
    });
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return '#ef4444';
      case 2: return '#f59e0b';
      case 3: return '#10b981';
      case 4: return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#10b981';
    if (confidence >= 0.6) return '#f59e0b';
    if (confidence >= 0.4) return '#f97316';
    return '#ef4444';
  };

  const renderTrendChart = () => {
    if (trendData.length === 0) return null;

    const maxEvidence = Math.max(...trendData.map(d => d.evidenceCount));
    const chartHeight = 200;
    const chartWidth = 600;
    const padding = 40;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Competency Progression</h4>
        
        <div className="mb-6">
          <svg width={chartWidth} height={chartHeight} className="w-full">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
              <line
                key={ratio}
                x1={padding}
                y1={padding + (chartHeight - 2 * padding) * (1 - ratio)}
                x2={chartWidth - padding}
                y2={padding + (chartHeight - 2 * padding) * (1 - ratio)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {/* Level line */}
            <polyline
              points={trendData.map((data, index) => {
                const x = padding + (chartWidth - 2 * padding) * (index / (trendData.length - 1));
                const y = padding + (chartHeight - 2 * padding) * (1 - data.level / 4);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
            
            {/* Level points */}
            {trendData.map((data, index) => {
              const x = padding + (chartWidth - 2 * padding) * (index / (trendData.length - 1));
              const y = padding + (chartHeight - 2 * padding) * (1 - data.level / 4);
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={getLevelColor(data.level)}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
            
            {/* X-axis labels */}
            {trendData.map((data, index) => {
              const x = padding + (chartWidth - 2 * padding) * (index / (trendData.length - 1));
              return (
                <text
                  key={index}
                  x={x}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {formatDate(data.date)}
                </text>
              );
            })}
            
            {/* Y-axis labels */}
            {[1, 2, 3, 4].map(level => {
              const y = padding + (chartHeight - 2 * padding) * (1 - level / 4);
              return (
                <text
                  key={level}
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-600"
                >
                  {getLevelName(level)}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Confidence Trend</h5>
            <div className="space-y-2">
              {trendData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{formatDate(data.date)}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${data.confidence * 100}%`,
                          backgroundColor: getConfidenceColor(data.confidence)
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-700 w-10">
                      {(data.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Evidence Growth</h5>
            <div className="space-y-2">
              {trendData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{formatDate(data.date)}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${(data.evidenceCount / maxEvidence) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-700 w-10">
                      {data.evidenceCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-gray-600">Loading trend data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Competency Trends</h2>
              <p className="text-sm text-gray-600 mt-1">
                {developer} • {category} • {row}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-600">Error: {error}</div>
            </div>
          ) : (
            <>
              {renderTrendChart()}
              
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Key Insights</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Current Level:</span>
                    <span className="ml-2 font-medium">
                      {trendData.length > 0 ? getLevelName(trendData[trendData.length - 1].level) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Progression:</span>
                    <span className="ml-2 font-medium">
                      {trendData.length > 1 
                        ? `+${trendData[trendData.length - 1].level - trendData[0].level} levels`
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Evidence Growth:</span>
                    <span className="ml-2 font-medium">
                      {trendData.length > 1 
                        ? `+${trendData[trendData.length - 1].evidenceCount - trendData[0].evidenceCount} items`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendVisualization;
