/**
 * Flashcards Page
 * List of all flashcard decks
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { flashcardService } from "@/services/flashcard";
import {
  Brain,
  Plus,
  BookOpen,
  Clock,
  TrendingUp,
  Sparkles,
  Zap,
} from "lucide-react";

interface Deck {
  _id: string;
  name: string;
  description?: string;
  totalCards: number;
  dueCards?: number;
  lastStudied?: string;
  category?: string;
}

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      // For now, using mock data since the service might not return decks
      // In production, this would call flashcardService.getDecks() or similar
      setDecks([]);
    } catch (error) {
      console.error("Error fetching decks:", error);
      setDecks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto px-6 py-8">
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
      <div className="mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Flashcards
            </h1>
            <p className="text-gray-600">
              Study with spaced repetition for better retention
            </p>
          </div>
          <Link
            href="/flashcards/create"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
            <span>Create Deck</span>
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Cards</p>
                <p className="text-2xl font-bold text-blue-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm text-green-700">Due Today</p>
                <p className="text-2xl font-bold text-green-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm text-purple-700">Total Decks</p>
                <p className="text-2xl font-bold text-purple-900">
                  {decks.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decks Grid */}
        {decks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No flashcard decks yet
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first deck or generate flashcards from your study
              materials using AI
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/flashcards/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5" strokeWidth={2} />
                <span>Create Deck Manually</span>
              </Link>
              <Link
                href="/flashcards/generate"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl border-2 border-gray-200 transition-all"
              >
                <Sparkles className="w-5 h-5" strokeWidth={2} />
                <span>Generate with AI</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <Link
                key={deck._id}
                href={`/flashcards/study/${deck._id}`}
                className="group bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-green-600 transition-colors">
                        {deck.name}
                      </h3>
                      {deck.category && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {deck.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {deck.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {deck.description}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {deck.totalCards}
                      </p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {deck.dueCards || 0}
                      </p>
                      <p className="text-xs text-gray-500">Due</p>
                    </div>
                    <div className="text-center">
                      <Clock
                        className="w-4 h-4 text-gray-400 mx-auto mb-1"
                        strokeWidth={2}
                      />
                      <p className="text-xs text-gray-500">
                        {deck.lastStudied
                          ? new Date(deck.lastStudied).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                  </div>

                  {deck.dueCards && deck.dueCards > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600">
                        <TrendingUp className="w-4 h-4" strokeWidth={2} />
                        <span>Ready to study</span>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Study Tips */}
        <div className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Study Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    Review cards daily for best retention with spaced repetition
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    Focus on understanding concepts, not just memorization
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    Study in short sessions (20-30 minutes) for better focus
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
