import {
  ChartBarIcon,
  CheckCircleIcon,
  FileExclamationPointIcon,
  ServerIcon
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { connectorApi } from '../services/api';
import { ConnectorConfig } from '../types';

export default function Dashboard() {
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      setLoading(true);
      const response = await connectorApi.getAll();
      if (response.success) {
        setConnectors(response.data || []);
      } else {
        setError('Failed to load connectors');
      }
    } catch (err) {
      setError('Error loading connectors');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: connectors.length,
    active: connectors.filter(c => c.is_active).length,
    jira: connectors.filter(c => c.connector_type === 'jira').length,
    confluence: connectors.filter(c => c.connector_type === 'confluence').length,
    bitbucket: connectors.filter(c => c.connector_type === 'bitbucket').length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <FileExclamationPointIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome to the Competency Matrix Platform. Here's an overview of your connector configurations.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ServerIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Connectors
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Connectors
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.active}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Jira Connectors
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.jira}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Other Connectors
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.confluence + stats.bitbucket}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Connectors */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Connector Configurations
          </h3>
          <div className="space-y-3">
            {connectors.slice(0, 5).map((connector) => (
              <div key={connector.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    connector.is_active ? 'bg-green-400' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{connector.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{connector.connector_type}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(connector.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {connectors.length === 0 && (
              <p className="text-sm text-gray-500">No connectors configured yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
