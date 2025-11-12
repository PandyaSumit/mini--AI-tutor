import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { MessageSquare, Trash2, Search } from 'lucide-react';

const Conversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

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
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await chatService.deleteConversation(id);
      setConversations(prev => prev.filter(conv => conv._id !== id));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Conversations</h1>
        <p className="text-gray-600">Browse and manage your learning conversations</p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedTopic('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTopic === ''
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Topics
          </button>
          {['programming', 'mathematics', 'languages', 'general'].map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                selectedTopic === topic
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : conversations.length > 0 ? (
        <div className="grid gap-4">
          {conversations.map((conv) => (
            <div
              key={conv._id}
              className="card flex items-start justify-between hover:shadow-lg transition-shadow"
            >
              <Link to={`/chat/${conv._id}`} className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {conv.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                        {conv.topic}
                      </span>
                      <span>{conv.messageCount} messages</span>
                      <span>
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(conv._id);
                }}
                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No conversations found
          </h3>
          <p className="text-gray-600 mb-6">
            Start a new conversation to begin learning with AI
          </p>
          <Link to="/chat" className="btn-primary inline-block">
            Start New Chat
          </Link>
        </div>
      )}
    </div>
  );
};

export default Conversations;
