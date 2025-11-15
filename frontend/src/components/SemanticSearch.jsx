/**
 * Semantic Search Component
 * Search across knowledge base using AI embeddings
 */

import { useState } from 'react';
import { useAI } from '../hooks/useAI';

const SemanticSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searchType, setSearchType] = useState('all');
  const { search, searchRoadmaps, searchFlashcards, searchNotes, loading } = useAI();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    try {
      let searchResults;
      switch (searchType) {
        case 'roadmaps':
          searchResults = await searchRoadmaps(query);
          break;
        case 'flashcards':
          searchResults = await searchFlashcards(query);
          break;
        case 'notes':
          searchResults = await searchNotes(query);
          break;
        default:
          searchResults = await search(query);
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      roadmap: 'bg-blue-100 text-blue-800',
      flashcard: 'bg-green-100 text-green-800',
      note: 'bg-yellow-100 text-yellow-800',
      knowledge: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔍 Semantic Search
        </h2>
        <p className="text-gray-600">
          Search your learning content using AI-powered semantic understanding
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for concepts, topics, or questions..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {['all', 'roadmaps', 'flashcards', 'notes'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSearchType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Found {results.results?.length || 0} results
            </h3>
            {results.cached && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                ⚡ Cached
              </span>
            )}
          </div>

          {results.results && results.results.length > 0 ? (
            <div className="space-y-3">
              {results.results.map((result, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">
                        #{index + 1}
                      </span>
                      {result.metadata?.type && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${getTypeColor(
                            result.metadata.type
                          )}`}
                        >
                          {result.metadata.type}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-600">
                        {(result.score * 100).toFixed(0)}% match
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-900 mb-2">{result.content}</p>

                  {result.metadata && (
                    <div className="flex gap-3 text-xs text-gray-500">
                      {result.metadata.title && (
                        <span>📚 {result.metadata.title}</span>
                      )}
                      {result.metadata.difficulty && (
                        <span>🎯 {result.metadata.difficulty}</span>
                      )}
                      {result.metadata.tags && (
                        <span>🏷️ {result.metadata.tags.join(', ')}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm">Try a different search query</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold mb-2">Start Searching</h3>
          <p className="text-sm">
            Enter a query to search across your roadmaps, flashcards, and notes
          </p>
          <div className="mt-6 text-left max-w-md mx-auto bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              💡 Pro Tips:
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use natural language questions</li>
              <li>• Search for concepts, not exact words</li>
              <li>• Try "explain recursion" instead of just "recursion"</li>
              <li>• Filter by content type for better results</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemanticSearch;
