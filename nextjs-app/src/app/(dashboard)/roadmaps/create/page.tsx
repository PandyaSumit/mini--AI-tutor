/**
 * Create Roadmap Page
 * AI-powered roadmap generation wizard
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { roadmapService } from "@/services/roadmap";
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
} from "lucide-react";

type Level = "novice" | "intermediate" | "advanced";
type LearningMode = "video" | "text" | "hands-on" | "interactive";

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
    goal: "",
    currentLevel: "intermediate",
    weeklyTimeCommitment: 10,
    targetDate: "",
    preferredLearningModes: ["text", "hands-on"],
  });

  const levels = [
    { value: "novice" as Level, label: "Beginner", description: "Just starting out" },
    { value: "intermediate" as Level, label: "Intermediate", description: "Some experience" },
    { value: "advanced" as Level, label: "Advanced", description: "Experienced learner" },
  ];

  const learningModes = [
    { value: "video" as LearningMode, label: "Video", icon: Video },
    { value: "text" as LearningMode, label: "Reading", icon: BookOpen },
    { value: "hands-on" as LearningMode, label: "Practice", icon: Zap },
    { value: "interactive" as LearningMode, label: "Interactive", icon: Gamepad2 },
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
      console.error("Error creating roadmap:", error);
      alert("Failed to create roadmap");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const steps = [
    { number: 1, label: "Your goal" },
    { number: 2, label: "Experience" },
    { number: 3, label: "Preferences" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121]">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#2a2a2a] bg-gradient-to-b from-slate-50 to-white dark:from-[#1a1a1a] dark:to-[#212121]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#2a2a2a] bg-white/80 dark:bg-[#1a1a1a]/90 px-3 py-1">
              <Sparkles className="w-4 h-4 text-slate-700 dark:text-[#f5f5f5]" />
              <span className="text-[11px] font-medium text-slate-600 dark:text-[#c2c2c2]">
                AI-powered learning path
              </span>
            </div>
            <h1 className="text-3xl lg:text-[2.1rem] font-semibold tracking-tight text-slate-900 dark:text-[#f5f5f5]">
              Create your roadmap
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-[#c2c2c2] max-w-xl mx-auto">
              Tell us about your goals and we&apos;ll design a focused learning path for you.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Stepper */}
        <div className="mb-8 sm:mb-10">
          <div className="mx-auto max-w-xl rounded-full border border-slate-200 dark:border-[#2a2a2a] bg-white/80 dark:bg-[#1a1a1a]/90 px-3 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              {steps.map((s, idx) => {
                const isActive = s.number === step;
                const isDone = s.number < step;
                return (
                  <div
                    key={s.number}
                    className="flex-1 flex items-center gap-2 last:flex-none last:w-auto"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold border transition-all
                          ${
                            isActive
                              ? "bg-slate-900 text-white border-slate-900 dark:bg-[#f5f5f5] dark:text-[#212121] dark:border-[#f5f5f5]"
                              : isDone
                              ? "bg-slate-900/5 text-slate-900 border-slate-300 dark:bg-[#2a2a2a] dark:text-[#f5f5f5] dark:border-[#3a3a3a]"
                              : "bg-transparent text-slate-400 border-slate-200 dark:text-[#7a7a7a] dark:border-[#2a2a2a]"
                          }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          s.number
                        )}
                      </div>
                      <span
                        className={`hidden sm:inline-block text-[11px] font-medium truncate
                          ${
                            isActive
                              ? "text-slate-900 dark:text-[#f5f5f5]"
                              : "text-slate-500 dark:text-[#a8a8a8]"
                          }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`hidden sm:block h-px flex-1 rounded-full
                          ${
                            s.number < step
                              ? "bg-slate-900 dark:bg-[#f5f5f5]"
                              : "bg-slate-200 dark:bg-[#2a2a2a]"
                          }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        >
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-900 dark:text-[#f5f5f5] mb-3">
                  <Target className="w-5 h-5 text-slate-600 dark:text-[#e0e0e0]" />
                  What do you want to learn?
                </label>
                <textarea
                  value={formData.goal}
                  onChange={(e) => handleChange("goal", e.target.value)}
                  className="w-full px-4 py-3 min-h-32 text-[15px] rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] text-slate-900 dark:text-[#f5f5f5] placeholder:text-slate-400 dark:placeholder:text-[#7a7a7a] focus:outline-none focus:ring-2 focus:ring-slate-900/80 dark:focus:ring-[#f5f5f5]/70 focus:border-transparent transition-all resize-none"
                  placeholder="e.g., Become a full-stack developer, master data structures, learn system design, crack FAANG interviews..."
                  required
                />
                <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-[#bdbdbd]">
                  Be specific and include timeframe or outcome if possible (e.g., &quot;crack
                  interviews in 4 months&quot;).
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <label className="text-base sm:text-lg font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4 block">
                  What&apos;s your current level?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {levels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => handleChange("currentLevel", level.value)}
                      className={`p-4 sm:p-5 rounded-xl text-left border transition-all
                        ${
                          formData.currentLevel === level.value
                            ? "border-slate-900 bg-slate-50 dark:border-[#f5f5f5] dark:bg-[#202020]"
                            : "border-slate-200 bg-white dark:border-[#2a2a2a] dark:bg-[#151515] hover:border-slate-900 dark:hover:border-[#f5f5f5] hover:bg-slate-50 dark:hover:bg-[#202020]"
                        }`}
                    >
                      <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-[#f5f5f5] mb-1">
                        {level.label}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-[#c2c2c2]">
                        {level.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4">
                  <Clock className="w-5 h-5 text-slate-600 dark:text-[#e0e0e0]" />
                  Weekly time commitment
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <input
                    type="range"
                    min="2"
                    max="40"
                    value={formData.weeklyTimeCommitment}
                    onChange={(e) =>
                      handleChange("weeklyTimeCommitment", parseInt(e.target.value))
                    }
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-[#2a2a2a]
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-5
                      [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-slate-900
                      dark:[&::-webkit-slider-thumb]:bg-[#f5f5f5]
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-5
                      [&::-moz-range-thumb]:h-5
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-slate-900
                      dark:[&::-moz-range-thumb]:bg-[#f5f5f5]
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:cursor-pointer"
                  />
                  <div className="text-center min-w-[96px]">
                    <div className="text-3xl font-semibold text-slate-900 dark:text-[#f5f5f5]">
                      {formData.weeklyTimeCommitment}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                      hours / week
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-[#bdbdbd]">
                  Hours per week you can dedicate to learning.
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-900 dark:text-[#f5f5f5] mb-3">
                  <Calendar className="w-5 h-5 text-slate-600 dark:text-[#e0e0e0]" />
                  Target completion date{" "}
                  <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-[#a8a8a8]">
                    (optional)
                  </span>
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => handleChange("targetDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 text-[15px] rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] text-slate-900 dark:text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-slate-900/80 dark:focus:ring-[#f5f5f5]/70 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="text-base sm:text-lg font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4 block">
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
                        className={`relative p-5 sm:p-6 rounded-xl border text-center transition-all
                          ${
                            isSelected
                              ? "border-slate-900 bg-slate-50 dark:border-[#f5f5f5] dark:bg-[#202020]"
                              : "border-slate-200 bg-white dark:border-[#2a2a2a] dark:bg-[#151515] hover:border-slate-900 dark:hover:border-[#f5f5f5] hover:bg-slate-50 dark:hover:bg-[#202020]"
                          }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900 dark:bg-[#f5f5f5] flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white dark:text-[#212121]" />
                          </div>
                        )}
                        <div
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mx-auto mb-3
                            ${
                              isSelected
                                ? "bg-slate-900 dark:bg-[#f5f5f5]"
                                : "bg-slate-100 dark:bg-[#2a2a2a]"
                            }`}
                        >
                          <Icon
                            className={`w-5 h-5 sm:w-6 sm:h-6 ${
                              isSelected
                                ? "text-white dark:text-[#212121]"
                                : "text-slate-600 dark:text-[#e0e0e0]"
                            }`}
                          />
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-[#f5f5f5]">
                          {mode.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-[#bdbdbd]">
                  Select all that apply. We&apos;ll prioritize these in your roadmap.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1 || loading}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg border border-slate-200 dark:border-[#2a2a2a] text-xs sm:text-sm font-medium text-slate-900 dark:text-[#f5f5f5] bg-white dark:bg-[#1a1a1a] hover:border-slate-900 dark:hover:border-[#f5f5f5] hover:bg-slate-50 dark:hover:bg-[#222222] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={(step === 1 && !formData.goal) || loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] text-xs sm:text-sm font-medium hover:bg-black dark:hover:bg-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-7 sm:px-8 py-2.5 rounded-lg bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] text-xs sm:text-sm font-semibold hover:bg-black dark:hover:bg-white shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Generate Roadmap</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Helper text */}
        <div className="mt-6 text-center">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#bdbdbd]">
            Generation usually takes around 10–15 seconds while we analyze your goal and build a
            structured plan.
          </p>
        </div>
      </div>
    </div>
  );
}
