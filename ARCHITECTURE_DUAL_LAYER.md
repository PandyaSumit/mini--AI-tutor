# Dual-Layer Course System Architecture

## Overview

This document outlines the complete architecture for a dual-layer course system that distinguishes between personal AI-generated courses and verified instructor marketplace courses.

## 🎯 Core Principles

1. **Quality Control**: Only verified instructors can publish public courses
2. **Cost Management**: AI usage is limited for personal courses
3. **Revenue Protection**: Prevent spam and low-quality courses from marketplace
4. **User Empowerment**: Everyone can create personal learning paths

---

## 📋 Role System

### 1. Learner (Default)
- **Permissions**:
  - Create personal AI-generated courses/roadmaps
  - Enroll in marketplace courses
  - AI tutor usage: **Limited** (e.g., 100 messages/month for free tier)
- **Restrictions**:
  - Cannot publish to marketplace
  - Courses only visible to themselves (private)
  - Cannot set pricing or earn revenue

### 2. Verified Instructor
- **Requirements**:
  - Age ≥ 18 (KYC/ID verification)
  - Subject knowledge check (quiz/portfolio)
  - Profile completeness
  - Accept instructor terms & conditions
- **Permissions**:
  - All learner permissions
  - Create public marketplace courses
  - Set course pricing
  - Earn revenue (with platform fee)
  - Higher AI usage quota
- **Verification Process**:
  1. Submit instructor application
  2. Age/identity verification (KYC)
  3. Subject expertise validation (quiz or portfolio review)
  4. Admin review & approval
  5. Instructor onboarding

### 3. Platform Author (Internal)
- **Who**: Platform team or hired domain experts
- **Permissions**:
  - All verified instructor permissions
  - Create "flagship" courses
  - Access to premium AI features
  - Unlimited AI usage
  - Higher revenue share
- **Purpose**: Create canonical, high-quality courses

### 4. Admin
- **Permissions**:
  - All platform capabilities
  - Review instructor applications
  - Moderate content
  - Flag/remove low-quality courses
  - Handle disputes
  - Analytics & reporting

---

## 🗄️ Database Schema Changes

### User Model Updates

```javascript
{
  // UPDATED: Enhanced role system
  role: {
    type: String,
    enum: ['learner', 'verified_instructor', 'platform_author', 'admin'],
    default: 'learner'
  },

  // NEW: Instructor verification
  instructorVerification: {
    status: {
      type: String,
      enum: ['not_applied', 'pending', 'approved', 'rejected'],
      default: 'not_applied'
    },
    appliedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,

    // KYC/Age Verification
    kycStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'verified', 'failed'],
      default: 'not_submitted'
    },
    kycProvider: String, // e.g., 'stripe_identity', 'manual'
    kycVerifiedAt: Date,
    dateOfBirth: Date,
    age: Number, // Calculated from DOB

    // Subject Expertise
    expertiseAreas: [{
      subject: String,
      category: String,
      verificationMethod: {
        type: String,
        enum: ['quiz', 'portfolio', 'certification', 'manual_review']
      },
      verificationScore: Number,
      verifiedAt: Date
    }],

    // Portfolio/Credentials
    portfolio: {
      bio: String,
      professionalTitle: String,
      yearsOfExperience: Number,
      certifications: [{
        name: String,
        issuer: String,
        url: String,
        verifiedAt: Date
      }],
      socialLinks: {
        linkedin: String,
        github: String,
        website: String
      }
    },

    // Terms acceptance
    termsAcceptedAt: Date,
    termsVersion: String
  },

  // NEW: AI Usage Tracking
  aiUsage: {
    currentPeriodStart: Date,
    currentPeriodEnd: Date,

    // Monthly quotas
    quotas: {
      chatMessages: {
        limit: Number, // Based on role
        used: Number,
        overage: Number
      },
      voiceMinutes: {
        limit: Number,
        used: Number,
        overage: Number
      },
      courseGenerations: {
        limit: Number,
        used: Number,
        overage: Number
      }
    },

    // Historical tracking
    totalMessagesAllTime: Number,
    totalVoiceMinutesAllTime: Number,
    totalCoursesGenerated: Number,

    // Cost tracking
    estimatedCost: Number, // USD
    lastResetAt: Date
  },

  // NEW: Instructor earnings
  earnings: {
    totalEarned: Number,
    availableBalance: Number,
    pendingBalance: Number,
    totalWithdrawn: Number,

    // Payout info
    payoutMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'bank_transfer'],
      default: null
    },
    payoutDetails: {
      type: Map,
      of: String,
      default: {}
    },

    nextPayoutDate: Date,
    lastPayoutDate: Date
  }
}
```

