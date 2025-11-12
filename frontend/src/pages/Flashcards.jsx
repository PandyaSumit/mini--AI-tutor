import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studyMaterialService } from '../services/studyMaterialService';
import { Brain, Plus, Play, Download, Sparkles, Clock, TrendingUp, Target, Zap, ArrowRight } from 'lucide-react';

const Flashcards = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    topic: '',
    count: 10,
    difficulty: 'intermediate',
    source: 'topic'
  });

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const response = await studyMaterialService.getDecks();
      setDecks(response.data || []);
    } catch (error) {
      console.error('Error loading decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      await studyMaterialService.generateFlashcards({
        topic: generateForm.topic,
        count: generateForm.count,
        difficulty: generateForm.difficulty,
        ...(generateForm.source === 'conversation' && { conversationId: generateForm.conversationId })
      });

      setShowGenerateModal(false);
      setGenerateForm({ topic: '', count: 10, difficulty: 'intermediate', source: 'topic' });
      await loadDecks();
      alert('Flashcards generated successfully!');
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert(error.response?.data?.message || 'Failed to generate flashcards');
    } finally {
      setGenerating(false);
    }
  };

  const handleStudy = (deckName) => {
    navigate(`/flashcards/study/${encodeURIComponent(deckName)}`);
  };

  const handleExport = async (deckName) => {
    try {
      const blob = await studyMaterialService.exportFlashcards(deckName, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deckName}-flashcards.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting flashcards:', error);
      alert('Failed to export flashcards');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalCards = decks.reduce((sum, deck) => sum + deck.totalCards, 0);
  const dueCards = decks.reduce((sum, deck) => sum + deck.dueCount, 0);
  const avgRetention = decks.length > 0
    ? Math.round(decks.reduce((sum, deck) => sum + (deck.averageRetention || 0), 0) / decks.length)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-700 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Spaced Repetition System
              </p>
              <h1 className="text-4xl font-bold mb-2">Flashcards</h1>
              <p className="text-orange-100 text-lg">
                Master concepts with scientifically-proven spaced repetition
              </p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="hidden md:flex items-center gap-2 bg-white text-orange-700 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
            >
              <Plus className="w-5 h-5" />
              Generate Cards
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8 pb-12">
        {/* Stats Grid */}
        {decks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Cards</p>
              <p className="text-3xl font-bold text-gray-900">{totalCards}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Due Today</p>
              <p className="text-3xl font-bold text-gray-900">{dueCards}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Avg. Retention</p>
              <p className="text-3xl font-bold text-gray-900">{avgRetention}%</p>
            </div>
          </div>
        )}

        {/* Decks Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-orange-600" />
              Your Flashcard Decks
            </h2>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Generate New
            </button>
          </div>

          {decks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No flashcards yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Generate your first set of flashcards from topics or conversations to start learning with spaced repetition.
              </p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate Your First Deck
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <div key={deck.deck} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-6 hover:border-orange-200 hover:shadow-lg transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg truncate">{deck.deck}</h3>
                        <p className="text-sm text-gray-500">{deck.totalCards} cards</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Mastery</span>
                      <span className="font-semibold">{Math.round(deck.averageRetention || 0)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                        style={{ width: `${deck.averageRetention || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Due Today</p>
                      <p className="text-2xl font-bold text-orange-600">{deck.dueCount}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Mastered</p>
                      <p className="text-2xl font-bold text-green-600">{deck.masteredCount || 0}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStudy(deck.deck)}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Study Now
                    </button>
                    <button
                      onClick={() => handleExport(deck.deck)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-xl transition-colors"
                      title="Export to Anki"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-600" />
              Generate Flashcards
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic / Subject
                </label>
                <input
                  type="text"
                  value={generateForm.topic}
                  onChange={(e) => setGenerateForm({ ...generateForm, topic: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="e.g., Python Functions, World War 2..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Cards
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={generateForm.count}
                  onChange={(e) => setGenerateForm({ ...generateForm, count: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
                <div className="text-center mt-2">
                  <span className="text-3xl font-bold text-orange-600">{generateForm.count}</span>
                  <span className="text-gray-600 ml-2">cards</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setGenerateForm({ ...generateForm, difficulty: level })}
                      className={`px-4 py-3 rounded-xl border-2 transition-all capitalize font-medium ${
                        generateForm.difficulty === level
                          ? 'border-orange-600 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcards;
