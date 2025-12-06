'use client';

/**
 * Teach Page
 * Instructor recruitment and information
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  Users,
  DollarSign,
  TrendingUp,
  BookOpen,
  Video,
  BarChart,
  Clock,
  Globe,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Brain,
  Mic,
  Play,
} from 'lucide-react';

export default function TeachPage() {
  const router = useRouter();

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

  const benefits = [
    {
      icon: Users,
      title: 'Reach Global Learners',
      description: 'Connect with thousands of motivated students from around the world eager to learn from you.',
    },
    {
      icon: DollarSign,
      title: 'Earn Money Teaching',
      description: 'Set your own prices and earn revenue from course sales. Top instructors earn thousands monthly.',
    },
    {
      icon: Brain,
      title: 'AI-Powered Assistance',
      description: 'Our AI tutor helps your students learn 24/7, answering questions and providing personalized guidance.',
    },
    {
      icon: Mic,
      title: 'Voice Learning Sessions',
      description: 'Students can learn through AI-powered voice interactions, making your content more accessible.',
    },
    {
      icon: BarChart,
      title: 'Detailed Analytics',
      description: 'Track student progress, engagement metrics, and course performance with comprehensive analytics.',
    },
    {
      icon: Clock,
      title: 'Flexible Schedule',
      description: 'Create courses on your own time. Update content whenever you want with full creative control.',
    },
  ];

  const features = [
    'AI-powered student support',
    'Adaptive learning paths',
    'Voice learning sessions',
    'Comprehensive analytics dashboard',
    'Marketing and promotion support',
    'Secure payment processing',
    'Student progress tracking',
    'Course quality review system',
    'Dedicated instructor support',
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Apply to Become an Instructor',
      description: 'Submit your application with your background, expertise, and teaching goals. We review all applications carefully.',
    },
    {
      step: '02',
      title: 'Create Your Course',
      description: 'Use our intuitive course builder to create engaging content with modules, lessons, and assessments.',
    },
    {
      step: '03',
      title: 'Quality Review',
      description: 'Our team reviews your course to ensure high quality standards. We provide feedback and support.',
    },
    {
      step: '04',
      title: 'Launch & Earn',
      description: 'Once approved, your course goes live! Start earning from enrollments and grow your teaching business.',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Active Students' },
    { value: '500+', label: 'Published Courses' },
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
              <span>AI-Powered Teaching Platform</span>
            </div>

            {/* Headline */}
            <h1
              data-animate="slide-up"
              data-delay="100"
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Come teach with us
            </h1>

            {/* Subheadline */}
            <p
              data-animate="slide-up"
              data-delay="200"
              className="text-xl text-gray-600 mb-10 leading-relaxed"
            >
              Join thousands of expert instructors teaching millions of students worldwide. Powered by AI to amplify your impact.
            </p>

            {/* CTA Buttons */}
            <div
              data-animate="slide-up"
              data-delay="300"
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link
                href="/dashboard/instructor/apply"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                <span>Become an Instructor</span>
                <ArrowRight className="w-5 h-5" strokeWidth={2} />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl transition-all border-2 border-gray-200 active:scale-[0.98]"
              >
                <Play className="w-5 h-5" strokeWidth={2} />
                <span>Learn How It Works</span>
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

      {/* Benefits Section */}
      <section className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 data-animate="slide-up" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why teach on Mini AI Tutor?
            </h2>
            <p data-animate="slide-up" data-delay="100" className="text-lg text-gray-600">
              Our platform combines expert instruction with AI technology to create the ultimate learning experience
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 data-animate="slide-up" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p data-animate="slide-up" data-delay="100" className="text-lg text-gray-600">
              Start teaching in four simple steps
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div
                key={index}
                data-animate="slide-up"
                data-delay={`${index * 100}`}
                className="text-center"
              >
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 text-white text-2xl font-bold mb-6">
                  {item.step}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div data-animate="slide-left">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Powerful tools for powerful teaching
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We provide everything you need to create engaging courses and track student success
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div data-animate="slide-right" className="bg-gray-100 rounded-2xl p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Video className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Course Creation Made Easy</h3>
                <p className="text-gray-600">
                  Intuitive tools to build, manage, and optimize your courses
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div data-animate="slide-up">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to start teaching?
            </h2>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Join our community of expert instructors and start making an impact today
            </p>
            <Link
              href="/dashboard/instructor/apply"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all font-semibold text-lg shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              <span>Apply to Become an Instructor</span>
              <ArrowRight className="w-5 h-5" strokeWidth={2} />
            </Link>
            <p className="text-sm text-gray-600 mt-6">
              Already an instructor?{' '}
              <Link href="/login" className="text-gray-900 font-medium hover:underline">
                Log in to your account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
