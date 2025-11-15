import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roadmapService } from '../services/roadmapService';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Lock,
  TrendingUp,
  BookOpen,
  Play,
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const RoadmapDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState([1]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadRoadmap();
  }, [id]);

  const loadRoadmap = async () => {
    try {
      const response = await roadmapService.getRoadmap(id);
      setRoadmap(response.data);

      // Auto-expand the current week
      if (response.data?.weeklyModules && Array.isArray(response.data.weeklyModules)) {
        const currentWeek = response.data.weeklyModules.find(
          w => w.status === 'in_progress' || w.status === 'not_started'
        );
        if (currentWeek) {
          setExpandedWeeks([currentWeek.weekNumber]);
        }
      }
    } catch (error) {
      console.error('Error loading roadmap:', error);
      toast.error('Failed to load roadmap. Please try again.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleWeek = (weekNumber) => {
    setExpandedWeeks(prev =>
      prev.includes(weekNumber)
        ? prev.filter(w => w !== weekNumber)
        : [...prev, weekNumber]
    );
  };

  const handleTaskToggle = async (weekNumber, taskIndex, currentStatus) => {
    setUpdating(true);
    try {
      const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';

      await roadmapService.updateProgress(id, {
        weekNumber,
        taskIndex,
        status: newStatus
      });

      await loadRoadmap();
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteMilestone = async (milestoneIndex) => {
    setUpdating(true);
    try {
      await roadmapService.completeMilestone(id, milestoneIndex);
      await loadRoadmap();
      toast.success('Milestone completed! Great job!');
    } catch (error) {
      console.error('Error completing milestone:', error);
      toast.error('Failed to complete milestone. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const isWeekUnlocked = (week) => {
    if (!week.prerequisiteModules || week.prerequisiteModules.length === 0) {
      return true;
    }

    return week.prerequisiteModules.every(prereqWeekNum => {
      const prereqWeek = roadmap.weeklyModules.find(w => w.weekNumber === prereqWeekNum);
      return prereqWeek && prereqWeek.status === 'completed';
    });
  };

  const getWeekProgress = (week) => {
    if (!week.dailyTasks || week.dailyTasks.length === 0) return 0;
    const completed = week.dailyTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / week.dailyTasks.length) * 100);
  };

  const getOverallProgress = () => {
    if (!roadmap || !roadmap.weeklyModules) return 0;
    const completed = roadmap.weeklyModules.filter(w => w.status === 'completed').length;
    return Math.round((completed / roadmap.weeklyModules.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!roadmap) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="card">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
                  <Target className="w-4 h-4" />
                  Learning Roadmap
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{roadmap.goal}</h1>
                <p className="text-gray-600">{roadmap.overview}</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`px-4 py-2 rounded-lg font-medium text-center capitalize ${
                  roadmap.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : roadmap.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {roadmap.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Duration</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{roadmap.totalWeeks} weeks</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Weekly Time</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{roadmap.weeklyTimeCommitment}h</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">Modules</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{roadmap.weeklyModules.length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Progress</span>
                </div>
                <p className="text-xl font-bold text-primary-600">{getOverallProgress()}%</p>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Progress</span>
                <span>{getOverallProgress()}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all"
                  style={{ width: `${getOverallProgress()}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        {roadmap.milestones && roadmap.milestones.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-primary-600" />
              Milestones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roadmap.milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    milestone.completed
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{milestone.title}</h3>
                    {milestone.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                  <p className="text-xs text-gray-500">Week {milestone.weekNumber}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Modules */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Weekly Modules</h2>

          {roadmap.weeklyModules.map((week) => {
            const isUnlocked = isWeekUnlocked(week);
            const isExpanded = expandedWeeks.includes(week.weekNumber);
            const progress = getWeekProgress(week);

            return (
              <div key={week.weekNumber} className="card">
                {/* Week Header */}
                <button
                  onClick={() => isUnlocked && toggleWeek(week.weekNumber)}
                  className="w-full text-left"
                  disabled={!isUnlocked}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                        week.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : week.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : isUnlocked
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-50 text-gray-400'
                      }`}>
                        {isUnlocked ? (
                          week.weekNumber
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                          Week {week.weekNumber}: {week.title}
                        </h3>
                        <p className="text-sm text-gray-600">{week.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {week.estimatedHours}h
                          </span>
                          <span>
                            {week.dailyTasks?.filter(t => t.status === 'completed').length || 0} / {week.dailyTasks?.length || 0} tasks
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Progress Circle */}
                      <div className="relative w-16 h-16">
                        <svg className="transform -rotate-90 w-16 h-16">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-gray-200"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                            className="text-primary-600 transition-all"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-900">{progress}%</span>
                        </div>
                      </div>
                      {isUnlocked && (
                        isExpanded ? (
                          <ChevronUp className="w-6 h-6 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-400" />
                        )
                      )}
                    </div>
                  </div>
                </button>

                {/* Week Content (Expanded) */}
                {isExpanded && isUnlocked && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    {/* Objectives */}
                    {week.objectives && week.objectives.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary-600" />
                          Learning Objectives
                        </h4>
                        <ul className="space-y-2">
                          {week.objectives.map((obj, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                              <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Daily Tasks */}
                    {week.dailyTasks && week.dailyTasks.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Daily Tasks</h4>
                        <div className="space-y-3">
                          {week.dailyTasks.map((task, taskIdx) => (
                            <div
                              key={taskIdx}
                              className={`p-4 border-2 rounded-lg transition-all ${
                                task.status === 'completed'
                                  ? 'border-green-200 bg-green-50'
                                  : 'border-gray-200 bg-white hover:border-primary-200'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => handleTaskToggle(week.weekNumber, taskIdx, task.status)}
                                  disabled={updating}
                                  className="mt-1"
                                >
                                  {task.status === 'completed' ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                  ) : (
                                    <Circle className="w-6 h-6 text-gray-400 hover:text-primary-600" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <h5 className={`font-semibold mb-1 ${
                                    task.status === 'completed'
                                      ? 'text-gray-500 line-through'
                                      : 'text-gray-900'
                                  }`}>
                                    {task.title}
                                  </h5>
                                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                  {task.estimatedMinutes && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {task.estimatedMinutes} minutes
                                    </span>
                                  )}

                                  {/* Resources */}
                                  {task.resources && task.resources.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      {task.resources.map((resource, resIdx) => (
                                        <a
                                          key={resIdx}
                                          href={resource.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                          {resource.title}
                                          <span className="text-xs text-gray-500">({resource.type})</span>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoadmapDetail;
