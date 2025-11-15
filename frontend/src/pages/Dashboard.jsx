import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { chatService } from '../services/chatService';
import { roadmapService } from '../services/roadmapService';
import { studyMaterialService } from '../services/studyMaterialService';
import {
  BookOpen,
  MessageSquare,
  TrendingUp,
  Zap,
  Brain,
  Map,
  Play,
  Clock,
  Target,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentConversations, setRecentConversations] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [flashcardStats, setFlashcardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, conversationsRes, roadmapsRes, decksRes] = await Promise.all([
        userService.getStats(),
        chatService.getConversations({ limit: 3 }),
        roadmapService.getRoadmaps().catch(() => ({ data: [] })),
        studyMaterialService.getDecks().catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data.stats);
      setRecentConversations(Array.isArray(conversationsRes.data.conversations) ? conversationsRes.data.conversations : []);
      setRoadmaps(Array.isArray(roadmapsRes.data) ? roadmapsRes.data : []);

      // Calculate flashcard stats - ensure decks is an array
      const decks = Array.isArray(decksRes.data) ? decksRes.data : [];
      const totalCards = decks.reduce((sum, deck) => sum + (deck.totalCards || 0), 0);
      const dueCards = decks.reduce((sum, deck) => sum + (deck.dueCount || 0), 0);
      setFlashcardStats({ totalCards, dueCards, decks: decks.length });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallProgress = (roadmap) => {
    if (!roadmap.weeklyModules || roadmap.weeklyModules.length === 0) return 0;
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

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Welcome back!
              </p>
              <h1 className="text-4xl font-bold mb-2">{user?.name}</h1>
              <p className="text-primary-100 text-lg">
                Continue your learning journey with AI-powered tools
              </p>
            </div>
            <Link
              to="/chat"
              className="hidden md:flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
            >
              <MessageSquare className="w-5 h-5" />
              Start New Chat
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8 pb-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Conversations</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalConversations || 0}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Map className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Roadmaps</p>
            <p className="text-3xl font-bold text-gray-900">{roadmaps.length || 0}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Brain className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Cards Due</p>
            <p className="text-3xl font-bold text-gray-900">{flashcardStats?.dueCards || 0}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Day Streak</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.currentStreak || 0}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Roadmaps & Conversations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Roadmaps */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Map className="w-6 h-6 text-primary-600" />
                  Learning Roadmaps
                </h2>
                <div className="flex items-center gap-3">
                  <Link
                    to="/roadmaps"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/roadmaps/create"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Create New
                  </Link>
                </div>
              </div>

              {roadmaps.length > 0 ? (
                <div className="space-y-4">
                  {roadmaps.slice(0, 3).map((roadmap) => {
                    const progress = getOverallProgress(roadmap);
                    return (
                      <Link
                        key={roadmap._id}
                        to={`/roadmaps/${roadmap._id}`}
                        className="block p-4 border-2 border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-700">
                              {roadmap.goal}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {roadmap.totalWeeks} weeks
                              </span>
                              <span className="capitalize px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                {roadmap.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{progress}%</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                    <Map className="w-8 h-8 text-primary-600" />
                  </div>
                  <p className="text-gray-600 mb-4">No roadmaps yet</p>
                  <Link to="/roadmaps/create" className="btn-primary inline-flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create Your First Roadmap
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Conversations */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Conversations</h2>
                <Link
                  to="/conversations"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {recentConversations.length > 0 ? (
                <div className="space-y-3">
                  {recentConversations.map((conv) => (
                    <Link
                      key={conv._id}
                      to={`/chat/${conv._id}`}
                      className="block p-4 border-2 border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2 group-hover:text-primary-700">
                            {conv.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="capitalize">{conv.topic}</span>
                            <span>{conv.messageCount} messages</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No conversations yet</p>
                  <Link to="/chat" className="btn-primary inline-flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Start Learning
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions & Flashcards */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/chat"
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl hover:shadow-md transition-shadow group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Start AI Chat</p>
                    <p className="text-sm text-gray-600">Learn anything</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                </Link>

                <Link
                  to="/roadmaps/create"
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-shadow group"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
                    <Map className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">New Roadmap</p>
                    <p className="text-sm text-gray-600">Plan your learning</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                </Link>

                <Link
                  to="/flashcards"
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-md transition-shadow group"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Study Cards</p>
                    <p className="text-sm text-gray-600">Review flashcards</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
                </Link>
              </div>
            </div>

            {/* Flashcard Stats */}
            {flashcardStats && flashcardStats.decks > 0 && (
              <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Flashcard Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Cards Due Today</span>
                      <span className="font-bold">{flashcardStats.dueCards}</span>
                    </div>
                    <div className="flex justify-between text-sm opacity-90">
                      <span>Total Cards</span>
                      <span>{flashcardStats.totalCards}</span>
                    </div>
                  </div>
                  <Link
                    to="/flashcards"
                    className="block w-full bg-white text-orange-600 py-3 rounded-xl font-semibold text-center hover:shadow-lg transition-shadow"
                  >
                    Study Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
