import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { roadmapService } from '../services/roadmapService';
import { useToast } from '../context/ToastContext';
import {
    Map,
    Plus,
    Clock,
    Target,
    Search,
    ChevronRight,
    Calendar,
    BookOpen,
    CheckCircle2,
    Play,
    Award,
    Sparkles
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
            const roadmapsData = Array.isArray(response.data.roadmaps) ? response.data.roadmaps : [];
            setRoadmaps(roadmapsData);
        } catch (error) {
            console.error('Error loading roadmaps:', error);
            toast.error('Failed to load roadmaps');
            setRoadmaps([]);
        } finally {
            setLoading(false);
        }
    };

    const filterRoadmaps = () => {
        let filtered = Array.isArray(roadmaps) ? roadmaps : [];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

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

    const getStatusCounts = () => {
        const roadmapsArray = Array.isArray(roadmaps) ? roadmaps : [];
        return {
            all: roadmapsArray.length,
            not_started: roadmapsArray.filter(r => r.status === 'not_started').length,
            in_progress: roadmapsArray.filter(r => r.status === 'in_progress').length,
            completed: roadmapsArray.filter(r => r.status === 'completed').length
        };
    };

    const RoadmapsSkeleton = () => (
        <div className="min-h-screen bg-white">
            <div className="border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-12">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-8 w-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
                            <div className="animate-pulse space-y-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                                <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                <div className="h-6 w-16 bg-gray-200 rounded"></div>
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
            value: statusCounts.all
        },
        {
            icon: Play,
            label: 'In Progress',
            value: statusCounts.in_progress
        },
        {
            icon: CheckCircle2,
            label: 'Completed',
            value: statusCounts.completed
        },
        {
            icon: Target,
            label: 'Not Started',
            value: statusCounts.not_started
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-100 bg-white">
                <div className="mx-auto px-4 lg:px-6 py-2">
                    <div className="flex items-center justify-between gap-3">

                        {/* Left */}
                        <div className="min-w-0">
                            <h1 className="truncate text-sm font-semibold text-gray-900">
                                My Roadmaps
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                Track your personalized learning journeys
                            </p>
                        </div>

                        {/* Right */}
                        <button
                            onClick={() => navigate("/roadmaps/create")}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-md transition active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2} />
                            <span className="hidden sm:inline">Create</span>
                        </button>

                    </div>
                </div>
            </div>


            <div className="mx-auto px-6 lg:px-8 py-8 lg:py-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                    {statCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 transition-all"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                                    <Icon className="w-5 h-5 text-gray-600" strokeWidth={2} />
                                </div>
                                <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
                            <input
                                type="text"
                                placeholder="Search roadmaps..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 text-[15px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                            />
                        </div>

                        {/* Status Filters */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'all', label: 'All', count: statusCounts.all },
                                { value: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
                                { value: 'not_started', label: 'Not Started', count: statusCounts.not_started },
                                { value: 'completed', label: 'Completed', count: statusCounts.completed }
                            ].map((filter) => (
                                <button
                                    key={filter.value}
                                    onClick={() => setStatusFilter(filter.value)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === filter.value
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <span>{filter.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusFilter === filter.value ? 'bg-white/20' : 'bg-gray-200'
                                        }`}>
                                        {filter.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Roadmaps Grid or Empty State */}
                {filteredRoadmaps.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Map className="w-8 h-8 text-gray-400" strokeWidth={2} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {roadmaps.length === 0 ? 'No roadmaps yet' : 'No roadmaps found'}
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {roadmaps.length === 0
                                ? 'Create your first personalized learning roadmap to achieve your goals'
                                : 'Try adjusting your search or filters'}
                        </p>
                        {roadmaps.length === 0 && (
                            <button
                                onClick={() => navigate('/roadmaps/create')}
                                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                            >
                                <Plus className="w-5 h-5" strokeWidth={2} />
                                Create Your First Roadmap
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredRoadmaps.map((roadmap) => {
                            const progress = getOverallProgress(roadmap);
                            return (
                                <Link
                                    key={roadmap._id}
                                    to={`/roadmaps/${roadmap._id}`}
                                    className="bg-white rounded-xl border border-gray-200 hover:border-gray-900 hover:bg-gray-50 p-6 transition-all group"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                                                    <Map className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" strokeWidth={2} />
                                                </div>
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                                    {roadmap.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                                                {roadmap.goal}
                                            </h3>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-3" strokeWidth={2} />
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-3 mb-5">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <Calendar className="w-4 h-4 text-gray-500 mb-1" strokeWidth={2} />
                                            <p className="text-xs text-gray-500 mb-0.5">Duration</p>
                                            <p className="text-base font-semibold text-gray-900">{roadmap.totalWeeks}w</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <Clock className="w-4 h-4 text-gray-500 mb-1" strokeWidth={2} />
                                            <p className="text-xs text-gray-500 mb-0.5">Weekly</p>
                                            <p className="text-base font-semibold text-gray-900">{roadmap.weeklyTimeCommitment}h</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <BookOpen className="w-4 h-4 text-gray-500 mb-1" strokeWidth={2} />
                                            <p className="text-xs text-gray-500 mb-0.5">Modules</p>
                                            <p className="text-base font-semibold text-gray-900">{roadmap.weeklyModules?.length || 0}</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700">Progress</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-semibold text-gray-900">{progress}%</span>
                                                {progress === 100 && (
                                                    <Award className="w-4 h-4 text-gray-600" strokeWidth={2} />
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gray-900 rounded-full transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer */}
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