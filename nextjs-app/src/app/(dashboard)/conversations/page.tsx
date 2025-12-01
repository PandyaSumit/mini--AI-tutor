/**
 * Conversations Page
 * History of all chat conversations
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { chatService } from "@/services/chat";
import {
  MessageSquare,
  Clock,
  Trash2,
  Search,
  Calendar,
  Sparkles,
} from "lucide-react";

interface Conversation {
  _id: string;
  topic: string;
  lastMessage?: string;
  messageCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, topic: string) => {
    if (!window.confirm(`Are you sure you want to delete "${topic}"?`)) {
      return;
    }

    setDeleting(id);
    try {
      await chatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Failed to delete conversation. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.topic
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const groupByDate = (conversations: Conversation[]) => {
    const groups: { [key: string]: Conversation[] } = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      "This Month": [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    conversations.forEach((conv) => {
      const date = new Date(conv.createdAt);
      if (date >= today) {
        groups.Today.push(conv);
      } else if (date >= yesterday) {
        groups.Yesterday.push(conv);
      } else if (date >= thisWeek) {
        groups["This Week"].push(conv);
      } else if (date >= thisMonth) {
        groups["This Month"].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#212121]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-7 w-40 rounded-lg bg-slate-200 dark:bg-[#2a2a2a]" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-slate-100 dark:bg-[#1a1a1a] border border-slate-100 dark:border-[#2a2a2a]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groupedConversations = groupByDate(filteredConversations);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-[#f5f5f5] mb-1">
              Conversation history
            </h1>
            <p className="text-sm text-slate-600 dark:text-[#bdbdbd]">
              Review, search, and manage your previous chats with your AI tutor.
            </p>
          </div>
          {conversations.length > 0 && (
            <div className="rounded-full border border-slate-200 dark:border-[#2a2a2a] bg-white/80 dark:bg-[#1a1a1a]/90 px-4 py-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-[#cfcfcf]">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">
                {conversations.length} saved{" "}
                {conversations.length === 1 ? "conversation" : "conversations"}
              </span>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#9e9e9e]"
              strokeWidth={2}
            />
            <input
              type="text"
              placeholder="Search by topic or message content"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#1a1a1a] pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-[#f5f5f5] placeholder:text-slate-400 dark:placeholder:text-[#8c8c8c] shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/80 dark:focus:ring-[#f5f5f5]/80 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-[#2a2a2a] bg-white/80 dark:bg-[#1a1a1a]/80">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-[#2a2a2a] mx-auto mb-5">
              <MessageSquare className="w-8 h-8 text-slate-400 dark:text-[#9e9e9e]" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-2">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#bdbdbd] mb-6 max-w-md mx-auto">
              {searchQuery
                ? "Try a different keyword or clear the search."
                : "Start a new chat with your AI tutor and it will appear here."}
            </p>
            {!searchQuery && (
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] hover:bg-black dark:hover:bg-white shadow-sm hover:shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start chatting</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-7">
            {Object.entries(groupedConversations).map(([group, convs]) => {
              if (convs.length === 0) return null;

              return (
                <div key={group}>
                  {/* Group Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-slate-400 dark:text-[#9e9e9e]" />
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#a8a8a8]">
                      {group}
                    </h2>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-[#2a2a2a]" />
                  </div>

                  {/* Conversations in Group */}
                  <div className="space-y-3">
                    {convs.map((conversation) => (
                      <div
                        key={conversation._id}
                        className="group rounded-2xl border border-slate-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#1a1a1a] shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-[#3a3a3a] transition-all"
                      >
                        <Link
                          href={`/chat/${conversation._id}`}
                          className="block px-4 sm:px-5 py-4"
                        >
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white dark:from-[#2a2a2a] dark:to-[#3a3a3a]">
                              <MessageSquare className="w-5 h-5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-[#f5f5f5] mb-1 line-clamp-1 group-hover:text-slate-900 dark:group-hover:text-white">
                                {conversation.topic}
                              </h3>
                              {conversation.lastMessage && (
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#c2c2c2] line-clamp-2 mb-2">
                                  {conversation.lastMessage}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                                <div className="inline-flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {new Date(
                                      conversation.createdAt
                                    ).toLocaleDateString()}{" "}
                                    ·{" "}
                                    {new Date(
                                      conversation.createdAt
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                {conversation.messageCount && (
                                  <div className="inline-flex items-center gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>
                                      {conversation.messageCount} messages
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleDelete(
                                  conversation._id,
                                  conversation.topic
                                );
                              }}
                              disabled={deleting === conversation._id}
                              className="ml-1 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50/80 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete conversation"
                            >
                              {deleting === conversation._id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {conversations.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#2a2a2a]">
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-600 dark:text-[#bdbdbd]">
              <div className="inline-flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>
                  {conversations.length}{" "}
                  {conversations.length === 1
                    ? "conversation stored"
                    : "conversations stored"}
                </span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  Total of{" "}
                  {conversations.reduce(
                    (acc, conv) => acc + (conv.messageCount || 0),
                    0
                  )}{" "}
                  messages
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
