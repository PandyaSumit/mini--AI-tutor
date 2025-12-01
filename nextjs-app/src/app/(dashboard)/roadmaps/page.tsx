/**
 * Roadmaps Page
 * List of all user's learning roadmaps
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { roadmapService } from "@/services/roadmap";
import {
  Map,
  Plus,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { Roadmap } from "@/types";

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      const data = await roadmapService.getRoadmaps();
      setRoadmaps(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching roadmaps:", error);
      setRoadmaps([]);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (roadmap: Roadmap) => {
    if (!roadmap.milestones || roadmap.milestones.length === 0) return 0;
    const completed = roadmap.milestones.filter(
      (m) => m.status === "completed"
    ).length;
    return Math.round((completed / roadmap.milestones.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#212121]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-7 w-44 rounded-lg bg-slate-200 dark:bg-[#2a2a2a]" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-56 rounded-2xl bg-slate-100 dark:bg-[#1a1a1a] border border-slate-100 dark:border-[#2a2a2a]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-[#f5f5f5] mb-1">
              Learning roadmaps
            </h1>
            <p className="text-sm text-slate-600 dark:text-[#bdbdbd]">
              Create focused paths and track progress toward your learning goals.
            </p>
          </div>
          <Link
            href="/roadmaps/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] hover:bg-black dark:hover:bg-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create roadmap</span>
          </Link>
        </div>

        {/* Roadmaps Grid / Empty state */}
        {roadmaps.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-[#2a2a2a] bg-white/80 dark:bg-[#1a1a1a]/85">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-[#2a2a2a] mx-auto mb-5">
              <Map className="w-8 h-8 text-slate-400 dark:text-[#9e9e9e]" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-2">
              No roadmaps yet
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#bdbdbd] mb-6 max-w-md mx-auto">
              Design a roadmap to break your big learning goals into small,
              trackable milestones.
            </p>
            <Link
              href="/roadmaps/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] hover:bg-black dark:hover:bg-white shadow-sm hover:shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create your first roadmap</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roadmaps.map((roadmap) => {
              const progress = getProgress(roadmap);
              const completed =
                roadmap.milestones?.filter((m) => m.status === "completed")
                  .length || 0;
              const total = roadmap.milestones?.length || 0;

              return (
                <Link
                  key={roadmap._id}
                  href={`/roadmaps/${roadmap._id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#1a1a1a] shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-[#3a3a3a] transition-all"
                >
                  {/* Header */}
                  <div className="px-5 py-5 border-b border-slate-100 dark:border-[#2a2a2a]">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                        <Map className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f5f5f5] mb-0.5 truncate group-hover:text-violet-500">
                          {roadmap.title || roadmap.goal}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                          {roadmap.difficulty || "Intermediate"} ·{" "}
                          {total} milestone{total === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    {roadmap.description && (
                      <p className="text-xs text-slate-600 dark:text-[#c2c2c2] line-clamp-3 mb-4">
                        {roadmap.description}
                      </p>
                    )}

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-[#bdbdbd]">
                          Progress
                        </span>
                        <span className="font-medium text-slate-900 dark:text-[#f5f5f5]">
                          {progress}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-[#242424] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="px-5 py-4 bg-slate-50 dark:bg-[#1f1f1f]">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <Target className="w-4 h-4 text-slate-400 dark:text-[#9e9e9e]" />
                        </div>
                        <p className="text-base font-semibold text-slate-900 dark:text-[#f5f5f5]">
                          {total}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                          Milestones
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-base font-semibold text-slate-900 dark:text-[#f5f5f5]">
                          {completed}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                          Completed
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="w-4 h-4 text-slate-400 dark:text-[#9e9e9e]" />
                        </div>
                        <p className="text-base font-semibold text-slate-900 dark:text-[#f5f5f5]">
                          {roadmap.estimatedDuration || "12"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                          Weeks
                        </p>
                      </div>
                    </div>

                    {progress === 0 ? (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#2a2a2a] text-[11px] text-slate-500 dark:text-[#bdbdbd] text-center flex items-center justify-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ready to start your roadmap</span>
                      </div>
                    ) : progress === 100 ? (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#2a2a2a] text-[11px] text-emerald-600 dark:text-emerald-400 text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Roadmap completed</span>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#2a2a2a] text-[11px] text-blue-600 dark:text-blue-400 text-center flex items-center justify-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Keep going — you’re on track</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
