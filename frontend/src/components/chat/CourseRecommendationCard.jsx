import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users, ChevronRight } from 'lucide-react';

/**
 * CourseRecommendationCard - Displays course recommendations in AI chat
 * Shows when user asks learning-related questions
 */
const CourseRecommendationCard = ({ course }) => {
  const navigate = useNavigate();

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => navigate(course.url)}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors flex-1">
          {course.title}
        </h4>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {course.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{course.lessonsCount} lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration}h</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.enrollmentCount}</span>
          </div>
        </div>

        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(course.level)}`}>
          {course.level}
        </span>
      </div>

      {course.instructor && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            by <span className="font-medium">{course.instructor}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseRecommendationCard;
