import React, { useEffect, useState } from 'react';
import { COMPETENCY_CATEGORIES, DeveloperMatrix, formatConfidenceColor, getLevelName } from '../types/matrix';

interface ComparisonMatrixProps {
  developers: string[];
  onClose: () => void;
}

interface ComparisonData {
  developer: string;
  matrix: DeveloperMatrix;
}

const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({ 
  developers, 
  onClose 
}) => {
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<any>(null);

  useEffect(() => {
    fetchComparisonData();
  }, [developers]);

  const fetchComparisonData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const promises = developers.map(async (developer) => {
        const response = await fetch(`http://localhost:3001/api/matrix/developer/${developer}`);
        const result = await response.json();
        
        if (result.success) {
          return {
            developer,
            matrix: result.data
          };
        }
        throw new Error(result.error || 'Failed to fetch developer data');
      });

      const results = await Promise.all(promises);
      setComparisonData(results);
    } catch (err) {
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const renderComparisonCell = (comparison: ComparisonData, category: string, row: any, level: number) => {
    // Add null checks and array validation
    if (!comparison || !comparison.matrix || !comparison.matrix.categories || !Array.isArray(comparison.matrix.categories)) {
      return null;
    }
    
    const categoryData = comparison.matrix.categories.find(c => c.category === category);
    if (!categoryData) return null;
    
    const rowData = categoryData.rows.find(r => r.row === row.id);
    if (!rowData) return null;
    
    const cell = rowData.levels[level];
    const isEmpty = !cell;
    
    return (
      <div
        key={`${comparison.developer}-${category}-${row.id}-${level}`}
        className={`
          w-10 h-10 border border-gray-200 rounded flex items-center justify-center text-xs font-semibold cursor-pointer transition-colors
          ${isEmpty ? 'bg-gray-50 hover:bg-gray-100' : ''}
          ${!isEmpty ? 'hover:scale-105 shadow-sm' : ''}
        `}
        style={!isEmpty ? {
          backgroundColor: formatConfidenceColor(cell.confidence),
          color: 'white'
        } : {}}
        onClick={() => !isEmpty && setSelectedCell({ ...cell, developer: comparison.developer })}
        title={!isEmpty ? `${comparison.developer} - ${getLevelName(level)} - Confidence: ${(cell.confidence * 100).toFixed(1)}%` : 'No data'}
      >
        {!isEmpty ? level : ''}
      </div>
    );
  };

  const renderComparisonRow = (category: string, row: any) => {
    if (comparisonData.length === 0) return null;
    
    return (
      <div key={row.id} className="flex items-center gap-2">
        <div className="w-40 text-sm font-medium text-gray-700 truncate" title={row.displayName}>
          {row.displayName}
        </div>
        <div className="flex gap-2">
          {comparisonData.map(comparison => (
            <div key={comparison.developer} className="flex gap-0.5">
              {[1, 2, 3, 4].map(level => 
                renderComparisonCell(comparison, category, row, level)
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComparisonCategory = (category: any) => {
    if (comparisonData.length === 0) return null;
    
    return (
      <div key={category.category} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">{category.displayName}</h3>
          <div className="text-sm text-gray-500">
            {comparisonData.length} developers
          </div>
        </div>
        
        <div className="space-y-2">
          {category.rows.map((row: any) => renderComparisonRow(category.category, row))}
        </div>
      </div>
    );
  };

  const renderComparisonHeaders = () => {
    if (comparisonData.length === 0) return null;
    
    return (
      <div className="flex items-center gap-2 mb-4 px-40">
        <div className="w-40"></div> {/* Spacer for row names */}
        {comparisonData.map(comparison => (
          <div key={comparison.developer} className="flex flex-col items-center">
            <div className="text-sm font-medium text-gray-700 text-center mb-1">
              {comparison.developer.length > 15 
                ? comparison.developer.substring(0, 15) + '...' 
                : comparison.developer}
            </div>
            <div className="text-xs text-gray-500 mb-1">
              Avg: {(comparison.matrix.summary.averageConfidence * 100).toFixed(1)}%
            </div>
            <div className="flex gap-0.5">
              <div className="w-4 h-4 text-xs text-center text-gray-400">1</div>
              <div className="w-4 h-4 text-xs text-center text-gray-400">2</div>
              <div className="w-4 h-4 text-xs text-center text-gray-400">3</div>
              <div className="w-4 h-4 text-xs text-center text-gray-400">4</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderComparisonSummary = () => {
    if (comparisonData.length === 0) return null;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Developer Comparison</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {comparisonData.map(comparison => (
            <div key={comparison.developer} className="text-center">
              <div className="text-sm font-medium text-gray-700 truncate" title={comparison.developer}>
                {comparison.developer.length > 12 
                  ? comparison.developer.substring(0, 12) + '...' 
                  : comparison.developer}
              </div>
              <div className="text-lg font-bold text-gray-900">
                {(comparison.matrix.summary.averageConfidence * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                {comparison.matrix.summary.totalScores} scores
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-gray-600">Loading comparison data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Developer Comparison</h2>
              <p className="text-sm text-gray-600 mt-1">
                Comparing {developers.length} developers
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
              {renderComparisonSummary()}
              {renderComparisonHeaders()}
              
              <div className="space-y-4">
                {Object.values(COMPETENCY_CATEGORIES).map(category => 
                  renderComparisonCategory(category)
                )}
              </div>
            </>
          )}
        </div>

        {selectedCell && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Competency Details</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Developer:</strong> {selectedCell.developer}</div>
                <div><strong>Category:</strong> {selectedCell.category}</div>
                <div><strong>Row:</strong> {selectedCell.row}</div>
                <div><strong>Level:</strong> {getLevelName(selectedCell.level)}</div>
                <div><strong>Confidence:</strong> {(selectedCell.confidence * 100).toFixed(1)}%</div>
                <div><strong>Evidence Count:</strong> {selectedCell.evidenceCount}</div>
                <div><strong>Last Updated:</strong> {new Date(selectedCell.lastUpdated).toLocaleDateString()}</div>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonMatrix;
