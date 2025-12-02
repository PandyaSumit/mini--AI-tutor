'use client';

/**
 * About Us Page
 */

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Users,
  Target,
  Heart,
  TrendingUp,
  Award,
  Globe,
  Zap,
} from 'lucide-react';

export default function AboutPage() {
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

    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const values = [
    {
      icon: Heart,
      title: 'Student-Centric',
      description: 'Every decision we make prioritizes the learning experience and success of our students.',
    },
    {
      icon: Sparkles,
      title: 'Innovation',
      description: 'We leverage cutting-edge AI technology to transform how people learn and retain knowledge.',
    },
    {
      icon: Globe,
      title: 'Accessibility',
      description: 'Quality education should be accessible to everyone, anywhere, at any time.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We maintain the highest standards in course quality and educational outcomes.',
    },
  ];

  const stats = [
    { value: '50,000+', label: 'Active Learners' },
    { value: '500+', label: 'Courses' },
    { value: '100+', label: 'Expert Instructors' },
    { value: '95%', label: 'Success Rate' },
  ];

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
              <span>About Mini AI Tutor</span>
            </div>

            {/* Headline */}
            <h1
              data-animate="slide-up"
              data-delay="100"
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Transforming Education with AI
            </h1>

            {/* Subheadline */}
            <p
              data-animate="slide-up"
              data-delay="200"
              className="text-xl text-gray-600 mb-10 leading-relaxed"
            >
              We're on a mission to make quality education accessible to everyone through the power of artificial intelligence and personalized learning.
            </p>

            {/* Stats */}
            <div
              data-animate="fade"
              data-delay="300"
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

      {/* Mission Section */}
      <section className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div data-animate="slide-left">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                At Mini AI Tutor, we believe that everyone deserves access to world-class education. Our mission is to democratize learning by combining expert instruction with AI-powered personalization.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                We're building a platform where students can learn at their own pace, get instant help when they're stuck, and achieve their learning goals faster than ever before.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Founded in 2024, we've already helped thousands of learners master new skills and advance their careers through our innovative approach to online education.
              </p>
            </div>
            <div data-animate="slide-right" className="bg-gray-100 rounded-2xl p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Target className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Learn Smarter, Not Harder</h3>
                <p className="text-gray-600">
                  AI-powered personalization for every learner
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 data-animate="slide-up" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p data-animate="slide-up" data-delay="100" className="text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  data-animate="scale"
                  data-delay={`${index * 100}`}
                  className="p-8 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 text-center"
                >
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-xl bg-gray-900 flex items-center justify-center mb-5 mx-auto">
                    <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div data-animate="slide-up">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Join Our Learning Community
            </h2>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Start your learning journey today and join thousands of students achieving their goals
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                Get Started Free
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-200 text-gray-900 rounded-xl hover:bg-gray-50 transition-all font-semibold active:scale-[0.98]"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