### Course Model Updates

```javascript
{
  // NEW: Visibility control
  visibility: {
    type: String,
    enum: ['private', 'unlisted', 'public'],
    default: 'private'
  },

  // NEW: Course type
  courseType: {
    type: String,
    enum: ['personal', 'marketplace', 'flagship'],
    default: 'personal'
  },

  // NEW: Pricing (for marketplace courses)
  pricing: {
    model: {
      type: String,
      enum: ['free', 'paid', 'subscription'],
      default: 'free'
    },
    amount: {
      type: Number,
      default: 0 // USD cents
    },
    currency: {
      type: String,
      default: 'USD'
    },

    // Revenue split
    platformFeePercentage: {
      type: Number,
      default: 30 // Platform takes 30%
    },
    instructorShare: {
      type: Number,
      default: 70 // Instructor gets 70%
    }
  },

  // NEW: Marketplace metadata
  marketplace: {
    isFeatured: Boolean,
    featuredUntil: Date,
    isPremium: Boolean,
    rank: Number, // For sorting

    // Quality gates
    hasPassedQualityReview: Boolean,
    qualityReviewedAt: Date,
    qualityReviewedBy: mongoose.Schema.Types.ObjectId,
    qualityIssues: [String],

    // Sales tracking
    totalSales: Number,
    totalRevenue: Number,
    averageRating: Number,
    totalReviews: Number
  },

  // NEW: AI Generation tracking
  aiGeneration: {
    isAIGenerated: Boolean,
    generatedAt: Date,
    generationPrompt: String,
    generationModel: String,
    estimatedCost: Number,

    // Quality indicators
    hasHumanReview: Boolean,
    humanReviewedAt: Date,
    humanReviewedBy: mongoose.Schema.Types.ObjectId
  },

  // UPDATED: Creator role tracking
  creatorRole: {
    type: String,
    enum: ['learner', 'verified_instructor', 'platform_author'],
    required: true
  }
}
```

### New Model: AIUsageLog

```javascript
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  usageType: {
    type: String,
    enum: ['chat_message', 'voice_session', 'course_generation', 'flashcard_generation'],
    required: true
  },

  // Resource consumption
  tokensUsed: Number,
  minutesUsed: Number, // For voice
  estimatedCost: Number, // USD

  // Context
  courseId: mongoose.Schema.Types.ObjectId,
  sessionId: mongoose.Schema.Types.ObjectId,
  conversationId: mongoose.Schema.Types.ObjectId,

  // Metadata
  model: String, // e.g., 'gpt-4', 'whisper'
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Quota tracking
  quotaStatus: {
    type: String,
    enum: ['within_quota', 'over_quota', 'unlimited'],
    default: 'within_quota'
  },

  chargeableToUser: Boolean
}
```

---

## 🔒 Access Control Rules

### Course Creation

```javascript
// Personal Courses (visibility: private)
if (user.role === 'learner') {
  // Allowed but with limits
  - visibility: MUST be 'private'
  - courseType: MUST be 'personal'
  - pricing: NOT allowed
  - AI usage: LIMITED by quota
}

// Marketplace Courses (visibility: public)
if (user.role === 'verified_instructor') {
  - visibility: Can be 'public', 'unlisted', or 'private'
  - courseType: Can be 'marketplace' or 'personal'
  - pricing: ALLOWED
  - AI usage: HIGHER quota
  - Quality review: REQUIRED before public visibility
}

// Flagship Courses
if (user.role === 'platform_author') {
  - visibility: Can be 'public'
  - courseType: Can be 'flagship', 'marketplace', or 'personal'
  - pricing: ALLOWED
  - AI usage: UNLIMITED
  - Quality review: OPTIONAL (trusted)
  - Revenue share: HIGHER percentage
}
```

