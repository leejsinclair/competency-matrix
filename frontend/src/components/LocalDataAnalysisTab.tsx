import { useEffect, useState } from 'react';

interface LocalProcessingSummary {
  dataSource: string;
  totalEvents: number;
  processedEvents: number;
  labelsGenerated: number;
  errors: number;
  competencyCategories: string[];
  topCompetencyAreas: Array<{
    area: string;
    category: string;
    count: number;
  }>;
  contributors: Array<{
    actor: string;
    events: number;
    labelsGenerated: number;
    competencyAreas: string[];
    averageConfidence: number;
    topCompetency: string;
    space: string;
  }>;
  generatedAt: string;
}

export default function LocalDataAnalysisTab() {
  const [summary, setSummary] = useState<LocalProcessingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocalResults();
  }, []);

  const loadLocalResults = async () => {
    try {
      setLoading(true);
      // Load the local processed results
      const response = await fetch('/confluence-summary.json');
      if (!response.ok) {
        throw new Error('Failed to load local results');
      }
      const data = await response.json();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError('Failed to load local analysis results');
      console.error('Failed to load local results:', err);
    } finally {
      setLoading(false);
    }
  };

  const startLocalProcessing = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      // This would trigger the local processing if we had the API endpoint
      // For now, we'll just reload the existing results
      console.log('Local processing would be triggered here');
      
      setTimeout(() => {
        loadLocalResults();
        setProcessing(false);
      }, 2000);
      
    } catch (err) {
      setError('Local processing failed');
      console.error('Local processing failed:', err);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading local analysis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No local analysis results available</p>
        <button
          onClick={startLocalProcessing}
          disabled={processing}
          className="btn btn-primary"
        >
          {processing ? 'Processing...' : 'Process Local Data'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Local Data Analysis</h3>
        <div className="flex gap-2">
          <button
            onClick={loadLocalResults}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={startLocalProcessing}
            disabled={processing}
            className="btn btn-primary"
          >
            {processing ? 'Processing...' : 'Reprocess Data'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-6 border border-gray-200 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-4">Analysis Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalEvents.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Pages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.labelsGenerated.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Labels Generated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{summary.contributors.length}</div>
            <div className="text-sm text-gray-600">Contributors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{summary.competencyCategories.length}</div>
            <div className="text-sm text-gray-600">Competency Areas</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Data source: {summary.dataSource} | Generated: {new Date(summary.generatedAt).toLocaleString()}
        </div>
      </div>

      {/* Top Competency Areas */}
      <div className="bg-white p-6 border border-gray-200 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-4">Top Competency Areas</h4>
        <div className="space-y-3">
          {summary.topCompetencyAreas.slice(0, 10).map((area, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{area.area}</div>
                  <div className="text-sm text-gray-500">{area.category}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{area.count}</div>
                <div className="text-sm text-gray-500">occurrences</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Contributors */}
      <div className="bg-white p-6 border border-gray-200 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-4">Top Contributors</h4>
        <div className="space-y-4">
          {summary.contributors.slice(0, 15).map((contributor, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{contributor.actor}</span>
                    <span className="text-sm text-gray-500">({contributor.space})</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {contributor.events} pages • {contributor.labelsGenerated} labels
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {contributor.competencyAreas.map((area, areaIndex) => (
                      <span
                        key={areaIndex}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {(contributor.averageConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">confidence</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {contributor.topCompetency}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competency Distribution */}
      <div className="bg-white p-6 border border-gray-200 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-4">Competency Distribution</h4>
        <div className="space-y-3">
          {summary.topCompetencyAreas.map((area) => {
            const percentage = (area.count / summary.labelsGenerated) * 100;
            return (
              <div key={area.category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">{area.category}</span>
                  <span className="text-gray-600">{area.count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
