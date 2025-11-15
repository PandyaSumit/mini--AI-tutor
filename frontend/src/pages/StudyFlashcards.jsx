import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studyMaterialService } from '../services/studyMaterialService';
import { ArrowLeft, RotateCw, Check, X, Brain, Trophy, TrendingUp } from 'lucide-react';

const StudyFlashcards = () => {
    const { deckName } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState({
        flashcards: [],
        count: 0
    });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        reviewed: 0,
        correct: 0,
        incorrect: 0,
        startTime: Date.now()
    });
    const [showResults, setShowResults] = useState(false);
    console.log('cards :>> ', cards);
    useEffect(() => {
        loadCards();
    }, [deckName]);

    const loadCards = async () => {
        try {
            const response = await studyMaterialService.getDueFlashcards(
                deckName ? decodeURIComponent(deckName) : null,
                50
            );
            setCards({
                flashcards: Array.isArray(response.data.flashcards) ? response.data.flashcards : [],
                count: typeof response.data.count === 'number' ? response.data.count : (Array.isArray(response.data.flashcards) ? response.data.flashcards.length : 0)
            });

            if (!response.data || !Array.isArray(response.data.flashcards) || response.data.flashcards.length === 0) {
                alert('No cards due for review!');
                navigate('/flashcards');
            }
        } catch (error) {
            console.error('Error loading cards:', error);
            alert(error.response?.data?.message || 'Failed to load flashcards');
            navigate('/flashcards');
        } finally {
            setLoading(false);
        }
    };

    const handleFlip = () => {
        setFlipped(!flipped);
    };

    const handleRating = async (quality) => {
        const startTime = sessionStats.startTime;
        const responseTime = Math.round((Date.now() - startTime) / 1000);

        try {
            const flashcards = cards.flashcards || [];
            const cardId = flashcards[currentIndex]?._id;
            await studyMaterialService.reviewFlashcard(
                cardId,
                quality,
                responseTime
            );

            // Update session stats
            setSessionStats(prev => ({
                ...prev,
                reviewed: prev.reviewed + 1,
                correct: quality >= 3 ? prev.correct + 1 : prev.correct,
                incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect
            }));

            // Move to next card or show results
            if (currentIndex < flashcards.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setFlipped(false);
                setSessionStats(prev => ({ ...prev, startTime: Date.now() }));
            } else {
                setShowResults(true);
            }
        } catch (error) {
            console.error('Error reviewing card:', error);
            alert('Failed to save review');
        }
    };

    const handleFinish = () => {
        navigate('/flashcards');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (showResults) {
        const accuracy = sessionStats.reviewed > 0
            ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
            : 0;

        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center px-4">
                <div className="card max-w-2xl w-full text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
                        <Trophy className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Study Session Complete!</h2>
                    <p className="text-gray-600 mb-8">Great job! Here's your performance:</p>

                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="p-6 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-600 mb-1">Cards Reviewed</p>
                            <p className="text-3xl font-bold text-gray-900">{sessionStats.reviewed}</p>
                        </div>
                        <div className="p-6 bg-green-50 rounded-xl">
                            <p className="text-sm text-gray-600 mb-1">Correct</p>
                            <p className="text-3xl font-bold text-green-600">{sessionStats.correct}</p>
                        </div>
                        <div className="p-6 bg-primary-50 rounded-xl">
                            <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                            <p className="text-3xl font-bold text-primary-600">{accuracy}%</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={handleFinish} className="flex-1 btn-primary">
                            Back to Decks
                        </button>
                        <button
                            onClick={() => {
                                setShowResults(false);
                                setCurrentIndex(0);
                                setFlipped(false);
                                setSessionStats({
                                    reviewed: 0,
                                    correct: 0,
                                    incorrect: 0,
                                    startTime: Date.now()
                                });
                                loadCards();
                            }}
                            className="flex-1 btn-secondary flex items-center justify-center gap-2"
                        >
                            <RotateCw className="w-5 h-5" />
                            Study More
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const flashcards = cards.flashcards || [];
    const currentCard = flashcards[currentIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/flashcards')}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                            Card {currentIndex + 1} of {flashcards.length}
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                            <Brain className="w-5 h-5 text-primary-600" />
                            <span className="font-semibold text-gray-900">
                                {sessionStats.reviewed} reviewed
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${flashcards.length ? ((currentIndex + 1) / flashcards.length) * 100 : 0}%` }}
                        />
                    </div>
                </div>

                {/* Flashcard */}
                <div className="perspective-1000 mb-8">
                    <div
                        className={`relative w-full h-96 transition-transform duration-500 transform-style-3d cursor-pointer ${flipped ? 'rotate-y-180' : ''
                            }`}
                        onClick={handleFlip}
                    >
                        {/* Front */}
                        <div
                            className={`absolute inset-0 card flex flex-col items-center justify-center text-center p-8 backface-hidden ${flipped ? 'invisible' : ''
                                }`}
                        >
                            <div className="text-sm text-primary-600 font-medium mb-4">QUESTION</div>
                            <p className="text-2xl font-bold text-gray-900 mb-8">{currentCard?.front}</p>
                            <div className="text-sm text-gray-500">Click to reveal answer</div>
                        </div>

                        {/* Back */}
                        <div
                            className={`absolute inset-0 card flex flex-col items-center justify-center text-center p-8 backface-hidden rotate-y-180 ${!flipped ? 'invisible' : ''
                                }`}
                        >
                            <div className="text-sm text-green-600 font-medium mb-4">ANSWER</div>
                            <p className="text-2xl font-bold text-gray-900">{currentCard?.back}</p>
                            {currentCard?.tags && currentCard.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-6">
                                    {currentCard.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rating Buttons (only show when flipped) */}
                {flipped && (
                    <div className="space-y-4">
                        <div className="text-center mb-4">
                            <p className="text-lg font-semibold text-gray-900 mb-2">How well did you know this?</p>
                            <p className="text-sm text-gray-600">Your answer affects when you'll see this card again</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <button
                                onClick={() => handleRating(0)}
                                className="p-4 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl transition-all"
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <X className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="text-sm font-semibold text-red-900">Total Blackout</div>
                                <div className="text-xs text-red-600 mt-1">See again soon</div>
                            </button>

                            <button
                                onClick={() => handleRating(1)}
                                className="p-4 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 rounded-xl transition-all"
                            >
                                <div className="text-sm font-semibold text-orange-900">Incorrect</div>
                                <div className="text-xs text-orange-600 mt-1">Review soon</div>
                            </button>

                            <button
                                onClick={() => handleRating(2)}
                                className="p-4 bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-200 rounded-xl transition-all"
                            >
                                <div className="text-sm font-semibold text-yellow-900">Hard</div>
                                <div className="text-xs text-yellow-600 mt-1">Difficult recall</div>
                            </button>

                            <button
                                onClick={() => handleRating(3)}
                                className="p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition-all"
                            >
                                <div className="text-sm font-semibold text-blue-900">Good</div>
                                <div className="text-xs text-blue-600 mt-1">Some hesitation</div>
                            </button>

                            <button
                                onClick={() => handleRating(4)}
                                className="p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl transition-all"
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Check className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="text-sm font-semibold text-green-900">Perfect</div>
                                <div className="text-xs text-green-600 mt-1">Easy recall</div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Instructions (only show when not flipped) */}
                {!flipped && (
                    <div className="text-center text-gray-500 text-sm">
                        <p>Review the question, think of your answer, then click the card to reveal</p>
                    </div>
                )}
            </div>

            <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
        </div>
    );
};

export default StudyFlashcards;
