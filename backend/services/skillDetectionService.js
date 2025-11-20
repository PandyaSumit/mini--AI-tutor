import aiService from '../config/aiService.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

/**
 * Skill Detection Service
 * Analyzes user's chat history to detect actual skill level
 */

/**
 * Analyze user's chat history to detect skill level
 * @param {String} userId - User ID
 * @param {String} topic - Topic/domain to analyze for
 * @param {Object} options - Additional options
 * @returns {Object} Detected skill level with confidence and evidence
 */
export const detectSkillLevel = async (userId, topic, options = {}) => {
  try {
    // Get user's recent conversations related to the topic
    const conversations = await getRelevantConversations(userId, topic, options.limit || 10);

    if (!conversations || conversations.length === 0) {
      return {
        detectedLevel: 'beginner',
        confidence: 'low',
        evidence: [],
        recommendation: 'No prior conversation history found. Starting with beginner level.',
        basedOn: 'default'
      };
    }

    // Extract messages from conversations
    const messages = await extractMessagesFromConversations(conversations);

    if (messages.length < 5) {
      return {
        detectedLevel: 'beginner',
        confidence: 'low',
        evidence: [],
        recommendation: 'Limited conversation history. Starting with beginner level.',
        basedOn: 'limited_data'
      };
    }

    // Analyze messages with AI
    const analysis = await analyzeMessagesForSkillLevel(messages, topic);

    return analysis;
  } catch (error) {
    console.error('Skill detection error:', error);
    return {
      detectedLevel: 'beginner',
      confidence: 'low',
      evidence: [],
      recommendation: 'Error in skill detection. Defaulting to beginner level.',
      basedOn: 'error',
      error: error.message
    };
  }
};

/**
 * Get relevant conversations for a topic
 */
