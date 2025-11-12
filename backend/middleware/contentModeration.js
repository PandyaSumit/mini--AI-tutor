import ModerationLog from '../models/ModerationLog.js';

// Prohibited keywords and patterns
const MODERATION_RULES = {
  illegal_activity: {
    keywords: ['hack into', 'steal', 'break into', 'crack password', 'ddos', 'malware', 'virus', 'exploit vulnerability', 'bypass security', 'illegal'],
    patterns: [/how to (hack|crack|break into|steal)/i, /build (malware|virus|ransomware)/i],
    severity: 'critical'
  },
  medical_diagnosis: {
    keywords: ['diagnose me', 'what disease', 'medical advice', 'prescription', 'should i take medication', 'am i sick'],
    patterns: [/(diagnose|treat|cure) (my|me|this)/i, /what (disease|illness|condition) do i have/i],
    severity: 'high'
  },
  legal_advice: {
    keywords: ['legal advice', 'sue', 'lawsuit', 'court case', 'contract review', 'should i sign'],
    patterns: [/should i (sue|file|sign this contract)/i, /is this legal/i],
    severity: 'high'
  },
  financial_advice: {
    keywords: ['invest in', 'buy stocks', 'financial advice', 'should i invest', 'trading strategy'],
    patterns: [/should i (invest|buy|sell) (stocks?|crypto|bitcoin)/i],
    severity: 'medium'
  },
  harmful_content: {
    keywords: ['hurt myself', 'end my life', 'suicide', 'kill myself', 'self harm', 'want to die'],
    patterns: [/(hurt|harm|kill) (myself|me)/i, /end (my|this) life/i],
    severity: 'critical'
  },
  copyright_violation: {
    keywords: ['transcribe this book', 'full text of', 'copy entire', 'pirated content'],
    patterns: [/transcribe (the|this) (entire|full|complete) (book|article|paper)/i],
    severity: 'high'
  },
  impersonation: {
    keywords: ['pretend to be', 'impersonate', 'act as if you are', 'pose as'],
    patterns: [/pretend (you are|to be) (a human|real person)/i],
    severity: 'medium'
  },
  non_educational: {
    keywords: ['book flight', 'order food', 'buy product', 'file taxes', 'make reservation'],
    patterns: [/(book|order|buy|purchase) (flight|hotel|product|food)/i],
    severity: 'low'
  }
};

// Educational refusal messages
const REFUSAL_MESSAGES = {
  illegal_activity: {
    message: "I can't help with that request. However, I can teach cybersecurity fundamentals, ethical hacking principles, or information security best practices if you're interested in these topics for educational or career purposes.",
    alternative: "Consider learning about: Cybersecurity basics, Network security, Ethical hacking certifications (CEH, OSCP), or how to become a security researcher."
  },
  medical_diagnosis: {
    message: "I can't provide medical diagnoses or treatment advice. For health concerns, please consult a licensed healthcare professional.",
    alternative: "I can teach you about: Human anatomy, physiology, health sciences, or medical career paths if that interests you."
  },
  legal_advice: {
    message: "I can't provide legal advice. For legal matters, please consult a licensed attorney.",
    alternative: "I can teach you about: Legal system basics, how laws are made, contract fundamentals, or legal career paths."
  },
  financial_advice: {
    message: "I can't provide personalized investment or financial advice. Please consult a licensed financial advisor.",
    alternative: "I can teach you about: Personal finance basics, investment fundamentals, financial literacy, or accounting principles."
  },
  harmful_content: {
    message: "I'm concerned about what you've shared. Please reach out for help:\n\n🆘 **Crisis Resources:**\n- National Suicide Prevention Lifeline: 988 or 1-800-273-8255\n- Crisis Text Line: Text HOME to 741741\n- International: findahelpline.com\n\nYou don't have to face this alone. Professional support is available 24/7.",
    alternative: "If you'd like to learn about mental health, psychology, or wellness in an educational context, I'm here to help with that."
  },
  copyright_violation: {
    message: "I can't reproduce copyrighted content in full. However, I can discuss concepts, summarize ideas, or teach related topics.",
    alternative: "I can help you: Understand key concepts, create study guides, or find legitimate learning resources."
  },
  impersonation: {
    message: "I can't pretend to be a real person or human. I'm an AI assistant designed for educational purposes.",
    alternative: "I can teach you about: AI technology, natural language processing, or how chatbots work."
  },
  non_educational: {
    message: "I'm designed for educational purposes rather than transactional services.",
    alternative: "I can teach you: How to book flights step-by-step, meal planning and nutrition, tax basics, or consumer skills if that's helpful for learning."
  },
  out_of_scope: {
    message: "This request is outside my educational scope. I focus on helping you learn and build skills.",
    alternative: "Let me know what skills or topics you'd like to learn about, and I'll create a personalized learning plan for you!"
  }
};

