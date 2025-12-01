'use client';

/**
 * Teach Page
 * Instructor recruitment and information
 */

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
} from 'lucide-react';

export default function TeachPage() {
  const router = useRouter();

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
      step: 1,
      title: 'Apply to Become an Instructor',
      description: 'Submit your application with your background, expertise, and teaching goals. We review all applications carefully.',
    },
    {
      step: 2,
      title: 'Create Your Course',
      description: 'Use our intuitive course builder to create engaging content with modules, lessons, and assessments.',
    },
    {
      step: 3,
      title: 'Quality Review',
      description: 'Our team reviews your course to ensure high quality standards. We provide feedback and support.',
    },
    {
      step: 4,
      title: 'Launch & Earn',
      description: 'Once approved, your course goes live! Start earning from enrollments and grow your teaching business.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white bg-opacity-20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">AI-Powered Teaching Platform</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Come teach with us
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Join thousands of expert instructors teaching millions of students worldwide. Powered by AI to amplify your impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard/instructor/apply"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-center flex items-center justify-center space-x-2"
              >
                <span>Become an Instructor</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-all font-semibold text-center"
              >
                Learn How It Works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">10,000+</p>
              <p className="text-gray-600">Active Students</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">500+</p>
              <p className="text-gray-600">Published Courses</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-3">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">100+</p>
              <p className="text-gray-600">Expert Instructors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why teach on AI Tutor?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines expert instruction with AI technology to create the ultimate learning experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start teaching in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
                {idx < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Powerful tools for powerful teaching
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We provide everything you need to create engaging courses and track student success.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-12 flex items-center justify-center">
              <div className="text-center">
                <Video className="w-24 h-24 text-blue-600 mx-auto mb-6" />
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
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to start teaching?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our community of expert instructors and start making an impact today.
          </p>
          <Link
            href="/dashboard/instructor/apply"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            <span>Apply to Become an Instructor</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-blue-100 mt-6">
            Already an instructor?{' '}
            <Link href="/login" className="text-white underline hover:text-gray-100">
              Log in to your account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
