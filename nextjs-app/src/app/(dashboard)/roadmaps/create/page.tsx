/**
 * Create Roadmap Page
 * AI-powered roadmap generation wizard
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { roadmapService } from '@/services/roadmap';
import {
  Target,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader,
  CheckCircle2,
  Video,
  BookOpen,
  Zap,
  Gamepad2,
} from 'lucide-react';

type Level = 'novice' | 'intermediate' | 'advanced';
type LearningMode = 'video' | 'text' | 'hands-on' | 'interactive';

interface FormData {
  goal: string;
  currentLevel: Level;
  weeklyTimeCommitment: number;
  targetDate: string;
  preferredLearningModes: LearningMode[];
}

export default function CreateRoadmapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    goal: '',
    currentLevel: 'intermediate',
    weeklyTimeCommitment: 10,
    targetDate: '',
    preferredLearningModes: ['text', 'hands-on'],
  });

  const levels = [
    { value: 'novice' as Level, label: 'Beginner', description: 'Just starting out' },
    { value: 'intermediate' as Level, label: 'Intermediate', description: 'Some experience' },
    { value: 'advanced' as Level, label: 'Advanced', description: 'Experienced learner' },
  ];

  const learningModes = [
    { value: 'video' as LearningMode, label: 'Video', icon: Video },
    { value: 'text' as LearningMode, label: 'Reading', icon: BookOpen },
    { value: 'hands-on' as LearningMode, label: 'Practice', icon: Zap },
    { value: 'interactive' as LearningMode, label: 'Interactive', icon: Gamepad2 },
  ];

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleLearningMode = (mode: LearningMode) => {
    setFormData((prev) => ({
      ...prev,
      preferredLearningModes: prev.preferredLearningModes.includes(mode)
        ? prev.preferredLearningModes.filter((m) => m !== mode)
        : [...prev.preferredLearningModes, mode],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await roadmapService.generateRoadmap(formData);
      router.push(`/roadmaps/${response._id}`);
    } catch (error) {
      console.error('Error creating roadmap:', error);
      alert('Failed to create roadmap');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const steps = [
    { number: 1, label: 'Your Goal' },
    { number: 2, label: 'Experience' },
    { number: 3, label: 'Preferences' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8 lg:py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-gray-600" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium text-gray-600">AI-Powered Learning Path</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Create Your Roadmap
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Let&apos;s design a personalized learning path for your goals
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8 lg:py-10">
        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all mb-2 ${
                      s.number === step
                        ? 'bg-gray-900 text-white'
                        : s.number < step
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {s.number < step ? (
                      <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
                    ) : (
                      s.number
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      s.number === step ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-all ${
                      s.number < step ? 'bg-gray-900' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-8">
          {/* Step 1: Goal */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                  <Target className="w-5 h-5 text-gray-600" strokeWidth={2} />
                  What do you want to learn?
                </label>
                <textarea
                  value={formData.goal}
                  onChange={(e) => handleChange('goal', e.target.value)}
                  className="w-full px-4 py-3 min-h-32 text-[15px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white resize-none"
                  placeholder="e.g., Become a full-stack developer, Master data science, Learn Spanish fluently..."
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Be specific about your learning goal to get a better roadmap
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Experience & Time */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <label className="text-lg font-semibold text-gray-900 mb-4 block">
                  What&apos;s your current level?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {levels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => handleChange('currentLevel', level.value)}
                      className={`p-5 border rounded-xl text-left transition-all ${
                        formData.currentLevel === level.value
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-base text-gray-900 mb-1">
                        {level.label}
                      </div>
                      <div className="text-sm text-gray-600">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                  <Clock className="w-5 h-5 text-gray-600" strokeWidth={2} />
                  Weekly time commitment
                </label>
                <div className="flex items-center gap-6">
                  <input
                    type="range"
                    min="2"
                    max="40"
                    value={formData.weeklyTimeCommitment}
                    onChange={(e) => handleChange('weeklyTimeCommitment', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gray-900 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                  />
                  <div className="text-3xl font-bold text-gray-900 min-w-[100px] text-center">
                    {formData.weeklyTimeCommitment}{' '}
                    <span className="text-lg text-gray-500">hrs</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Hours per week you can dedicate to learning
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600" strokeWidth={2} />
                  Target completion date{' '}
                  <span className="text-sm font-normal text-gray-500">(optional)</span>
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => handleChange('targetDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 text-[15px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 bg-white"
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
                  {learningModes.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = formData.preferredLearningModes.includes(mode.value);
                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => toggleLearningMode(mode.value)}
                        className={`p-6 border rounded-xl text-center transition-all relative ${
                          isSelected
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                          </div>
                        )}
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                            isSelected ? 'bg-gray-900' : 'bg-gray-100'
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`}
                            strokeWidth={2}
                          />
                        </div>
                        <div className="font-medium text-gray-900 text-sm">{mode.label}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Select all that apply. We&apos;ll prioritize these in your roadmap.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              Previous
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={step === 1 && !formData.goal}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                Next
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" strokeWidth={2} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" strokeWidth={2} />
                    Generate Roadmap
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            This usually takes 10-15 seconds. We&apos;re analyzing your goals and creating a
            personalized roadmap.
          </p>
        </div>
      </div>
    </div>
  );
}
