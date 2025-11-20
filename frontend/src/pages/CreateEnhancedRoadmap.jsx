import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateEnhancedRoadmap = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    goal: '',
    userDeclaredLevel: 'beginner',
    weeklyTimeCommitment: 10,
    targetCompletionDate: '',
    preferences: {
      learningStyle: 'mixed',
      pacePreference: 'moderate',
      contentTypes: ['video', 'text', 'hands-on']
    },
    priorExperience: []
  });

  const [priorExpInput, setExpInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/enhanced-roadmaps/generate`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Navigate to the roadmap detail page
        navigate(`/enhanced-roadmap/${response.data.roadmap._id}`);
      }
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError(err.response?.data?.message || 'Failed to generate roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addPriorExperience = () => {
    if (priorExpInput.trim()) {
      setFormData({
        ...formData,
        priorExperience: [...formData.priorExperience, priorExpInput.trim()]
      });
      setExpInput('');
    }
  };

  const removePriorExperience = (index) => {
    const updated = formData.priorExperience.filter((_, i) => i !== index);
    setFormData({ ...formData, priorExperience: updated });
  };

  const toggleContentType = (type) => {
    const currentTypes = formData.preferences.contentTypes;
    const updated = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];

    setFormData({
      ...formData,
      preferences: { ...formData.preferences, contentTypes: updated }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Learning Roadmap
            </h1>
            <p className="text-gray-600">
              Generate a personalized, deeply structured learning roadmap with AI-powered skill detection
              and adaptive learning paths.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Learning Goal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Learning Goal *
              </label>
              <textarea
                required
                rows={3}
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="E.g., Master full-stack web development, Learn machine learning, Become a data scientist..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Be specific about what you want to learn or achieve
              </p>
            </div>

            {/* Skill Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Current Skill Level *
              </label>
              <select
                required
                value={formData.userDeclaredLevel}
                onChange={(e) => setFormData({ ...formData, userDeclaredLevel: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer"
              >
                <option value="absolute_beginner">Absolute Beginner - No prior knowledge</option>
                <option value="beginner">Beginner - Basic understanding</option>
                <option value="intermediate">Intermediate - Comfortable with fundamentals</option>
                <option value="advanced">Advanced - Strong understanding</option>
                <option value="expert">Expert - Deep expertise</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Don't worry - we'll analyze your chat history to verify and adjust this automatically
              </p>
            </div>

            {/* Time Commitment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Weekly Time Commitment (hours) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="40"
                value={formData.weeklyTimeCommitment}
                onChange={(e) => setFormData({ ...formData, weeklyTimeCommitment: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">1-4 hrs: Casual learner</span>
                <span className="text-gray-500">5-10 hrs: Steady progress</span>
                <span className="text-gray-500">15+ hrs: Intensive learning</span>
              </div>
            </div>

            {/* Target Completion Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Completion Date (Optional)
              </label>
              <input
                type="date"
                value={formData.targetCompletionDate}
                onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave blank for a flexible timeline based on your pace
              </p>
            </div>

            {/* Prior Experience */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prior Experience & Related Skills
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={priorExpInput}
                  onChange={(e) => setExpInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPriorExperience();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="E.g., JavaScript, Python, Database design..."
                />
                <button
                  type="button"
                  onClick={addPriorExperience}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.priorExperience.map((exp, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    {exp}
                    <button
                      type="button"
                      onClick={() => removePriorExperience(index)}
                      className="text-indigo-500 hover:text-indigo-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                This helps us create a more personalized roadmap
              </p>
            </div>

            {/* Learning Preferences */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Preferences</h3>

              {/* Learning Style */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Learning Style
                </label>
                <select
                  value={formData.preferences.learningStyle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, learningStyle: e.target.value }
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer"
                >
                  <option value="visual">Visual - Learn best through diagrams and videos</option>
                  <option value="auditory">Auditory - Learn best through listening</option>
                  <option value="kinesthetic">Kinesthetic - Learn best through doing</option>
                  <option value="reading-writing">Reading/Writing - Learn best through text</option>
                  <option value="mixed">Mixed - Combination of all styles</option>
                </select>
              </div>

              {/* Pace Preference */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pace Preference
                </label>
                <select
                  value={formData.preferences.pacePreference}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, pacePreference: e.target.value }
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer"
                >
                  <option value="slow">Slow - Extra time for concepts to sink in</option>
                  <option value="moderate">Moderate - Balanced pace</option>
                  <option value="fast">Fast - Accelerated learning</option>
                </select>
              </div>

              {/* Content Types */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Preferred Content Types
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['video', 'text', 'hands-on', 'interactive', 'audio'].map((type) => (
                    <label
                      key={type}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.preferences.contentTypes.includes(type)
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.preferences.contentTypes.includes(type)}
                        onChange={() => toggleContentType(type)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3"
                      />
                      <span className={`capitalize font-medium text-sm ${
                        formData.preferences.contentTypes.includes(type)
                          ? 'text-indigo-700'
                          : 'text-gray-700'
                      }`}>
                        {type}
                      </span>
                      {formData.preferences.contentTypes.includes(type) && (
                        <svg className="w-5 h-5 text-indigo-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-lg text-white font-semibold text-lg transition ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating Your Personalized Roadmap...
                  </span>
                ) : (
                  'Generate My Learning Roadmap'
                )}
              </button>
              <p className="mt-3 text-center text-sm text-gray-500">
                This may take 30-60 seconds as we analyze your profile and create a comprehensive roadmap
              </p>
            </div>
          </form>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-indigo-600 text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-1">AI-Powered</h3>
            <p className="text-sm text-gray-600">
              Analyzes your chat history to detect your actual skill level
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-indigo-600 text-2xl mb-2">📚</div>
            <h3 className="font-semibold text-gray-900 mb-1">Deeply Structured</h3>
            <p className="text-sm text-gray-600">
              Phases → Modules → Sub-modules with quizzes and projects
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-indigo-600 text-2xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-1">Adaptive Learning</h3>
            <p className="text-sm text-gray-600">
              Automatically adjusts to your progress and performance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEnhancedRoadmap;
