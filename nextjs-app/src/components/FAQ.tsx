'use client';

/**
 * FAQ Component
 * Accordion-style frequently asked questions
 */

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQProps {
  items?: FAQItem[];
  className?: string;
  variant?: 'default' | 'compact';
}

const defaultFAQItems: FAQItem[] = [
  {
    id: '1',
    question: 'How does the AI tutor work?',
    answer:
      'Our AI tutor uses advanced machine learning to understand your learning style, pace, and goals. It provides personalized explanations, answers your questions in real-time, and adapts the content difficulty based on your progress. Think of it as having a patient, knowledgeable teacher available 24/7.',
  },
  {
    id: '2',
    question: 'Can I get a refund if I am not satisfied?',
    answer:
      'Yes! We offer a 30-day money-back guarantee for all paid courses. If you are not completely satisfied with your purchase, simply contact our support team within 30 days of enrollment for a full refund. No questions asked.',
  },
  {
    id: '3',
    question: 'Do I need any prior experience to start learning?',
    answer:
      'Not at all! Our courses are designed for learners of all levels. Each course clearly indicates its difficulty level (Beginner, Intermediate, Advanced), and our AI tutor adapts to your current knowledge level. If you are new to a topic, the AI will provide foundational explanations and gradually build up your understanding.',
  },
  {
    id: '4',
    question: 'How does voice learning work?',
    answer:
      'Voice learning allows you to interact with course content hands-free using speech. You can ask questions, request explanations, and navigate lessons using your voice. The AI tutor responds with natural speech, making it perfect for learning while commuting, exercising, or during other activities.',
  },
  {
    id: '5',
    question: 'Can I access courses on mobile devices?',
    answer:
      'Absolutely! Our platform is fully responsive and works seamlessly on smartphones, tablets, and desktop computers. Your progress syncs automatically across all devices, so you can start learning on your computer and continue on your phone without missing a beat.',
  },
  {
    id: '6',
    question: 'Do I get a certificate after completing a course?',
    answer:
      'Yes, you receive a certificate of completion for every course you finish. The certificate includes your name, course title, completion date, and a unique verification code. You can share it on LinkedIn, include it in your resume, or download it as a PDF.',
  },
  {
    id: '7',
    question: 'How is this different from other online learning platforms?',
    answer:
      'Unlike traditional pre-recorded courses, our platform features AI-powered personalized tutoring. The AI adapts to your learning pace, answers your specific questions, identifies knowledge gaps, and creates custom study paths. It is like having a personal tutor combined with the convenience of online learning.',
  },
  {
    id: '8',
    question: 'Can I become an instructor on this platform?',
    answer:
      'Yes! We welcome expert instructors to join our platform. Visit our "Become an Instructor" page to learn more about the application process, requirements, and benefits. Our AI tutor enhances your courses by providing 24/7 student support, so you can focus on creating great content.',
  },
];

export default function FAQ({ items = defaultFAQItems, className = '', variant = 'default' }: FAQProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (variant === 'compact') {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((item) => {
          const isOpen = openItems.has(item.id);
          return (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900 text-sm">{item.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ml-2 ${
                    isOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700 text-sm leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        return (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-start space-x-4 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isOpen
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                  }`}
                >
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-900 text-lg pt-1">{item.question}</span>
              </div>
              <ChevronDown
                className={`w-6 h-6 text-gray-500 transition-transform flex-shrink-0 ml-4 mt-1 ${
                  isOpen ? 'transform rotate-180 text-blue-600' : 'group-hover:text-blue-600'
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed pl-14">{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
