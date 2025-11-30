/**
 * Roadmaps Page
 * List of all user's learning roadmaps
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { roadmapService } from '@/services/roadmap';
import { Map, Plus, TrendingUp, Clock, Target, CheckCircle2, Sparkles } from 'lucide-react';
import type { Roadmap } from '@/types';

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
      console.error('Error fetching roadmaps:', error);
      setRoadmaps([]);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (roadmap: Roadmap) => {
    if (!roadmap.milestones || roadmap.milestones.length === 0) return 0;
    const completed = roadmap.milestones.filter((m) => m.status === 'completed').length;
    return Math.round((completed / roadmap.milestones.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Roadmaps</h1>
            <p className="text-gray-600">Create and track your personalized learning paths</p>
          </div>
          <Link
            href="/roadmaps/create"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
            <span>Create Roadmap</span>
          </Link>
        </div>

        {/* Roadmaps Grid */}
        {roadmaps.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Map className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No roadmaps yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first learning roadmap to start tracking your educational journey
            </p>
            <Link
              href="/roadmaps/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <Sparkles className="w-5 h-5" strokeWidth={2} />
              <span>Create Your First Roadmap</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap) => {
              const progress = getProgress(roadmap);
              return (
                <Link
                  key={roadmap._id}
                  href={`/roadmaps/${roadmap._id}`}
                  className="group bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Map className="w-6 h-6 text-white" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                          {roadmap.title || roadmap.goal}
                        </h3>
                        <p className="text-sm text-gray-500">{roadmap.difficulty || 'Intermediate'}</p>
                      </div>
                    </div>

                    {/* Description */}
                    {roadmap.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{roadmap.description}</p>
                    )}

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">{progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="p-6 bg-gray-50">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Target className="w-4 h-4 text-gray-400" strokeWidth={2} />
                        </div>
                        <p className="text-lg font-bold text-gray-900">{roadmap.milestones?.length || 0}</p>
                        <p className="text-xs text-gray-500">Milestones</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" strokeWidth={2} />
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {roadmap.milestones?.filter((m) => m.status === 'completed').length || 0}
                        </p>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="w-4 h-4 text-gray-400" strokeWidth={2} />
                        </div>
                        <p className="text-lg font-bold text-gray-900">{roadmap.estimatedDuration || '12'}</p>
                        <p className="text-xs text-gray-500">Weeks</p>
                      </div>
                    </div>
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
