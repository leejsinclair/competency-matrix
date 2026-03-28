import React, { useEffect, useState } from 'react';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cell: any;
  developer: string;
}

interface Evidence {
  id: string;
  type: 'jira' | 'confluence' | 'bitbucket' | 'git';
  title: string;
  url?: string;
  description: string;
  timestamp: string;
  confidence: number;
  relevanceScore: number;
}

const EvidenceModal: React.FC<EvidenceModalProps> = ({ 
  isOpen, 
  onClose, 
  cell, 
  developer 
}) => {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrends, setShowTrends] = useState(false);

  useEffect(() => {
    if (isOpen && cell) {
      fetchEvidence();
    }
  }, [isOpen, cell, developer]);

  const fetchEvidence = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock API call - in real implementation this would fetch actual evidence
      // For now, generate mock evidence based on the cell data
      const mockEvidence: Evidence[] = [
        {
          id: '1',
          type: 'jira',
          title: `Completed ${cell.row} implementation in project`,
          description: `Successfully implemented advanced ${cell.row} features with high quality code and comprehensive testing.`,
          url: 'https://example.atlassian.net/browse/PROJ-123',
          timestamp: '2026-03-15T10:30:00Z',
          confidence: 0.85,
          relevanceScore: 0.92
        },
        {
          id: '2',
          type: 'confluence',
          title: `Technical documentation for ${cell.row}`,
          description: `Created comprehensive documentation covering best practices and implementation guidelines for ${cell.row}.`,
          url: 'https://example.atlassian.net/wiki/display/TECH/RowGuide',
          timestamp: '2026-03-10T14:20:00Z',
          confidence: 0.78,
          relevanceScore: 0.88
        },
        {
          id: '3',
          type: 'bitbucket',
          title: `Pull request: ${cell.row} improvements`,
          description: `Submitted pull request with significant improvements to ${cell.row} functionality and performance optimizations.`,
          url: 'https://bitbucket.org/example/project/pull-requests/45',
          timestamp: '2026-03-08T09:15:00Z',
          confidence: 0.91,
          relevanceScore: 0.95
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setEvidence(mockEvidence);
    } catch (err) {
      setError('Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'jira':
        return '🎫';
      case 'confluence':
        return '📄';
      case 'bitbucket':
        return '🔀';
      case 'git':
        return '🌲';
      default:
        return '📋';
    }
  };

  const getEvidenceTypeColor = (type: string) => {
    switch (type) {
      case 'jira':
        return 'bg-blue-100 text-blue-800';
      case 'confluence':
        return 'bg-green-100 text-green-800';
      case 'bitbucket':
        return 'bg-purple-100 text-purple-800';
      case 'git':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Competency Evidence</h3>
              <p className="text-sm text-gray-600 mt-1">
                {developer} • {cell?.category} • {cell?.row} • Level {cell?.level}
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-600">Loading evidence...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-600">Error: {error}</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Assessment Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Confidence Level:</span>
                    <span className="ml-2 font-medium">{(cell?.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Evidence Count:</span>
                    <span className="ml-2 font-medium">{cell?.evidenceCount || evidence.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-2 font-medium">
                      {cell?.lastUpdated ? formatDate(cell.lastUpdated) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Skill Level:</span>
                    <span className="ml-2 font-medium">
                      {cell?.level === 1 ? 'Beginner' : 
                       cell?.level === 2 ? 'Intermediate' : 
                       cell?.level === 3 ? 'Advanced' : 'Expert'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Supporting Evidence ({evidence.length})</h4>
                <div className="space-y-3">
                  {evidence.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getEvidenceIcon(item.type)}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEvidenceTypeColor(item.type)}`}>
                              {item.type.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(item.timestamp)}
                            </span>
                          </div>
                          
                          <h5 className="font-medium text-gray-900 mb-1">{item.title}</h5>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                            <span>Relevance: {(item.relevanceScore * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 text-blue-500 hover:text-blue-600 transition-colors"
                            title="Open in new tab"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {evidence.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500">No evidence available for this competency</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between">
            <button
              onClick={() => setShowTrends(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              View Trends
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showTrends && cell && (
        <TrendVisualization
          developer={developer}
          category={cell.category}
          row={cell.row}
          onClose={() => setShowTrends(false)}
        />
      )}
    </div>
  );
};

export default EvidenceModal;
