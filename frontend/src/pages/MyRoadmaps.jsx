import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { roadmapService } from '../services/roadmapService';
import { useToast } from '../context/ToastContext';
import {
  Map,
  Plus,
  Clock,
  Target,
  TrendingUp,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Play
} from 'lucide-react';

const MyRoadmaps = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState([]);
  const [filteredRoadmaps, setFilteredRoadmaps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadRoadmaps();
  }, []);

  useEffect(() => {
    filterRoadmaps();
  }, [searchTerm, statusFilter, roadmaps]);

  const loadRoadmaps = async () => {
    try {
      const response = await roadmapService.getRoadmaps();
      setRoadmaps(response.data || []);
    } catch (error) {
      console.error('Error loading roadmaps:', error);
      toast.error('Failed to load roadmaps');
    } finally {
      setLoading(false);
    }
  };

  const filterRoadmaps = () => {
    let filtered = roadmaps;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.goal?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRoadmaps(filtered);
  };

  const getOverallProgress = (roadmap) => {
    if (!roadmap.weeklyModules || roadmap.weeklyModules.length === 0) return 0;
    const completed = roadmap.weeklyModules.filter(w => w.status === 'completed').length;
    return Math.round((completed / roadmap.weeklyModules.length) * 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusCounts = () => {
    return {
      all: roadmaps.length,
      not_started: roadmaps.filter(r => r.status === 'not_started').length,
      in_progress: roadmaps.filter(r => r.status === 'in_progress').length,
      completed: roadmaps.filter(r => r.status === 'completed').length
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-green-100 mb-2 flex items-center gap-2">
                <Map className="w-5 h-5" />
                Personalized Learning Paths
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">My Roadmaps</h1>
              <p className="text-green-100 text-base sm:text-lg">
                Track your learning journey with AI-generated roadmaps
              </p>
            </div>
            <button
              onClick={() => navigate('/roadmaps/create')}
              className="bg-white text-green-700 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow flex items-center gap-2 justify-center"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create Roadmap</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Map className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Roadmaps</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{statusCounts.all}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">In Progress</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900">{statusCounts.in_progress}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-900">{statusCounts.completed}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Not Started</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{statusCounts.not_started}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search roadmaps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {[
                { value: 'all', label: 'All', count: statusCounts.all },
                { value: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
                { value: 'not_started', label: 'Not Started', count: statusCounts.not_started },
                { value: 'completed', label: 'Completed', count: statusCounts.completed }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    statusFilter === filter.value
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Roadmaps Grid */}
        {filteredRoadmaps.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Map className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {roadmaps.length === 0 ? 'No roadmaps yet' : 'No roadmaps found'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {roadmaps.length === 0
                ? 'Create your first personalized learning roadmap to start your journey'
                : 'Try adjusting your search or filters'}
            </p>
            {roadmaps.length === 0 && (
              <button
                onClick={() => navigate('/roadmaps/create')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Your First Roadmap
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRoadmaps.map((roadmap) => {
              const progress = getOverallProgress(roadmap);
              return (
                <Link
                  key={roadmap._id}
                  to={`/roadmaps/${roadmap._id}`}
                  className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6 hover:border-green-200 hover:shadow-lg transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                          <Map className="w-5 h-5 text-white" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 capitalize ${getStatusColor(roadmap.status)}`}>
                          {roadmap.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2">
                        {roadmap.goal}
                      </h3>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-lg font-bold text-gray-900">{roadmap.totalWeeks}w</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Clock className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-gray-500">Weekly</p>
                      <p className="text-lg font-bold text-gray-900">{roadmap.weeklyTimeCommitment}h</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-gray-500">Modules</p>
                      <p className="text-lg font-bold text-gray-900">{roadmap.weeklyModules?.length || 0}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span className="font-medium">Progress</span>
                      <span className="font-bold text-green-600">{progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Info */}
                  {roadmap.createdAt && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Created {new Date(roadmap.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRoadmaps;
