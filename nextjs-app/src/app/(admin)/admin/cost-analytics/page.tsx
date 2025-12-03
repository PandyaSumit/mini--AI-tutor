'use client';

/**
 * Admin Cost Analytics Page
 * Detailed view of multi-agent system costs, cache performance, and usage
 */

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Zap,
  Activity,
  Users,
  Loader,
  AlertCircle,
  Brain,
  Database,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { agentService } from '@/services/agent';

interface CostAnalytics {
  period: string;
  total_cost: number;
  breakdown: Array<{
    feature: string;
    cost: number;
    count: number;
  }>;
  cache_hit_rate?: number;
}

interface AgentStats {
  global: {
    total_requests: number;
    total_successes: number;
    total_failures: number;
    total_cost: number;
    average_response_time: number;
  };
  agents: Record<
    string,
    {
      requests: number;
      successes: number;
      failures: number;
      total_cost: number;
      average_response_time: number;
    }
  >;
}

export default function CostAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CostAnalytics | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsData, statsData] = await Promise.all([
        agentService.getCostAnalytics({ period, group_by: 'feature' }),
        agentService.getAgentStats(),
      ]);

      setAnalytics(analyticsData);
      setAgentStats(statsData);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading cost analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Error Loading Analytics
              </h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadAnalytics}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const successRate = agentStats
    ? ((agentStats.global.total_successes / agentStats.global.total_requests) *
        100
      ).toFixed(1)
    : '0';

  const cacheHitRate = analytics?.cache_hit_rate
    ? (analytics.cache_hit_rate * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cost Analytics</h1>
          <p className="text-gray-600 mt-2">
            Multi-agent system performance and cost breakdown
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Cost</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            ${analytics?.total_cost.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-gray-500">This {period}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Cache Hit Rate</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{cacheHitRate}%</p>
          <p className="text-sm text-gray-500">
            Target: 60%+ (Cost savings: 90%)
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Success Rate</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{successRate}%</p>
          <p className="text-sm text-gray-500">
            {agentStats?.global.total_requests.toLocaleString() || '0'} requests
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Avg Response Time</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {agentStats?.global.average_response_time.toFixed(0) || '0'}
            <span className="text-lg">ms</span>
          </p>
          <p className="text-sm text-gray-500">Target: &lt;2000ms</p>
        </div>
      </div>

      {/* Cost Breakdown by Feature */}
      {analytics && analytics.breakdown && analytics.breakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Cost by Feature</h2>
            <Brain className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics.breakdown.map((item) => {
              const percentage = analytics.total_cost > 0
                ? ((item.cost / analytics.total_cost) * 100).toFixed(1)
                : '0';

              return (
                <div key={item.feature}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700">
                        {item.feature}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({item.count.toLocaleString()} requests)
                      </span>
                    </div>
                    <span className="text-sm text-gray-900 font-semibold">
                      ${item.cost.toFixed(2)} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agent Performance */}
      {agentStats && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Agent Performance</h2>
            <Database className="w-6 h-6 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Agent
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Requests
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Success Rate
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Avg Time (ms)
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Total Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(agentStats.agents).map(([name, stats]) => {
                  const successRate =
                    stats.requests > 0
                      ? ((stats.successes / stats.requests) * 100).toFixed(1)
                      : '0';

                  return (
                    <tr key={name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {name}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">
                        {stats.requests.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            parseFloat(successRate) >= 95
                              ? 'bg-green-100 text-green-800'
                              : parseFloat(successRate) >= 80
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {successRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">
                        {stats.average_response_time.toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                        ${stats.total_cost.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cost Optimization Tips */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          💡 Cost Optimization Tips
        </h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <strong>Target 60%+ cache hit rate:</strong> Pre-generate common Q&As
              during course preparation to maximize cache efficiency
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <strong>Course Preparation ROI:</strong> $10 one-time cost serves 1000+
              students, reducing per-student cost from $20 to $2-3
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <strong>Monitor throttling:</strong> System auto-throttles at 95% of
              daily budget to prevent cost overruns
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