### AI Usage Limits (Per Month)

```javascript
const AI_USAGE_QUOTAS = {
  learner: {
    chatMessages: 100,
    voiceMinutes: 30,
    courseGenerations: 3
  },

  verified_instructor: {
    chatMessages: 1000,
    voiceMinutes: 300,
    courseGenerations: 20
  },

  platform_author: {
    chatMessages: Infinity,
    voiceMinutes: Infinity,
    courseGenerations: Infinity
  }
};
```

### Course Discovery

```javascript
// Public course catalog
GET /api/courses?visibility=public
- Returns only courses with:
  - visibility: 'public'
  - courseType: 'marketplace' OR 'flagship'
  - creatorRole: 'verified_instructor' OR 'platform_author'
  - isPublished: true
  - marketplace.hasPassedQualityReview: true

// Personal courses
GET /api/courses/my-courses
- Returns user's own courses (any visibility)

// Admin view
GET /api/admin/courses
- Returns all courses (admin only)
```

---

## 🛠️ API Endpoints

### Instructor Verification

```
POST   /api/instructor/apply
       - Submit instructor application
       - Requires: portfolio, expertise areas, terms acceptance

POST   /api/instructor/verify-age
       - Submit KYC/age verification
       - Integration with Stripe Identity or similar

POST   /api/instructor/expertise-quiz
       - Take subject knowledge quiz
       - Returns score and verification status

GET    /api/instructor/status
       - Check verification status

POST   /api/admin/instructor/review/:userId
       - Admin: Approve or reject instructor application
```

### AI Usage Management

```
GET    /api/usage/current
       - Get current period usage and limits

GET    /api/usage/history
       - Historical usage data

POST   /api/usage/track
       - Record AI usage (internal)

GET    /api/usage/estimate-cost
       - Estimate cost for an operation
```

### Course Management (Updated)

```
POST   /api/courses
       - Create course
       - Validates role and sets visibility/type accordingly

POST   /api/courses/:id/publish
       - Publish course
       - For learners: Error (cannot publish)
       - For instructors: Submits for quality review
       - For platform authors: Publishes immediately

POST   /api/courses/:id/submit-for-review
       - Submit marketplace course for quality review

GET    /api/courses/marketplace
       - Browse public marketplace courses
       - Filters by quality review status

GET    /api/courses/my-courses
       - User's personal courses
```

### Revenue & Earnings

```
GET    /api/earnings/summary
       - Instructor: View earnings summary

POST   /api/earnings/withdraw
       - Request payout

GET    /api/admin/revenue/overview
       - Admin: Platform revenue analytics
```

---

## 🎨 Frontend Changes

### 1. Course Creation Flow

```typescript
// Based on user role, show different options

if (userRole === 'learner') {
  <CourseCreationWizard
    allowedVisibility="private"
    showPricingOptions={false}
    aiUsageWarning="You have X/100 AI generations left this month"
    courseType="personal"
  />
}

if (userRole === 'verified_instructor') {
  <CourseCreationWizard
    allowedVisibility={['private', 'unlisted', 'public']}
    showPricingOptions={true}
    aiUsageWarning="You have X/1000 AI generations left this month"
    courseType="marketplace"
    requiresQualityReview={true}
  />
}
```

### 2. Instructor Application Page

```
/become-instructor
- Requirements checklist
- Application form (bio, expertise, portfolio)
- Age verification integration
- Subject quiz
- Terms & conditions
- Progress tracker
```

### 3. Course Discovery

```
/courses (Marketplace)
- Only shows public, reviewed courses
- Filter by category, price, instructor
- Featured courses section
- Quality badges

/my-courses
- User's personal courses
- Draft courses
- Revenue analytics (for instructors)
```

