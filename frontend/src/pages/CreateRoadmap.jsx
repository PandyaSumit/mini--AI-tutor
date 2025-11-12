import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roadmapService } from '../services/roadmapService';
import { Target, Clock, Calendar, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

const CreateRoadmap = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    goal: '',
    currentLevel: 'intermediate',
    weeklyTimeCommitment: 10,
    targetDate: '',
    preferredLearningModes: ['text', 'hands-on']
  });

  const levels = [
    { value: 'novice', label: 'Beginner', description: 'Just starting out' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced learner' }
  ];

  const learningModes = [
    { value: 'video', label: 'Video', icon: '🎥' },
    { value: 'text', label: 'Reading', icon: '📖' },
    { value: 'hands-on', label: 'Practice', icon: '⚡' },
    { value: 'interactive', label: 'Interactive', icon: '🎮' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleLearningMode = (mode) => {
    setFormData(prev => ({
      ...prev,
      preferredLearningModes: prev.preferredLearningModes.includes(mode)
        ? prev.preferredLearningModes.filter(m => m !== mode)
        : [...prev.preferredLearningModes, mode]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await roadmapService.generateRoadmap(formData);
      navigate(`/roadmaps/${response.data.roadmap._id}`);
    } catch (error) {
      console.error('Error creating roadmap:', error);
      alert(error.response?.data?.message || 'Failed to create roadmap');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Learning Path
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Create Your Personalized Roadmap
          </h1>
          <p className="text-gray-600 text-lg">
            Let's design a learning path tailored to your goals and schedule
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    i === step
                      ? 'bg-primary-600 text-white scale-110'
                      : i < step
                      ? 'bg-primary-200 text-primary-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i}
                </div>
                {i < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-all ${
                      i < step ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Your Goal</span>
            <span>Experience</span>
            <span>Preferences</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card">
          {/* Step 1: Goal */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                  <Target className="w-5 h-5 text-primary-600" />
                  What do you want to learn?
                </label>
                <textarea
                  value={formData.goal}
                  onChange={(e) => handleChange('goal', e.target.value)}
                  className="input-field min-h-32 text-lg"
                  placeholder="e.g., Become a full-stack developer, Master data science, Learn Spanish fluently..."
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Be specific about your learning goal. This helps us create a better roadmap for you.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Experience & Time */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <label className="text-lg font-semibold text-gray-900 mb-4 block">
                  What's your current level?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {levels.map(level => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => handleChange('currentLevel', level.value)}
                      className={`p-6 border-2 rounded-xl text-left transition-all ${
                        formData.currentLevel === level.value
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-lg text-gray-900 mb-1">
                        {level.label}
                      </div>
                      <div className="text-sm text-gray-600">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                  <Clock className="w-5 h-5 text-primary-600" />
                  Weekly time commitment
                </label>
                <div className="flex items-center gap-6">
                  <input
                    type="range"
                    min="2"
                    max="40"
                    value={formData.weeklyTimeCommitment}
                    onChange={(e) => handleChange('weeklyTimeCommitment', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="text-3xl font-bold text-primary-600 min-w-24 text-center">
                    {formData.weeklyTimeCommitment} hrs
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Hours per week you can dedicate to learning
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  Target completion date (optional)
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => handleChange('targetDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* Step 3: Learning Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="text-lg font-semibold text-gray-900 mb-4 block">
                  How do you prefer to learn?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {learningModes.map(mode => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => toggleLearningMode(mode.value)}
                      className={`p-6 border-2 rounded-xl text-center transition-all ${
                        formData.preferredLearningModes.includes(mode.value)
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">{mode.icon}</div>
                      <div className="font-medium text-gray-900">{mode.label}</div>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Select all that apply. We'll prioritize these in your roadmap.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={step === 1 && !formData.goal}
                className="btn-primary flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 px-8"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Roadmap
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoadmap;
