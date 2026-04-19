import React, { useEffect, useState } from 'react';
import { COMPETENCY_CATEGORIES, COMPETENCY_LEVELS, getLevelColor, getLevelName } from '../types/matrix';
import EvidenceModal from './EvidenceModal';

const SimpleMatrix: React.FC = () => {
  console.log('🚀 SimpleMatrix render');
  
  const [developers, setDevelopers] = useState<string[]>([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [matrixData, setMatrixData] = useState<any>(null);
  const [clickedCells, setClickedCells] = useState<Set<string>>(new Set()); // Track clicked cells for flashcard effect
  const [evidenceModal, setEvidenceModal] = useState<{
    isOpen: boolean;
    competency: any;
  }>({
    isOpen: false,
    competency: null
  });

  console.log('🔧 State snapshot:', {
    developersCount: developers.length,
    selectedDeveloper,
    loading,
    error,
    hasMatrixData: !!matrixData
  });

  useEffect(() => {
    const loadDevelopers = async () => {
      try {
        console.log('🔍 Fetching developers...');
        const response = await fetch('/api/matrix/team');
        const result = await response.json();

        console.log('📡 Developers API response:', result);

        if (result.success) {
          const developerNames = result.data.developers
            .map((dev: any) => dev.actor)
            .filter((name: string) => {
              // Filter out deactivated and unlicensed developers (case insensitive)
              const lowerName = name.toLowerCase();
              return !lowerName.includes('deactivated') && !lowerName.includes('unlicensed');
            });
          console.log('✅ Developers parsed:', developerNames);
          console.log('📊 Filtered out deactivated/unlicensed developers');
          setDevelopers(developerNames);

          // safer auto-select (no stale closure issue)
          setSelectedDeveloper(prev => {
            if (prev) {
              console.log('⏭️ Skipping auto-select, already selected:', prev);
              return prev;
            }

            const next = developerNames[0] || '';
            console.log('🎯 Auto-selecting first developer:', next);
            return next;
          });
        } else {
          console.error('❌ API returned failure');
          setError('Failed to fetch developers');
        }
      } catch (err) {
        console.error('❌ Error fetching developers:', err);
        setError('Network error fetching developers');
      } finally {
        setLoading(false);
      }
    };

    loadDevelopers();

    // Listen for refresh events
    const handleRefresh = () => {
      console.log('🔄 Refresh event received, reloading data...');
      setLoading(true);
      loadDevelopers();
    };

    window.addEventListener('refreshMatrix', handleRefresh);

    return () => {
      window.removeEventListener('refreshMatrix', handleRefresh);
    };
  }, []);

  // Track selectedDeveloper changes explicitly
  useEffect(() => {
    console.log('👀 selectedDeveloper changed:', selectedDeveloper);
  }, [selectedDeveloper]);

  // Load matrix when selection changes
  useEffect(() => {
    console.log('📦 useEffect[matrixFetch] triggered');

    if (!selectedDeveloper) {
      console.log('⛔ No developer selected, skipping fetch');
      return;
    }

    const loadMatrixData = async () => {
      try {
        console.log('🧹 Clearing previous matrix data');
        setMatrixData(null);

        console.log('🔍 Fetching matrix for:', selectedDeveloper);
        const url = `/api/matrix/developer/${encodeURIComponent(selectedDeveloper)}`;
        console.log('🌐 Request URL:', url);

        const response = await fetch(url);
        const result = await response.json();

        console.log('📡 Matrix API response:', result);

        if (result.success) {
          console.log('✅ Matrix data loaded');
          setMatrixData(result.data);
        } else {
          console.error('❌ API error:', result.error);
          setError('Failed to fetch matrix data');
        }
      } catch (err) {
        console.error('❌ Network error fetching matrix:', err);
        setError('Network error fetching matrix data');
      }
    };

    loadMatrixData();
  }, [selectedDeveloper]);

  // Handle cell clicks for flashcard effect and evidence modal
  const handleCellClick = (categoryKey: string, rowKey: string, level: number, event: React.MouseEvent) => {
    // Check for Ctrl+Click on achieved (green) cells
    if (event.ctrlKey && matrixData && matrixData.categories) {
      const categoryData = matrixData.categories[categoryKey];
      const competencyData = categoryData?.find((c: any) => c.row === rowKey);
      
      if (competencyData && competencyData.level >= level) {
        // This is an achieved cell, show evidence modal
        setEvidenceModal({
          isOpen: true,
          competency: {
            category: categoryKey,
            row: competencyData.row,
            level: competencyData.level,
            confidence: competencyData.confidence,
            evidenceCount: competencyData.evidenceCount,
            evidence: competencyData.evidence
          }
        });
        return; // Don't proceed with regular click handling
      }
    }
    
    // Regular click handling for flashcard effect
    const cellKey = `${categoryKey}-${rowKey}-${level}`;
    setClickedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cellKey)) {
        newSet.delete(cellKey);
      } else {
        newSet.add(cellKey);
      }
      return newSet;
    });
  };

  // Handle select change with logging + same-value guard
  const handleDeveloperChange = (value: string) => {
    console.log('🖱️ Select changed:', value);

    setSelectedDeveloper(prev => {
      if (prev === value) {
        console.log('⚠️ Same value selected, no state change');
        return prev; // prevents unnecessary rerender
      }

      console.log('✅ Updating selectedDeveloper:', value);
      return value;
    });
  };

  // Transform API data to CircleCI matrix format
  const transformToMatrixFormat = (apiData: any) => {
    const matrix: any = {};
    
    Object.entries(COMPETENCY_CATEGORIES).forEach(([categoryKey, categoryInfo]) => {
      matrix[categoryKey] = {
        displayName: categoryInfo.displayName,
        rows: {}
      };
      
      categoryInfo.rows.forEach(rowInfo => {
        const categoryData = apiData.categories?.[categoryKey] || [];
        const apiRow = categoryData.rows?.find((item: any) => item.row === rowInfo.id);
        
        matrix[categoryKey].rows[rowInfo.id] = {
          displayName: rowInfo.displayName,
          level: apiRow?.level || 0,
          confidence: apiRow?.confidence || 0,
          evidenceCount: apiRow?.evidenceCount || 0,
          lastUpdated: apiRow?.lastUpdated || null,
          evidence: apiRow?.evidence || [], // Fixed: was evidenceDetails, now evidence
          recentActivity: apiRow?.recentActivity || [],
          hasData: !!apiRow // Flag to indicate if this row has actual data
        };
      });
    });
    
    return matrix;
  };

  // Generate specific evidence descriptions based on competency and activity
  const generateEvidenceDescription = (_rowData: any, _competencyName: string, _categoryKey: string) => {
    const evidenceCount = _rowData.evidenceCount || 0;
    const recentActivity = _rowData.recentActivity || [];
    
    if (evidenceCount === 0) {
      return "No evidence found for this competency in recent activity.";
    }

    let _description = `This assessment is supported by ${evidenceCount} data points`;
    
    // Add specific activity types based on category
    const categoryEvidence: Record<string, string> = {
      'programming-languages': 'code commits, pull requests, and code reviews',
      'databases': 'database schema changes, query optimizations, and data modeling tasks',
      'containers-orchestration': 'Dockerfile updates, Kubernetes deployments, and infrastructure changes',
      'testing': 'test case additions, test automation improvements, and quality assurance activities',
      'collaboration-process': 'code reviews, documentation updates, and team collaboration activities',
      'git-version-control': 'git operations, version control, and repository management',
      'quality-assurance': 'quality assurance, testing, and code quality activities',
      'devops-platform-engineering': 'CI/CD pipelines, infrastructure automation, and deployment practices',
      'web-development': 'frontend and backend web development tasks',
      'atlassian': 'Jira, Confluence, Bitbucket, and Atlassian tool usage',
      'software-engineering': 'software architecture, design patterns, and development practices'
    };
    
    const activityTypes = categoryEvidence[_categoryKey] || 'engineering activities';
    _description += ` from ${activityTypes}`;
    
    // Add recent activity details if available
    if (recentActivity.length > 0) {
      const recentCount = Math.min(recentActivity.length, 3);
      _description += `. Recent activity includes ${recentCount} notable contributions`;
    }
    
    // Add specific examples based on competency level
    if (_rowData.level >= 3) {
      _description += ' demonstrating advanced technical leadership and mentorship';
    } else if (_rowData.level >= 2) {
      _description += ' showing consistent application and growing expertise';
    } else {
      _description += ' indicating foundational skill development';
    }
    
    // Add confidence context
    if (_rowData.confidence >= 0.8) {
      _description += ' with high confidence due to consistent patterns across multiple projects';
    } else if (_rowData.confidence >= 0.6) {
      _description += ' with moderate confidence based on recurring successful implementations';
    } else if (_rowData.confidence >= 0.4) {
      _description += ' with developing confidence based on emerging patterns';
    }
    
    return _description;
  };

  // Transform API data to CircleCI matrix format
  const formattedMatrix = matrixData ? transformToMatrixFormat(matrixData) : null;

