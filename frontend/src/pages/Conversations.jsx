import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chatService } from '../services/chatService';
import {
    MessageSquare,
    Trash2,
    Search,
    X,
    Calendar,
    MessagesSquare,
    AlertCircle,
    ChevronRight
} from 'lucide-react';

const Conversations = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchConversations();
    }, [selectedTopic]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedTopic) params.topic = selectedTopic;

            const response = await chatService.getConversations(params);
            setConversations(response.data.conversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            fetchConversations();
            return;
        }

        try {
            setLoading(true);
            const response = await chatService.searchConversations(searchQuery);
            setConversations(response.data.conversations);
        } catch (error) {
            console.error('Error searching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await chatService.deleteConversation(id);
            setConversations(prev => prev.filter(conv => conv._id !== id));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting conversation:', error);
            alert('Failed to delete conversation');
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        fetchConversations();
    };

    // Loading Skeleton
    const ConversationsSkeleton = () => (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="animate-pulse">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gray-200" />
                            <div className="flex-1 space-y-3">
                                <div className="h-5 bg-gray-200 rounded w-3/4" />
                                <div className="flex gap-3">
                                    <div className="h-4 bg-gray-200 rounded w-20" />
                                    <div className="h-4 bg-gray-200 rounded w-24" />
                                    <div className="h-4 bg-gray-200 rounded w-28" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const topics = [
        { value: '', label: 'All Topics' },
        { value: 'programming', label: 'Programming' },
        { value: 'mathematics', label: 'Mathematics' },
        { value: 'languages', label: 'Languages' },
        { value: 'general', label: 'General' }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                <div className="mx-auto px-6 lg:px-8 py-8 lg:py-12">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                My Conversations
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Browse and manage your learning conversations
                            </p>
                        </div>
                        <Link
                            to="/chat"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
                        >
                            <MessageSquare className="w-5 h-5" strokeWidth={2} />
                            <span>New Chat</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-10">
                {/* Search and Filters */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search conversations by title or content..."
                                className="w-full pl-12 pr-12 py-3 text-[15px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X className="w-4 h-4 text-gray-400" strokeWidth={2} />
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Topic Filters */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Topic</h3>
                        <div className="flex flex-wrap gap-2">
                            {topics.map((topic) => (
                                <button
                                    key={topic.value}
                                    onClick={() => setSelectedTopic(topic.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTopic === topic.value
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {topic.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                {!loading && conversations.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-600">
                            {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'} found
                            {searchQuery && (
                                <span> for "<span className="font-semibold text-gray-900">{searchQuery}</span>"</span>
                            )}
                        </p>
                    </div>
                )}

                {/* Conversations List */}
                {loading ? (
                    <ConversationsSkeleton />
                ) : conversations.length > 0 ? (
                    <div className="space-y-3">
                        {conversations.map((conv) => (
                            <div key={conv._id} className="bg-white rounded-xl border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all group">
                                <div className="flex items-start p-6">
                                    {/* Icon */}
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors">
                                            <MessageSquare className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" strokeWidth={2} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <Link to={`/chat/${conv._id}`} className="flex-1 min-w-0 mx-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                                            {conv.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium capitalize">
                                                {conv.topic}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessagesSquare className="w-3.5 h-3.5" strokeWidth={2} />
                                                {conv.messageCount} messages
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                                                {new Date(conv.lastMessageAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </Link>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Link
                                            to={`/chat/${conv._id}`}
                                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                            aria-label="Open conversation"
                                        >
                                            <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirm(conv._id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            aria-label="Delete conversation"
                                        >
                                            <Trash2 className="w-5 h-5" strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-gray-400" strokeWidth={2} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No conversations found' : 'No conversations yet'}
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                            {searchQuery
                                ? `No conversations match "${searchQuery}". Try a different search term.`
                                : 'Start a new conversation to begin learning with AI'}
                        </p>
                        <Link
                            to="/chat"
                            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                        >
                            <MessageSquare className="w-5 h-5" strokeWidth={2} />
                            Start New Chat
                        </Link>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6 text-red-600" strokeWidth={2} />
                        </div>

                        {/* Content */}
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                            Delete Conversation?
                        </h3>
                        <p className="text-gray-600 text-center mb-6">
                            This action cannot be undone. All messages in this conversation will be permanently deleted.
                        </p>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Conversations;