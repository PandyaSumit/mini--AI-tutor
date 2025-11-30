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
      conversation.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      <div className="min-h-screen bg-white">
        <div className="mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groupedConversations = groupByDate(filteredConversations);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Conversation History
          </h1>
          <p className="text-gray-600">
            View and manage your past conversations with AI Tutor
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              strokeWidth={2}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <MessageSquare
                className="w-10 h-10 text-gray-400"
                strokeWidth={1.5}
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </h2>
            <p className="text-gray-600 mb-8">
              {searchQuery
                ? "Try adjusting your search query"
                : "Start a conversation with AI Tutor to see it here"}
            </p>
            {!searchQuery && (
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <Sparkles className="w-5 h-5" strokeWidth={2} />
                <span>Start Chatting</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedConversations).map(([group, convs]) => {
              if (convs.length === 0) return null;

              return (
                <div key={group}>
                  {/* Group Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar
                      className="w-4 h-4 text-gray-400"
                      strokeWidth={2}
                    />
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      {group}
                    </h2>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  {/* Conversations in Group */}
                  <div className="space-y-3">
                    {convs.map((conversation) => (
                      <div
                        key={conversation._id}
                        className="group bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
                      >
                        <Link
                          href={`/chat/${conversation._id}`}
                          className="block p-6"
                        >
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                              <MessageSquare
                                className="w-6 h-6 text-white"
                                strokeWidth={2}
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                {conversation.topic}
                              </h3>
                              {conversation.lastMessage && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                  {conversation.lastMessage}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" strokeWidth={2} />
                                  <span>
                                    {new Date(
                                      conversation.createdAt
                                    ).toLocaleDateString()}{" "}
                                    at{" "}
                                    {new Date(
                                      conversation.createdAt
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                {conversation.messageCount && (
                                  <div className="flex items-center gap-1">
                                    <MessageSquare
                                      className="w-3 h-3"
                                      strokeWidth={2}
                                    />
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
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete conversation"
                            >
                              {deleting === conversation._id ? (
                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-5 h-5" strokeWidth={2} />
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
          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" strokeWidth={2} />
                <span>
                  {conversations.length}{" "}
                  {conversations.length === 1
                    ? "conversation"
                    : "conversations"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" strokeWidth={2} />
                <span>
                  Total:{" "}
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
