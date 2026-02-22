import { useState } from 'react';
import { connectorApi } from '../services/api';
import { BitbucketConfig } from '../types';
import { Plus, X, Save } from 'lucide-react';

export default function BitbucketConfigTab() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BitbucketConfig>({
    baseUrl: '',
    username: '',
    appPassword: '',
    repositories: [''],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await connectorApi.create({
        connectorType: 'bitbucket',
        name: `Bitbucket - ${formData.baseUrl}`,
        config: formData,
      });
      
      setFormData({
        baseUrl: '',
        username: '',
        appPassword: '',
        repositories: [''],
      });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create Bitbucket config:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRepository = () => {
    setFormData({
      ...formData,
      repositories: [...formData.repositories, ''],
    });
  };

  const removeRepository = (index: number) => {
    setFormData({
      ...formData,
      repositories: formData.repositories.filter((_, i) => i !== index),
    });
  };

  const updateRepository = (index: number, value: string) => {
    const newRepositories = [...formData.repositories];
    newRepositories[index] = value;
    setFormData({
      ...formData,
      repositories: newRepositories,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Bitbucket Configurations</h3>
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
                Bitbucket Base URL
              </label>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="input"
                placeholder="https://api.bitbucket.org/2.0"
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
                placeholder="your-bitbucket-username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App Password
              </label>
              <input
                type="password"
                value={formData.appPassword}
                onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
                className="input"
                placeholder="Your Bitbucket app password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repositories
              </label>
              {formData.repositories.map((repo, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={repo}
                    onChange={(e) => updateRepository(index, e.target.value)}
                    className="input"
                    placeholder="workspace/repository-name"
                    required
                  />
                  {formData.repositories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRepository(index)}
                      className="btn btn-secondary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRepository}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Repository
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
        No Bitbucket configurations found. Add your first configuration above.
      </div>
    </div>
  );
}
