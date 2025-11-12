import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studyMaterialService } from '../services/studyMaterialService';
import { Brain, Plus, Play, Download, Sparkles, Clock, TrendingUp, Target } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
              <Brain className="w-4 h-4" />
              Spaced Repetition Learning
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Flashcards</h1>
            <p className="text-gray-600 text-lg">
              Master concepts with scientifically-proven spaced repetition
            </p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary flex items-center gap-2 px-6"
          >
            <Plus className="w-5 h-5" />
            Generate Flashcards
          </button>
        </div>

        {/* Stats Overview */}
        {decks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Cards</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {decks.reduce((sum, deck) => sum + deck.totalCards, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {decks.reduce((sum, deck) => sum + deck.dueCount, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg. Retention</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {decks.length > 0
                      ? Math.round(
                          decks.reduce((sum, deck) => sum + (deck.averageRetention || 0), 0) / decks.length
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Decks Grid */}
        {decks.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-12 h-12 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No flashcards yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Generate your first set of flashcards from conversations or topics to start learning with spaced repetition.
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
              <div key={deck.deck} className="card group hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{deck.deck}</h3>
                      <p className="text-sm text-gray-500">{deck.totalCards} cards</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(deck.averageRetention || 0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all"
                      style={{ width: `${deck.averageRetention || 0}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Due</p>
                    <p className="text-lg font-bold text-orange-600">{deck.dueCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mastered</p>
                    <p className="text-lg font-bold text-green-600">{deck.masteredCount || 0}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStudy(deck.deck)}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Study
                  </button>
                  <button
                    onClick={() => handleExport(deck.deck)}
                    className="btn-secondary p-3"
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

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Flashcards</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic / Subject
                </label>
                <input
                  type="text"
                  value={generateForm.topic}
                  onChange={(e) => setGenerateForm({ ...generateForm, topic: e.target.value })}
                  className="input-field"
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
                  className="w-full"
                />
                <div className="text-center text-2xl font-bold text-primary-600 mt-2">
                  {generateForm.count} cards
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
                      className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                        generateForm.difficulty === level
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
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
                  className="flex-1 btn-secondary"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
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
