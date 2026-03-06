import { Plus, Save, TestTube, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { connectorApi } from '../services/api';
import { ConfluenceConfig, ConnectorConfig } from '../types';

export default function ConfluenceConfigTab() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ConfluenceConfig>({
    baseUrl: '',
    username: '',
    apiToken: '',
    spaces: [''],
  });
  const [loading, setLoading] = useState(false);
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([]);
  const [loadingConnectors, setLoadingConnectors] = useState(true);
  const [testingConnector, setTestingConnector] = useState<number | null>(null);

  useEffect(() => {
    loadConfluenceConnectors();
  }, []);

  const loadConfluenceConnectors = async () => {
    try {
      const response = await connectorApi.getAll();
      if (response.success) {
        // Filter only confluence connectors
        const confluenceConnectors = response.data?.filter(
          (connector: ConnectorConfig) => connector.connector_type === 'confluence'
        ) || [];
        setConnectors(confluenceConnectors);
      }
    } catch (error) {
      console.error('Failed to load Confluence connectors:', error);
    } finally {
      setLoadingConnectors(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await connectorApi.create({
        connectorType: 'confluence',
        name: `Confluence - ${formData.baseUrl}`,
        config: formData,
      });
      
      setFormData({
        baseUrl: '',
        username: '',
        apiToken: '',
        spaces: [''],
      });
      setShowForm(false);
      // Reload connectors to show the newly created one
      loadConfluenceConnectors();
    } catch (error) {
      console.error('Failed to create Confluence config:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSpace = () => {
    setFormData({
      ...formData,
      spaces: [...formData.spaces, ''],
    });
  };

  const removeSpace = (index: number) => {
    setFormData({
      ...formData,
      spaces: formData.spaces.filter((_, i) => i !== index),
    });
  };

  const updateSpace = (index: number, value: string) => {
    const newSpaces = [...formData.spaces];
    newSpaces[index] = value;
    setFormData({
      ...formData,
      spaces: newSpaces,
    });
  };

  const deleteConnector = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this Confluence configuration?')) {
      try {
        await connectorApi.delete(id);
        loadConfluenceConnectors();
      } catch (error) {
        console.error('Failed to delete connector:', error);
      }
    }
  };

  const testConnector = async (id: number) => {
    setTestingConnector(id);
    try {
      const response = await connectorApi.test(id);
      if (response.success) {
        alert(`✅ Connection test successful!\n\n${response.message}`);
      } else {
        alert(`❌ Connection test failed!\n\n${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to test connector:', error);
      alert('❌ Connection test failed. Please check the console for details.');
    } finally {
      setTestingConnector(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Confluence Configurations</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Configuration'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confluence Base URL
              </label>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="input"
                placeholder="https://your-domain.atlassian.net/wiki"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input"
                placeholder="your-email@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Token
              </label>
              <input
                type="password"
                value={formData.apiToken}
                onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                className="input"
                placeholder="Your Confluence API token"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spaces
              </label>
              {formData.spaces.map((space, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={space}
                    onChange={(e) => updateSpace(index, e.target.value)}
                    className="input"
                    placeholder="Space key"
                    required
                  />
                  {formData.spaces.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpace(index)}
                      className="btn btn-secondary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSpace}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Space
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </form>
        </div>
      )}

      {/* Display existing Confluence configurations */}
      {loadingConnectors ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : connectors.length > 0 ? (
        <div className="space-y-4">
          {connectors.map((connector) => {
            const config = JSON.parse(connector.config) as ConfluenceConfig;
            return (
              <div key={connector.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{connector.name}</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <strong>Base URL:</strong> {config.baseUrl}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Username:</strong> {config.username}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Spaces:</strong> {config.spaces.join(', ') || 'None configured'}
                      </p>
                      <p className="text-xs text-gray-500">
                        <strong>Status:</strong> {connector.is_active ? 'Active' : 'Inactive'} | 
                        <strong> Created:</strong> {new Date(connector.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => testConnector(connector.id)}
                        disabled={testingConnector === connector.id}
                        className="btn btn-secondary flex items-center gap-2"
                      >
                        <TestTube className="h-4 w-4" />
                        {testingConnector === connector.id ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        onClick={() => deleteConnector(connector.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          No Confluence configurations found. Add your first configuration above.
        </div>
      )}
    </div>
  );
}
