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
  results: Array<{
    connectorId: number;
    connectorName: string;
    connectorType: string;
    eventsProcessed?: number;
    labelsGenerated?: number;
    errors?: number;
    processingTime?: number;
    error?: string;
  }>;
}

export default function ProcessingTab() {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await connectorApi.get('/api/processing/status');
      setStatus(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load processing status');
      console.error('Failed to load status:', err);
    } finally {
      setLoading(false);
    }
  };

  const startProcessing = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      const response = await connectorApi.post('/api/processing/process', {
        connectorIds: [5, 6], // Process Bitbucket connectors
        limit: 50
      });
      
      console.log('Processing result:', response.data);
      setLastResult(response.data);
      
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
        </div>
      </div>

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
