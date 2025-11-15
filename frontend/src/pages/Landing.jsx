import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    Users,
    TrendingUp,
    Shield,
    ChevronRight,
    Play,
    Menu,
    X,
    Github,
    Twitter,
    Linkedin
} from 'lucide-react';

const Landing = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll for navbar
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && mobileMenuOpen) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [mobileMenuOpen]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    const features = [
        {
            icon: Brain,
            title: 'AI-Powered Learning',
            description: 'Adaptive study paths that evolve with your progress and learning style'
        },
        {
            icon: MessageSquare,
            title: 'Interactive Chat',
            description: 'Ask questions and get instant, contextual answers from our AI tutor'
        },
        {
            icon: Map,
            title: 'Smart Roadmaps',
            description: 'Structured learning plans with milestones and progress tracking'
        },
        {
            icon: Target,
            title: 'Goal Setting',
            description: 'Set targets and track your achievement with detailed analytics'
        },
        {
            icon: Zap,
            title: 'Flashcards',
            description: 'Generate and study with AI-powered spaced repetition flashcards'
        },
        {
            icon: TrendingUp,
            title: 'Progress Analytics',
            description: 'Visualize your growth with comprehensive performance insights'
        }
    ];

    const benefits = [
        {
            title: 'Learn 10x Faster',
            description: 'AI-powered personalization adapts to your pace and style',
            stat: '10x',
            statLabel: 'faster learning'
        },
        {
            title: 'Retain 2x More',
            description: 'Scientifically-proven spaced repetition techniques',
            stat: '2x',
            statLabel: 'better retention'
        },
        {
            title: '95% Success Rate',
            description: 'Join thousands of learners achieving their goals',
            stat: '95%',
            statLabel: 'completion rate'
        }
    ];

    const testimonials = [
        {
            name: 'Sarah Chen',
            role: 'Computer Science Student',
            avatar: 'SC',
            content: 'Mini AI Tutor helped me ace my algorithms course. The personalized roadmaps and instant feedback are game-changers.',
            rating: 5
        },
        {
            name: 'Michael Rodriguez',
            role: 'Self-Taught Developer',
            avatar: 'MR',
            content: 'I went from zero to landing my first developer job in 6 months. The structured learning path kept me focused and motivated.',
            rating: 5
        },
        {
            name: 'Emily Watson',
            role: 'Medical Student',
            avatar: 'EW',
            content: 'The flashcard feature with spaced repetition is perfect for medical school. I retain so much more information now.',
            rating: 5
        }
    ];

    const stats = [
        { value: '50,000+', label: 'Active Learners' },
        { value: '1M+', label: 'Study Sessions' },
        { value: '95%', label: 'Success Rate' },
        { value: '4.9/5', label: 'User Rating' }
    ];

    const pricingFeatures = [
        'Unlimited AI conversations',
        'Personalized learning roadmaps',
        'Smart flashcard generation',
        'Progress tracking & analytics',
        'Mobile-friendly platform',
        'Community access'
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white'
                }`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-lg font-bold text-gray-900">Mini AI Tutor</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                Features
                            </a>
                            <a href="#benefits" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                Benefits
                            </a>
                            <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                Testimonials
                            </a>
                            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                Pricing
                            </a>
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center gap-3">
                            <Link
                                to="/login"
                                className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/register"
                                className="text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                            >
                                Get Started
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu className="w-6 h-6 text-gray-600" strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 md:hidden animate-fade-in"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="fixed top-0 right-0 h-full w-64 bg-white z-50 shadow-xl md:hidden transition-transform duration-300 animate-slide-in-right">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <span className="text-lg font-bold text-gray-900">Menu</span>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    aria-label="Close menu"
                                >
                                    <X className="w-5 h-5 text-gray-600" strokeWidth={2} />
                                </button>
                            </div>
                            <div className="flex-1 py-6 px-6 space-y-1">
                                <a
                                    href="#features"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    Features
                                </a>
                                <a
                                    href="#benefits"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    Benefits
                                </a>
                                <a
                                    href="#testimonials"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    Testimonials
                                </a>
                                <a
                                    href="#pricing"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    Pricing
                                </a>
                            </div>
                            <div className="p-6 border-t border-gray-100 space-y-3">
                                <Link
                                    to="/login"
                                    className="block text-center text-sm font-semibold text-gray-900 px-4 py-2.5 rounded-lg border-2 border-gray-200 hover:border-gray-900 transition-colors"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className="block text-center text-sm font-semibold text-white bg-gray-900 px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-3xl mx-auto text-center animate-slide-up">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-semibold text-gray-900">50,000+ learners trust us</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
                            Learn smarter with
                            <span className="block mt-2">AI-powered education</span>
                        </h1>

                        {/* Description */}
                        <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto">
                            Personalized learning paths, instant AI tutoring, and smart study tools designed to help you achieve your goals faster.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/register"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                            >
                                <span>Start Learning Free</span>
                                <ArrowRight className="w-5 h-5" strokeWidth={2} />
                            </Link>
                            <a
                                href="#features"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-900 transition-all"
                            >
                                <Play className="w-5 h-5" strokeWidth={2} />
                                <span>Learn More</span>
                            </a>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {['SC', 'MR', 'EW', 'JD'].map((initials, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-gray-900 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                                            {initials}
                                        </div>
                                    ))}
                                </div>
                                <span className="font-medium">Trusted by 50K+ students</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" strokeWidth={0} />
                                ))}
                                <span className="ml-1 font-medium">4.9/5 rating</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-6 lg:px-8 border-y border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                                <div className="text-sm text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything you need to succeed
                        </h2>
                        <p className="text-lg text-gray-600">
                            Powerful features designed to accelerate your learning journey
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={index}
                                    className="group p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-all duration-200"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-5 group-hover:bg-gray-900 transition-colors">
                                        <Icon className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" strokeWidth={2} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-24 px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-12">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="text-center">
                                <div className="mb-6">
                                    <div className="text-5xl font-bold text-gray-900 mb-2">{benefit.stat}</div>
                                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                        {benefit.statLabel}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-24 px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Loved by learners worldwide
                        </h2>
                        <p className="text-lg text-gray-600">
                            See what our community has to say about their experience
                        </p>
                    </div>

                    {/* Testimonials Grid */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="p-8 rounded-2xl border border-gray-100 bg-white"
                            >
                                {/* Rating */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" strokeWidth={0} />
                                    ))}
                                </div>

                                {/* Content */}
                                <p className="text-gray-700 mb-6 leading-relaxed">
                                    "{testimonial.content}"
                                </p>

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
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Start learning for free
                        </h2>
                        <p className="text-lg text-gray-600">
                            No credit card required. Upgrade anytime.
                        </p>
                    </div>

                    {/* Pricing Card */}
                    <div className="bg-white rounded-2xl border-2 border-gray-900 p-10">
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
                            to="/register"
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
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">
                        Ready to transform your learning?
                    </h2>
                    <p className="text-xl text-gray-600 mb-10">
                        Join 50,000+ learners achieving their goals with AI-powered education
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                    >
                        <span>Start Learning Free</span>
                        <ArrowRight className="w-5 h-5" strokeWidth={2} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-12 px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <Link to="/" className="flex items-center gap-2.5 mb-4">
                                <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                                <span className="text-lg font-bold text-gray-900">Mini AI Tutor</span>
                            </Link>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                AI-powered education platform helping learners achieve their goals faster with personalized study paths and intelligent tutoring.
                            </p>
                            <div className="flex items-center gap-3">
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-900 flex items-center justify-center transition-colors group">
                                    <Twitter className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" strokeWidth={2} />
                                </a>
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-900 flex items-center justify-center transition-colors group">
                                    <Github className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" strokeWidth={2} />
                                </a>
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-900 flex items-center justify-center transition-colors group">
                                    <Linkedin className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" strokeWidth={2} />
                                </a>
                            </div>
                        </div>

                        {/* Links */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
                            <ul className="space-y-3">
                                <li><a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a></li>
                                <li><a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a></li>
                                <li><Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link></li>
                                <li><Link to="/register" className="text-gray-600 hover:text-gray-900 transition-colors">Get Started</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About</a></li>
                                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</a></li>
                                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Careers</a></li>
                                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500">
                            © 2024 Mini AI Tutor. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                            <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Privacy</a>
                            <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Terms</a>
                            <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Cookies</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
