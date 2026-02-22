import { Plug, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { connectorApi } from '../services/api';
import { ConnectorConfig } from '../types';

export default function Connectors() {
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      const response = await connectorApi.getAll();
      if (response.success) {
        setConnectors(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load connectors:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleConnector = async (id: number, isActive: boolean) => {
    try {
      await connectorApi.toggle(id, isActive);
      loadConnectors();
    } catch (error) {
      console.error('Failed to toggle connector:', error);
    }
  };

  const deleteConnector = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this connector configuration?')) {
      try {
        await connectorApi.delete(id);
        loadConnectors();
      } catch (error) {
        console.error('Failed to delete connector:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Connector Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage and monitor all your connector configurations.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {connectors.length === 0 ? (
            <div className="text-center py-12">
              <Plug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Connectors</h3>
              <p className="text-gray-600 mb-4">
                Get started by configuring your first connector in the Configuration page.
              </p>
              <a
                href="/configuration"
                className="btn btn-primary"
              >
                Configure Connector
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {connectors.map((connector) => (
                <div
                  key={connector.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        connector.is_active ? 'bg-green-400' : 'bg-gray-300'
                      }`}></div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {connector.name}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {connector.connector_type} Connector
                        </p>
                        <p className="text-xs text-gray-400">
                          Created: {new Date(connector.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleConnector(connector.id, !connector.is_active)}
                        className={`p-2 rounded-md ${
                          connector.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={connector.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {connector.is_active ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => deleteConnector(connector.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
