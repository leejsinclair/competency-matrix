import React, { useEffect, useState } from 'react';
import type { TeamMatrix as TeamMatrixType } from '../types/matrix';
import { COMPETENCY_CATEGORIES, getLevelName } from '../types/matrix';
import ComparisonMatrix from './ComparisonMatrix';

interface DeveloperData {
  actor: string;
  categories: {
    [category: string]: Array<{
      row: string;
      level: number;
      confidence: number;
      evidenceCount: number;
      lastUpdated: string;
    }>;
  };
  totalScores: number;
  averageConfidence: number;
}

interface TeamMatrixProps {
  viewMode?: 'overview' | 'detailed';
  filterCategory?: string;
  searchTerm?: string;
}

const TeamMatrix: React.FC<TeamMatrixProps> = ({ viewMode: _viewMode = 'overview' }) => {
  const [teamMatrix, setTeamMatrix] = useState<TeamMatrixType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [comparisonMode, setComparisonMode] = useState(false);

  useEffect(() => {
    fetchTeamMatrix();
  }, []);

  const fetchTeamMatrix = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/matrix/team');
      const result = await response.json();
      
      if (result.success) {
        setTeamMatrix(result.data);
      } else {
        setError(result.error || 'Failed to load team matrix data');
      }
    } catch (err) {
      setError('Network error loading team matrix data');
    } finally {
      setLoading(false);
    }
  };

  const renderDeveloperMatrixCell = (developer: DeveloperData, category: string, row: any, level: number) => {
    // Add null checks and array validation
    if (!developer || !developer.categories || !Array.isArray(developer.categories[category])) {
      return null;
    }
    
    const categoryScores = developer.categories[category] || [];
    const score = categoryScores.find((s: any) => s.row === row.id);
    const isEmpty = !score;
    const isAchieved = !isEmpty && score.level >= level; // Check if this level is achieved
    
    return (
      <div
        key={`${developer.actor}-${category}-${row.id}-${level}`}
        className={`
          w-8 h-8 border border-gray-200 rounded flex items-center justify-center text-xs font-semibold cursor-pointer transition-all
          ${isEmpty ? 'bg-gray-50 hover:bg-gray-100' : ''}
          ${!isEmpty ? 'hover:scale-105 shadow-sm' : ''}
        `}
        style={!isEmpty ? {
          backgroundColor: isAchieved ? '#10b981' : '#f59e0b', // Green for achieved, amber for not achieved
          color: 'white'
        } : {}}
        onClick={() => !isEmpty && setSelectedCell({ ...score, developer: developer.actor, category, row })}
        title={
          isEmpty 
            ? `${developer.actor} - ${row.displayName} - Level ${level}: Not yet achieved`
            : `${developer.actor} - ${row.displayName} - Level ${level}: ${getLevelName(level)} - Confidence: ${(score.confidence * 100).toFixed(1)}% - ${score.evidenceCount} evidence items`
        }
      >
        {!isEmpty ? level : ''}
      </div>
    );
  };

  const renderOverviewRow = (category: string, row: any) => {
    if (!teamMatrix) return null;
    
    return (
      <div key={row.id} className="flex items-center gap-1">
        <div className="w-32 text-sm font-medium text-gray-700 truncate" title={row.displayName}>
          {row.displayName}
        </div>
        <div className="flex gap-1">
          {teamMatrix.developers.map(developer => (
            <div key={developer.actor} className="flex gap-0.5">
              {[1, 2, 3, 4].map(level => 
                renderDeveloperMatrixCell(developer, category, row, level)
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOverviewCategory = (category: any) => {
    if (!teamMatrix) return null;
    
    return (
      <div key={category.category} className="border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-800">{category.displayName}</h3>
          <div className="text-xs text-gray-500">
            {teamMatrix.totalDevelopers} developers
          </div>
        </div>
        
        <div className="space-y-1">
          {category.rows.map((row: any) => renderOverviewRow(category.category, row))}
        </div>
      </div>
    );
  };

  const renderDeveloperHeaders = () => {
    if (!teamMatrix) return null;
    
    return (
      <div className="flex items-center gap-1 mb-4 px-32">
        <div className="w-32"></div> {/* Spacer for row names */}
        {teamMatrix.developers.map(developer => (
          <div key={developer.actor} className="flex flex-col items-center">
            <div className="text-xs font-medium text-gray-600 text-center mb-1">
              {developer.actor.length > 12 
                ? developer.actor.substring(0, 12) + '...' 
                : developer.actor}
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

  const renderTeamSummary = () => {
    if (!teamMatrix) return null;
    
    const avgConfidence = teamMatrix.developers.reduce((sum, dev) => 
      sum + (dev.summary?.averageConfidence || 0), 0) / teamMatrix.developers.length;
    const avgLevel = teamMatrix.developers.reduce((sum, dev) => 
      sum + (dev.summary?.averageLevel || 0), 0) / teamMatrix.developers.length;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Team Overview</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Total Developers</div>
            <div className="text-xl font-bold text-gray-900">{teamMatrix.totalDevelopers}</div>
          </div>
          <div>
            <div className="text-gray-500">Total Scores</div>
            <div className="text-xl font-bold text-gray-900">{teamMatrix.totalScores}</div>
          </div>
          <div>
            <div className="text-gray-500">Avg Confidence</div>
            <div className="text-xl font-bold text-gray-900">{(avgConfidence * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-500">Avg Level</div>
            <div className="text-xl font-bold text-gray-900">{avgLevel.toFixed(1)}</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading team matrix...</div>
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

  if (!teamMatrix) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">No team data available</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Team Competency Matrix
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {teamMatrix.totalDevelopers} developers across {teamMatrix.categories.length} categories
            </div>
            
            {teamMatrix.developers.length > 1 && (
              <button
                onClick={() => setComparisonMode(true)}
                className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
              >
                Compare Developers
              </button>
            )}
          </div>
          
          <button
            onClick={fetchTeamMatrix}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {renderTeamSummary()}
      {renderDeveloperHeaders()}

      <div className="space-y-3">
        {Object.values(COMPETENCY_CATEGORIES).map(category => 
          renderOverviewCategory(category)
        )}
      </div>

      {selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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

      {comparisonMode && (
        <ComparisonMatrix
          developers={teamMatrix.developers.slice(0, 4).map(dev => dev.actor)}
          onClose={() => setComparisonMode(false)}
        />
      )}
    </div>
  );
};

export default TeamMatrix;
