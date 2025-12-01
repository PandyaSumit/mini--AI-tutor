'use client';

/**
 * Testimonials Component
 * Displays user testimonials for social proof
 */

import { Star, Quote } from 'lucide-react';
import { useState } from 'react';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  rating: number;
  text: string;
  course?: string;
}

interface TestimonialsProps {
  testimonials?: Testimonial[];
  variant?: 'carousel' | 'grid';
  className?: string;
}

const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Software Engineer',
    rating: 5,
    text: 'The AI tutor is incredible! It adapts to my learning pace and explains complex topics in a way I can understand. I have learned more in 3 months than I did in a year of traditional courses.',
    course: 'Web Development Bootcamp',
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Data Scientist',
    rating: 5,
    text: 'The voice learning feature is a game-changer. I can learn during my commute and the AI answers all my questions instantly. This platform has transformed how I approach learning.',
    course: 'Machine Learning Fundamentals',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    role: 'Product Designer',
    rating: 5,
    text: 'As someone who struggled with self-paced learning, the AI tutor keeps me accountable and motivated. The personalized feedback is exactly what I needed to stay on track.',
    course: 'UI/UX Design Masterclass',
  },
  {
    id: '4',
    name: 'David Park',
    role: 'Entrepreneur',
    rating: 5,
    text: 'I have taken courses on multiple platforms, but none compare to this. The AI-powered tutoring makes it feel like having a personal mentor available 24/7. Worth every penny!',
    course: 'Business Strategy Essentials',
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    role: 'Marketing Manager',
    rating: 5,
    text: 'The adaptive learning paths are brilliant. The platform identified my weak areas and created a custom study plan. I passed my certification exam on the first try!',
    course: 'Digital Marketing Pro',
  },
  {
    id: '6',
    name: 'James Wilson',
    role: 'Student',
    rating: 5,
    text: 'Being able to ask questions and get instant, detailed answers from the AI is amazing. It is like having a patient teacher who never gets tired of explaining things.',
    course: 'Python Programming',
  },
];

export default function Testimonials({
  testimonials = defaultTestimonials,
  variant = 'grid',
  className = '',
}: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={`w-5 h-5 ${
              idx < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderTestimonialCard = (testimonial: Testimonial, index: number) => {
    const initials = testimonial.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    return (
      <div
        key={testimonial.id}
        className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300"
      >
        {/* Quote Icon */}
        <div className="flex items-start justify-between mb-4">
          <Quote className="w-10 h-10 text-blue-200" />
          {renderStars(testimonial.rating)}
        </div>

        {/* Testimonial Text */}
        <p className="text-gray-700 mb-6 text-lg leading-relaxed">"{testimonial.text}"</p>

        {/* Author Info */}
        <div className="flex items-center space-x-4">
          {testimonial.avatar ? (
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{initials}</span>
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{testimonial.name}</p>
            <p className="text-sm text-gray-600">{testimonial.role}</p>
            {testimonial.course && (
              <p className="text-xs text-blue-600 mt-1">{testimonial.course}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (variant === 'carousel') {
    return (
      <div className={`relative ${className}`}>
        {/* Main Testimonial */}
        <div className="mb-8">{renderTestimonialCard(testimonials[currentIndex], currentIndex)}</div>

        {/* Navigation */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={prevTestimonial}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Previous testimonial"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center space-x-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-blue-600 w-8' : 'bg-gray-300'
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextTestimonial}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Next testimonial"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${className}`}>
      {testimonials.map((testimonial, index) => renderTestimonialCard(testimonial, index))}
    </div>
  );
}
