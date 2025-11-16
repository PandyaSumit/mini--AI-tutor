import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Sparkles,
    Loader,
    CheckCircle,
    AlertCircle,
    BookOpen,
    Target,
    Clock,
    Users,
    TrendingUp,
    XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CreateCourse = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Steps: 1=Input, 2=SimilarCourses, 3=Preview, 4=Generating, 5=Success
    const [step, setStep] = useState(1);
    const [prompt, setPrompt] = useState('');
    const [level, setLevel] = useState('beginner');
    const [numModules, setNumModules] = useState(5);
    const [lessonsPerModule, setLessonsPerModule] = useState(4);
    const [similarCourses, setSimilarCourses] = useState([]);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [generatedCourse, setGeneratedCourse] = useState(null);

    const handleCheckSimilar = async () => {
        if (!prompt.trim()) {
            setError('Please describe what you want to learn');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await api.post('/api/courses/check-similar', {
                prompt,
                level
            });

            setSimilarCourses(response.data.data.similarCourses);

            // If no similar courses or low similarity, skip to preview
            if (response.data.data.similarCourses.length === 0) {
                handleGeneratePreview();
            } else {
                setStep(2); // Show similar courses
                setLoading(false);
            }
        } catch (err) {
            console.error('Error checking similar courses:', err);
            // On error, proceed to preview anyway
            handleGeneratePreview();
        }
    };

    const handleGeneratePreview = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.post('/api/courses/generate/preview', {
                prompt,
                level,
                numModules
            });

            setPreview(response.data.data);
            setStep(3);
            setLoading(false);
        } catch (err) {
            console.error('Error generating preview:', err);
            setError(err.response?.data?.error || 'Failed to generate preview');
            setLoading(false);
        }
    };

    const handleGenerateCourse = async () => {
        try {
            setLoading(true);
            setError(null);
            setStep(4);

            const response = await api.post('/api/courses/generate', {
                prompt,
                level,
                numModules,
                lessonsPerModule
            });

            setGeneratedCourse(response.data.data);
            setSuccess(true);
            setStep(5);
            setLoading(false);
        } catch (err) {
            console.error('Error generating course:', err);
            setError(err.response?.data?.error || 'Failed to generate course');
            setLoading(false);
            setStep(3);
        }
    };

    const handlePublish = async () => {
        try {
            await api.post(`/api/courses/${generatedCourse._id}/publish`);
            navigate(`/courses/${generatedCourse._id}`);
        } catch (err) {
            console.error('Error publishing course:', err);
            alert('Failed to publish course');
        }
    };

    const handleEnroll = async (courseId) => {
        try {
            await api.post(`/api/courses/${courseId}/enroll`);
            navigate(`/courses/${courseId}`);
        } catch (err) {
            console.error('Error enrolling:', err);
            alert(err.response?.data?.error || 'Failed to enroll in course');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <button
                        onClick={() => navigate('/courses')}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Courses</span>
                    </button>

                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Create Course with AI
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Describe what you want to learn, and AI will create a complete course for you
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Step 1: Input Form */}
                {step === 1 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            What do you want to learn?
                        </h2>

                        {/* Prompt Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Describe your learning goal
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Example: I want to learn Python programming for beginners, covering variables, functions, and object-oriented programming"
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Level Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Difficulty Level
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                                    <button
                                        key={lvl}
                                        onClick={() => setLevel(lvl)}
                                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                                            level === lvl
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Number of Modules */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Number of Modules
                            </label>
                            <input
                                type="number"
                                value={numModules}
                                onChange={(e) =>
                                    setNumModules(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))
                                }
                                min="1"
                                max="10"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Recommended: 5 modules (1-10 allowed)
                            </p>
                        </div>

                        {/* Lessons per Module */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Lessons per Module
                            </label>
                            <input
                                type="number"
                                value={lessonsPerModule}
                                onChange={(e) =>
                                    setLessonsPerModule(Math.max(1, Math.min(8, parseInt(e.target.value) || 4)))
                                }
                                min="1"
                                max="8"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Recommended: 4 lessons (1-8 allowed)
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Continue Button */}
                        <button
                            onClick={handleCheckSimilar}
                            disabled={loading || !prompt.trim()}
                            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    <span>Checking for similar courses...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    <span>Continue</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 2: Similar Courses Found */}
                {step === 2 && similarCourses.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-2">
                                <TrendingUp className="w-6 h-6 text-orange-500" />
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Similar Courses Found!
                                </h2>
                            </div>
                            <p className="text-gray-600">
                                We found {similarCourses.length} existing course{similarCourses.length > 1 ? 's' : ''} similar to what you're looking for.
                                Consider enrolling in one of these high-quality courses instead of creating a duplicate.
                            </p>
                        </div>

                        {/* Similar Courses List */}
                        <div className="space-y-4 mb-6">
                            {similarCourses.map((course) => (
                                <div
                                    key={course._id}
                                    className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {course.title}
                                                </h3>
                                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                                                    {course.similarityScore}% Match
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {course.description}
                                            </p>
                                            <p className="text-xs text-gray-500 italic">
                                                Why similar: {course.similarityReason}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <div className="flex items-center space-x-1">
                                                <BookOpen className="w-4 h-4" />
                                                <span>{course.statistics.totalLessons} lessons</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Users className="w-4 h-4" />
                                                <span>{course.statistics.enrollmentCount} students</span>
                                            </div>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                                                {course.level}
                                            </span>
                                        </div>

                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => navigate(`/courses/${course._id}`)}
                                                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => handleEnroll(course._id)}
                                                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                Enroll Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Options */}
                        <div className="border-t border-gray-200 pt-6">
                            <p className="text-sm text-gray-600 mb-4">
                                None of these courses match your needs? You can still create your own course.
                            </p>
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Back to Edit
                                </button>
                                <button
                                    onClick={handleGeneratePreview}
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            <span>Loading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            <span>Create New Course Anyway</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Preview */}
                {step === 3 && preview && !success && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {preview.title}
                        </h2>
                        <p className="text-gray-600 mb-6">{preview.description}</p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center space-x-2 text-sm">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                <span className="text-gray-600">
                                    {numModules} modules, {numModules * lessonsPerModule} lessons
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <Clock className="w-5 h-5 text-purple-600" />
                                <span className="text-gray-600">
                                    ~{preview.estimatedDuration || numModules * lessonsPerModule * 15} minutes
                                </span>
                            </div>
                        </div>

                        {preview.modulesTitles && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    Course Modules:
                                </h3>
                                <ul className="space-y-2">
                                    {preview.modulesTitles.map((title, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-start space-x-2 text-gray-700"
                                        >
                                            <span className="font-semibold text-blue-600">
                                                {idx + 1}.
                                            </span>
                                            <span>{title}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex space-x-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Back to Edit
                            </button>
                            <button
                                onClick={handleGenerateCourse}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                <Sparkles className="w-5 h-5" />
                                <span>Generate Full Course</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Generating */}
                {step === 4 && loading && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <Loader className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Generating Your Course...
                        </h2>
                        <p className="text-gray-600">
                            AI is creating {numModules} modules with {lessonsPerModule} lessons each. This may take 30-60 seconds.
                        </p>
                    </div>
                )}

                {/* Step 5: Success */}
                {step === 5 && success && generatedCourse && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <div className="text-center mb-6">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Course Created Successfully!
                            </h2>
                            <p className="text-gray-600">
                                Your AI-generated course is ready to publish
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {generatedCourse.title}
                            </h3>
                            <p className="text-gray-700 mb-4">{generatedCourse.description}</p>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-white rounded-lg p-3">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {generatedCourse.statistics?.totalModules || numModules}
                                    </p>
                                    <p className="text-sm text-gray-600">Modules</p>
                                </div>
                                <div className="bg-white rounded-lg p-3">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {generatedCourse.statistics?.totalLessons || numModules * lessonsPerModule}
                                    </p>
                                    <p className="text-sm text-gray-600">Lessons</p>
                                </div>
                                <div className="bg-white rounded-lg p-3">
                                    <p className="text-2xl font-bold text-green-600">
                                        {Math.ceil((generatedCourse.statistics?.totalDuration || 0) / 60)}h
                                    </p>
                                    <p className="text-sm text-gray-600">Duration</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={() => navigate(`/courses/${generatedCourse._id}`)}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Review Course
                            </button>
                            <button
                                onClick={handlePublish}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold flex items-center justify-center space-x-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                <span>Publish Course</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateCourse;
