import React, { useState, useEffect } from 'react';
import { DeveloperMatrix, getLevelName } from '../types/matrix';

interface DeveloperReportProps {
  isOpen: boolean;
  onClose: () => void;
  developer: string;
}

interface ReportSection {
  title: string;
  type: 'summary' | 'matrix' | 'trends' | 'recommendations';
  data: any;
}

const DeveloperReport: React.FC<DeveloperReportProps> = ({ 
  isOpen, 
  onClose, 
  developer 
}) => {
  const [matrix, setMatrix] = useState<DeveloperMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && developer) {
      generateReport();
    }
  }, [isOpen, developer]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setIsGenerating(true);
    
    try {
      // Fetch developer matrix data
      const response = await fetch(`http://localhost:3001/api/matrix/developer/${developer}`);
      const result = await response.json();
      
      if (result.success) {
        setMatrix(result.data);
        
        // Generate report sections
        const sections: ReportSection[] = [
          {
            title: 'Executive Summary',
            type: 'summary',
            data: generateExecutiveSummary(result.data)
          },
          {
            title: 'Competency Matrix Analysis',
            type: 'matrix',
            data: generateMatrixAnalysis(result.data)
          },
          {
            title: 'Performance Trends',
            type: 'trends',
            data: generateTrendsData(result.data)
          },
          {
            title: 'Development Recommendations',
            type: 'recommendations',
            data: generateRecommendations(result.data)
          }
        ];
        
        setReportSections(sections);
      } else {
        setError(result.error || 'Failed to generate report');
      }
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const generateExecutiveSummary = (data: DeveloperMatrix) => {
    const topCategories = data.categories
      .map(cat => ({
        name: cat.displayName,
        avgConfidence: cat.summary.averageConfidence,
        avgLevel: cat.summary.averageLevel,
        scoreCount: cat.summary.totalScores
      }))
      .sort((a, b) => b.avgConfidence - a.avgConfidence)
      .slice(0, 3);

    const weakestCategories = data.categories
      .map(cat => ({
        name: cat.displayName,
        avgConfidence: cat.summary.averageConfidence,
        avgLevel: cat.summary.averageLevel,
        scoreCount: cat.summary.totalScores
      }))
      .sort((a, b) => a.avgConfidence - b.avgConfidence)
      .slice(0, 2);

    return {
      overallScore: (data.summary.averageConfidence * 100).toFixed(1),
      overallLevel: data.summary.averageLevel.toFixed(1),
      totalAssessments: data.summary.totalScores,
      topStrengths: topCategories,
      areasForImprovement: weakestCategories,
      levelDistribution: data.summary.levelDistribution
    };
  };

  const generateMatrixAnalysis = (data: DeveloperMatrix) => {
    return data.categories.map(category => ({
      name: category.displayName,
      rows: category.rows.map(row => ({
        name: row.displayName,
        level: Object.values(row.levels).find(cell => cell)?.level || 0,
        confidence: Object.values(row.levels).find(cell => cell)?.confidence || 0,
        evidenceCount: Object.values(row.levels).find(cell => cell)?.evidenceCount || 0
      }))
    }));
  };

  const generateTrendsData = (data: DeveloperMatrix) => {
    // Mock trend data - in real implementation this would come from historical data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trendData = months.map((month, index) => ({
      month,
      confidence: Math.min(0.95, data.summary.averageConfidence + (index * 0.02)),
      level: Math.min(4, data.summary.averageLevel + (index * 0.1))
    }));

    return {
      monthlyProgress: trendData,
      overallTrend: 'improving',
      growthRate: '+15%'
    };
  };

  const generateRecommendations = (data: DeveloperMatrix) => {
    const recommendations = [];

    // Identify areas needing improvement
    const weakAreas = data.categories
      .filter(cat => cat.summary.averageConfidence < 0.6)
      .map(cat => cat.displayName);

    if (weakAreas.length > 0) {
      recommendations.push({
        type: 'improvement',
        priority: 'high',
        title: `Focus on ${weakAreas.join(' and ')}`,
        description: `Consider additional training and practical experience in ${weakAreas.join(' and ')} to strengthen your competency profile.`,
        actionItems: [
          'Complete relevant online courses or certifications',
          'Seek mentorship from senior team members',
          'Take on projects that require these skills'
        ]
      });
    }

    // Identify strengths to leverage
    const strongAreas = data.categories
      .filter(cat => cat.summary.averageConfidence > 0.8)
      .map(cat => cat.displayName);

    if (strongAreas.length > 0) {
      recommendations.push({
        type: 'leverage',
        priority: 'medium',
        title: `Leverage strengths in ${strongAreas.join(' and ')}`,
        description: `Your strong performance in ${strongAreas.join(' and ')} presents opportunities for leadership and mentorship roles.`,
        actionItems: [
          'Mentor junior team members in these areas',
          'Lead projects requiring these competencies',
          'Share knowledge through documentation and presentations'
        ]
      });
    }

    // General development recommendation
    recommendations.push({
      type: 'development',
      priority: 'medium',
      title: 'Continue Professional Development',
      description: 'Maintain your current growth trajectory by consistently seeking new challenges and learning opportunities.',
      actionItems: [
        'Set quarterly learning goals',
        'Attend industry conferences and workshops',
        'Contribute to open source projects',
        'Read technical books and blogs regularly'
      ]
    });

    return recommendations;
  };

  const exportReport = async () => {
    // Mock export functionality
    console.log('Exporting report for', developer);
    alert('Report exported successfully!');
  };

  const renderSummarySection = (data: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{data.overallScore}%</div>
          <div className="text-sm text-gray-600">Overall Score</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{getLevelName(Math.round(data.overallLevel))}</div>
          <div className="text-sm text-gray-600">Average Level</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{data.totalAssessments}</div>
          <div className="text-sm text-gray-600">Assessments</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Top Strengths</h4>
          <div className="space-y-2">
            {data.topStrengths.map((strength: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{strength.name}</span>
                <span className="text-sm font-medium text-green-600">
                  {(strength.avgConfidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
          <div className="space-y-2">
            {data.areasForImprovement.map((area: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{area.name}</span>
                <span className="text-sm font-medium text-orange-600">
                  {(area.avgConfidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMatrixSection = (data: any) => (
    <div className="space-y-4">
      {data.map((category: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">{category.name}</h4>
          <div className="space-y-2">
            {category.rows.map((row: any, rowIndex: number) => (
              <div key={rowIndex} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{row.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    Level {row.level} ({getLevelName(row.level)})
                  </span>
                  <span className="text-sm text-gray-500">
                    {(row.confidence * 100).toFixed(0)}% confidence
                  </span>
                  <span className="text-xs text-gray-400">
                    {row.evidenceCount} evidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderTrendsSection = (data: any) => (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-900">Performance Trend</h4>
          <span className="text-sm font-medium text-green-600">{data.overallTrend}</span>
        </div>
        <div className="text-sm text-gray-600 mb-2">Growth Rate: {data.growthRate}</div>
        
        <div className="space-y-2">
          {data.monthlyProgress.map((point: any, index: number) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-700">{point.month}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm">Level {point.level.toFixed(1)}</span>
                <span className="text-sm text-gray-500">
                  {(point.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRecommendationsSection = (data: any) => (
    <div className="space-y-4">
      {data.map((rec: any, index: number) => (
        <div key={index} className={`border-l-4 rounded-lg p-4 ${
          rec.priority === 'high' ? 'border-red-500 bg-red-50' :
          rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
          'border-blue-500 bg-blue-50'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-900">{rec.title}</h4>
            <span className={`text-xs px-2 py-1 rounded ${
              rec.priority === 'high' ? 'bg-red-200 text-red-800' :
              rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
              'bg-blue-200 text-blue-800'
            }`}>
              {rec.priority}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-1">Action Items:</h5>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {rec.actionItems.map((item: string, itemIndex: number) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSection = (section: ReportSection) => {
    switch (section.type) {
      case 'summary':
        return renderSummarySection(section.data);
      case 'matrix':
        return renderMatrixSection(section.data);
      case 'trends':
        return renderTrendsSection(section.data);
      case 'recommendations':
        return renderRecommendationsSection(section.data);
      default:
        return <div>Unknown section type</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Developer Report</h2>
              <p className="text-sm text-gray-600 mt-1">
                {developer} • Generated {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportReport}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Export PDF
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {loading || isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-gray-600">
                  {isGenerating ? 'Generating comprehensive report...' : 'Loading data...'}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-600">Error: {error}</div>
            </div>
          ) : (
            <div className="space-y-8">
              {reportSections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h3>
                  {renderSection(section)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperReport;
