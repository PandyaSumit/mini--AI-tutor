import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { chatService } from '../services/chatService';
import { roadmapService } from '../services/roadmapService';
import { studyMaterialService } from '../services/studyMaterialService';
import {
    BookOpen,
    MessageSquare,
    TrendingUp,
    Zap,
    Brain,
    Map,
    Play,
    Clock,
    Target,
    Plus,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Calendar,
    Award,
    BarChart3,
    Flame,
    ChevronRight
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentConversations, setRecentConversations] = useState([]);
    const [roadmaps, setRoadmaps] = useState([]);
    const [flashcardStats, setFlashcardStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, conversationsRes, roadmapsRes, decksRes] = await Promise.all([
                userService.getStats(),
                chatService.getConversations({ limit: 3 }),
                roadmapService.getRoadmaps().catch(() => ({ data: [] })),
                studyMaterialService.getDecks().catch(() => ({ data: [] }))
            ]);

            setStats(statsRes.data.stats);
            setRecentConversations(Array.isArray(conversationsRes.data.conversations) ? conversationsRes.data.conversations : []);
            setRoadmaps(Array.isArray(roadmapsRes.data) ? roadmapsRes.data : []);

            // Calculate flashcard stats
            const decks = Array.isArray(decksRes.data) ? decksRes.data : [];
            const totalCards = decks.reduce((sum, deck) => sum + (deck.totalCards || 0), 0);
            const dueCards = decks.reduce((sum, deck) => sum + (deck.dueCount || 0), 0);
            setFlashcardStats({ totalCards, dueCards, decks: decks.length });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getOverallProgress = (roadmap) => {
        if (!roadmap.weeklyModules || roadmap.weeklyModules.length === 0) return 0;
        const completed = roadmap.weeklyModules.filter(w => w.status === 'completed').length;
        return Math.round((completed / roadmap.weeklyModules.length) * 100);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Loading Skeleton
    const DashboardSkeleton = () => (
        <div className="min-h-screen bg-white">
            {/* Header Skeleton */}
            <div className="border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-12">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-8 w-64 bg-gray-200 rounded"></div>
                        <div className="h-4 w-80 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Stats Skeleton */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                            <div className="animate-pulse space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                                </div>
                                <div>
                                    <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return <DashboardSkeleton />;
    }

    const statCards = [
        {
            icon: MessageSquare,
            label: 'Conversations',
            value: stats?.totalConversations || 0,
            change: '+12%',
            changeLabel: 'vs last week'
        },
        {
            icon: Map,
            label: 'Active Roadmaps',
            value: roadmaps.length || 0,
            change: roadmaps.length > 0 ? 'In progress' : 'Get started'
        },
        {
            icon: Brain,
            label: 'Cards Due',
            value: flashcardStats?.dueCards || 0,
            change: flashcardStats?.totalCards ? `${flashcardStats.totalCards} total` : 'No cards yet'
        },
        {
            icon: Flame,
            label: 'Day Streak',
            value: stats?.currentStreak || 0,
            change: stats?.currentStreak > 0 ? 'Keep it up!' : 'Start today',
            highlight: stats?.currentStreak >= 7
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header Section */}
            <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-12">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Welcome Message */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" strokeWidth={2} />
                                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                                {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Ready to continue your learning journey?
                            </p>
                        </div>

                        {/* Primary CTA */}
                        <Link
                            to="/chat"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
                        >
                            <MessageSquare className="w-5 h-5" strokeWidth={2} />
                            <span>Start Learning</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
                    {statCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className={`p-6 rounded-xl border transition-all ${stat.highlight
                                    ? 'border-yellow-200 bg-yellow-50'
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.highlight ? 'bg-yellow-200' : 'bg-gray-100'
                                        }`}>
                                        <Icon className={`w-5 h-5 ${stat.highlight ? 'text-yellow-700' : 'text-gray-600'
                                            }`} strokeWidth={2} />
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                                <p className="text-xs text-gray-500">{stat.change}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column - Primary Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Learning Roadmaps */}
                        <section className="bg-white rounded-xl border border-gray-100 p-6 lg:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Map className="w-5 h-5 text-gray-600" strokeWidth={2} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Learning Roadmaps</h2>
                                </div>
                                <Link
                                    to="/roadmaps"
                                    className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
                                >
                                    <span>View All</span>
                                    <ChevronRight className="w-4 h-4" strokeWidth={2} />
                                </Link>
                            </div>

                            {roadmaps.length > 0 ? (
                                <div className="space-y-3">
                                    {roadmaps.slice(0, 3).map((roadmap) => {
                                        const progress = getOverallProgress(roadmap);
                                        return (
                                            <Link
                                                key={roadmap._id}
                                                to={`/roadmaps/${roadmap._id}`}
                                                className="block p-5 border border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all group"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 mb-2 truncate">
                                                            {roadmap.goal}
                                                        </h3>
                                                        <div className="flex items-center gap-3 text-xs text-gray-600">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                                                                {roadmap.totalWeeks} weeks
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium capitalize">
                                                                {roadmap.status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" strokeWidth={2} />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gray-900 rounded-full transition-all duration-500"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900 tabular-nums min-w-[3ch]">{progress}%</span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                        <Map className="w-7 h-7 text-gray-400" strokeWidth={2} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No roadmaps yet</h3>
                                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                                        Create your first learning roadmap to organize your study path
                                    </p>
                                    <Link
                                        to="/roadmaps/create"
                                        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                                    >
                                        <Plus className="w-4 h-4" strokeWidth={2} />
                                        Create Roadmap
                                    </Link>
                                </div>
                            )}
                        </section>

                        {/* Recent Conversations */}
                        <section className="bg-white rounded-xl border border-gray-100 p-6 lg:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-gray-600" strokeWidth={2} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Recent Conversations</h2>
                                </div>
                                <Link
                                    to="/conversations"
                                    className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
                                >
                                    <span>View All</span>
                                    <ChevronRight className="w-4 h-4" strokeWidth={2} />
                                </Link>
                            </div>

                            {recentConversations.length > 0 ? (
                                <div className="space-y-3">
                                    {recentConversations.map((conv) => (
                                        <Link
                                            key={conv._id}
                                            to={`/chat/${conv._id}`}
                                            className="block p-5 border border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 mb-2 truncate">
                                                        {conv.title}
                                                    </h3>
                                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium capitalize">
                                                            {conv.topic}
                                                        </span>
                                                        <span>{conv.messageCount} messages</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" strokeWidth={2} />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-7 h-7 text-gray-400" strokeWidth={2} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                                        Start a conversation with our AI tutor to get personalized help
                                    </p>
                                    <Link
                                        to="/chat"
                                        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                                    >
                                        <MessageSquare className="w-4 h-4" strokeWidth={2} />
                                        Start Chat
                                    </Link>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column - Secondary Content */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <section className="bg-white rounded-xl border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-5">Quick Actions</h2>
                            <div className="space-y-3">
                                <Link
                                    to="/chat"
                                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                                        <MessageSquare className="w-5 h-5 text-white" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm">AI Chat</p>
                                        <p className="text-xs text-gray-600">Ask questions</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors flex-shrink-0" strokeWidth={2} />
                                </Link>

                                <Link
                                    to="/roadmaps/create"
                                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                                        <Map className="w-5 h-5 text-white" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm">New Roadmap</p>
                                        <p className="text-xs text-gray-600">Plan learning</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors flex-shrink-0" strokeWidth={2} />
                                </Link>

                                <Link
                                    to="/flashcards"
                                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                                        <Brain className="w-5 h-5 text-white" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm">Flashcards</p>
                                        <p className="text-xs text-gray-600">Study & review</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors flex-shrink-0" strokeWidth={2} />
                                </Link>
                            </div>
                        </section>

                        {/* Flashcard Progress */}
                        {flashcardStats && flashcardStats.decks > 0 && (
                            <section className="bg-gray-900 text-white rounded-xl p-6 border border-gray-800">
                                <div className="flex items-center gap-2 mb-5">
                                    <Brain className="w-5 h-5" strokeWidth={2} />
                                    <h3 className="text-lg font-bold">Study Progress</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                        <span className="text-sm font-medium text-gray-300">Cards Due Today</span>
                                        <span className="text-3xl font-bold">{flashcardStats.dueCards}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-300">
                                        <span className="text-sm">Total Cards</span>
                                        <span className="text-lg font-semibold">{flashcardStats.totalCards}</span>
                                    </div>
                                    <Link
                                        to="/flashcards"
                                        className="block w-full bg-white text-gray-900 py-3 rounded-lg font-semibold text-center hover:bg-gray-100 transition-colors mt-4"
                                    >
                                        Study Now
                                    </Link>
                                </div>
                            </section>
                        )}

                        {/* Achievement Badge */}
                        {stats?.currentStreak >= 7 && (
                            <section className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                                        <Award className="w-6 h-6 text-yellow-700" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">On Fire! 🔥</h3>
                                        <p className="text-sm text-gray-600">{stats.currentStreak} day streak</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    You're on an amazing streak! Keep going to unlock more achievements.
                                </p>
                            </section>
                        )}

                        {/* Learning Tip */}
                        <section className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-gray-600" strokeWidth={2} />
                                <h3 className="font-semibold text-gray-900">Daily Tip</h3>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Spaced repetition is most effective when you review material just before you're about to forget it. Study your due flashcards daily for best results.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;