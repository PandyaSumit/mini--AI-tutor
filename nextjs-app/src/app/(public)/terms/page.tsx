/**
 * Terms of Service Page
 */

import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-8">
            <FileText className="w-4 h-4" strokeWidth={2} />
            <span>Terms of Service</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Terms of Service
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing and using Mini AI Tutor, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use of Service</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You agree to use our service only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Use the service in any way that violates any applicable law or regulation</li>
                <li>Impersonate or attempt to impersonate another user or person</li>
                <li>Engage in any conduct that restricts or inhibits anyone's use of the service</li>
                <li>Use any robot, spider, or other automatic device to access the service</li>
                <li>Introduce viruses, trojan horses, or other malicious code</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-600 leading-relaxed">
                When you create an account, you must provide accurate and complete information. You are responsible for safeguarding your account password and for all activities that occur under your account.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Course Content and Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                All content on our platform, including courses, videos, text, and graphics, is the property of Mini AI Tutor or our content providers and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without permission.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment and Refunds</h2>
              <p className="text-gray-600 leading-relaxed">
                Paid courses and subscriptions are subject to the pricing and payment terms specified at the time of purchase. Refunds are handled according to our refund policy, which may vary by course or subscription type.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Termination</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Disclaimer of Warranties</h2>
              <p className="text-gray-600 leading-relaxed">
                The service is provided "as is" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                Mini AI Tutor shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about these Terms, please contact us at legal@miniaitutor.com
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
