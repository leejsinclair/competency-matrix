import React, { useEffect, useState } from 'react';
import type { DeveloperMatrix, MatrixCategory, MatrixRow } from '../types/matrix';
import { formatConfidenceColor, getLevelColor, getLevelName } from '../types/matrix';
import EvidenceModal from './EvidenceModal';

interface CompetencyMatrixProps {
  developerId?: string;
  viewMode?: 'individual' | 'team';
  filterCategory?: string;
  searchTerm?: string;
}

const CompetencyMatrix: React.FC<CompetencyMatrixProps> = ({ 
  developerId, 
  viewMode = 'individual' 
}) => {
  const [matrix, setMatrix] = useState<DeveloperMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [availableDevelopers, setAvailableDevelopers] = useState<string[]>([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>(developerId || '');
  
  // Debug state changes
  useEffect(() => {
    console.log('📊 AvailableDevelopers state updated:', availableDevelopers);
    console.log('📊 SelectedDeveloper state updated:', selectedDeveloper);
  }, [availableDevelopers, selectedDeveloper]);

  useEffect(() => {
    if (viewMode === 'individual') {
      fetchAvailableDevelopers();
    }
    fetchMatrixData();
  }, [developerId, viewMode, selectedDeveloper]);

  // Transform API data format to frontend expected format
  const transformApiDataToMatrixFormat = (apiData: any): DeveloperMatrix | null => {
    console.log('🔄 Transforming API data:', apiData);
    
    if (!apiData || !apiData.categories) {
      console.warn('❌ Invalid API data structure:', apiData);
      return null;
    }

    // Convert categories from object to array format
    const categoriesArray: MatrixCategory[] = Object.entries(apiData.categories).map(([categoryKey, categoryData]: [string, any]) => {
      const categoryInfo = COMPETENCY_CATEGORIES[categoryKey as keyof typeof COMPETENCY_CATEGORIES];
      if (!categoryInfo) {
        console.warn('⚠️ Unknown category:', categoryKey);
        return null;
      }

      console.log(`📊 Processing category: ${categoryKey}`, categoryData);

      // Backend provides array of competency objects, frontend expects category object with rows
      const competencyRows = categoryData as any[];
      const totalScores = competencyRows.length;
      
      if (totalScores === 0) {
        console.warn(`⚠️ No competency data for category: ${categoryKey}`);
        return {
          category: categoryKey,
          displayName: categoryInfo.displayName,
          rows: [],
          summary: {
            totalScores: 0,
            averageConfidence: 0,
            averageLevel: 0
          }
        };
      }
      
      const averageConfidence = competencyRows.reduce((sum, row) => sum + row.confidence, 0) / totalScores;
      const averageLevel = competencyRows.reduce((sum, row) => sum + row.level, 0) / totalScores;

      // Transform rows to MatrixRow format using categoryInfo.rows structure
      const matrixRows: MatrixRow[] = categoryInfo.rows.map((rowInfo: any) => {
        const apiRow = competencyRows.find(r => r.row === rowInfo.id);
        return {
          row: rowInfo.id,
          displayName: rowInfo.displayName,
          levels: {
            1: apiRow?.level === 1 ? apiRow : null,
            2: apiRow?.level === 2 ? apiRow : null,
            3: apiRow?.level === 3 ? apiRow : null,
            4: apiRow?.level === 4 ? apiRow : null,
          }
        };
      });

      const result = {
        category: categoryKey,
        displayName: categoryInfo.displayName,
        rows: matrixRows,
        summary: {
          totalScores,
          averageConfidence,
          averageLevel
        }
      };
      
      console.log(`✅ Transformed category ${categoryKey}:`, result);
      return result;
    }).filter(Boolean) as MatrixCategory[];

    const finalResult = {
      actor: apiData.actor,
      categories: categoriesArray,
      summary: apiData.summary || {
        totalScores: categoriesArray.reduce((sum, cat) => sum + cat.summary.totalScores, 0),
        averageConfidence: categoriesArray.reduce((sum, cat) => sum + cat.summary.averageConfidence * cat.summary.totalScores, 0) / categoriesArray.reduce((sum, cat) => sum + cat.summary.totalScores, 0),
        averageLevel: categoriesArray.reduce((sum, cat) => sum + cat.summary.averageLevel * cat.summary.totalScores, 0) / categoriesArray.reduce((sum, cat) => sum + cat.summary.totalScores, 0),
        levelDistribution: apiData.summary?.levelDistribution || {}
      },
      generatedAt: apiData.generatedAt || new Date().toISOString()
    };
    
    console.log('🎉 Final transformed data:', finalResult);
    return finalResult;
  };

  const fetchAvailableDevelopers = async () => {
    try {
      console.log('🔍 Fetching available developers...');
      const response = await fetch('/api/matrix/overview');
      
      if (!response.ok) {
        console.error('❌ Overview fetch failed:', response.status, response.statusText);
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📡 Overview API Response:', result);
      
      if (result.success) {
        // Extract developers from the team matrix API
        const teamResponse = await fetch('/api/matrix/team');
        
        if (!teamResponse.ok) {
          console.error('❌ Team fetch failed:', teamResponse.status, teamResponse.statusText);
          throw new Error(`Network error: ${teamResponse.status} ${teamResponse.statusText}`);
        }
        
        const teamResult = await teamResponse.json();
        console.log('👥 Team API Response:', teamResult);
        
        if (teamResult.success) {
          const developers = teamResult.data.developers.map((dev: any) => dev.actor);
          console.log('👥 Extracted developers:', developers);
          console.log('👥 Developers count:', developers.length);
          console.log('👥 Looking for lsinclair:', developers.includes('lsinclair'));
          setAvailableDevelopers(developers);
          
          // Auto-select first developer if none selected
          if (!selectedDeveloper && developers.length > 0) {
            console.log('🎯 Auto-selecting first developer:', developers[0]);
            setSelectedDeveloper(developers[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch developers:', err);
    }
  };

  const fetchMatrixData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const developerToFetch = selectedDeveloper || developerId;
      if (!developerToFetch && viewMode === 'individual') {
        setLoading(false);
        return;
      }
      
      const endpoint = viewMode === 'individual' && developerToFetch
        ? `/api/matrix/developer/${developerToFetch}`
        : '/api/matrix/team';
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.error('❌ Fetch failed:', response.status, response.statusText);
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📡 API Response:', result);
      
      if (result.success) {
        if (viewMode === 'team') {
          // For team view, we'll show the first developer for now
          // TODO: Add team overview component
          const developerData = result.data.developers?.[0] || null;
          const transformedData = developerData ? transformApiDataToMatrixFormat(developerData) : null;
          setMatrix(transformedData);
        } else {
          const transformedData = transformApiDataToMatrixFormat(result.data);
          setMatrix(transformedData);
        }
      } else {
        setError(result.error || 'Failed to load matrix data');
      }
    } catch (err) {
      console.error('❌ fetchMatrixData failed:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        selectedDeveloper,
        viewMode,
        endpoint: viewMode === 'individual' && selectedDeveloper 
          ? `/api/matrix/developer/${selectedDeveloper}` 
          : '/api/matrix/team'
      });
      setError('Network error loading matrix data');
    } finally {
      setLoading(false);
    }
  };

  const renderMatrixCell = (category: string, row: MatrixRow, level: number) => {
    const cell = row.levels[level];
    const isEmpty = !cell;
    
    return (
      <div
        key={`${category}-${row.row}-${level}`}
        className={`
          w-12 h-12 border border-gray-300 rounded flex items-center justify-center text-xs font-semibold cursor-pointer transition-colors
          ${isEmpty ? 'bg-gray-100 hover:bg-gray-200' : ''}
          ${!isEmpty ? 'hover:scale-105 shadow-sm' : ''}
        `}
        style={!isEmpty ? {
          backgroundColor: formatConfidenceColor(cell.confidence),
          color: 'white'
        } : {}}
        onClick={() => !isEmpty && setSelectedCell(cell)}
        title={!isEmpty ? `${getLevelName(level)} - Confidence: ${(cell.confidence * 100).toFixed(1)}%` : 'No data'}
      >
        {!isEmpty ? level : ''}
      </div>
    );
  };

  const renderMatrixRow = (category: string, row: MatrixRow) => {
    return (
      <div key={row.row} className="flex items-center gap-2">
        <div className="w-48 text-sm font-medium text-gray-700 truncate" title={row.displayName}>
          {row.displayName}
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(level => renderMatrixCell(category, row, level))}
        </div>
      </div>
    );
  };

  const renderMatrixCategory = (category: MatrixCategory) => {
    // Add debugging to see what category data looks like
    if (!category || !category.summary) {
      console.log('Invalid category data:', category);
      return null;
    }
    
    return (
      <div key={category.category} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">{category.displayName}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Scores: {category.summary?.totalScores || 0}</span>
            <span>Avg Confidence: {category.summary?.averageConfidence ? (category.summary.averageConfidence * 100).toFixed(1) : '0.0'}%</span>
            <span>Avg Level: {category.summary?.averageLevel ? category.summary.averageLevel.toFixed(1) : '0.0'}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {category.rows?.map((row: MatrixRow) => renderMatrixRow(category.category, row))}
        </div>
      </div>
    );
  };

  const renderLegend = () => {
    return (
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">Levels:</span>
          {[1, 2, 3, 4].map(level => (
            <div key={level} className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: getLevelColor(level) }}
              />
              <span>{getLevelName(level)}</span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Confidence:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span>Med</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>Low</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading competency matrix...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">No competency data available</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Competency Matrix - {matrix?.actor || 'Select Developer'}
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {viewMode === 'individual' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Developer:</label>
                <select
                  key="developer-select"
                  value={selectedDeveloper}
                  onChange={(e) => setSelectedDeveloper(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={availableDevelopers.length === 0}
                >
                  {availableDevelopers.length === 0 ? (
                    <option value="">Loading developers...</option>
                  ) : (
                    availableDevelopers.map((developer) => (
                      <option key={developer} value={developer}>
                        {developer}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
            
            {matrix && matrix.summary && (
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span>Total Scores: {matrix.summary.totalScores || 0}</span>
                <span>Average Confidence: {matrix.summary.averageConfidence ? (matrix.summary.averageConfidence * 100).toFixed(1) : '0.0'}%</span>
                <span>Average Level: {matrix.summary.averageLevel ? matrix.summary.averageLevel.toFixed(1) : '0.0'}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={fetchMatrixData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {renderLegend()}

      <div className="mt-6 space-y-4">
        {matrix && Array.isArray(matrix.categories) && matrix.categories.map(category => renderMatrixCategory(category))}
      </div>

      {selectedCell && (
        <EvidenceModal
          isOpen={!!selectedCell}
          onClose={() => setSelectedCell(null)}
          cell={selectedCell}
          developer={matrix?.actor || ''}
        />
      )}
    </div>
  );
};

export default CompetencyMatrix;
