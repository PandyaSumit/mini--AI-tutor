import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EnhancedRoadmapDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePhase, setActivePhase] = useState(0);
  const [activeModule, setActiveModule] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    fetchRoadmap();
  }, [id]);

  const fetchRoadmap = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/enhanced-roadmaps/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setRoadmap(response.data.roadmap);
      }
    } catch (err) {
      console.error('Error fetching roadmap:', err);
      setError(err.response?.data?.message || 'Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/enhanced-roadmaps/${id}/task/${taskId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchRoadmap(); // Refresh
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  const completeConcept = async (conceptId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/enhanced-roadmaps/${id}/concept/${conceptId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchRoadmap(); // Refresh
    } catch (err) {
      console.error('Error completing concept:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Roadmap not found'}</p>
          <button
            onClick={() => navigate('/enhanced-roadmaps')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Roadmaps
          </button>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  // Check if module prerequisites are met
  const arePrerequisitesMet = (module, allModules) => {
    if (!module.prerequisiteModules || module.prerequisiteModules.length === 0) {
      return true;
    }

    // Check if all prerequisite modules are completed
    for (const prereqId of module.prerequisiteModules) {
      const prereqModule = allModules.find(m => m.moduleId === prereqId);
      if (!prereqModule || prereqModule.status !== 'completed') {
        return false;
      }
    }

    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{roadmap.title}</h1>
              <p className="text-gray-600 mb-4">{roadmap.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(roadmap.personalization.finalSkillLevel)}`}>
                  {roadmap.personalization.finalSkillLevel.replace('_', ' ')}
                </span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  {roadmap.personalization.learningPath}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  {roadmap.personalization.domain || 'General'}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/enhanced-roadmaps')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{roadmap.overallProgress || 0}%</div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {roadmap.progressMetrics?.modulesCompleted || 0}/{roadmap.metadata?.totalModules || 0}
              </div>
              <div className="text-sm text-gray-600">Modules Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {roadmap.progressMetrics?.quizzesCompleted || 0}
              </div>
              <div className="text-sm text-gray-600">Quizzes Passed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {roadmap.progressMetrics?.averageQuizScore || 0}%
              </div>
              <div className="text-sm text-gray-600">Avg Quiz Score</div>
            </div>
          </div>
        </div>

        {/* Phase Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {roadmap.phases.map((phase, index) => (
              <button
                key={phase.phaseId}
                onClick={() => {
                  setActivePhase(index);
                  setActiveModule(null);
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition whitespace-nowrap ${
                  activePhase === index
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Phase {index + 1}: {phase.title}</span>
                  <span className="px-2 py-0.5 bg-white bg-opacity-20 rounded text-xs">
                    {phase.progress || 0}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Phase Content */}
        {roadmap.phases[activePhase] && (
          <div className="space-y-6">
            {/* Phase Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {roadmap.phases[activePhase].title}
              </h2>
              <p className="text-gray-600 mb-4">{roadmap.phases[activePhase].description}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">
                  📅 {roadmap.phases[activePhase].estimatedWeeks} weeks
                </span>
                <span className="text-gray-600">
                  ⏱️ {roadmap.phases[activePhase].estimatedHours} hours
                </span>
                <span className={`px-2 py-1 rounded ${getDifficultyColor(roadmap.phases[activePhase].phaseType)}`}>
                  {roadmap.phases[activePhase].phaseType}
                </span>
              </div>
            </div>

            {/* Modules */}
            <div className="space-y-4">
              {roadmap.phases[activePhase].modules.map((module, moduleIndex) => {
                const isLocked = !arePrerequisitesMet(module, roadmap.phases[activePhase].modules);
                return (
                  <ModuleCard
                    key={module.moduleId}
                    module={module}
                    moduleIndex={moduleIndex}
                    isActive={activeModule === module.moduleId}
                    isLocked={isLocked}
                    onToggle={() => {
                      if (!isLocked) {
                        setActiveModule(activeModule === module.moduleId ? null : module.moduleId);
                      }
                    }}
                    onCompleteTask={completeTask}
                    onCompleteConcept={completeConcept}
                    getDifficultyColor={getDifficultyColor}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Module Card Component
const ModuleCard = ({ module, moduleIndex, isActive, isLocked, onToggle, onCompleteTask, onCompleteConcept, getDifficultyColor }) => {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${isLocked ? 'opacity-60' : ''}`}>
      {/* Module Header */}
      <button
        onClick={onToggle}
        disabled={isLocked}
        className={`w-full px-6 py-4 flex items-center justify-between transition ${
          isLocked ? 'cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isLocked ? 'bg-gray-200' : 'bg-indigo-100'
          }`}>
            {isLocked ? (
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <span className="text-indigo-600 font-bold">{moduleIndex + 1}</span>
            )}
          </div>
          <div className="text-left flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
              {isLocked && (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                  Locked
                </span>
              )}
              {module.status === 'completed' && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                  ✓ Completed
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{module.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
            {module.difficulty}
          </span>
          <span className="text-sm text-gray-600">⏱️ {module.estimatedHours}h</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${module.progress || 0}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">{module.progress || 0}%</span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isActive ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Locked Module Message */}
      {isLocked && isActive && (
        <div className="border-t border-gray-200 p-6 bg-gray-100">
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">Module Locked</h4>
            <p className="text-gray-600">
              Complete the prerequisite modules first to unlock this content.
            </p>
            {module.prerequisiteModules && module.prerequisiteModules.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Required: {module.prerequisiteModules.length} previous module{module.prerequisiteModules.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Module Content */}
      {isActive && !isLocked && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          {/* Learning Objectives */}
          {module.learningObjectives && module.learningObjectives.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">📋 Learning Objectives</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {module.learningObjectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Learning Outcomes */}
          {module.learningOutcomes && module.learningOutcomes.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">🎯 Learning Outcomes</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {module.learningOutcomes.map((outcome, i) => (
                  <li key={i}>{outcome}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Real-World Applications */}
          {module.realWorldApplications && module.realWorldApplications.length > 0 && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">🌍 Real-World Applications</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                {module.realWorldApplications.map((app, i) => (
                  <li key={i}>{app}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Core Concepts */}
          {module.topicsBreakdown?.coreConcepts && module.topicsBreakdown.coreConcepts.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">💡 Core Concepts</h4>
              <div className="space-y-3">
                {module.topicsBreakdown.coreConcepts.map((concept) => (
                  <div
                    key={concept.conceptId}
                    className={`p-4 rounded-lg border-2 ${
                      concept.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{concept.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{concept.description}</p>
                      </div>
                      <button
                        onClick={() => onCompleteConcept(concept.conceptId)}
                        className={`ml-4 px-3 py-1 rounded text-sm ${
                          concept.completed
                            ? 'bg-green-200 text-green-800'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {concept.completed ? '✓ Done' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practical Tasks */}
          {module.practicalTasks && module.practicalTasks.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">⚡ Practical Tasks</h4>
              <div className="space-y-3">
                {module.practicalTasks.map((task) => (
                  <div
                    key={task.taskId}
                    className={`p-4 rounded-lg border-2 ${
                      task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-gray-900">{task.title}</h5>
                          <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">⏱️ {task.estimatedMinutes}min</span>
                        </div>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                      <button
                        onClick={() => onCompleteTask(task.taskId)}
                        className={`ml-4 px-3 py-1 rounded text-sm ${
                          task.completed
                            ? 'bg-green-200 text-green-800'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {task.completed ? '✓ Completed' : 'Complete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Practices */}
          {module.bestPractices && module.bestPractices.length > 0 && (
            <div className="mb-6 bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3">✅ Best Practices</h4>
              <div className="space-y-2">
                {module.bestPractices.map((practice, i) => (
                  <div key={i} className="text-sm">
                    <strong className="text-green-800">{practice.title}:</strong>{' '}
                    <span className="text-green-700">{practice.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {module.commonMistakes && module.commonMistakes.length > 0 && (
            <div className="mb-6 bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-3">⚠️ Common Mistakes to Avoid</h4>
              <div className="space-y-3">
                {module.commonMistakes.map((mistake, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-red-800 font-medium">❌ {mistake.mistake}</p>
                    <p className="text-red-700 mt-1">Why: {mistake.why}</p>
                    <p className="text-green-700 mt-1">✓ {mistake.correctApproach}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Module Summary */}
          {module.moduleEndSummary && (
            <div className="mb-6 bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-3">📝 Module Summary</h4>
              {module.moduleEndSummary.keyTakeaways && (
                <div className="mb-3">
                  <strong className="text-purple-800 text-sm">Key Takeaways:</strong>
                  <ul className="list-disc list-inside mt-1 text-sm text-purple-700">
                    {module.moduleEndSummary.keyTakeaways.map((takeaway, i) => (
                      <li key={i}>{takeaway}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Quiz */}
          {module.quiz && (
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-indigo-900">📝 Module Quiz</h4>
                  <p className="text-sm text-indigo-700 mt-1">
                    {module.quiz.questions?.length || 0} questions • Passing score: {module.quiz.passingScore}%
                  </p>
                  {module.quiz.bestScore && (
                    <p className="text-sm text-indigo-600 mt-1">Best Score: {module.quiz.bestScore}%</p>
                  )}
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  {module.quiz.completed ? 'Retake Quiz' : 'Take Quiz'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedRoadmapDetail;
