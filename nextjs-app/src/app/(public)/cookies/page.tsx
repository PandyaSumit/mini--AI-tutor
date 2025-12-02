/**
 * Cookie Policy Page
 */

import { Cookie } from 'lucide-react';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-8">
            <Cookie className="w-4 h-4" strokeWidth={2} />
            <span>Cookie Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Cookie Policy
          </h1>
          <p className="text-lg text-gray-600">
            Last updated: December 2, 2024
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto prose prose-lg">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
              <p className="text-gray-600 leading-relaxed">
                Cookies are small text files that are placed on your device when you visit a website. They help websites remember your preferences and understand how you use the site to improve your experience.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Cookies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Mini AI Tutor uses cookies for various purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li><strong>Essential Cookies:</strong> Required for the platform to function properly</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use our platform</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Types of Cookies We Use</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Essential Cookies</h3>
              <p className="text-gray-600 leading-relaxed">
                These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as logging in or filling out forms.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Performance Cookies</h3>
              <p className="text-gray-600 leading-relaxed">
                These cookies help us understand how visitors interact with our website by collecting anonymous information about pages visited and any errors encountered.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Functionality Cookies</h3>
              <p className="text-gray-600 leading-relaxed">
                These cookies enable the website to provide enhanced functionality and personalization, such as remembering your language preference or course progress.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                You can control and manage cookies in various ways. Most browsers allow you to refuse or accept cookies, delete cookies that have already been set, and set your preferences for certain websites.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                Please note that if you choose to block cookies, some features of our platform may not function properly.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                We may use third-party services that set cookies on your device. These include analytics providers and payment processors. These third parties have their own privacy policies and cookie policies.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about our use of cookies, please contact us at privacy@miniaitutor.com
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
