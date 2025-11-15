import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { roadmapService } from '../services/roadmapService';
import { useToast } from '../context/ToastContext';
import {
    Map,
    Plus,
    Clock,
    Target,
    TrendingUp,
    Search,
    ChevronRight,
    Calendar,
    BookOpen,
    Sparkles,
    CheckCircle2,
    Play,
    Award,
    Zap
} from 'lucide-react';

const MyRoadmaps = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [roadmaps, setRoadmaps] = useState([]);
    const [filteredRoadmaps, setFilteredRoadmaps] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadRoadmaps();
    }, []);

    useEffect(() => {
        filterRoadmaps();
    }, [searchTerm, statusFilter, roadmaps]);

    const loadRoadmaps = async () => {
        try {
            const response = await roadmapService.getRoadmaps();
            // Ensure we always set an array
            const roadmapsData = Array.isArray(response.data.roadmaps) ? response.data.roadmaps : [];
            setRoadmaps(roadmapsData);
        } catch (error) {
            console.error('Error loading roadmaps:', error);
            toast.error('Failed to load roadmaps');
            setRoadmaps([]); // Ensure roadmaps is an empty array on error
        } finally {
            setLoading(false);
        }
    };

    const filterRoadmaps = () => {
        // Ensure roadmaps is an array
        let filtered = Array.isArray(roadmaps) ? roadmaps : [];

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.goal?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredRoadmaps(filtered);
    };

    const getOverallProgress = (roadmap) => {
        if (!roadmap.weeklyModules || roadmap.weeklyModules.length === 0) return 0;
        const completed = roadmap.weeklyModules.filter(w => w.status === 'completed').length;
        return Math.round((completed / roadmap.weeklyModules.length) * 100);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700 border-green-300';
            case 'in_progress':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    const getStatusCounts = () => {
        // Ensure roadmaps is an array before filtering
        const roadmapsArray = Array.isArray(roadmaps) ? roadmaps : [];
        return {
            all: roadmapsArray.length,
            not_started: roadmapsArray.filter(r => r.status === 'not_started').length,
            in_progress: roadmapsArray.filter(r => r.status === 'in_progress').length,
            completed: roadmapsArray.filter(r => r.status === 'completed').length
        };
    };

    // Premium Loading Skeleton
    const RoadmapsSkeleton = () => (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Skeleton */}
            <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="animate-pulse space-y-4">
                        <div className="h-6 w-48 bg-green-500 rounded"></div>
                        <div className="h-10 w-64 bg-green-500 rounded"></div>
                    </div>
                </div>
            </div>
            {/* Stats Skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="animate-pulse space-y-3">
                                <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                <div className="h-8 w-16 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return <RoadmapsSkeleton />;
    }

    const statusCounts = getStatusCounts();

    const statCards = [
        {
            icon: Map,
            label: 'Total Roadmaps',
            value: statusCounts.all,
            color: 'gray',
            bgColor: 'bg-gray-100',
            iconColor: 'text-gray-600',
            textColor: 'text-gray-900'
        },
        {
            icon: Play,
            label: 'In Progress',
            value: statusCounts.in_progress,
            color: 'blue',
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600',
            textColor: 'text-blue-900'
        },
        {
            icon: CheckCircle2,
            label: 'Completed',
            value: statusCounts.completed,
            color: 'green',
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            textColor: 'text-green-900'
        },
        {
            icon: Target,
            label: 'Not Started',
            value: statusCounts.not_started,
            color: 'orange',
            bgColor: 'bg-orange-100',
            iconColor: 'text-orange-600',
            textColor: 'text-orange-900'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Premium Hero Header */}
            <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-700 text-white relative overflow-hidden">
                {/* Animated background decoration */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="animate-slide-up">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Map className="w-5 h-5 text-white" strokeWidth={2} />
                                </div>
                                <p className="text-green-100 font-medium">Personalized Learning Paths</p>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                                My Roadmaps
                            </h1>
                            <p className="text-green-100 text-lg leading-relaxed">
                                Track your learning journey with AI-generated roadmaps
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/roadmaps/create')}
                            className="bg-white text-green-700 px-6 py-3.5 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-2 justify-center shadow-lg active:scale-95 animate-slide-up"
                            style={{ animationDelay: '0.1s' }}
                        >
                            <Plus className="w-5 h-5" strokeWidth={2.5} />
                            <span className="hidden sm:inline">Create Roadmap</span>
                            <span className="sm:hidden">Create</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
                {/* Premium Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    {statCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group animate-slide-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor}`} strokeWidth={2} />
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">{stat.label}</p>
                                <p className={`text-2xl sm:text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Premium Filters and Search */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Premium Search */}
                        <div className="flex-1 relative">
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400" strokeWidth={2} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search roadmaps..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 hover:border-gray-300 shadow-sm"
                            />
                        </div>

                        {/* Premium Status Filter Pills */}
                        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                            {[
                                { value: 'all', label: 'All', count: statusCounts.all, icon: Map },
                                { value: 'in_progress', label: 'In Progress', count: statusCounts.in_progress, icon: Play },
                                { value: 'not_started', label: 'Not Started', count: statusCounts.not_started, icon: Target },
                                { value: 'completed', label: 'Completed', count: statusCounts.completed, icon: CheckCircle2 }
                            ].map((filter) => {
                                const Icon = filter.icon;
                                return (
                                    <button
                                        key={filter.value}
                                        onClick={() => setStatusFilter(filter.value)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 shadow-sm hover:shadow-md ${
                                            statusFilter === filter.value
                                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white scale-105'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" strokeWidth={2} />
                                        <span>{filter.label}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            statusFilter === filter.value ? 'bg-white/20' : 'bg-gray-200'
                                        }`}>
                                            {filter.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Roadmaps Grid or Empty State */}
                {filteredRoadmaps.length === 0 ? (
                    /* Premium Empty State */
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 sm:p-16 text-center animate-fade-in">
                        <div className="relative inline-block mb-6">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-2xl animate-scale-in">
                                <Map className="w-12 h-12 sm:w-14 sm:h-14 text-white" strokeWidth={2} />
                            </div>
                            {roadmaps.length === 0 && (
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-yellow-500 border-4 border-white flex items-center justify-center shadow-lg animate-pulse">
                                    <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                            )}
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                            {roadmaps.length === 0 ? 'Start Your Learning Journey' : 'No roadmaps found'}
                        </h3>
                        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                            {roadmaps.length === 0
                                ? 'Create your first personalized learning roadmap powered by AI to achieve your goals faster'
                                : 'Try adjusting your search or filters to find what you\'re looking for'}
                        </p>
                        {roadmaps.length === 0 && (
                            <button
                                onClick={() => navigate('/roadmaps/create')}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                            >
                                <Sparkles className="w-5 h-5" strokeWidth={2} />
                                <span>Create Your First Roadmap</span>
                            </button>
                        )}
                    </div>
                ) : (
                    /* Premium Roadmaps Grid */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredRoadmaps.map((roadmap, index) => {
                            const progress = getOverallProgress(roadmap);
                            return (
                                <Link
                                    key={roadmap._id}
                                    to={`/roadmaps/${roadmap._id}`}
                                    className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 hover:border-green-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group animate-slide-up"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                                    <Map className="w-6 h-6 text-white" strokeWidth={2} />
                                                </div>
                                                <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 capitalize ${getStatusColor(roadmap.status)} shadow-sm`}>
                                                    {roadmap.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2 leading-tight">
                                                {roadmap.goal}
                                            </h3>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-3" strokeWidth={2} />
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-3 mb-5">
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 group-hover:from-green-50 group-hover:to-emerald-50 transition-all">
                                            <Calendar className="w-4 h-4 text-gray-500 group-hover:text-green-600 mb-1.5 transition-colors" strokeWidth={2} />
                                            <p className="text-xs text-gray-500 mb-0.5 font-medium">Duration</p>
                                            <p className="text-lg font-bold text-gray-900">{roadmap.totalWeeks}w</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 group-hover:from-blue-50 group-hover:to-indigo-50 transition-all">
                                            <Clock className="w-4 h-4 text-gray-500 group-hover:text-blue-600 mb-1.5 transition-colors" strokeWidth={2} />
                                            <p className="text-xs text-gray-500 mb-0.5 font-medium">Weekly</p>
                                            <p className="text-lg font-bold text-gray-900">{roadmap.weeklyTimeCommitment}h</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 group-hover:from-purple-50 group-hover:to-pink-50 transition-all">
                                            <BookOpen className="w-4 h-4 text-gray-500 group-hover:text-purple-600 mb-1.5 transition-colors" strokeWidth={2} />
                                            <p className="text-xs text-gray-500 mb-0.5 font-medium">Modules</p>
                                            <p className="text-lg font-bold text-gray-900">{roadmap.weeklyModules?.length || 0}</p>
                                        </div>
                                    </div>

                                    {/* Premium Progress Bar */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-gray-700">Progress</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                    {progress}%
                                                </span>
                                                {progress === 100 && (
                                                    <Award className="w-4 h-4 text-green-600" strokeWidth={2} />
                                                )}
                                            </div>
                                        </div>
                                        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-700 rounded-full shadow-md"
                                                style={{ width: `${progress}%` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    {roadmap.createdAt && (
                                        <div className="mt-5 pt-4 border-t border-gray-100">
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                                                Created {new Date(roadmap.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyRoadmaps;
