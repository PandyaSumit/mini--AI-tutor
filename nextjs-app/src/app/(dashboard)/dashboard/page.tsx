/**
 * Dashboard Page
 * Main dashboard with stats, roadmaps, and recent activity
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks';
import { dashboardService } from '@/services/dashboard';
import {
  MessageSquare,
  Brain,
  Map,
  ArrowRight,
  Flame,
  Play,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  BookOpen,
} from 'lucide-react';
import type { DashboardStats } from '@/types';

interface Flashcard Stats {
  totalCards: number;
  dueCards: number;
  decks: number;
}

interface Conversation {
  _id: string;
  topic: string;
  lastMessage?: string;
  createdAt: string;
}

interface Roadmap {
  _id: string;
  goal: string;
  weeklyModules?: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [flashcardStats, setFlashcardStats] = useState<FlashcardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardService.getStats();

      if (response) {
        setStats(response);
      }

      // Set empty defaults for now
      setRecentConversations([]);
      setRoadmaps([]);
      setFlashcardStats({ totalCards: 0, dueCards: 0, decks: 0 });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats(null);
      setRecentConversations([]);
      setRoadmaps([]);
      setFlashcardStats({ totalCards: 0, dueCards: 0, decks: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const DashboardSkeleton = () => (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100">
        <div className="mx-auto px-6 lg:px-8 py-8 lg:py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-8 w-64 bg-gray-200 rounded"></div>
            <div className="h-4 w-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                </div>
                <div>
                  <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
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
      change: '+12%',
      changeLabel: 'vs last week',
    },
    {
      icon: Map,
      label: 'Active Roadmaps',
      value: roadmaps.length || 0,
      change: roadmaps.length > 0 ? 'In progress' : 'Get started',
    },
    {
      icon: Brain,
      label: 'Cards Due',
      value: flashcardStats?.dueCards || 0,
      change: flashcardStats?.totalCards ? `${flashcardStats.totalCards} total` : 'No cards yet',
    },
    {
      icon: Flame,
      label: 'Day Streak',
      value: stats?.currentStreak || 0,
      change: stats?.currentStreak && stats.currentStreak > 0 ? 'Keep it up!' : 'Start today',
      highlight: stats?.currentStreak && stats.currentStreak >= 7,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="border-b border-gray-100 bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="mx-auto px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Welcome Message */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋
                </h1>
                {stats?.currentStreak && stats.currentStreak > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 rounded-full">
                    <Flame className="w-4 h-4 text-orange-600" strokeWidth={2} />
                    <span className="text-sm font-bold text-orange-900">{stats.currentStreak} day streak</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {flashcardStats?.dueCards && flashcardStats.dueCards > 0 ? (
                  <p className="text-gray-700 text-base">
                    You have <span className="font-semibold text-gray-900">{flashcardStats.dueCards} cards</span> ready
                    to review today
                  </p>
                ) : roadmaps.length > 0 ? (
                  <p className="text-gray-700 text-base">
                    Continue your progress on <span className="font-semibold text-gray-900">{roadmaps[0]?.goal}</span>
                  </p>
                ) : (
                  <p className="text-gray-700 text-base">Let&apos;s start building your personalized learning path</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
              {flashcardStats?.dueCards && flashcardStats.dueCards > 0 && (
                <Link
                  href="/flashcards"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] group"
                >
                  <Brain className="w-5 h-5" strokeWidth={2} />
                  <span>Review Cards ({flashcardStats.dueCards})</span>
                  <ArrowRight
                    className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                    strokeWidth={2}
                  />
                </Link>
              )}
              {roadmaps.length > 0 && (
                <Link
                  href={`/roadmaps/${roadmaps[0]._id}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] group"
                >
                  <Play className="w-5 h-5" strokeWidth={2} />
                  <span>Continue Learning</span>
                  <ArrowRight
                    className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                    strokeWidth={2}
                  />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-6 lg:px-8 py-8 lg:py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`p-6 rounded-xl border transition-all ${
                  stat.highlight ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      stat.highlight ? 'bg-yellow-200' : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${stat.highlight ? 'text-yellow-700' : 'text-gray-600'}`}
                      strokeWidth={2}
                    />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <section className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/chat"
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-600" strokeWidth={2} />
                    </div>
                    <h3 className="font-semibold text-gray-900">Ask AI Tutor</h3>
                  </div>
                  <p className="text-sm text-gray-600">Get instant help with any topic</p>
                </Link>

                <Link
                  href="/roadmaps/create"
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Map className="w-5 h-5 text-purple-600" strokeWidth={2} />
                    </div>
                    <h3 className="font-semibold text-gray-900">Create Roadmap</h3>
                  </div>
                  <p className="text-sm text-gray-600">Plan your learning journey</p>
                </Link>

                <Link
                  href="/flashcards"
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-green-600" strokeWidth={2} />
                    </div>
                    <h3 className="font-semibold text-gray-900">Study Flashcards</h3>
                  </div>
                  <p className="text-sm text-gray-600">Review with spaced repetition</p>
                </Link>

                <Link
                  href="/courses"
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-orange-600" strokeWidth={2} />
                    </div>
                    <h3 className="font-semibold text-gray-900">Browse Courses</h3>
                  </div>
                  <p className="text-sm text-gray-600">Explore structured content</p>
                </Link>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-600" strokeWidth={2} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                </div>
                <Link
                  href="/conversations"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>

              {recentConversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-gray-500 mb-4">No recent conversations</p>
                  <Link
                    href="/chat"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" strokeWidth={2} />
                    <span>Start Chatting</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentConversations.map((conversation) => (
                    <Link
                      key={conversation._id}
                      href={`/chat/${conversation._id}`}
                      className="block p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">{conversation.topic}</h3>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(conversation.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Learning Tips */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600" strokeWidth={2} />
                <h3 className="font-bold text-gray-900">Study Tip</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                Regular practice is key! Try to study for at least 20 minutes each day to build a strong learning habit.
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <TrendingUp className="w-4 h-4" strokeWidth={2} />
                <span className="font-medium">Keep your streak going!</span>
              </div>
            </section>

            {/* Progress Summary */}
            <section className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Your Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-sm font-bold text-gray-900">0%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-[0%] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Start learning to track your progress</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
