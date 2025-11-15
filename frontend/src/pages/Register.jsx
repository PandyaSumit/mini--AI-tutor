import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Sparkles,
    Rocket,
    Target,
    Zap,
    Eye,
    EyeOff,
    Mail,
    Lock,
    User as UserIcon,
    ArrowRight,
    Shield,
    Users,
    TrendingUp,
    AlertCircle,
    Check,
    X
} from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match. Please try again.');
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = () => {
        const password = formData.password;
        if (!password) return 0;
        if (password.length < 6) return 1;
        if (password.length < 10) return 2;
        return 3;
    };

    const strengthColors = ['bg-gray-200', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];
    const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

    const passwordsMatch = formData.password && formData.confirmPassword &&
        formData.password === formData.confirmPassword;
    const passwordsDontMatch = formData.password && formData.confirmPassword &&
        formData.password !== formData.confirmPassword;

    const features = [
        {
            icon: Rocket,
            title: 'Start Learning Instantly',
            description: 'Access AI-powered study tools from day one',
            stat: 'Instant access'
        },
        {
            icon: Target,
            title: 'Track Your Progress',
            description: 'Monitor growth with detailed analytics',
            stat: 'Real-time'
        },
        {
            icon: Zap,
            title: 'Unlimited Resources',
            description: 'Create flashcards, roadmaps, and more',
            stat: 'No limits'
        }
    ];

    const benefits = [
        'Unlimited AI conversations',
        'Personalized learning roadmaps',
        'Smart flashcard generation',
        'Progress tracking & analytics',
        'Mobile-friendly platform',
        'Free forever - no credit card'
    ];

    const stats = [
        { icon: Users, label: 'Active Learners', value: '50,000+' },
        { icon: TrendingUp, label: 'Success Rate', value: '95%' },
        { icon: Shield, label: 'Secure', value: 'Bank-level' }
    ];

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Brand Experience */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative overflow-hidden">
                {/* Background - Subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />

                {/* Decorative elements - Very subtle */}
                <div className="absolute inset-0 opacity-[0.03]">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-green-500 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
                </div>

                {/* Content Container */}
                <div className="relative w-full flex flex-col p-12 xl:p-16 2xl:p-20">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-3 mb-16 group w-fit"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                            <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-bold text-gray-900">Mini AI Tutor</span>
                    </Link>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col justify-center max-w-lg">
                        {/* Headline */}
                        <div className="mb-12">
                            <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 leading-tight mb-4">
                                Start your
                                <span className="block mt-1">learning adventure</span>
                            </h1>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Join thousands of learners achieving their goals with AI-powered education.
                            </p>
                        </div>

                        {/* Features - Clean cards */}
                        <div className="space-y-3 mb-8">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <div
                                        key={index}
                                        className="group p-5 rounded-xl border border-gray-100 bg-white/50 hover:bg-white hover:shadow-sm transition-all duration-200"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 transition-colors">
                                                <Icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" strokeWidth={2} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-1">
                                                    <h3 className="font-semibold text-gray-900 text-[15px]">{feature.title}</h3>
                                                    <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">{feature.stat}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Benefits List */}
                        <div className="space-y-3 mb-12">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                What's Included
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-gray-600" strokeWidth={3} />
                                        </div>
                                        <span className="text-sm text-gray-600">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="flex items-center gap-6 pt-6 border-t border-gray-100">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={index} className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-gray-400" strokeWidth={2} />
                                        <div className="text-xs">
                                            <div className="font-semibold text-gray-900">{stat.value}</div>
                                            <div className="text-gray-500">{stat.label}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Links */}
                    <div className="flex items-center gap-6 text-xs text-gray-500">
                        <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
                        <Link to="/help" className="hover:text-gray-900 transition-colors">Help</Link>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-10">
                        <Link to="/" className="inline-flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
                                <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Mini AI Tutor</span>
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">Create your account</h1>
                        <p className="text-gray-600">Start your learning journey today</p>
                    </div>

                    {/* Form Container */}
                    <div className="space-y-6">
                        {/* Header - Desktop Only */}
                        <div className="hidden lg:block">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
                            <p className="text-gray-600">Start your learning journey today</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-red-900">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-semibold text-gray-900"
                                >
                                    Full name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserIcon className={`h-[18px] w-[18px] transition-colors ${focusedField === 'name' ? 'text-gray-900' : 'text-gray-400'
                                            }`} strokeWidth={2} />
                                    </div>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('name')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-4 py-3 text-[15px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                                        placeholder="John Doe"
                                        required
                                        autoComplete="name"
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-semibold text-gray-900"
                                >
                                    Email address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className={`h-[18px] w-[18px] transition-colors ${focusedField === 'email' ? 'text-gray-900' : 'text-gray-400'
                                            }`} strokeWidth={2} />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-4 py-3 text-[15px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                                        placeholder="you@example.com"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-semibold text-gray-900"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className={`h-[18px] w-[18px] transition-colors ${focusedField === 'password' ? 'text-gray-900' : 'text-gray-400'
                                            }`} strokeWidth={2} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-12 py-3 text-[15px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                                        placeholder="Create a password"
                                        required
                                        autoComplete="new-password"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-900 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} />
                                        ) : (
                                            <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
                                        )}
                                    </button>
                                </div>
                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className="space-y-2 pt-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1 flex-1 rounded-full transition-all ${passwordStrength() >= level ? strengthColors[passwordStrength()] : 'bg-gray-200'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        {passwordStrength() > 0 && (
                                            <p className="text-xs text-gray-600">
                                                Strength: <span className="font-semibold">{strengthLabels[passwordStrength()]}</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-semibold text-gray-900"
                                >
                                    Confirm password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className={`h-[18px] w-[18px] transition-colors ${focusedField === 'confirmPassword' ? 'text-gray-900' : 'text-gray-400'
                                            }`} strokeWidth={2} />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('confirmPassword')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-12 py-3 text-[15px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                                        placeholder="Confirm your password"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-900 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} />
                                        ) : (
                                            <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
                                        )}
                                    </button>
                                    {/* Match Indicator */}
                                    {formData.confirmPassword && (
                                        <div className="absolute inset-y-0 right-12 flex items-center pr-2">
                                            {passwordsMatch ? (
                                                <Check className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                                            ) : passwordsDontMatch ? (
                                                <X className="w-4 h-4 text-red-600" strokeWidth={2.5} />
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Terms & Conditions */}
                            <div className="pt-2">
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    By creating an account, you agree to our{' '}
                                    <Link to="/terms" className="font-semibold text-gray-900 hover:underline">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link to="/privacy" className="font-semibold text-gray-900 hover:underline">
                                        Privacy Policy
                                    </Link>
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.99] mt-6"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create account</span>
                                        <ArrowRight className="w-4 h-4" strokeWidth={2} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-3 bg-white text-gray-500">Already have an account?</span>
                            </div>
                        </div>

                        {/* Sign In Link */}
                        <Link
                            to="/login"
                            className="w-full border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group"
                        >
                            <span>Sign in</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                        </Link>

                        {/* Security Note */}
                        <div className="pt-4">
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                <Shield className="w-3.5 h-3.5" strokeWidth={2} />
                                <span>Free forever • No credit card required</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;