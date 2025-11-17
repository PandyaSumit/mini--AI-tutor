# User Roles and Permissions System

## Overview

The platform implements a four-tier collaborative course creation system inspired by Wikipedia, allowing courses to evolve through community contributions while maintaining quality control.

## User Roles

### 1. Course Founder (50-60% Revenue)
**Full editorial control of the course**

**Permissions:**
- Create and publish courses
- Approve/reject co-creator applications
- Set course pricing (free/paid)
- Archive or delete courses
- Make final decisions on content disputes
- Set overall course structure and direction

**Responsibilities:**
- Maintain quality standards
- Respond to co-creator requests within 7 days
- Keep course content current and accurate

**Revenue:**
- Starts at 60%, decreases by 2% per approved co-creator (minimum 50%)
- Automatically recalculated when co-creators join

### 2. Co-Creator (10-20% Revenue)
**Approved contributors with substantial editing rights**

**Permissions:**
- Add new lessons and modules
- Edit existing content
- Create quizzes and exercises
- Respond to student questions
- Participate in course improvement discussions
- Vote on improvement suggestions

**Requirements to Apply:**
- 50+ reputation points OR invited contributor status
- Submit application with proposed contributions

**Revenue Calculation:**
```javascript
Base: 10-20%
Formula: 10% + (contentContribution * 10%)
Where contentContribution = (lessonsCreated/totalLessons + modulesCreated/totalModules) / 2
```

**Benefits:**
- Build platform reputation
- Highlighted in search results
- May be invited to found new courses in expertise area

### 3. Contributor (2-5% Revenue)
**Suggesters without direct editing access**

**Permissions:**
- Flag errors in content
- Suggest content additions/improvements
- Provide feedback on existing content
- Vote on proposed changes
- Ask questions and participate in discussions

**Requirements:**
- Any enrolled student
- Can be promoted through activity

**Revenue Calculation:**
```javascript
1-2 implemented suggestions: 2%
3-5 implemented suggestions: 3%
6-10 implemented suggestions: 4%
11+ implemented suggestions: 5%
```

**Path to Co-Creator:**
- Automatic invitation when quality score reaches threshold
- Direct application with 50+ reputation points

### 4. Regular Student (No Revenue)
**Learners with consumption rights**

**Permissions:**
- View all course content
- Complete lessons and take quizzes
- Receive certificates
- Leave ratings and reviews
- Ask questions

**Path to Contributor:**
Automatically invited when meeting criteria:
- Quality activity score >= 50 points
- OR implementation rate >= 30% (3+ suggestions submitted)

**Activity Scoring:**
```
Error reports: 2 points each
Suggestions submitted: 3 points each
Quality questions: 1 point each
Forum participation: 1.5 points each
```

## API Endpoints

### Co-Creator Management

#### Apply as Co-Creator
```http
POST /api/courses/:courseId/co-creators/apply
Authorization: Bearer {token}

Body:
{
  "message": "I'd like to contribute lessons on advanced topics",
  "proposedContributions": "5 new lessons on machine learning",
  "requestedRevenueShare": 15
}

Response 201:
{
  "success": true,
  "data": {
    "_id": "request_id",
    "course": "course_id",
    "requester": {...},
    "status": "pending",
    "requestedRevenueShare": 15
  }
}
```

#### Get Pending Requests (Founders Only)
```http
GET /api/courses/:courseId/co-creators/requests?status=pending
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "count": 3,
  "data": [...]
}
```

#### Approve Co-Creator Request (Founders Only)
```http
PUT /api/courses/:courseId/co-creators/requests/:requestId/approve
Authorization: Bearer {token}

Body:
{
  "approvedRevenueShare": 12,
  "notes": "Great proposal, reduced share due to current allocations"
}

Response 200:
{
  "success": true,
  "data": {...},
  "course": {
    "founderRevenue": 54,
    "totalAllocated": 89
  }
}
```

#### Reject Co-Creator Request (Founders Only)
```http
PUT /api/courses/:courseId/co-creators/requests/:requestId/reject
Authorization: Bearer {token}

Body:
{
  "notes": "Not enough expertise in proposed area"
}
```

### Contributor Suggestions

#### Submit Improvement Suggestion
```http
POST /api/courses/:courseId/improvements
Authorization: Bearer {token}

Body:
{
  "title": "Add examples for recursion",
  "description": "The recursion lesson needs more practical examples",
  "improvementType": "new_content",
  "targetSection": {
    "module": "module_id",
    "lesson": "lesson_id"
  }
}

Response 201:
{
  "success": true,
  "data": {
    "_id": "improvement_id",
    "course": "course_id",
    "suggestedBy": {...},
    "title": "Add examples for recursion",
    "status": "pending",
    "upvotes": 0
  }
}
```

#### Upvote Suggestion
```http
POST /api/courses/:courseId/improvements/:improvementId/upvote
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "upvotes": 5,
    "upvotedBy": [...]
  }
}
```

#### Implement Suggestion (Founders/Co-Creators Only)
```http
PUT /api/courses/:courseId/improvements/:improvementId/implement
Authorization: Bearer {token}

Body:
{
  "notes": "Added 3 new examples as suggested"
}

Response 200:
{
  "success": true,
  "data": {...},
  "contributor": {
    "id": "user_id",
    "name": "John Doe",
    "revenueShare": 3,
    "totalImplementations": 4
  }
}
```

