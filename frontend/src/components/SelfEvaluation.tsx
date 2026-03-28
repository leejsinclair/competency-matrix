import React, { useEffect, useState } from 'react';
import { COMPETENCY_CATEGORIES } from '../types/matrix';

interface SelfEvaluationProps {
  isOpen: boolean;
  onClose: () => void;
  developer: string;
}

interface EvaluationData {
  category: string;
  row: string;
  selfLevel: number;
  selfConfidence: number;
  evidence: string;
}

const SelfEvaluation: React.FC<SelfEvaluationProps> = ({ 
  isOpen, 
  onClose, 
  developer 
}) => {
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = Object.values(COMPETENCY_CATEGORIES);
  const totalSteps = categories.reduce((sum, cat) => sum + cat.rows.length, 0);

  useEffect(() => {
    if (isOpen) {
      initializeEvaluations();
    }
  }, [isOpen]);

  const initializeEvaluations = () => {
    const initialEvaluations: EvaluationData[] = [];
    
    Object.entries(COMPETENCY_CATEGORIES).forEach(([categoryKey, categoryData]) => {
      categoryData.rows.forEach(row => {
        initialEvaluations.push({
          category: categoryKey,
          row: row.id,
          selfLevel: 2, // Default to intermediate
          selfConfidence: 0.7, // Default confidence
          evidence: ''
        });
      });
    });
    
    setEvaluations(initialEvaluations);
    setCurrentStep(0);
    setSubmitted(false);
  };

  const getCurrentEvaluation = () => {
    return evaluations[currentStep];
  };

  const updateEvaluation = (field: keyof EvaluationData, value: any) => {
    setEvaluations(prev => {
      const updated = [...prev];
      updated[currentStep] = {
        ...updated[currentStep],
        [field]: value
      };
      return updated;
    });
  };

  const goToNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getProgressPercentage = () => {
    return Math.round(((currentStep + 1) / totalSteps) * 100);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Mock API call - in real implementation this would save to backend
      console.log('Submitting self-evaluations:', {
        developer,
        evaluations,
        submittedAt: new Date().toISOString()
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
      alert('Failed to submit evaluation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    return COMPETENCY_CATEGORIES[category as keyof typeof COMPETENCY_CATEGORIES];
  };

  const getRowInfo = (category: string, row: string) => {
    const cat = getCategoryInfo(category);
    return cat?.rows.find(r => r.id === row);
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Evaluation Complete!</h2>
          <p className="text-gray-600 mb-6">
            Your self-evaluation has been submitted successfully. Your responses will be compared with system-generated assessments to provide insights into your competency development.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentEval = getCurrentEvaluation();
  const categoryInfo = getCategoryInfo(currentEval?.category || '');
  const rowInfo = getRowInfo(currentEval?.category || '', currentEval?.row || '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Self-Evaluation</h2>
              <p className="text-sm text-gray-600 mt-1">
                {developer} • Step {currentStep + 1} of {totalSteps}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1 text-center">
              {getProgressPercentage()}% Complete
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentEval && categoryInfo && rowInfo && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {categoryInfo.displayName}
                </h3>
                <p className="text-gray-700">{rowInfo.displayName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Skill Level
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: 1, label: 'Beginner', description: 'Basic understanding and limited application' },
                    { value: 2, label: 'Intermediate', description: 'Competent with moderate experience' },
                    { value: 3, label: 'Advanced', description: 'Skilled with extensive experience' },
                    { value: 4, label: 'Expert', description: 'Mastery and can teach others' }
                  ].map(level => (
                    <label key={level.value} className="relative">
                      <input
                        type="radio"
                        name="level"
                        value={level.value}
                        checked={currentEval.selfLevel === level.value}
                        onChange={() => updateEvaluation('selfLevel', level.value)}
                        className="sr-only"
                      />
                      <div className={`
                        p-3 border-2 rounded-lg cursor-pointer transition-colors text-center
                        ${currentEval.selfLevel === level.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-xs text-gray-600 mt-1">{level.value}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence in Your Assessment
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentEval.selfConfidence * 100}
                    onChange={(e) => updateEvaluation('selfConfidence', parseInt(e.target.value) / 100)}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 w-12">
                    {Math.round(currentEval.selfConfidence * 100)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  How confident are you in this self-assessment?
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Evidence (Optional)
                </label>
                <textarea
                  value={currentEval.evidence}
                  onChange={(e) => updateEvaluation('evidence', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide examples of projects, achievements, or experiences that demonstrate your competency in this area..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  This helps validate your self-assessment and provides context for development planning.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between">
            <button
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            
            <div className="text-sm text-gray-600">
              {currentStep + 1} of {totalSteps}
            </div>
            
            {currentStep === totalSteps - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            ) : (
              <button
                onClick={goToNextStep}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfEvaluation;