### 4. Usage Dashboard

```
/dashboard/usage
- Current usage vs quota
- Visual progress bars
- Upgrade CTA for learners
- Historical charts
- Cost estimates
```

---

## 🔐 Security Considerations

1. **Role Validation**: Always verify user role on backend before operations
2. **KYC Privacy**: Encrypt and securely store verification documents
3. **Age Verification**: Use trusted third-party services (Stripe Identity, Jumio)
4. **Rate Limiting**: Prevent abuse of AI endpoints
5. **Content Moderation**: AI-powered content review for marketplace courses
6. **Revenue Protection**: Fraud detection for payouts

---

## 📊 Business Logic

### Quality Review Process

```javascript
// When instructor submits course for review
async function submitCourseForReview(courseId) {
  const course = await Course.findById(courseId);

  // Automated checks
  const qualityChecks = {
    hasDescription: course.description.length >= 100,
    hasModules: course.statistics.totalModules >= 3,
    hasLessons: course.statistics.totalLessons >= 10,
    hasLearningOutcomes: course.metadata.learningOutcomes.length >= 3,
    hasPrerequisites: true, // Optional but good
    hasThumbnail: !!course.thumbnail
  };

  const passedAutomated = Object.values(qualityChecks).every(check => check);

  if (passedAutomated) {
    // Queue for human review
    await QueueAdminReview(courseId);
  } else {
    // Return with issues
    course.marketplace.qualityIssues =
      Object.entries(qualityChecks)
        .filter(([key, passed]) => !passed)
        .map(([key]) => key);
    await course.save();
  }
}
```

### Revenue Calculation

```javascript
async function calculateInstructorEarnings(courseId, saleAmount) {
  const course = await Course.findById(courseId).populate('createdBy');

  const platformFee = saleAmount * (course.pricing.platformFeePercentage / 100);
  const instructorEarning = saleAmount - platformFee;

  // Update instructor earnings
  const instructor = course.createdBy;
  instructor.earnings.totalEarned += instructorEarning;
  instructor.earnings.availableBalance += instructorEarning;

  await instructor.save();

  // Log transaction
  await Transaction.create({
    user: instructor._id,
    course: courseId,
    type: 'course_sale',
    amount: saleAmount,
    platformFee: platformFee,
    netAmount: instructorEarning
  });
}
```

---

## 🚀 Migration Plan

### Phase 1: Database Updates (Week 1)
1. Update User model with new fields
2. Update Course model with visibility and pricing
3. Create AIUsageLog model
4. Run migration scripts for existing data

### Phase 2: Backend API (Week 2)
1. Implement instructor verification endpoints
2. Update course creation logic
3. Add AI usage tracking middleware
4. Implement quality review system

### Phase 3: Frontend (Week 3)
1. Create instructor application flow
2. Update course creation wizards
3. Build usage dashboard
4. Update course discovery

### Phase 4: Testing & Rollout (Week 4)
1. End-to-end testing
2. Security audit
3. Beta testing with select users
4. Full production rollout

---

## 📈 Success Metrics

1. **Quality**: Average course rating in marketplace > 4.0
2. **Control**: % of public courses created by verified instructors > 95%
3. **Cost**: AI usage costs per learner < $X/month
4. **Revenue**: Marketplace course sales growth
5. **Engagement**: Personal course creation rate

---

## ⚠️ Edge Cases & Considerations

1. **Upgrading Learner to Instructor**: Preserve personal courses, allow publishing selected ones
2. **Instructor Downgrade**: If instructor verification expires/revoked, unpublish marketplace courses
3. **AI Quota Exceeded**: Graceful degradation, offer upgrade or wait for reset
4. **Course Quality Failures**: Clear feedback, allow resubmission
5. **Revenue Disputes**: Admin arbitration process
6. **Refunds**: Impact on instructor earnings

---

This architecture ensures quality control, cost management, and a clear path for users to grow from learners to verified instructors while protecting the platform from spam and abuse.