// ...

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          CircleCI Engineering Competency Matrix
        </h2>

        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700">
            Developer:
          </label>

          <select
            value={selectedDeveloper}
            onChange={(e) => handleDeveloperChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a developer...</option>
            {developers.map((developer) => (
              <option key={developer} value={developer}>
                {developer}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600">
          Developers loaded: {developers.length}<br />
          Selected: {selectedDeveloper || 'None'}
        </div>

        {/* CircleCI Matrix Grid */}
        {formattedMatrix && (
          <div className="mt-6">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {selectedDeveloper} - Competency Overview
              </h3>
              <div className="text-sm text-gray-600">
                Total Scores: {matrixData.totalScores || 0}<br />
                Average Confidence: {matrixData.averageConfidence ? (matrixData.averageConfidence * 100).toFixed(1) : '0.0'}%
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Category / Competency
                    </th>
                    {[1, 2, 3, 4].map(level => (
                      <th key={level} className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                        L{level} - {getLevelName(level)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(formattedMatrix).map(([categoryKey, categoryData]: [string, any]) => (
                    <React.Fragment key={categoryKey}>
                      {/* Category Header Row */}
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-semibold text-gray-800" colSpan={5}>
                          {categoryData.displayName}
                        </td>
                      </tr>
                      
                      {/* Category Rows */}
                      {Object.entries(categoryData.rows).map(([rowKey, rowData]: [string, any]) => (
                        <tr key={rowKey} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                            {rowData.displayName}
                          </td>
                          {[1, 2, 3, 4].map(level => {
                            const isActive = rowData.level === level;
                            const isBeforeActive = rowData.level > 0 && level <= rowData.level;
                            const cellKey = `${categoryKey}-${rowKey}-${level}`;
                            const isClicked = clickedCells.has(cellKey);
                            
                            // Get competency description
                            const categoryInfo = COMPETENCY_CATEGORIES[categoryKey as keyof typeof COMPETENCY_CATEGORIES];
                            const rowInfo = categoryInfo?.rows.find(row => row.id === rowKey);
                            const competencyDescription = rowInfo?.description || '';
                            
                            let cellContent, cellStyle;
                            
                            if (isBeforeActive && rowData.level > 0) {
                              if (isActive) {
                                // Active level cell - achieved level should be green
                                cellStyle = {
                                  backgroundColor: '#10b981', // Green for achieved levels
                                  color: 'white',
                                  cursor: 'pointer',
                                  minHeight: '80px',
                                  position: 'relative' as const
                                };
                                
                                if (isClicked) {
                                  // Show confidence details
                                  cellContent = (
                                    <div className="p-2 text-center">
                                      <div className="text-xs font-bold mb-1">
                                        Level {level} - {getLevelName(level)}
                                      </div>
                                      <div className="text-xs opacity-90 mb-1">
                                        {(rowData.confidence * 100).toFixed(0)}% confidence
                                      </div>
                                      <div className="text-xs opacity-75">
                                        {rowData.evidenceCount} evidences
                                      </div>
                                      <div className="text-xs opacity-75 mt-1">
                                        Click to hide details
                                      </div>
                                    </div>
                                  );
                                } else {
                                  // Show competency description
                                  cellContent = (
                                    <div className="p-2 text-center">
                                      <div className="text-xs font-medium mb-1">
                                        Level {level}
                                      </div>
                                      <div className="text-xs opacity-90 leading-tight">
                                        {competencyDescription.length > 70 
                                          ? `${competencyDescription.substring(0, 70)}...`
                                          : competencyDescription
                                        }
                                      </div>
                                      <div className="text-xs opacity-75 mt-1">
                                        Ctrl+Click for evidence →
                                      </div>
                                    </div>
                                  );
                                }
                              } else {
                                // Filled cell before active level - show description with gray background
                                cellStyle = {
                                  backgroundColor: '#e5e7eb',
                                  color: '#374151',
                                  cursor: 'pointer',
                                  minHeight: '60px'
                                };
                                cellContent = (
                                  <div className="p-2 text-center">
                                    <div className="text-xs font-medium mb-1">
                                      Level {level}
                                    </div>
                                    <div className="text-xs opacity-75 leading-tight">
                                      {competencyDescription.length > 60 
                                        ? `${competencyDescription.substring(0, 60)}...`
                                        : competencyDescription
                                      }
                                    </div>
                                  </div>
                                );
                              }
                            } else {
                              // Empty cell - show description with light gray background
                              cellStyle = {
                                backgroundColor: '#f3f4f6',
                                color: '#9ca3af',
                                cursor: 'default',
                                minHeight: '60px'
                              };
                              cellContent = (
                                <div className="p-2 text-center">
                                  <div className="text-xs font-medium mb-1">
                                    Level {level}
                                  </div>
                                  <div className="text-xs opacity-75 leading-tight">
                                    {competencyDescription.length > 60 
                                      ? `${competencyDescription.substring(0, 60)}...`
                                      : competencyDescription
                                    }
                                  </div>
                                  <div className="text-xs opacity-50 mt-1">
                                    Not yet achieved
                                  </div>
                                </div>
                              );
                            }
                            
                            return (
                              <td
                                key={level}
                                className="border border-gray-300 px-2 py-2 text-center transition-all duration-200"
                                style={cellStyle}
                                onClick={(event) => isActive && handleCellClick(categoryKey, rowKey, level, event)}
                              >
                                {cellContent}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Competency Levels</h4>
              <div className="flex flex-wrap gap-4">
                {Object.entries(COMPETENCY_LEVELS).map(([level, levelInfo]) => (
                  <div key={level} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: levelInfo.color }}
                    />
                    <span className="text-xs text-gray-600">
                      L{level} - {levelInfo.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Numbers indicate confidence percentage. Higher confidence = more reliable assessment.
              </div>
            </div>

            {/* Detailed Competency Report */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Detailed Competency Report
              </h3>
              
              {Object.entries(formattedMatrix).map(([categoryKey, categoryData]: [string, any]) => (
                <div key={categoryKey} className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    {categoryData.displayName}
                  </h4>
                  
                  {Object.entries(categoryData.rows).map(([rowKey, rowData]: [string, any]) => {
                    if (rowData.level === 0) {
                      // Show empty competencies with a clear message
                      return (
                        <div key={rowKey} className="mb-4 p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-700">
                              {rowData.displayName}
                            </h5>
                            <span className="text-xs text-gray-500">
                              No data available
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            <p>
                              <strong>Assessment:</strong> No competency data available for {rowData.displayName.toLowerCase()}.
                            </p>
                            <p>
                              <strong>Status:</strong> This competency area requires more activity evidence to generate an assessment.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    // Show competencies with data
                    return (
                      <div key={rowKey} className="mb-4 p-3 bg-gray-50 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-700">
                            {rowData.displayName}
                          </h5>
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-1 text-xs font-medium text-white rounded"
                              style={{ backgroundColor: getLevelColor(rowData.level) }}
                            >
                              Level {rowData.level} - {getLevelName(rowData.level)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(rowData.confidence * 100).toFixed(1)}% confidence
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p className="mb-2">
                            <strong>Assessment:</strong> {selectedDeveloper} demonstrates competency at 
                            Level {rowData.level} ({getLevelName(rowData.level).toLowerCase()}) in {rowData.displayName.toLowerCase()}.
                          </p>
                          
                          <p className="mb-2">
                            <strong>Confidence Level:</strong> {(rowData.confidence * 100).toFixed(1)}% confidence in this assessment,
                            based on {rowData.evidenceCount || 0} evidence points from recent activity.
                          </p>
                          
                          <p className="mb-2">
                            <strong>Level Description:</strong> {COMPETENCY_LEVELS[rowData.level as keyof typeof COMPETENCY_LEVELS]?.description || 
                            'Competency demonstrated through consistent application and understanding.'}
                          </p>
                          
                          {rowData.evidenceCount > 0 && (
                            <p>
                              <strong>Evidence:</strong> {generateEvidenceDescription(rowData, rowData.displayName, categoryKey)}
                            </p>
                          )}
                          
                          {rowData.lastUpdated && (
                            <p className="text-xs text-gray-500 mt-2">
                              Last updated: {new Date(rowData.lastUpdated).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={evidenceModal.isOpen}
        onClose={() => setEvidenceModal({ isOpen: false, competency: null })}
        competency={evidenceModal.competency}
      />
    </div>
  );
};

export default SimpleMatrix;