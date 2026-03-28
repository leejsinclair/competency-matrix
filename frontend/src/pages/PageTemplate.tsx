import React, { useState, useEffect } from 'react';
import ComponentTemplate from '../components/ComponentTemplate';

/**
 * Page Template
 * 
 * Purpose: Template for creating new React pages
 * Usage: Copy this file and modify for your specific page
 * Features: Includes common page patterns and layout
 * Examples: See existing pages for reference
 */

const PageTemplate: React.FC = () => {
  // Page state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [data, setData] = useState<any[]>([]);

  // Effects
  useEffect(() => {
    // Page initialization
    console.log('PageTemplate mounted');
    loadInitialData();
    
    return () => {
      // Cleanup
      console.log('PageTemplate unmounted');
    };
  }, []);

  // Data loading
  const loadInitialData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API call
      const mockData = [
        { id: 1, title: 'Sample Item 1', description: 'This is a sample item' },
        { id: 2, title: 'Sample Item 2', description: 'Another sample item' },
        { id: 3, title: 'Sample Item 3', description: 'Yet another sample item' },
      ];
      
      setData(mockData);
      console.log('Page data loaded successfully');
    } catch (err) {
      setError('Failed to load page data');
      console.error('Page data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Event handlers
  const handleRefresh = () => {
    loadInitialData();
  };

  const handleAction = (action: string) => {
    console.log('Page action:', action);
    // Handle page-specific actions
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Page Template</h1>
              <p className="mt-1 text-sm text-gray-600">
                Template for creating new pages with consistent structure
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button
                onClick={() => console.log('Settings clicked')}
                className="px-3 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Settings
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-3 rounded-md border bg-red-50 border-red-200 text-red-800">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 p-3 rounded-md border bg-blue-50 border-blue-200 text-blue-800">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm font-medium">Loading page data...</span>
              </div>
            </div>
          )}
        </div>

        {/* Page Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <ComponentTemplate
              title="Main Content"
              data={data}
              onAction={handleAction}
              className="h-full"
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Page Information</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Status</h4>
                  <p className="text-sm text-gray-600">
                    {isLoading ? 'Loading...' : data.length > 0 ? 'Data loaded' : 'No data'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Items Count</h4>
                  <p className="text-sm text-gray-600">{data.length} items</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Last Updated</h4>
                  <p className="text-sm text-gray-600">{new Date().toLocaleString()}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => console.log('Export clicked')}
                  className="w-full px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Export Data
                </button>
                
                <button
                  onClick={() => console.log('Import clicked')}
                  className="w-full px-4 py-2 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600"
                >
                  Import Data
                </button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  View Documentation
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  Check Status
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  Get Help
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Sections */}
        <div className="mt-8">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Additional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Usage Guide</h4>
                  <p className="text-sm text-gray-600">
                    This page template provides a consistent structure for new pages. 
                    Modify the content and components to match your specific requirements.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Best Practices</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Use consistent styling with Tailwind CSS</li>
                    <li>• Implement proper error handling</li>
                    <li>• Add loading states for better UX</li>
                    <li>• Include accessibility features</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageTemplate;
