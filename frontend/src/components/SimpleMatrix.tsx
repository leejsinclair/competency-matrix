import React, { useEffect, useState } from 'react';
import { COMPETENCY_CATEGORIES } from '../types/matrix';
import EvidenceModal from './EvidenceModal';

const SimpleMatrix: React.FC = () => {
  console.log('🚀 SimpleMatrix render');

  const [developers, setDevelopers] = useState<string[]>([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [matrixData, setMatrixData] = useState<any>(null);
  const [clickedCells, setClickedCells] = useState<Set<string>>(new Set());
  const [evidenceModal, setEvidenceModal] = useState<{
    isOpen: boolean;
    competency: any;
  }>({
    isOpen: false,
    competency: null
  });

  // Fetch developers list
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await fetch('/api/matrix/team');
        const data = await response.json();

        if (data.success && data.data) {
          const excludedNamePattern = /(deactivated|inactive|disabled|terminated|former|archived|unlicensed)/i;
          const developerList = data.data.developers
            .map((dev: any) => dev.actor)
            .filter((name: string) => !excludedNamePattern.test(name));
          setDevelopers(developerList);
          setLoading(false);
        } else {
          setError('Failed to load developers');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching developers:', err);
        setError('Failed to load developers');
        setLoading(false);
      }
    };

    fetchDevelopers();
  }, []);

  // Fetch matrix data when developer is selected
  useEffect(() => {
    if (!selectedDeveloper) return;

    const fetchMatrixData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`📊 Fetching matrix data for ${selectedDeveloper}...`);
        const response = await fetch(`/api/matrix/developer/${encodeURIComponent(selectedDeveloper)}`);
        const data = await response.json();

        console.log('📋 API Response:', data);

        if (data.success && data.data) {
          setMatrixData(data.data);
          setLoading(false);
        } else {
          setError('Failed to load matrix data');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching matrix data:', err);
        setError('Failed to load matrix data');
        setLoading(false);
      }
    };

    fetchMatrixData();
  }, [selectedDeveloper]);

  // Handle cell clicks for flashcard effect
  const handleCellClick = (categoryKey: string, rowKey: string, level: number, event: React.MouseEvent) => {
    // Check for Ctrl+Click on achieved cells
    if (event.ctrlKey && matrixData && matrixData.categories) {
      const categoryData = matrixData.categories[categoryKey];
      const competencyData = categoryData?.rows?.find((c: any) => c.id === rowKey || c.row === rowKey);

      if (competencyData && competencyData.level >= level) {
        // This is an achieved cell, show evidence modal
        setEvidenceModal({
          isOpen: true,
          competency: {
            category: categoryKey,
            row: competencyData.id || competencyData.row,
            level: competencyData.level,
            confidence: competencyData.confidence,
            evidenceCount: competencyData.evidenceCount,
            evidence: competencyData.evidence || []
          }
        });
        return; // Don't proceed with regular click handling
      }
    }

    // Regular click handling for flashcard effect
    setClickedCells(prev => {
      const newSet = new Set(prev);
      const cellKey = `${categoryKey}-${rowKey}-${level}`;

      if (newSet.has(cellKey)) {
        newSet.delete(cellKey);
      } else {
        newSet.add(cellKey);
      }

      return newSet;
    });
  };

  const handleDeveloperChange = (developer: string) => {
    setMatrixData(null);
    setSelectedDeveloper(developer);
    setClickedCells(new Set());
    setEvidenceModal({ isOpen: false, competency: null });
  };

  const normalizeKey = (value: string): string =>
    (value || '')
      .toLowerCase()
      .replace(/\s*>\s*/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  // Transform API data to CircleCI matrix format
  const transformToMatrixFormat = (apiData: any) => {
    const matrix: any = {};

    Object.entries(COMPETENCY_CATEGORIES).forEach(([categoryKey, categoryInfo]) => {
      const apiRows: any[] = apiData.categories?.[categoryKey]?.rows || [];
      const apiRowById = new Map(apiRows.map((row: any) => [String(row.id || ''), row]));
      const apiRowByNormalized = new Map(
        apiRows.map((row: any) => [normalizeKey(String(row.id || row.displayName || '')), row])
      );

      matrix[categoryKey] = {
        displayName: categoryInfo.displayName,
        rows: {}
      };

      categoryInfo.rows.forEach(rowInfo => {
        const normalizedRowId = normalizeKey(rowInfo.id);
        const normalizedRowName = normalizeKey(rowInfo.displayName);
        const apiRow =
          apiRowById.get(rowInfo.id) ||
          apiRowByNormalized.get(normalizedRowId) ||
          apiRowByNormalized.get(normalizedRowName);

        matrix[categoryKey].rows[rowInfo.id] = {
          id: rowInfo.id,
          row: rowInfo.id,
          displayName: rowInfo.displayName,
          description: rowInfo.description,
          level: apiRow?.level || 0,
          confidence: apiRow?.confidence || 0,
          evidenceCount: apiRow?.evidenceCount || 0,
          lastUpdated: apiRow?.lastUpdated || null,
          evidence: apiRow?.evidence || []
        };
      });

      // Include API-only rows so backend data is never dropped due to taxonomy mismatch.
      apiRows.forEach((apiRow: any) => {
        const apiRowId = String(apiRow.id || apiRow.row || '');
        if (!apiRowId || matrix[categoryKey].rows[apiRowId]) {
          return;
        }

        matrix[categoryKey].rows[apiRowId] = {
          id: apiRowId,
          row: apiRowId,
          displayName: apiRow.displayName || apiRowId,
          description: 'Competency demonstrated through observed activity and evidence.',
          level: apiRow.level || 0,
          confidence: apiRow.confidence || 0,
          evidenceCount: apiRow.evidenceCount || 0,
          lastUpdated: apiRow.lastUpdated || null,
          evidence: apiRow.evidence || []
        };
      });
    });

    console.log('🔍 Transform result:', matrix);
    return matrix;
  };

  if (error) {
    console.log('💥 Rendering error state:', error);
    return <div>Error: {error}</div>;
  }

  if (loading) {
    return <div className="p-6 text-gray-600">Loading competency data...</div>;
  }

  // Transform API data to CircleCI matrix format
  const formattedMatrix = matrixData ? transformToMatrixFormat(matrixData) : null;

  // Debug: Log the transformed data
  console.log('🔍 Formatted Matrix:', formattedMatrix);

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
                Competency Matrix for {selectedDeveloper}
              </h3>

              <div className="text-sm text-gray-600 mb-4">
                <strong>How to read this matrix:</strong> Each cell represents a competency level.
                <span className="text-green-600 font-semibold">Green cells</span> indicate achieved competencies with supporting evidence.
                <span className="text-blue-600 font-semibold">Ctrl+Click</span> on green cells to view detailed evidence.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Competency
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      L1
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      L2
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      L3
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      L4
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(formattedMatrix).map(([categoryKey, categoryData]: [string, any]) => (
                    <React.Fragment key={categoryKey}>
                      {/* Category Header Row */}
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="border border-gray-300 px-4 py-2 font-semibold text-gray-800">
                          {categoryData.displayName}
                        </td>
                      </tr>

                      {/* Competency Rows */}
                      {Object.entries(categoryData.rows).map(([rowKey, rowInfo]: [string, any]) => (
                        <tr key={rowKey}>
                          <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">
                            {rowInfo.displayName}
                          </td>

                          {/* Level Cells */}
                          {[1, 2, 3, 4].map((level) => {
                            const isAchieved = rowInfo.level === level;
                            const isActive = isAchieved;
                            const cellKey = `${categoryKey}-${rowKey}-${level}`;
                            const isClicked = clickedCells.has(cellKey);
                            const competencyDescription = rowInfo.description || 'Competency demonstrated through consistent application and understanding.';

                            // Determine cell styling based on achievement status
                            let cellStyle = "bg-white hover:bg-gray-50";
                            let cellContent;

                            if (isAchieved) {
                              // Green background for achieved levels
                              cellStyle = "bg-green-500 text-white";

                              cellContent = (
                                <div className="p-2 text-center">
                                  <div className="text-xs font-medium mb-1">
                                    Level {level}
                                  </div>
                                  <div className="text-xs opacity-90 leading-tight">
                                    {competencyDescription.length > 70
                                      ? `${competencyDescription.substring(0, 70)}...`
                                      : competencyDescription}
                                  </div>
                                  <div className="text-xs opacity-75 mt-1">
                                    Ctrl+Click for evidence →
                                  </div>
                                </div>
                              );
                            } else {
                              // Show the same CircleCI competency description for unachieved levels
                              cellContent = (
                                <div className="p-2 text-center text-gray-600">
                                  <div className="text-xs font-medium mb-1 text-gray-700">
                                    Level {level}
                                  </div>
                                  <div className="text-xs leading-tight">
                                    {competencyDescription.length > 70
                                      ? `${competencyDescription.substring(0, 70)}...`
                                      : competencyDescription}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <td
                                key={`${categoryKey}-${rowKey}-${level}`}
                                className={`border border-gray-300 px-2 py-1 text-center cursor-pointer transition-colors duration-200 ${cellStyle} ${isClicked ? 'ring-2 ring-blue-400' : ''}`}
                                onClick={(event) => isActive && handleCellClick(categoryKey, rowKey, level, event)}
                                title={
                                  isAchieved
                                    ? `${rowInfo.displayName} - Level ${rowInfo.level} achieved with ${rowInfo.evidenceCount || 0} evidence items`
                                    : `${rowInfo.displayName} - Level ${level} (not achieved)`
                                }
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
          </div>
        )}
      </div>

      {/* Evidence Modal */}
      {evidenceModal.competency && (
        <EvidenceModal
          isOpen={evidenceModal.isOpen}
          onClose={() => setEvidenceModal({ isOpen: false, competency: null })}
          competency={evidenceModal.competency}
        />
      )}
    </div>
  );
};

export default SimpleMatrix;
