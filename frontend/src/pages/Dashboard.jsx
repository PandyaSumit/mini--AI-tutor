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
  CheckCircle2,
  Calendar,
  Award,
  BarChart3,
  Flame
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Loading Skeleton Component
  const DashboardSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-gray-700 rounded"></div>
            <div className="h-10 w-64 bg-gray-700 rounded"></div>
            <div className="h-5 w-80 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-8 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                </div>
                <div>
                  <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  const statCards = [
    {
      icon: MessageSquare,
      label: 'Conversations',
      value: stats?.totalConversations || 0,
      trend: '+12%',
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trendColor: 'text-green-600'
    },
    {
      icon: Map,
      label: 'Active Roadmaps',
      value: roadmaps.length || 0,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: Brain,
      label: 'Cards Due',
      value: flashcardStats?.dueCards || 0,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      icon: Flame,
      label: 'Day Streak',
      value: stats?.currentStreak || 0,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      suffix: 'days'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 lg:py-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 animate-slide-up">
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>{getGreeting()}</span>
                <span className="text-gray-600">•</span>
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold">
                Welcome back, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'there'}</span>
              </h1>
              <p className="text-gray-300 text-base lg:text-lg max-w-2xl">
                Continue your learning journey and reach new milestones today
              </p>
            </div>

            <Link
              to="/chat"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold hover:shadow-xl hover:scale-[1.02] transition-all shadow-lg active:scale-[0.98] animate-slide-up"
              style={{ animationDelay: '0.1s' }}
            >
              <MessageSquare className="w-5 h-5" strokeWidth={2} />
              <span>Start Learning</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-12">
        {/* Stats Grid - Floating Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 -mt-8 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} strokeWidth={2} />
                  </div>
                  {stat.trend && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${stat.trendColor}`}>
                      <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                      <span>{stat.trend}</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                  {stat.suffix && <span className="text-lg text-gray-500 ml-1">{stat.suffix}</span>}
                </p>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Roadmaps & Conversations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Roadmaps */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <Map className="w-5 h-5 text-green-600" strokeWidth={2} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Learning Roadmaps</h2>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/roadmaps"
                    className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center gap-1 transition-colors"
                  >
                    <span className="hidden sm:inline">View All</span>
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </Link>
                </div>
              </div>

              {roadmaps.length > 0 ? (
                <div className="space-y-3">
                  {roadmaps.slice(0, 3).map((roadmap) => {
                    const progress = getOverallProgress(roadmap);
                    return (
                      <Link
                        key={roadmap._id}
                        to={`/roadmaps/${roadmap._id}`}
                        className="block p-4 lg:p-5 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-700 transition-colors truncate">
                              {roadmap.goal}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                                {roadmap.totalWeeks} weeks
                              </span>
                              <span className="capitalize px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                {roadmap.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" strokeWidth={2} />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-900 tabular-nums">{progress}%</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <Map className="w-8 h-8 text-green-600" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No roadmaps yet</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    Create your first learning roadmap to organize your study path
                  </p>
                  <Link
                    to="/roadmaps/create"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    <Plus className="w-5 h-5" strokeWidth={2} />
                    Create Roadmap
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Conversations */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" strokeWidth={2} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Conversations</h2>
                </div>
                <Link
                  to="/conversations"
                  className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center gap-1 transition-colors"
                >
                  <span className="hidden sm:inline">View All</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>

              {recentConversations.length > 0 ? (
                <div className="space-y-3">
                  {recentConversations.map((conv) => (
                    <Link
                      key={conv._id}
                      to={`/chat/${conv._id}`}
                      className="block p-4 lg:p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors truncate">
                            {conv.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="capitalize px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                              {conv.topic}
                            </span>
                            <span>{conv.messageCount} messages</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" strokeWidth={2} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-blue-600" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    Start a conversation with our AI tutor to get personalized help
                  </p>
                  <Link
                    to="/chat"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    <MessageSquare className="w-5 h-5" strokeWidth={2} />
                    Start Chat
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/chat"
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-200 group border border-blue-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">AI Chat</p>
                    <p className="text-xs text-gray-600">Ask questions</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" strokeWidth={2} />
                </Link>

                <Link
                  to="/roadmaps/create"
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-200 group border border-green-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                    <Map className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">New Roadmap</p>
                    <p className="text-xs text-gray-600">Plan learning</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" strokeWidth={2} />
                </Link>

                <Link
                  to="/flashcards"
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-200 group border border-orange-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">Flashcards</p>
                    <p className="text-xs text-gray-600">Study & review</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" strokeWidth={2} />
                </Link>
              </div>
            </div>

            {/* Flashcard Progress */}
            {flashcardStats && flashcardStats.decks > 0 && (
              <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl shadow-lg p-6 border border-orange-400/20">
                <div className="flex items-center gap-2 mb-5">
                  <Brain className="w-5 h-5" strokeWidth={2} />
                  <h3 className="text-lg font-bold">Study Progress</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium opacity-90">Cards Due Today</span>
                    <span className="text-2xl font-bold">{flashcardStats.dueCards}</span>
                  </div>
                  <div className="flex justify-between items-center opacity-90">
                    <span className="text-sm">Total Cards</span>
                    <span className="text-lg font-semibold">{flashcardStats.totalCards}</span>
                  </div>
                  <Link
                    to="/flashcards"
                    className="block w-full bg-white text-orange-600 py-3 rounded-xl font-semibold text-center hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
                  >
                    Study Now
                  </Link>
                </div>
              </div>
            )}

            {/* Achievement Badge */}
            {stats?.currentStreak >= 7 && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
                    <Award className="w-6 h-6 text-yellow-900" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">On Fire! 🔥</h3>
                    <p className="text-sm text-gray-600">{stats.currentStreak} day streak</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  You're on an amazing streak! Keep going to unlock more achievements.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