async function getRelevantConversations(userId, topic, limit = 10) {
  try {
    // Search for conversations with topic-related keywords
    const topicKeywords = extractKeywords(topic);

    const conversations = await Conversation.find({
      user: userId,
      $or: [
        { title: { $regex: new RegExp(topicKeywords.join('|'), 'i') } },
        { tags: { $in: topicKeywords } }
      ]
    })
    .sort({ lastMessageAt: -1 })
    .limit(limit)
    .lean();

    return conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

/**
 * Extract messages from conversations
 */
async function extractMessagesFromConversations(conversations) {
  const conversationIds = conversations.map(c => c._id);

  const messages = await Message.find({
    conversation: { $in: conversationIds }
  })
  .sort({ createdAt: 1 })
  .limit(100) // Limit to recent 100 messages
  .lean();

  return messages;
}

/**
 * Analyze messages using AI to determine skill level
 */
async function analyzeMessagesForSkillLevel(messages, topic) {
  const systemPrompt = `You are an expert educational assessor. Analyze a user's chat history to determine their skill level in a specific topic.

SKILL LEVELS:
- **absolute_beginner**: No prior knowledge, asking very basic questions, needs foundational concepts explained
- **beginner**: Has basic understanding, asking introductory questions, learning fundamentals
- **intermediate**: Comfortable with basics, asking about practical applications, working on real problems
- **advanced**: Strong understanding, asking sophisticated questions, discussing complex scenarios
- **expert**: Deep expertise, discussing edge cases, contributing insights, teaching others

ANALYSIS CRITERIA:
1. **Question Complexity**: Type and depth of questions asked
2. **Terminology Usage**: Correct use of technical terms and jargon
3. **Problem-Solving**: Ability to debug, troubleshoot, and solve problems
4. **Context Understanding**: Grasp of underlying concepts vs memorization
5. **Independence**: Self-sufficiency vs need for hand-holding
6. **Project Complexity**: Sophistication of projects discussed

CONFIDENCE LEVELS:
- **high**: 15+ relevant messages, clear patterns, consistent indicators
- **medium**: 8-14 messages, some patterns, mostly consistent
- **low**: <8 messages, unclear patterns, mixed indicators

Respond in JSON format:
{
  "detectedLevel": "beginner|intermediate|advanced|expert",
  "confidence": "low|medium|high",
  "evidence": [
    {
      "indicator": "Question complexity",
      "observation": "User asks basic how-to questions",
      "example": "Quote from message",
      "pointsTo": "beginner"
    }
  ],
  "skillIndicators": {
    "questionComplexity": "basic|intermediate|advanced",
    "terminologyUsage": "incorrect|basic|proficient|expert",
    "problemSolving": "struggling|learning|competent|expert",
    "independence": "dependent|guided|independent|teaching"
  },
  "priorExperience": ["List of related topics user has discussed"],
  "strengths": ["What user is good at"],
  "weaknesses": ["What user struggles with"],
  "recommendation": "Brief recommendation for learning path",
  "suggestedPath": "fast-track|detailed",
  "reasoning": "Explanation for the assessed level"
}`;

  // Prepare user messages summary
  const userMessages = messages.filter(m => m.sender === 'user');
  const messagesSummary = userMessages.slice(0, 30).map(m => ({
    content: m.content.substring(0, 300), // Limit length
    timestamp: m.createdAt
  }));

  const userPrompt = `Analyze this user's conversation history about "${topic}":

**Total Messages**: ${messages.length}
**User Messages**: ${userMessages.length}

**Recent User Messages**:
${messagesSummary.map((m, i) => `${i + 1}. ${m.content}`).join('\n\n')}

Assess their skill level in "${topic}" based on this conversation history.`;

  try {
    const completion = await aiService.generateStructuredJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      max_tokens: 2000,
      temperature: 0.3 // Lower temperature for more consistent analysis
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    return {
      ...analysis,
      basedOn: 'ai_analysis',
      messagesAnalyzed: messages.length,
      topic: topic
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    throw error;
  }
}

/**
 * Extract keywords from topic
 */
function extractKeywords(topic) {
  // Simple keyword extraction - split by spaces and common separators
  const keywords = topic
    .toLowerCase()
    .split(/[\s,\-_]+/)
    .filter(k => k.length > 2);

  return keywords;
}

/**
 * Combine detected skill level with user-declared level
 * @param {String} detectedLevel - AI-detected skill level
 * @param {String} userDeclaredLevel - User's self-assessment
 * @param {String} confidence - Confidence in detection
 * @returns {String} Final skill level
 */
export const combineSkillLevels = (detectedLevel, userDeclaredLevel, confidence) => {
  // Map levels to numeric values for comparison
  const levelMap = {
    'absolute_beginner': 1,
    'beginner': 2,
    'intermediate': 3,
    'advanced': 4,
    'expert': 5
  };

  const detectedValue = levelMap[detectedLevel] || 2;
  const declaredValue = levelMap[userDeclaredLevel] || 2;

  if (confidence === 'high') {
    // Trust AI detection more with high confidence
    // But don't go more than 1 level away from user's declaration
    const diff = Math.abs(detectedValue - declaredValue);
    if (diff <= 1) {
      return detectedLevel;
    } else {
      // Take average
      const avgValue = Math.round((detectedValue + declaredValue) / 2);
      return Object.keys(levelMap).find(key => levelMap[key] === avgValue);
    }
  } else if (confidence === 'medium') {
    // Take average of detected and declared
    const avgValue = Math.round((detectedValue + declaredValue) / 2);
    return Object.keys(levelMap).find(key => levelMap[key] === avgValue);
  } else {
    // Low confidence - trust user's self-assessment more
    return userDeclaredLevel;
  }
};

/**
 * Detect user's domain/industry from chat history
 */
export const detectUserDomain = async (userId) => {
  try {
    // Get recent conversations
    const conversations = await Conversation.find({ user: userId })
      .sort({ lastMessageAt: -1 })
      .limit(20)
      .lean();

    if (!conversations || conversations.length === 0) {
      return {
        domain: 'general',
        industries: [],
        confidence: 'low'
      };
    }

    // Extract topics and tags
    const allTags = conversations.flatMap(c => c.tags || []);
    const allTitles = conversations.map(c => c.title).join(' ');

    const systemPrompt = `You are a domain classifier. Analyze conversation topics to identify the user's primary domain/industry.

COMMON DOMAINS:
- Software Development / Programming
- Data Science / Machine Learning / AI
- Web Development / Frontend / Backend
- Mobile Development
- DevOps / Cloud / Infrastructure
- Cybersecurity
- Business / Marketing / Sales
- Finance / Fintech
- Healthcare / Biotech
- Education / EdTech
- Design / UX/UI
- General Technology

Respond in JSON:
{
  "primaryDomain": "Main domain",
  "secondaryDomains": ["Other relevant domains"],
  "industries": ["Specific industries"],
  "confidence": "low|medium|high",
  "reasoning": "Brief explanation"
}`;

    const userPrompt = `Analyze these conversation topics:

**Tags**: ${allTags.join(', ')}
**Titles**: ${allTitles}

Determine the user's primary domain and industries.`;

    const completion = await aiService.generateStructuredJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      max_tokens: 500,
      temperature: 0.3
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return {
      domain: result.primaryDomain || 'general',
      industries: result.industries || [],
      secondaryDomains: result.secondaryDomains || [],
      confidence: result.confidence || 'medium',
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error('Domain detection error:', error);
    return {
      domain: 'general',
      industries: [],
      confidence: 'low'
    };
  }
};

/**
 * Get personalized examples based on user's domain
 */
export const getPersonalizedExamples = (concept, userDomain) => {
  // This could be enhanced with AI, but here's a rule-based approach
  const domainExamples = {
    'finance': {
      'database': 'Stock trading system, transaction ledger',
      'api': 'Payment gateway integration, market data API',
      'security': 'PCI compliance, fraud detection',
      'algorithm': 'Risk calculation, portfolio optimization'
    },
    'healthcare': {
      'database': 'Patient records, medical history',
      'api': 'FHIR healthcare APIs, lab results integration',
      'security': 'HIPAA compliance, patient data encryption',
      'algorithm': 'Diagnosis prediction, drug interaction checking'
    },
    'e-commerce': {
      'database': 'Product catalog, order management',
      'api': 'Payment processing, shipping integration',
      'security': 'Secure checkout, PCI-DSS compliance',
      'algorithm': 'Recommendation engine, inventory optimization'
    },
    'default': {
      'database': 'User management, data storage',
      'api': 'Third-party integrations, web services',
      'security': 'Authentication, data protection',
      'algorithm': 'Problem-solving, optimization'
    }
  };

  const domain = userDomain.toLowerCase();
  const examples = domainExamples[domain] || domainExamples['default'];

  // Simple matching - could be enhanced
  for (const [key, value] of Object.entries(examples)) {
    if (concept.toLowerCase().includes(key)) {
      return value;
    }
  }

  return examples['database']; // Default
};

export default {
  detectSkillLevel,
  combineSkillLevels,
  detectUserDomain,
  getPersonalizedExamples
};