// Check content against moderation rules
export const checkContent = (content) => {
  const lowerContent = content.toLowerCase();
  const violations = [];

  for (const [violationType, rule] of Object.entries(MODERATION_RULES)) {
    // Check keywords
    const keywordMatch = rule.keywords.some(keyword =>
      lowerContent.includes(keyword.toLowerCase())
    );

    // Check patterns
    const patternMatch = rule.patterns.some(pattern =>
      pattern.test(content)
    );

    if (keywordMatch || patternMatch) {
      const matchedKeywords = rule.keywords.filter(k =>
        lowerContent.includes(k.toLowerCase())
      );

      violations.push({
        type: violationType,
        severity: rule.severity,
        matchedKeywords,
        confidence: (keywordMatch && patternMatch) ? 0.9 :
                    (keywordMatch ? 0.7 : 0.6)
      });
    }
  }

  return violations;
};

// Content moderation middleware
export const moderateContent = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message) {
      return next();
    }

    // Check for violations
    const violations = checkContent(message);

    if (violations.length > 0) {
      // Get the highest severity violation
      const primaryViolation = violations.reduce((prev, curr) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[curr.severity] > severityOrder[prev.severity] ? curr : prev;
      });

      // Log to moderation database
      await ModerationLog.create({
        user: req.user.id,
        conversation: req.body.conversationId || null,
        originalPrompt: message,
        violationType: primaryViolation.type,
        severity: primaryViolation.severity,
        action: primaryViolation.severity === 'critical' ? 'refused' : 'educational_alternative',
        refusalMessage: REFUSAL_MESSAGES[primaryViolation.type]?.message || REFUSAL_MESSAGES.out_of_scope.message,
        alternativeSuggestion: REFUSAL_MESSAGES[primaryViolation.type]?.alternative,
        requiresHumanReview: primaryViolation.severity === 'critical',
        automaticFlags: {
          keywords: primaryViolation.matchedKeywords,
          patterns: [],
          confidenceScore: primaryViolation.confidence
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Check for repeated violations
      const violationCheck = await ModerationLog.checkRepeatedViolations(req.user.id);

      // For critical violations or repeated offenders, refuse the request
      if (primaryViolation.severity === 'critical' || violationCheck.shouldFlag) {
        return res.status(403).json({
          success: false,
          message: REFUSAL_MESSAGES[primaryViolation.type]?.message || REFUSAL_MESSAGES.out_of_scope.message,
          alternative: REFUSAL_MESSAGES[primaryViolation.type]?.alternative,
          violationType: primaryViolation.type,
          moderated: true,
          ...(violationCheck.shouldFlag && {
            warning: 'Multiple policy violations detected. Please review our content guidelines.'
          })
        });
      }

      // For lower severity, add warning to request but allow it to proceed with educational framing
      req.moderationWarning = {
        type: primaryViolation.type,
        message: REFUSAL_MESSAGES[primaryViolation.type]?.alternative,
        redirectEducational: true
      };
    }

    next();
  } catch (error) {
    console.error('Moderation error:', error);
    // Don't block request on moderation error, but log it
    next();
  }
};

// Export for use in routes
export default moderateContent;
