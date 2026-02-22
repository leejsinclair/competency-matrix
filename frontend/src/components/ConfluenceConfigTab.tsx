import { useState } from 'react';
import { connectorApi } from '../services/api';
import { ConfluenceConfig } from '../types';
import { Plus, X, Save } from 'lucide-react';

export default function ConfluenceConfigTab() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ConfluenceConfig>({
    baseUrl: '',
    username: '',
    apiToken: '',
    spaces: [''],
  });
  const [loading, setLoading] = useState(false);

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

      <div className="text-sm text-gray-500">
        No Confluence configurations found. Add your first configuration above.
      </div>
    </div>
  );
}
