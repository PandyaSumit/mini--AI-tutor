/**
 * Landing Page
 * Public home page for unauthenticated users
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Brain,
  Target,
  Zap,
  MessageSquare,
  Map,
  ArrowRight,
  Check,
  Star,
  TrendingUp,
  Shield,
  Play,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Learning',
    description: 'Adaptive study paths that evolve with your progress and learning style',
  },
  {
    icon: MessageSquare,
    title: 'Interactive Chat',
    description: 'Ask questions and get instant, contextual answers from our AI tutor',
  },
  {
    icon: Map,
    title: 'Smart Roadmaps',
    description: 'Structured learning plans with milestones and progress tracking',
  },
  {
    icon: Target,
    title: 'Goal Setting',
    description: 'Set targets and track your achievement with detailed analytics',
  },
  {
    icon: Zap,
    title: 'Flashcards',
    description: 'Generate and study with AI-powered spaced repetition flashcards',
  },
  {
    icon: TrendingUp,
    title: 'Progress Analytics',
    description: 'Visualize your growth with comprehensive performance insights',
  },
];

const benefits = [
  {
    title: 'Learn 10x Faster',
    description: 'AI-powered personalization adapts to your pace and style',
    stat: '10x',
    statLabel: 'faster learning',
  },
  {
    title: 'Retain 2x More',
    description: 'Scientifically-proven spaced repetition techniques',
    stat: '2x',
    statLabel: 'better retention',
  },
  {
    title: '95% Success Rate',
    description: 'Join thousands of learners achieving their goals',
    stat: '95%',
    statLabel: 'completion rate',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Computer Science Student',
    avatar: 'SC',
    content:
      'Mini AI Tutor helped me ace my algorithms course. The personalized roadmaps and instant feedback are game-changers.',
    rating: 5,
  },
  {
    name: 'Michael Rodriguez',
    role: 'Self-Taught Developer',
    avatar: 'MR',
    content:
      'I went from zero to landing my first developer job in 6 months. The structured learning path kept me focused and motivated.',
    rating: 5,
  },
  {
    name: 'Emily Watson',
    role: 'Medical Student',
    avatar: 'EW',
    content:
      'The flashcard feature with spaced repetition is perfect for medical school. I retain so much more information now.',
    rating: 5,
  },
];

const stats = [
  { value: '50,000+', label: 'Active Learners' },
  { value: '1M+', label: 'Study Sessions' },
  { value: '95%', label: 'Success Rate' },
  { value: '4.9/5', label: 'User Rating' },
];

const pricingFeatures = [
  'Unlimited AI conversations',
  'Personalized learning roadmaps',
  'Smart flashcard generation',
  'Progress tracking & analytics',
  'Mobile-friendly platform',
  'Community access',
];

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Scroll Reveal Animation Hook
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all elements with data-animate attribute
    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="pt-24 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div
              data-animate="fade"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" strokeWidth={2} />
              <span>AI-Powered Learning Platform</span>
            </div>

            {/* Headline */}
            <h1
              data-animate="slide-up"
              data-delay="100"
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Learn Smarter, Not Harder
            </h1>

            {/* Subheadline */}
            <p
              data-animate="slide-up"
              data-delay="200"
              className="text-xl text-gray-600 mb-10 leading-relaxed"
            >
              Transform your study sessions with AI-powered tutoring, personalized roadmaps,
              and interactive flashcards. Achieve your learning goals faster than ever before.
            </p>

            {/* CTA Buttons */}
            <div
              data-animate="slide-up"
              data-delay="300"
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                <span>Start Learning Free</span>
                <ArrowRight className="w-5 h-5" strokeWidth={2} />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl transition-all border-2 border-gray-200 active:scale-[0.98]"
              >
                <Play className="w-5 h-5" strokeWidth={2} />
                <span>See How It Works</span>
              </a>
            </div>

            {/* Stats */}
            <div
              data-animate="fade"
              data-delay="400"
              className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 data-animate="slide-up" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p data-animate="slide-up" data-delay="100" className="text-lg text-gray-600">
              Powerful AI tools designed to accelerate your learning journey
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  data-animate="scale"
                  data-delay={`${(index % 3) * 100}`}
                  className="p-8 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 data-animate="slide-up" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why learners choose us
            </h2>
            <p data-animate="slide-up" data-delay="100" className="text-lg text-gray-600">
              Experience the difference AI-powered learning makes
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                data-animate="slide-up"
                data-delay={`${index * 100}`}
                className="text-center p-8 rounded-2xl bg-gray-50 border border-gray-100"
              >
                {/* Stat */}
                <div className="mb-4">
                  <div className="text-5xl font-bold text-gray-900 mb-2">{benefit.stat}</div>
                  <div className="text-sm text-gray-600 uppercase tracking-wide">
                    {benefit.statLabel}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 data-animate="slide-up" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p data-animate="slide-up" data-delay="100" className="text-lg text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Your Account',
                description: 'Sign up for free and tell us about your learning goals and preferences',
              },
              {
                step: '02',
                title: 'Get Your Roadmap',
                description: 'Our AI creates a personalized learning path tailored to your objectives',
              },
              {
                step: '03',
                title: 'Start Learning',
                description: 'Study with AI guidance, track progress, and achieve your goals faster',
              },
            ].map((item, index) => (
              <div
                key={index}
                data-animate="slide-up"
                data-delay={`${index * 100}`}
                className="relative"
              >
                {/* Connector Line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gray-200 -z-10" />
                )}

                {/* Card */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100">
                  {/* Step Number */}
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white font-bold text-lg mb-5">
                    {item.step}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 data-animate="slide-up" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Loved by learners worldwide
            </h2>
            <p data-animate="slide-up" data-delay="100" className="text-lg text-gray-600">
              See what our community has to say about their learning journey
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                data-animate="slide-up"
                data-delay={`${index * 100}`}
                className="p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-all duration-300"
              >
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" strokeWidth={0} />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 mb-6 leading-relaxed">&quot;{testimonial.content}&quot;</p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 data-animate="slide-up" className="text-4xl font-bold text-gray-900 mb-4">
              Start learning for free
            </h2>
            <p data-animate="slide-up" data-delay="100" className="text-lg text-gray-600">
              No credit card required. Upgrade anytime.
            </p>
          </div>

          {/* Pricing Card */}
          <div
            data-animate="scale"
            data-delay="200"
            className="bg-white rounded-2xl border-2 border-gray-900 p-10"
          >
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-gray-900 mb-2">Free</div>
              <p className="text-gray-600">Forever. No hidden fees.</p>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-10">
              {pricingFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-gray-900" strokeWidth={3} />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/register"
              className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              Get Started Free
            </Link>

            {/* Trust Badge */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" strokeWidth={2} />
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 data-animate="slide-up" className="text-4xl font-bold text-gray-900 mb-6">
            Ready to transform your learning?
          </h2>
          <p data-animate="slide-up" data-delay="100" className="text-xl text-gray-600 mb-10">
            Join 50,000+ learners achieving their goals with AI-powered education
          </p>
          <Link
            href="/register"
            data-animate="slide-up"
            data-delay="200"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            <span>Start Learning Free</span>
            <ArrowRight className="w-5 h-5" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </div>
  );
}