### Contributor Invitations

#### Check Invitation Status
```http
GET /api/invitations/my-status
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "invited": true,
    "invitedAt": "2024-01-15T10:30:00Z",
    "qualityScore": 75,
    "eligible": true,
    "activity": {
      "errorReports": 12,
      "suggestionsSubmitted": 8,
      "suggestionsImplemented": 4,
      "questionsAsked": 25,
      "forumParticipation": 15
    },
    "reputation": {
      "score": 85,
      "canApplyAsCoCreator": true
    }
  }
}
```

#### Trigger Auto-Invitations (Admin Only)
```http
POST /api/invitations/check-and-invite
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "invitedCount": 5,
  "message": "Invited 5 eligible students"
}
```

#### Get Invitation Statistics (Admin Only)
```http
GET /api/invitations/stats
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "data": {
    "totalInvited": 150,
    "activeContributors": 87,
    "conversionRate": 58,
    "eligibleButNotInvited": 23
  }
}
```

## Revenue Distribution

### Calculation Flow

1. **Course Earns Revenue**: $1000
2. **Founder Share** (54%): $540
3. **Co-Creator 1** (12%): $120 (added 15% of content)
4. **Co-Creator 2** (15%): $150 (added 25% of content)
5. **Contributor 1** (3%): $30 (4 implementations)
6. **Contributor 2** (2%): $20 (2 implementations)
7. **Platform** (14%): $140

### Automatic Adjustments

When a new co-creator is approved:
1. Calculate their contribution-based share (10-20%)
2. Reduce founder's share by 2%
3. Normalize all shares if total > 100%

```javascript
// Example: Before new co-creator
Founder: 60%
CoCreator1: 15%
Contributor1: 3%
Total: 78%

// After approving new co-creator (16%)
Founder: 58% (reduced by 2%)
CoCreator1: 15%
CoCreator2: 16% (new)
Contributor1: 3%
Total: 92%

// If total exceeds 100%, normalize proportionally
```

## Quality Control

### Founder Responsibilities

1. **Response Time**: Must respond to co-creator requests within 7 days
2. **Quality Standards**: Maintain course quality score >= 50
3. **Content Updates**: Keep content current and accurate
4. **Dispute Resolution**: Make final decisions on conflicting suggestions

### Automatic Quality Tracking

```javascript
User Quality Score =
  (Implementation Rate * 60) +
  (Error Reports * 2, max 20 points) +
  (Forum Activity / 10 * 20, max 20 points)

Implementation Rate = Implemented / Submitted
```

### Badges and Recognition

- **Founder**: Create 1+ course
- **Co-Creator**: Contribute to 3+ courses
- **Helpful**: 10+ implemented improvements
- **Prolific**: 10+ total courses (created + co-created)
- **Quality**: Average course rating >= 4.5
- **Expert**: 500+ reputation points

## Best Practices

### For Founders
- Review co-creator applications within 3-5 days
- Provide detailed feedback on rejections
- Set clear contribution guidelines
- Recognize top contributors
- Keep revenue shares fair and transparent

### For Co-Creators
- Propose specific, valuable contributions
- Maintain consistent quality
- Respond to student feedback
- Collaborate with other co-creators
- Support the course vision

### For Contributors
- Focus on quality over quantity
- Provide detailed improvement descriptions
- Include examples when suggesting changes
- Vote on suggestions you've reviewed
- Build reputation through helpful contributions

### For Students
- Report errors you find
- Ask thoughtful questions
- Participate in course discussions
- Leave constructive reviews
- Suggest specific improvements

## Migration and Setup

### Initial Course Setup
```javascript
// When creating a course
const course = new Course({
  title: "Course Title",
  createdBy: founderId,
  contributors: [{
    user: founderId,
    contributionType: 'founder',
    contributionDate: new Date(),
    contributionScore: 0,
    revenueShare: 60, // Starting founder share
    approvalStatus: 'approved'
  }]
});
```

### Adding Email Notifications
Set environment variables:
```env
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password
EMAIL_FROM=noreply@ailearning.com
```

### Scheduled Tasks
Set up cron job for daily contributor invitations:
```javascript
// Using node-cron
import cron from 'node-cron';
import contributorInvitationService from './services/contributorInvitationService.js';

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await contributorInvitationService.checkAndInviteEligibleStudents();
});
```

## Security Considerations

1. **Authorization Checks**: All endpoints verify user permissions
2. **Revenue Limits**: Shares automatically normalized to prevent > 100%
3. **Rate Limiting**: Apply to submission endpoints
4. **Input Validation**: All user inputs sanitized
5. **Audit Logging**: Track all permission changes

## Future Enhancements

1. **Content Dispute Resolution**: Voting system for conflicting edits
2. **Version Control**: Track content changes and allow rollbacks
3. **Revenue Analytics**: Detailed breakdowns for contributors
4. **Advanced Metrics**: Track individual lesson performance
5. **Contributor Leaderboards**: Gamification and recognition
