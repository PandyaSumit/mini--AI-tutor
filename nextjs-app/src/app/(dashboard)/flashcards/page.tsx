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
      // TODO: replace with flashcardService.getDecks()
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#212121]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-7 w-40 bg-slate-200 dark:bg-[#2a2a2a] rounded-lg" />
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-[#f5f5f5] mb-1">
              Flashcards
            </h1>
            <p className="text-sm text-slate-600 dark:text-[#bdbdbd]">
              Study with spaced repetition and short active recall sessions.
            </p>
          </div>
          <Link
            href="/flashcards/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] hover:bg-black dark:hover:bg-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create deck</span>
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 dark:border-[#2a2a2a] bg-gradient-to-br from-blue-50 to-slate-50 dark:from-[#1a1a1a] dark:to-[#1f1f1f] px-5 py-4">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Total cards
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f5]">
                  0
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-[#2a2a2a] bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-[#1a1a1a] dark:to-[#1f1f1f] px-5 py-4">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Due today
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f5]">
                  0
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-[#2a2a2a] bg-gradient-to-br from-violet-50 to-slate-50 dark:from-[#1a1a1a] dark:to-[#1f1f1f] px-5 py-4">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500 text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-violet-700 dark:text-violet-300">
                  Total decks
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f5]">
                  {decks.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decks Grid / Empty state */}
        {decks.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-[#2a2a2a] bg-white/70 dark:bg-[#1a1a1a]/80">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-[#2a2a2a] mx-auto mb-5">
              <Brain className="w-8 h-8 text-slate-400 dark:text-[#9e9e9e]" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-2">
              No flashcard decks yet
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#bdbdbd] mb-6 max-w-md mx-auto">
              Create your first deck or generate flashcards from your notes,
              transcripts, or resources using AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/flashcards/create"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] hover:bg-black dark:hover:bg-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create manually</span>
              </Link>
              <Link
                href="/flashcards/generate"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium border border-slate-200 dark:border-[#2a2a2a] bg-white text-slate-900 hover:bg-slate-50 dark:bg-[#212121] dark:text-[#f5f5f5] dark:hover:bg-[#262626] transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate with AI</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {decks.map((deck) => (
              <Link
                key={deck._id}
                href={`/flashcards/study/${deck._id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#1a1a1a] shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-[#3a3a3a] transition-all"
              >
                {/* Header */}
                <div className="px-5 py-5 border-b border-slate-100 dark:border-[#2a2a2a]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex-shrink-0">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f5f5f5] truncate group-hover:text-emerald-500">
                        {deck.name}
                      </h3>
                      {deck.category && (
                        <span className="mt-1 inline-block rounded-full border border-slate-200 dark:border-[#3a3a3a] bg-slate-50 dark:bg-[#252525] px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-[#e0e0e0]">
                          {deck.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {deck.description && (
                    <p className="text-xs text-slate-600 dark:text-[#c2c2c2] line-clamp-2">
                      {deck.description}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="px-5 py-4 bg-slate-50 dark:bg-[#1f1f1f]">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-[#f5f5f5]">
                        {deck.totalCards}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                        Total
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        {deck.dueCards || 0}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                        Due
                      </p>
                    </div>
                    <div>
                      <Clock className="w-4 h-4 text-slate-400 dark:text-[#9e9e9e] mx-auto mb-1" />
                      <p className="text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                        {deck.lastStudied
                          ? new Date(deck.lastStudied).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                  </div>

                  {deck.dueCards && deck.dueCards > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#2a2a2a]">
                      <div className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
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
        <div className="mt-10 rounded-2xl border border-blue-100 dark:border-[#2a2a2a] bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-[#1a1a1a] dark:via-[#212121] dark:to-[#1a1a1a] px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f5f5f5] mb-2">
                Study tips
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-[#c2c2c2]">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>
                    Review a small set of cards every day instead of cramming
                    once a week.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>
                    Say answers out loud or type them before revealing the
                    back of the card.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>
                    Keep sessions short (20–30 minutes) and come back multiple
                    times a day.
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
