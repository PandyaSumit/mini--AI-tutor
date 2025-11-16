import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    BookOpen,
    Users,
    Clock,
    Star,
    TrendingUp,
    ChevronRight,
    Loader,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CourseCatalog = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');

    const categories = [
        { value: 'all', label: 'All Categories' },
        { value: 'programming', label: 'Programming' },
        { value: 'mathematics', label: 'Mathematics' },
        { value: 'science', label: 'Science' },
        { value: 'language', label: 'Language' },
        { value: 'business', label: 'Business' },
        { value: 'design', label: 'Design' }
    ];

    const levels = [
        { value: 'all', label: 'All Levels' },
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
    ];

    // Fetch courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const params = {};

                if (searchTerm) params.search = searchTerm;
                if (selectedCategory !== 'all') params.category = selectedCategory;
                if (selectedLevel !== 'all') params.level = selectedLevel;

                const response = await api.get('/api/courses', { params });
                setCourses(response.data.data || []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching courses:', err);
                setError('Failed to load courses');
                setLoading(false);
            }
        };

        fetchCourses();
    }, [searchTerm, selectedCategory, selectedLevel]);

    const handleEnroll = async (courseId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            await api.post(`/api/courses/${courseId}/enroll`);
            navigate(`/courses/${courseId}`);
        } catch (err) {
            console.error('Error enrolling in course:', err);
            alert(err.response?.data?.error || 'Failed to enroll in course');
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'beginner':
                return 'bg-green-100 text-green-700';
            case 'intermediate':
                return 'bg-yellow-100 text-yellow-700';
            case 'advanced':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'programming':
                return '💻';
            case 'mathematics':
                return '🔢';
            case 'science':
                return '🔬';
            case 'language':
                return '🗣️';
            case 'business':
                return '💼';
            case 'design':
                return '🎨';
            default:
                return '📚';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Course Catalog</h1>
                            <p className="text-gray-600 mt-1">
                                Explore our collection of AI-powered learning courses
                            </p>
                        </div>
                        {user && (
                            <button
                                onClick={() => navigate('/my-courses')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                My Courses
                            </button>
                        )}
                    </div>

                    {/* Search and Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Search */}
                        <div className="md:col-span-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="md:col-span-3">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Level Filter */}
                        <div className="md:col-span-3">
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {levels.map((level) => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">Loading courses...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600">{error}</p>
                        </div>
                    </div>
                ) : courses.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">No courses found</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Try adjusting your search or filters
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div
                                key={course._id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                                onClick={() => navigate(`/courses/${course._id}`)}
                            >
                                {/* Thumbnail */}
                                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-6xl">
                                            {getCategoryIcon(course.category)}
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(
                                                course.level
                                            )}`}
                                        >
                                            {course.level}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-sm text-gray-500 capitalize">
                                            {course.category}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                        {course.title}
                                    </h3>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {course.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                                        <div className="flex items-center space-x-1">
                                            <BookOpen className="w-4 h-4" />
                                            <span>
                                                {course.statistics.totalLessons} lessons
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Users className="w-4 h-4" />
                                            <span>
                                                {course.statistics.enrollmentCount} students
                                            </span>
                                        </div>
                                    </div>

                                    {/* Instructor */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs font-semibold">
                                                    {course.instructor?.name?.[0] || 'T'}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-600">
                                                {course.instructor?.name || 'Instructor'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEnroll(course._id);
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-1"
                                        >
                                            <span>Enroll</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseCatalog;
