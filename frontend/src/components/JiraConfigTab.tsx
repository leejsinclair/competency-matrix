import { Plus, Save, TestTube, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { connectorApi } from '../services/api';
import { ConnectorConfig, JiraConfig } from '../types';

export default function JiraConfigTab() {
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<JiraConfig>({
    url: '',
    username: '',
    apiToken: '',
    boards: [''],
  });
  const [loading, setLoading] = useState(false);
  const [loadingConnectors, setLoadingConnectors] = useState(true);
  const [testingConnector, setTestingConnector] = useState<number | null>(null);

  useEffect(() => {
    loadJiraConnectors();
  }, []);

  const loadJiraConnectors = async () => {
    try {
      const response = await connectorApi.getAll();
      if (response.success) {
        // Filter only jira connectors
        const jiraConnectors = response.data?.filter(
          (connector: ConnectorConfig) => connector.connector_type === 'jira'
        ) || [];
        setConnectors(jiraConnectors);
      }
    } catch (error) {
      console.error('Failed to load Jira connectors:', error);
    } finally {
      setLoadingConnectors(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await connectorApi.create({
        connectorType: 'jira',
        name: `Jira - ${formData.url}`,
        config: formData,
      });
      
      // Reset form
      setFormData({
        url: '',
        username: '',
        apiToken: '',
        boards: [''],
      });
      setShowForm(false);
      // Reload connectors to show the newly created one
      loadJiraConnectors();
    } catch (error) {
      console.error('Failed to create Jira config:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConnector = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this Jira configuration?')) {
      try {
        await connectorApi.delete(id);
        loadJiraConnectors();
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

  const addBoard = () => {
    setFormData({
      ...formData,
      boards: [...formData.boards, ''],
    });
  };

  const removeBoard = (index: number) => {
    setFormData({
      ...formData,
      boards: formData.boards.filter((_, i) => i !== index),
    });
  };

  const updateBoard = (index: number, value: string) => {
    const newBoards = [...formData.boards];
    newBoards[index] = value;
    setFormData({
      ...formData,
      boards: newBoards,
    });
  };

  return (
    <div className="space-y-6">
      {/* Existing Configurations */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Jira Configurations</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary flex items-center gap-2"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Add Configuration'}
          </button>
        </div>

        {/* Configuration Form */}
        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jira URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="input"
                  placeholder="https://your-domain.atlassian.net"
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
                  placeholder="Your Jira API token"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Boards
                </label>
                {formData.boards.map((board, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={board}
                      onChange={(e) => updateBoard(index, e.target.value)}
                      className="input"
                      placeholder="Board name or ID"
                      required
                    />
                    {formData.boards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBoard(index)}
                        className="btn btn-secondary"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBoard}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Board
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Configurations List */}
        {loadingConnectors ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : connectors.length > 0 ? (
          <div className="space-y-3">
            {connectors.map((connector) => {
              const config = JSON.parse(connector.config) as JiraConfig;
              return (
                <div key={connector.id} className="bg-white p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{connector.name}</h4>
                      <p className="text-sm text-gray-600">URL: {config.url}</p>
                      <p className="text-sm text-gray-600">User: {config.username}</p>
                      <p className="text-sm text-gray-600">
                        Boards: {config.boards.filter(b => b).join(', ') || 'None configured'}
                      </p>
                      <p className="text-xs text-gray-500">
                        <strong>Status:</strong> {connector.is_active ? 'Active' : 'Inactive'} | 
                        <strong> Created:</strong> {new Date(connector.created_at).toLocaleDateString()}
                      </p>
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
          <p className="text-sm text-gray-500">No Jira configurations found.</p>
        )}
      </div>
    </div>
  );
}
