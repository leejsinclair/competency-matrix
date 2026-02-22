import { Plus, Save, TestTube, X } from 'lucide-react';
import { useState } from 'react';
import { connectorApi } from '../services/api';
import { JiraConfig } from '../types';

export default function JiraConfigTab() {
  const [configs, setConfigs] = useState<JiraConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<JiraConfig>({
    url: '',
    username: '',
    apiToken: '',
    boards: [''],
  });
  const [loading, setLoading] = useState(false);

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
      // Reload configs
      loadConfigs();
    } catch (error) {
      console.error('Failed to create Jira config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      const response = await connectorApi.getByType('jira');
      if (response.success) {
        const jiraConfigs = response.data.map(config => 
          JSON.parse(config.config) as JiraConfig
        );
        setConfigs(jiraConfigs);
      }
    } catch (error) {
      console.error('Failed to load Jira configs:', error);
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
        <div className="space-y-3">
          {configs.map((config, index) => (
            <div key={index} className="bg-white p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{config.url}</h4>
                  <p className="text-sm text-gray-600">User: {config.username}</p>
                  <p className="text-sm text-gray-600">
                    Boards: {config.boards.filter(b => b).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => {/* Test connection */}}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  Test
                </button>
              </div>
            </div>
          ))}
          {configs.length === 0 && (
            <p className="text-sm text-gray-500">No Jira configurations found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
