import { useEffect, useState } from 'react';
import { connectorApi } from '../services/api';

interface ProcessingStatus {
  totalConnectors: number;
  totalLabels: number;
  totalErrors: number;
  categories: string[];
}

interface ProcessingResult {
  totalConnectors: number;
  successful: number;
  failed: number;
  totalEvents: number;
  totalLabels: number;
  results: any[];
}

interface CompetencyScore {
  id: number;
  connector_id: number;
  competency_category: string;
  competency_row: string;
  actor: string;
  level: number;
  confidence: number;
  evidence_count: number;
  last_updated: string;
}

export default function ProcessingTab() {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [scores, setScores] = useState<CompetencyScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [lastResult, setLastResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
    loadScores();
  }, []);

  useEffect(() => {
    console.log('🔄 Scores state changed:', scores?.length, 'items');
  }, [scores]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await connectorApi.get('/api/processing/status');
      setStatus(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load processing status');
      console.error('Failed to load status:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadScores = async () => {
    try {
      const response = await connectorApi.get('/api/processing/scores?connectorId=2');
      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response data:', response);
      
      // API returns data directly, not wrapped in success/data structure
      if (response && response.data && Array.isArray(response.data)) {
        console.log('✅ Setting scores:', response.data.length, 'items');
        setScores(response.data);
      } else {
        console.log('❌ Invalid response structure - setting empty array');
        setScores([]);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load competency scores');
      setScores([]);
      console.error('Failed to load scores:', err);
    }
  };

  const regenerateScores = async () => {
    try {
      setRegenerating(true);
      setError(null);
      
      const response = await connectorApi.post('/api/processing/regenerate-scores');
      console.log('Scores regenerated:', response.data);
      
      // Reload scores after regeneration
      await loadScores();
      await loadStatus();
    } catch (err) {
      setError('Failed to regenerate competency scores');
      console.error('Failed to regenerate scores:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const startProcessing = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      const response = await connectorApi.post('/api/processing/process', {
        connectorIds: [2], // Use Confluence connector ID
        limit: 50
      });
      
      console.log('Processing result:', response.data);
      setLastResult(response.data.data);
      
      await loadStatus();
    } catch (err) {
      setError('Processing failed');
      console.error('Processing failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Processing & Analysis</h3>
        <button
          onClick={loadStatus}
          disabled={loading}
          className="btn btn-secondary"
        >
          {loading ? 'Loading...' : 'Refresh Status'}
        </button>
      </div>

      {/* Processing Status */}
      {status && (
        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">System Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{status.totalConnectors}</div>
              <div className="text-sm text-gray-600">Active Connectors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{status.totalLabels}</div>
              <div className="text-sm text-gray-600">Labels Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{status.totalErrors}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{status.categories?.length || 0}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Controls */}
      <div className="bg-white p-6 border border-gray-200 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-4">Processing Controls</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Test the processing system with sample data to see how competency classification works.
              </p>
            </div>
            <button
              onClick={startProcessing}
              disabled={processing}
              className="btn btn-primary"
            >
              {processing ? 'Processing...' : 'Run Demo Processing'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Regenerate competency scores with updated algorithms.
              </p>
            </div>
            <button
              onClick={regenerateScores}
              disabled={regenerating}
              className="btn btn-secondary"
            >
              {regenerating ? 'Regenerating...' : 'Regenerate Scores'}
            </button>
          </div>
        </div>
      </div>

      {/* Competency Scores */}
      {scores && scores.length > 0 ? (
        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Competency Scores ({scores.length} assessments)
          </h4>
          <div className="space-y-3">
            {/* Top contributors by score */}
            <div className="border-b pb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Top Contributors</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {scores
                  .reduce((acc: any[], score) => {
                    const existing = acc.find(item => item.actor === score.actor);
                    if (existing) {
                      existing.scores.push(score);
                      existing.avgScore = (existing.avgScore * (existing.scores.length - 1) + score.confidence) / existing.scores.length;
                    } else {
                      acc.push({
                        actor: score.actor,
                        scores: [score],
                        avgScore: score.confidence,
                        categories: [score.competency_category]
                      });
                    }
                    return acc;
                  }, [])
                  .sort((a, b) => b.avgScore - a.avgScore)
                  .slice(0, 6)
                  .map((contributor) => (
                    <div key={contributor.actor} className="border rounded p-3">
                      <div className="font-medium text-gray-900">{contributor.actor}</div>
                      <div className="text-sm text-gray-600">
                        Avg Score: {(contributor.avgScore * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {contributor.scores.length} competencies
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {contributor.categories.slice(0, 3).map((cat: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {cat.split('-')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Category distribution */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Category Distribution</h5>
              <div className="space-y-2">
                {Object.entries(
                  scores.reduce((acc: Record<string, number>, score) => {
                    acc[score.competency_category] = (acc[score.competency_category] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${((count as number) / scores.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count as number}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : scores && scores.length === 0 ? (
        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Competency Scores</h4>
          <p className="text-sm text-gray-600">No competency scores available. Run processing to generate scores.</p>
        </div>
      ) : null}

      {/* Last Processing Result */}
      {lastResult && (
        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Last Processing Result</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{lastResult.totalConnectors}</div>
                <div className="text-sm text-gray-600">Connectors</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{lastResult.successful}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{lastResult.totalEvents}</div>
                <div className="text-sm text-gray-600">Events</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">{lastResult.totalLabels}</div>
                <div className="text-sm text-gray-600">Labels</div>
              </div>
            </div>
            
            {lastResult.results.map((result, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-gray-900">{result.connectorName}</h5>
                    <p className="text-sm text-gray-600">Type: {result.connectorType}</p>
                    {result.eventsProcessed && (
                      <p className="text-sm text-gray-600">Events: {result.eventsProcessed}</p>
                    )}
                    {result.labelsGenerated && (
                      <p className="text-sm text-gray-600">Labels: {result.labelsGenerated}</p>
                    )}
                    {result.processingTime && (
                      <p className="text-sm text-gray-600">Time: {result.processingTime}ms</p>
                    )}
                  </div>
                  {result.error && (
                    <div className="text-red-600 text-sm">Error: {result.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Categories */}
      {status?.categories && status.categories.length > 0 && (
        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Competency Categories</h4>
          <div className="flex flex-wrap gap-2">
            {status.categories.map((category, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
