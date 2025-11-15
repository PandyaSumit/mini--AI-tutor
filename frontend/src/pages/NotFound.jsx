import { Link } from 'react-router-dom';
import {
  Home,
  ArrowLeft,
  Sparkles,
  Search,
  MessageSquare,
  Map,
  Brain
} from 'lucide-react';

const NotFound = () => {
  const quickLinks = [
    {
      to: '/dashboard',
      icon: Home,
      label: 'Dashboard',
      description: 'Return to your learning hub'
    },
    {
      to: '/chat',
      icon: MessageSquare,
      label: 'AI Chat',
      description: 'Start a new conversation'
    },
    {
      to: '/roadmaps',
      icon: Map,
      label: 'Roadmaps',
      description: 'View your learning paths'
    },
    {
      to: '/flashcards',
      icon: Brain,
      label: 'Flashcards',
      description: 'Study with flashcards'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* 404 Visual */}
        <div className="text-center mb-12 animate-scale-in">
          {/* Large 404 with gradient */}
          <div className="relative inline-block">
            <h1 className="text-[180px] sm:text-[220px] lg:text-[280px] font-bold leading-none bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 bg-clip-text text-transparent select-none">
              404
            </h1>

            {/* Floating decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-gray-100 animate-bounce-subtle">
                  <Search className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400" strokeWidth={1.5} />
                </div>
                {/* Sparkles around */}
                <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400 animate-pulse-subtle" />
                <Sparkles className="absolute -bottom-2 -left-6 w-6 h-6 text-blue-400 animate-pulse-subtle" style={{ animationDelay: '0.5s' }} />
                <Sparkles className="absolute top-1/2 -right-8 w-5 h-5 text-purple-400 animate-pulse-subtle" style={{ animationDelay: '1s' }} />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="mt-8 space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
              Oops! The page you're looking for seems to have wandered off.
              Let's get you back on track.
            </p>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="group bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center flex-shrink-0 group-hover:from-primary-50 group-hover:to-primary-100 transition-all">
                    <Icon className="w-6 h-6 text-gray-600 group-hover:text-primary-600 transition-colors" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                      {link.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {link.description}
                    </p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:-translate-x-1 transition-all rotate-180" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Primary Action */}
        <div className="text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
          >
            <Home className="w-5 h-5" />
            <span>Go to Dashboard</span>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-sm text-gray-500">
            If you believe this is a mistake, please{' '}
            <Link to="/contact" className="text-primary-600 hover:text-primary-700 font-medium underline">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
