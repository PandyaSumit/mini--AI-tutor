/**
 * AI Settings Page
 * Monitor AI performance, statistics, and settings
 */

import { useState, useEffect } from 'react';
import { useAI } from '../hooks/useAI';

const AISettings = () => {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const { getStats, checkHealth } = useAI();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [statsData, healthData] = await Promise.all([
      getStats(),
      checkHealth(),
    ]);
    setStats(statsData);
    setHealth(healthData);
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'blue' }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Settings</h1>
          <p className="text-gray-600 mt-1">Monitor your AI pipeline performance</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Health Status */}
      {health && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    health.status === 'healthy'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                  }`}
                >
                  {health.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Embeddings</span>
                <span className="text-sm font-semibold text-blue-800">
                  {health.embeddings?.initialized ? '✅ Ready' : '❌ Not Ready'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Vector Store</span>
                <span className="text-sm font-semibold text-purple-800">
                  {health.vectorStore?.initialized ? '✅ Ready' : '❌ Not Ready'}
                </span>
              </div>
            </div>
          </div>

          {health.model && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Model:</span> {health.model}
              </p>
              {health.embeddings?.testTime && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">Avg Embedding Time:</span>{' '}
                  {health.embeddings.testTime}ms
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Embeddings"
              value={stats.embeddings?.generated || 0}
              subtitle={`${stats.embeddings?.cached || 0} from cache`}
              icon="🎯"
              color="blue"
            />

            <StatCard
              title="Cache Hit Ratio"
              value={
                stats.embeddings?.cacheHitRatio
                  ? `${(stats.embeddings.cacheHitRatio * 100).toFixed(0)}%`
                  : 'N/A'
              }
              subtitle="Embedding cache performance"
              icon="⚡"
              color="green"
            />

            <StatCard
              title="Vector Store Size"
              value={stats.vectorStore?.totalDocuments || 0}
              subtitle="Documents indexed"
              icon="📚"
              color="purple"
            />

            <StatCard
              title="Cost Savings"
              value="$0"
              subtitle="100% free embeddings"
              icon="💰"
              color="yellow"
            />
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Embedding Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Embedding Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-semibold">{stats.model || 'BGE-small'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimensions:</span>
                  <span className="font-semibold">
                    {stats.embeddings?.dimensions || 384}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Generated:</span>
                  <span className="font-semibold">
                    {stats.embeddings?.generated || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cached:</span>
                  <span className="font-semibold text-green-600">
                    {stats.embeddings?.cached || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Time:</span>
                  <span className="font-semibold">
                    {stats.embeddings?.avgTime
                      ? `${stats.embeddings.avgTime.toFixed(0)}ms`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Tracking */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Embeddings Cost:</span>
                  <span className="font-semibold text-green-600">
                    ${stats.cost?.embeddings || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total AI Cost:</span>
                  <span className="font-semibold">
                    ${stats.cost?.total || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Savings:</span>
                  <span className="font-semibold text-green-600">
                    100% vs OpenAI
                  </span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  🎉 You're saving money with FREE local embeddings!
                </p>
              </div>
            </div>
          </div>

          {/* Vector Store Collections */}
          {stats.vectorStore?.collections && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Vector Collections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.vectorStore.collections).map(
                  ([name, count]) => (
                    <div
                      key={name}
                      className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
                    >
                      <p className="text-sm text-gray-600 mb-1">
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500 mt-1">documents</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading State */}
      {!stats && !health && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading AI statistics...</p>
        </div>
      )}
    </div>
  );
};

export default AISettings;
