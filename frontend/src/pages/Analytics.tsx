import { BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { connectorApi } from '../services/api';

interface CompetencyScore {
  id: number;
  connector_id: number;
  competency_category: string;
  competency_row: string;
  actor: string;
  level: number;
  confidence: number;
  evidence_count: number;
  last_updated: string;
}

export default function Analytics() {
  const [scores, setScores] = useState<CompetencyScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await connectorApi.get('/api/processing/scores?connectorId=2');
      
      if (response && response.data && Array.isArray(response.data)) {
        setScores(response.data);
      } else {
        setScores([]);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      setScores([]);
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-blue-600 bg-blue-100';
    if (confidence >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Calculate analytics
  const totalAssessments = scores.length;
  const totalContributors = [...new Set(scores.map(s => s.actor))].length;
  const averageConfidence = scores.length > 0 ? scores.reduce((sum, s) => sum + s.confidence, 0) / scores.length : 0;
  
  const categoryStats = scores.reduce((acc, score) => {
    if (!acc[score.competency_category]) {
      acc[score.competency_category] = { count: 0, totalConfidence: 0, scores: [] };
    }
    acc[score.competency_category].count++;
    acc[score.competency_category].totalConfidence += score.confidence;
    acc[score.competency_category].scores.push(score);
    return acc;
  }, {} as Record<string, any>);

  const topContributors = Object.entries(
    scores.reduce((acc, score) => {
      if (!acc[score.actor]) {
        acc[score.actor] = { count: 0, totalConfidence: 0, scores: [] };
      }
      acc[score.actor].count++;
      acc[score.actor].totalConfidence += score.confidence;
      acc[score.actor].scores.push(score);
      return acc;
    }, {} as Record<string, any>)
  ).map(([actor, contributor]) => ({
      actor,
      averageConfidence: contributor.totalConfidence / contributor.count,
      competencies: contributor.count,
      topScore: Math.max(...contributor.scores.map((s: any) => s.confidence))
    }))
    .sort((a: any, b: any) => b.averageConfidence - a.averageConfidence)
    .slice(0, 6);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            View competency analytics and insights.
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading analytics data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            View competency analytics and insights.
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (totalAssessments === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            View competency analytics and insights.
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600">
                Analytics features will be available once data is collected from your configured connectors.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">
          View competency analytics and insights.
        </p>
      </div>

      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Competency Analytics & Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{totalAssessments}</div>
            <div className="text-sm text-gray-600">Total Assessments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{totalContributors}</div>
            <div className="text-sm text-gray-600">Contributors</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{Object.keys(categoryStats).length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{(averageConfidence * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </div>
        </div>
      </div>

      {/* Top Contributors */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topContributors.map((contributor: any, _index: any) => (
            <div key={contributor.actor} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 truncate">{contributor.actor}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Competencies:</span>
                  <span className="font-semibold">{contributor.competencies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Confidence:</span>
                  <span className={`font-semibold ${getConfidenceColor(contributor.averageConfidence)}`}>
                    {(contributor.averageConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Top Score:</span>
                  <span className={`font-semibold ${getConfidenceColor(contributor.topScore)}`}>
                    {(contributor.topScore * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(categoryStats).map(([category, stats]: [string, any]) => (
            <div key={category} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 capitalize">{category.replace(/-/g, ' ')}</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Assessments:</span>
                  <span className="font-semibold">{stats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Confidence:</span>
                  <span className={`font-semibold ${getConfidenceColor(stats.totalConfidence / stats.count)}`}>
                    {((stats.totalConfidence / stats.count) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Top Performers</h5>
                  <div className="space-y-1">
                    {stats.scores
                      .sort((a: any, b: any) => b.confidence - a.confidence)
                      .slice(0, 3)
                      .map((score: any, idx: any) => (
                        <div key={score.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{idx + 1}. {score.actor}</span>
                          <span className={getConfidenceColor(score.confidence)}>{(score.confidence * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
