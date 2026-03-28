import React, { useState } from 'react';
import SimpleMatrix from '../components/SimpleMatrix';

const Matrix: React.FC = () => {
  const [viewMode, setViewMode] = useState<'circleci' | 'detailed'>('circleci');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Handle data reanalysis
  const handleReanalysis = async () => {
    setIsProcessing(true);
    setProcessingStatus('Starting data reanalysis...');
    
    try {
      // Step 1: Try to trigger score generation first (most reliable)
      setProcessingStatus('Generating competency scores...');
      const scoresResponse = await fetch('/api/processing/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (scoresResponse.ok) {
        const scoresResult = await scoresResponse.json();
        setProcessingStatus(`✅ Generated ${scoresResult.scores || 0} competency scores!`);
      } else {
        // Fallback to manual notification
        setProcessingStatus('⚠️ Backend processing unavailable. Please run scripts manually.');
      }
      
      // Step 2: Refresh the matrix data
      setProcessingStatus('Refreshing matrix display...');
      
      // Trigger a refresh of the SimpleMatrix component
      window.dispatchEvent(new CustomEvent('refreshMatrix'));
      
      setProcessingStatus('✅ Reanalysis completed!');
      setLastUpdated(new Date().toLocaleString());
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setProcessingStatus('');
      }, 3000);
      
    } catch (error) {
      console.error('Reanalysis failed:', error);
      setProcessingStatus('⚠️ Processing unavailable. Use "Refresh Data" to update display.');
      
      // Still refresh the matrix
      window.dispatchEvent(new CustomEvent('refreshMatrix'));
      setLastUpdated(new Date().toLocaleString());
      
      // Clear error status after 4 seconds
      setTimeout(() => {
        setProcessingStatus('');
      }, 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle data refresh only
  const handleRefresh = async () => {
    setIsProcessing(true);
    setProcessingStatus('Refreshing matrix data...');
    
    try {
      // Trigger a refresh of the SimpleMatrix component
      window.dispatchEvent(new CustomEvent('refreshMatrix'));
      
      setProcessingStatus('✅ Matrix data refreshed!');
      setLastUpdated(new Date().toLocaleString());
      
      setTimeout(() => {
        setProcessingStatus('');
      }, 2000);
      
    } catch (error) {
      console.error('Refresh failed:', error);
      setProcessingStatus('❌ Refresh failed. Please try again.');
      
      setTimeout(() => {
        setProcessingStatus('');
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Competency Matrix</h1>
              <p className="mt-1 text-sm text-gray-600">
                CircleCI Engineering Competency Matrix with detailed breakdowns
              </p>
              {lastUpdated && (
                <p className="mt-1 text-xs text-gray-500">
                  Last updated: {lastUpdated}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isProcessing}
                className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button
                onClick={handleReanalysis}
                disabled={isProcessing}
                className="px-3 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Reanalyze Data'}
              </button>
              <button
                onClick={() => setViewMode('circleci')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'circleci'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                CircleCI View
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'detailed'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Detailed Report
              </button>
            </div>
          </div>

          {/* Processing Status */}
          {processingStatus && (
            <div className={`mt-4 p-3 rounded-md border ${
              processingStatus.includes('✅') 
                ? 'bg-green-50 border-green-200 text-green-800'
                : processingStatus.includes('❌')
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                {isProcessing && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                )}
                <span className="text-sm font-medium">{processingStatus}</span>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  CircleCI Engineering Competency Matrix
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p className="mb-1">
                    <strong>Interactive Flashcards:</strong> Click any colored cell to toggle between competency descriptions and confidence details.
                  </p>
                  <p className="mb-1">
                    <strong>Complete Coverage:</strong> All cells show CircleCI competency descriptions, including levels not yet achieved.
                  </p>
                  <p className="mb-1">
                    <strong>Progressive Levels:</strong> Light gray = not achieved, gray = completed levels, colored = current level.
                  </p>
                  <p>
                    <strong>Data Management:</strong> Use "Reanalyze Data" to process new activities or "Refresh Data" to update the display.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Render the SimpleMatrix component */}
        <SimpleMatrix />
        
        {/* Additional information section */}
        {viewMode === 'detailed' && (
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Understanding the Matrix
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Competency Levels</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2 mt-1"></span>
                        <span><strong>Level 1 - Beginner:</strong> Basic understanding and limited application</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-3 h-3 bg-amber-500 rounded-full mr-2 mt-1"></span>
                        <span><strong>Level 2 - Intermediate:</strong> Competent with moderate experience</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 mt-1"></span>
                        <span><strong>Level 3 - Advanced:</strong> Skilled with extensive experience</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2 mt-1"></span>
                        <span><strong>Level 4 - Expert:</strong> Mastery and can teach others</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Data Management</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• <strong>Refresh Data:</strong> Updates the matrix display with latest scores</li>
                      <li>• <strong>Reanalyze Data:</strong> Processes new activities and regenerates all scores</li>
                      <li>• <strong>Automatic Updates:</strong> Matrix shows real-time competency assessments</li>
                      <li>• <strong>Rule Engine:</strong> Applies competency rules to generate detailed breakdowns</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Matrix;
