import React, { useState } from 'react';
import { DeveloperMatrix, TeamMatrix as TeamMatrixType } from '../types/matrix';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    type: 'individual' | 'team';
    developer?: DeveloperMatrix;
    teamData?: TeamMatrixType;
  };
}

const ExportModal: React.FC<ExportModalProps> = ({ 
  isOpen, 
  onClose, 
  data 
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(false);
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        format: exportFormat,
        type: data.type,
        includeEvidence,
        includeTrends,
        selectedDevelopers: data.type === 'team' ? selectedDevelopers : data.developer ? [data.developer.actor] : [],
        data: data.type === 'individual' ? data.developer : data.teamData
      };

      // Mock export functionality - in real implementation this would call the backend
      console.log('Exporting data:', exportData);
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate download
      const filename = `competency-matrix-${data.type}-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      console.log(`Downloaded: ${filename}`);
      
      // Show success message
      alert(`Export completed! File saved as ${filename}`);
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeveloperToggle = (developer: string) => {
    setSelectedDevelopers(prev => 
      prev.includes(developer) 
        ? prev.filter(d => d !== developer)
        : [...prev, developer]
    );
  };

  const selectAllDevelopers = () => {
    if (data.teamData) {
      setSelectedDevelopers(data.teamData.developers.map(d => d.actor));
    }
  };

  const clearAllDevelopers = () => {
    setSelectedDevelopers([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Export Competency Matrix</h2>
              <p className="text-sm text-gray-600 mt-1">
                {data.type === 'individual' 
                  ? `Export matrix for ${data.developer?.actor || 'Unknown'}`
                  : 'Export team competency matrix'
                }
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

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {/* Export Format */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Export Format</h3>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">PDF Report</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="excel"
                    checked={exportFormat === 'excel'}
                    onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Excel Spreadsheet</span>
                </label>
              </div>
            </div>

            {/* Include Options */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Include in Export</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeEvidence}
                    onChange={(e) => setIncludeEvidence(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Evidence details and links</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeTrends}
                    onChange={(e) => setIncludeTrends(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Historical trends and progressions</span>
                </label>
              </div>
            </div>

            {/* Developer Selection (Team Only) */}
            {data.type === 'team' && data.teamData && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Select Developers</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllDevelopers}
                      className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearAllDevelopers}
                      className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-2">
                    {data.teamData.developers.map((developer) => (
                      <label key={developer.actor} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedDevelopers.includes(developer.actor)}
                          onChange={() => handleDeveloperToggle(developer.actor)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{developer.actor}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({developer.summary.totalScores} scores)
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Export Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Export Summary</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Format: <span className="font-medium text-gray-900">{exportFormat.toUpperCase()}</span></div>
                <div>Type: <span className="font-medium text-gray-900">{data.type === 'individual' ? 'Individual Matrix' : 'Team Matrix'}</span></div>
                {data.type === 'team' && (
                  <div>Developers: <span className="font-medium text-gray-900">
                    {selectedDevelopers.length > 0 ? selectedDevelopers.length : 'All'}
                  </span></div>
                )}
                <div>Includes: <span className="font-medium text-gray-900">
                  {[includeEvidence && 'Evidence', includeTrends && 'Trends'].filter(Boolean).join(', ') || 'Matrix only'
                }</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || (data.type === 'team' && selectedDevelopers.length === 0)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
