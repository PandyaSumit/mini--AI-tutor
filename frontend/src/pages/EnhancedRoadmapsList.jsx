import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EnhancedRoadmapsList = () => {
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRoadmaps();
  }, [filter]);

  const fetchRoadmaps = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/enhanced-roadmaps${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setRoadmaps(response.data.roadmaps);
      }
    } catch (err) {
      console.error('Error fetching roadmaps:', err);
      setError('Failed to load roadmaps');
    } finally {
      setLoading(false);
    }
  };

  const deleteRoadmap = async (id) => {
    if (!window.confirm('Are you sure you want to delete this roadmap?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/enhanced-roadmaps/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchRoadmaps(); // Refresh list
    } catch (err) {
      console.error('Error deleting roadmap:', err);
      alert('Failed to delete roadmap');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      abandoned: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading roadmaps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Learning Roadmaps</h1>
              <p className="mt-2 text-gray-600">
                AI-powered, deeply structured learning paths tailored to your goals
              </p>
            </div>
            <button
              onClick={() => navigate('/create-enhanced-roadmap')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg font-semibold"
            >
              + Create New Roadmap
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'active', 'paused', 'completed', 'draft'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
                  filter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? 'All Roadmaps' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Roadmaps Grid */}
        {roadmaps.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No roadmaps yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first AI-powered learning roadmap to get started
            </p>
            <button
              onClick={() => navigate('/create-enhanced-roadmap')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Create Your First Roadmap
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap) => (
              <div
                key={roadmap._id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
                onClick={() => navigate(`/enhanced-roadmap/${roadmap._id}`)}
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900 flex-1 pr-2">
                      {roadmap.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(roadmap.status)}`}>
                      {roadmap.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {roadmap.description || roadmap.goal}
                  </p>
                </div>

                {/* Progress */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="mb-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-bold text-indigo-600">
                      {roadmap.overallProgress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${roadmap.overallProgress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="px-6 py-4 grid grid-cols-3 gap-4 text-center border-t border-gray-200">
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {roadmap.metadata?.totalPhases || 0}
                    </div>
                    <div className="text-xs text-gray-600">Phases</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {roadmap.progressMetrics?.modulesCompleted || 0}/
                      {roadmap.metadata?.totalModules || 0}
                    </div>
                    <div className="text-xs text-gray-600">Modules</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {roadmap.progressMetrics?.quizzesCompleted || 0}
                    </div>
                    <div className="text-xs text-gray-600">Quizzes</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                      {roadmap.personalization?.finalSkillLevel?.replace('_', ' ') || 'N/A'}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                      {roadmap.personalization?.learningPath || 'N/A'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRoadmap(roadmap._id);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">What makes Enhanced Roadmaps special?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">🤖</div>
              <h3 className="font-semibold mb-1">AI-Powered Detection</h3>
              <p className="text-indigo-100 text-sm">
                Analyzes your chat history to detect your actual skill level and adjusts accordingly
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold mb-1">Deep Structure</h3>
              <p className="text-indigo-100 text-sm">
                Phases → Modules → Sub-modules with core concepts, practical tasks, and quizzes
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold mb-1">Industry-Grade Quality</h3>
              <p className="text-indigo-100 text-sm">
                Real-world projects, best practices, common mistakes, and domain-specific examples
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRoadmapsList;
