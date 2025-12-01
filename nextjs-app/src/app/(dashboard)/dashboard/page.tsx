/**
 * Dashboard Page
 * Main dashboard with stats, roadmaps, and recent activity
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks";
import { dashboardService } from "@/services/dashboard";
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
} from "lucide-react";
import type { DashboardStats } from "@/types";

interface FlashcardStats {
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
  const [recentConversations, setRecentConversations] = useState<
    Conversation[]
  >([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [flashcardStats, setFlashcardStats] = useState<FlashcardStats | null>(
    null
  );
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

      // Defaults for now
      setRecentConversations([]);
      setRoadmaps([]);
      setFlashcardStats({ totalCards: 0, dueCards: 0, decks: 0 });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const DashboardSkeleton = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121]">
      <div className="border-b border-slate-200 dark:border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 rounded-lg bg-slate-200 dark:bg-[#2a2a2a]" />
            <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-[#2a2a2a]" />
            <div className="h-4 w-80 rounded-lg bg-slate-200 dark:bg-[#2a2a2a]" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-5"
            >
              <div className="animate-pulse space-y-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-[#2a2a2a]" />
                <div className="h-3 w-20 rounded bg-slate-100 dark:bg-[#2a2a2a]" />
                <div className="h-6 w-16 rounded bg-slate-100 dark:bg-[#2a2a2a]" />
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
      label: "Conversations",
      value: stats?.totalConversations || 0,
      change: "+12%",
      changeLabel: "vs last week",
    },
    {
      icon: Map,
      label: "Active roadmaps",
      value: roadmaps.length || 0,
      change: roadmaps.length > 0 ? "In progress" : "Get started",
    },
    {
      icon: Brain,
      label: "Cards due",
      value: flashcardStats?.dueCards || 0,
      change: flashcardStats?.totalCards
        ? `${flashcardStats.totalCards} total`
        : "No cards yet",
    },
    {
      icon: Flame,
      label: "Day streak",
      value: stats?.currentStreak || 0,
      change:
        stats?.currentStreak && stats.currentStreak > 0
          ? "Keep it up"
          : "Start today",
      highlight: stats?.currentStreak && stats.currentStreak >= 7,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121]">
      {/* Header Section */}
      <div className="border-b border-slate-200 dark:border-[#2a2a2a] bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-[#1a1a1a] dark:via-[#212121] dark:to-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Welcome Message */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900 dark:text-[#f5f5f5]">
                  {getGreeting()}, {user?.name?.split(" ")[0] || "there"}! 👋
                </h1>
                {stats?.currentStreak && stats.currentStreak > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 dark:border-orange-600/40 dark:bg-orange-600/10">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-semibold text-orange-900 dark:text-orange-200">
                      {stats.currentStreak} day streak
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                {flashcardStats?.dueCards && flashcardStats.dueCards > 0 ? (
                  <p className="text-sm text-slate-700 dark:text-[#c2c2c2]">
                    You have{" "}
                    <span className="font-medium text-slate-900 dark:text-[#f5f5f5]">
                      {flashcardStats.dueCards} cards
                    </span>{" "}
                    ready to review today.
                  </p>
                ) : roadmaps.length > 0 ? (
                  <p className="text-sm text-slate-700 dark:text-[#c2c2c2]">
                    Continue your progress on{" "}
                    <span className="font-medium text-slate-900 dark:text-[#f5f5f5]">
                      {roadmaps[0]?.goal}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="text-sm text-slate-700 dark:text-[#c2c2c2]">
                    Let&apos;s start building your personalized learning path.
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {/* <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
              {flashcardStats?.dueCards && flashcardStats.dueCards > 0 && (
                <Link
                  href="/flashcards"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] hover:bg-black dark:hover:bg-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all group"
                >
                  <Brain className="w-4 h-4" />
                  <span>Review cards ({flashcardStats.dueCards})</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
              {roadmaps.length > 0 && (
                <Link
                  href={`/roadmaps/${roadmaps[0]._id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] hover:bg-black dark:hover:bg-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all group"
                >
                  <Play className="w-4 h-4" />
                  <span>Continue learning</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div> */}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const isHighlight = stat.highlight;
            return (
              <div
                key={index}
                className={[
                  "rounded-2xl border p-5 transition-all",
                  isHighlight
                    ? "border-amber-200 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-900/10"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:hover:border-[#3a3a3a]",
                ].join(" ")}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      isHighlight
                        ? "bg-amber-100 dark:bg-amber-500/20"
                        : "bg-slate-100 dark:bg-[#2a2a2a]",
                    ].join(" ")}
                  >
                    <Icon
                      className={
                        isHighlight
                          ? "w-5 h-5 text-amber-700 dark:text-amber-200"
                          : "w-5 h-5 text-slate-700 dark:text-[#e0e0e0]"
                      }
                    />
                  </div>
                </div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-[#a8a8a8]">
                  {stat.label}
                </p>
                <p className="mb-1 text-3xl font-semibold text-slate-900 dark:text-[#f5f5f5]">
                  {stat.value}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                  {stat.change}
                </p>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <section className="rounded-2xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-5 sm:p-6">
              <h2 className="mb-4 text-lg sm:text-xl font-semibold text-slate-900 dark:text-[#f5f5f5]">
                Quick actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/chat"
                  className="group rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4 hover:border-slate-300 dark:hover:border-[#3a3a3a] hover:bg-slate-50 dark:hover:bg-[#222222] transition-all"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/15">
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f5f5f5]">
                      Ask AI tutor
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#c2c2c2]">
                    Get instant help with questions, concepts, or code.
                  </p>
                </Link>

                <Link
                  href="/roadmaps/create"
                  className="group rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4 hover:border-slate-300 dark:hover:border-[#3a3a3a] hover:bg-slate-50 dark:hover:bg-[#222222] transition-all"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/15">
                      <Map className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f5f5f5]">
                      Create roadmap
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#c2c2c2]">
                    Outline your next 4–8 weeks of structured learning.
                  </p>
                </Link>

                <Link
                  href="/flashcards"
                  className="group rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4 hover:border-slate-300 dark:hover:border-[#3a3a3a] hover:bg-slate-50 dark:hover:bg-[#222222] transition-all"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                      <Brain className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f5f5f5]">
                      Study flashcards
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#c2c2c2]">
                    Practice key ideas with spaced repetition.
                  </p>
                </Link>

                <Link
                  href="/courses"
                  className="group rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4 hover:border-slate-300 dark:hover:border-[#3a3a3a] hover:bg-slate-50 dark:hover:bg-[#222222] transition-all"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15">
                      <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f5f5f5]">
                      Browse courses
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#c2c2c2]">
                    Explore structured modules and tracks.
                  </p>
                </Link>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="rounded-2xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#2a2a2a]">
                    <Clock className="w-4 h-4 text-slate-600 dark:text-[#e0e0e0]" />
                  </div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-[#f5f5f5]">
                    Recent activity
                  </h2>
                </div>
                <Link
                  href="/conversations"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-[#bdbdbd] hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <span>View all</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {recentConversations.length === 0 ? (
                <div className="py-10 text-center">
                  <MessageSquare className="mx-auto mb-4 h-10 w-10 text-slate-300 dark:text-[#3a3a3a]" />
                  <p className="mb-4 text-sm text-slate-500 dark:text-[#bdbdbd]">
                    No recent conversations yet.
                  </p>
                  <Link
                    href="/chat"
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-medium bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] hover:bg-black dark:hover:bg-white transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Start chatting</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentConversations.map((conversation) => (
                    <Link
                      key={conversation._id}
                      href={`/chat/${conversation._id}`}
                      className="block rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4 hover:border-slate-300 dark:hover:border-[#3a3a3a] hover:bg-slate-50 dark:hover:bg-[#222222] transition-all"
                    >
                      <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-[#f5f5f5]">
                        {conversation.topic}
                      </h3>
                      {conversation.lastMessage && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#c2c2c2] truncate">
                          {conversation.lastMessage}
                        </p>
                      )}
                      <p className="mt-2 text-[11px] text-slate-400 dark:text-[#9e9e9e]">
                        {new Date(
                          conversation.createdAt
                        ).toLocaleDateString()}
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
            <section className="rounded-2xl border border-blue-100 dark:border-[#2a2a2a] bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-[#1a1a1a] dark:via-[#212121] dark:to-[#1a1a1a] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f5f5f5]">
                  Study tip
                </h3>
              </div>
              <p className="mb-4 text-xs sm:text-sm text-slate-700 dark:text-[#c2c2c2] leading-relaxed">
                Short, consistent sessions beat long cramming. Aim for at least{" "}
                <span className="font-medium">20 minutes</span> of focused
                learning each day.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 text-[11px] font-medium text-blue-700 dark:text-blue-200">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Keep your streak going</span>
              </div>
            </section>

            {/* Progress Summary */}
            <section className="rounded-2xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-5 sm:p-6">
              <h3 className="mb-4 text-sm sm:text-base font-semibold text-slate-900 dark:text-[#f5f5f5]">
                Your progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-[#bdbdbd]">
                      Overall progress
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-[#f5f5f5]">
                      0%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-[#242424] overflow-hidden">
                    <div className="h-full w-[0%] rounded-full bg-gradient-to-r from-blue-600 to-violet-600" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                  Start a course, roadmap, or flashcard session to see your
                  progress here.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
