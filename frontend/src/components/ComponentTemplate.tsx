import React, { useState, useEffect } from 'react';

/**
 * Component Template
 * 
 * Purpose: Template for creating new React components
 * Usage: Copy this file and modify for your specific component
 * Props: Define your component props below
 * Examples: See existing components for reference
 */

interface ComponentTemplateProps {
  // Define your props here
  title?: string;
  data?: any[];
  onAction?: (action: string) => void;
  className?: string;
}

const ComponentTemplate: React.FC<ComponentTemplateProps> = ({
  title = 'Default Title',
  data = [],
  onAction,
  className = '',
}) => {
  // State management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Effects
  useEffect(() => {
    // Component initialization logic
    console.log('ComponentTemplate mounted');
    
    return () => {
      // Cleanup logic
      console.log('ComponentTemplate unmounted');
    };
  }, []);

  // Event handlers
  const handleClick = (item: any) => {
    setSelectedItem(item);
    if (onAction) {
      onAction('item-selected');
    }
  };

  const handleLoadData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Data loading logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Data loaded successfully');
    } catch (err) {
      setError('Failed to load data');
      console.error('Data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render helpers
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding some data.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div
            key={index}
            className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors hover:border-blue-300 ${
              selectedItem === item ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => handleClick(item)}
          >
            <h4 className="font-medium text-gray-900">{item.title || `Item ${index + 1}`}</h4>
            <p className="text-sm text-gray-600 mt-1">{item.description || 'No description available'}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`component-template ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">
          Component template for rapid development
        </p>
      </div>

      {/* Actions */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={handleLoadData}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Load Data'}
        </button>
        
        {selectedItem && (
          <button
            onClick={() => setSelectedItem(null)}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {renderContent()}
      </div>

      {/* Selected Item Details */}
      {selectedItem && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900">Selected Item</h3>
          <pre className="mt-2 text-sm text-blue-800 whitespace-pre-wrap">
            {JSON.stringify(selectedItem, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ComponentTemplate;
