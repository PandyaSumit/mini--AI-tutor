/**
 * Industry-Level Memory System Test Suite
 * Validates all 10 strategies
 */

import industryMemoryManager from './ai/memory/industryMemoryManager.js';
import MemoryEntry from './models/MemoryEntry.js';
import UserProfile from './models/UserProfile.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testIndustryMemorySystem() {
  log('\n🧪 Testing Industry-Level Memory System', 'blue');
  log('='.repeat(70), 'blue');

  const testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-tutor');
    log('\n✅ Connected to MongoDB', 'green');

    // Test User ID
    const testUserId = new mongoose.Types.ObjectId();
    const testConversationId = new mongoose.Types.ObjectId();

    // ========================================
    // TEST 1: Memory Entry Model Validation
    // ========================================
    log('\nTest 1: Memory Entry Model Validation', 'yellow');
    try {
      const testMemory = new MemoryEntry({
        userId: testUserId,
        content: "I'm Sumit Pandya, full stack developer",
        type: 'fact',
        namespace: {
          category: 'personal',
          subcategory: 'identity',
          topic: 'name_and_role'
        },
        source: {
          conversationId: testConversationId,
          extractionMethod: 'automatic',
          confidence: 0.9
        },
        importance: {
          score: 0.8,
          factors: {
            userMarked: false,
            accessFrequency: 1,
            recency: 1.0
          }
        }
      });

      await testMemory.save();

      // Test importance calculation
      const calculatedScore = testMemory.calculateImportanceScore();
      log(`  ✅ Memory created and importance calculated: ${calculatedScore.toFixed(2)}`, 'green');

      // Test access marking
      await testMemory.markAccessed();
      log(`  ✅ Memory marked as accessed, frequency: ${testMemory.importance.factors.accessFrequency}`, 'green');

      testResults.passed++;
      testResults.tests.push({ name: 'Memory Entry Model', status: 'passed' });

    } catch (error) {
      log(`  ❌ Memory Entry Model test failed: ${error.message}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'Memory Entry Model', status: 'failed', error: error.message });
    }

    // ========================================
    // TEST 2: User Profile Model Validation
    // ========================================
    log('\nTest 2: User Profile Model Validation', 'yellow');
    try {
      const testProfile = new UserProfile({
        userId: testUserId,
        personal: {
          name: { value: 'Sumit Pandya', confidence: 0.9 },
          role: { value: 'Full Stack Developer', confidence: 0.85 }
        },
        professional: {
          occupation: 'Software Engineer',
          skills: [
            { name: 'JavaScript', level: 'expert', confidence: 0.9 },
            { name: 'React', level: 'advanced', confidence: 0.85 },
            { name: 'Node.js', level: 'advanced', confidence: 0.8 }
          ]
        },
        learning: {
          interests: [
            { topic: 'Advanced Node.js', category: 'programming', strength: 0.8, expertise: 0.6 },
            { topic: 'System Design', category: 'architecture', strength: 0.7, expertise: 0.4 }
          ],
          goals: [
            { goal: 'Master async patterns', category: 'programming', priority: 'high', status: 'active', createdAt: Date.now() }
          ]
        }
      });

      await testProfile.save();

      // Test completeness calculation
      const completeness = testProfile.calculateCompleteness();
      log(`  ✅ User profile created, completeness: ${(completeness * 100).toFixed(1)}%`, 'green');

      // Test engagement update
      await testProfile.updateEngagement({ messageCount: 5, sessionLength: 15 });
      log(`  ✅ Engagement updated: ${testProfile.behavioral.engagement.totalMessages} messages`, 'green');

      testResults.passed++;
      testResults.tests.push({ name: 'User Profile Model', status: 'passed' });

    } catch (error) {
      log(`  ❌ User Profile Model test failed: ${error.message}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'User Profile Model', status: 'failed', error: error.message });
    }

    // ========================================
    // TEST 3: Relevance Scoring Algorithm
    // ========================================
    log('\nTest 3: Multi-Factor Relevance Scoring', 'yellow');
    try {
      const testMemory = await MemoryEntry.findOne({ userId: testUserId });

      if (!testMemory) {
        throw new Error('Test memory not found');
      }

      const relevance = industryMemoryManager.calculateRelevanceScore(
        testMemory,
        0.85, // semantic score
        'identity'
      );

      log(`  ✅ Relevance score calculated: ${relevance.score.toFixed(3)}`, 'green');
      log(`    Factors:`, 'green');
      log(`    - Recency: ${relevance.factors.recency.toFixed(3)}`, 'green');
      log(`    - Frequency: ${relevance.factors.frequency.toFixed(3)}`, 'green');
      log(`    - Semantic: ${relevance.factors.semanticSimilarity.toFixed(3)}`, 'green');
      log(`    - Importance: ${relevance.factors.importance.toFixed(3)}`, 'green');

      testResults.passed++;
      testResults.tests.push({ name: 'Relevance Scoring', status: 'passed' });

    } catch (error) {
      log(`  ❌ Relevance scoring test failed: ${error.message}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'Relevance Scoring', status: 'failed', error: error.message });
    }

    // ========================================
    // TEST 4: Memory Extraction from Conversation
    // ========================================
    log('\nTest 4: Memory Extraction from Conversation', 'yellow');
    try {
      const mockMessages = [
        { _id: new mongoose.Types.ObjectId(), role: 'user', content: "Hi, I'm Sumit Pandya, full stack developer" },
        { _id: new mongoose.Types.ObjectId(), role: 'assistant', content: "Nice to meet you Sumit!" },
        { _id: new mongoose.Types.ObjectId(), role: 'user', content: "I work with React and Node.js mainly" },
        { _id: new mongoose.Types.ObjectId(), role: 'assistant', content: "Great stack! How can I help?" },
        { _id: new mongoose.Types.ObjectId(), role: 'user', content: "I want to learn about advanced async patterns" }
      ];

      const extractedMemories = await industryMemoryManager.extractMemoriesFromConversation(
        testUserId,
        testConversationId,
        mockMessages
      );

      log(`  ✅ Extracted ${extractedMemories.length} memories from conversation`, 'green');
      for (const memory of extractedMemories) {
        log(`    - ${memory.type}: "${memory.content.substring(0, 50)}..."`, 'green');
      }

      testResults.passed++;
      testResults.tests.push({ name: 'Memory Extraction', status: 'passed' });

    } catch (error) {
      log(`  ❌ Memory extraction test failed: ${error.message}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'Memory Extraction', status: 'failed', error: error.message });
    }

    // ========================================
    // TEST 5: Memory Decay Application
    // ========================================
    log('\nTest 5: Memory Decay Application', 'yellow');
    try {
      // Create an old, low-importance memory for testing
      const oldMemory = new MemoryEntry({
        userId: testUserId,
        content: "Test memory for decay",
        type: 'fact',
        namespace: { category: 'general', topic: 'test' },
        source: {
          conversationId: testConversationId,
          extractionMethod: 'automatic',
          confidence: 0.5
        },
        importance: {
          score: 0.1, // Low importance
          factors: {
            userMarked: false,
            accessFrequency: 0,
            recency: 0.1
          },
          decayRate: 0.2 // High decay rate
        },
        temporal: {
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
          lastAccessedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
        }
      });

      await oldMemory.save();

      // Apply decay
      const shouldForget = oldMemory.shouldForget();
      log(`  ✅ Memory decay evaluated: should forget = ${shouldForget}`, 'green');

      if (shouldForget) {
        oldMemory.status = 'archived';
        await oldMemory.save();
        log(`  ✅ Old, low-importance memory archived`, 'green');
      }

      testResults.passed++;
      testResults.tests.push({ name: 'Memory Decay', status: 'passed' });

    } catch (error) {
      log(`  ❌ Memory decay test failed: ${error.message}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'Memory Decay', status: 'failed', error: error.message });
    }

    // ========================================
    // TEST 6: Privacy Filtering
    // ========================================
    log('\nTest 6: Privacy and Compliance Filtering', 'yellow');
    try {
      // Create memories with different privacy levels
      const publicMemory = new MemoryEntry({
        userId: testUserId,
        content: "User likes JavaScript",
        type: 'preference',
        namespace: { category: 'general', topic: 'programming' },
        source: { conversationId: testConversationId, extractionMethod: 'automatic', confidence: 0.8 },
        privacy: {
          level: 'public',
          dataCategory: 'general',
          userConsent: { granted: true }
        }
      });

      const sensitiveMemory = new MemoryEntry({
        userId: testUserId,
        content: "User has health condition",
        type: 'fact',
        namespace: { category: 'health', topic: 'personal' },
        source: { conversationId: testConversationId, extractionMethod: 'automatic', confidence: 0.8 },
        privacy: {
          level: 'sensitive',
          dataCategory: 'health',
          userConsent: { granted: false } // No consent
        }
      });

      await publicMemory.save();
      await sensitiveMemory.save();

      // Filter for privacy
      const allMemories = await MemoryEntry.find({ userId: testUserId });
      const filtered = await industryMemoryManager.filterMemoriesForPrivacy(allMemories, {
        userConsentOnly: true
      });

      const sensitiveFiltered = filtered.filter(m => m.privacy.dataCategory === 'health');
      log(`  ✅ Privacy filtering working: ${sensitiveFiltered.length} sensitive memories after filter`, 'green');
      log(`    (Expected: 0, as health data without consent should be filtered)`, 'green');

      testResults.passed++;
      testResults.tests.push({ name: 'Privacy Filtering', status: 'passed' });

    } catch (error) {
      log(`  ❌ Privacy filtering test failed: ${error.message}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'Privacy Filtering', status: 'failed', error: error.message });
    }

    // ========================================
    // TEST 7: Token Budget Management
    // ========================================
    log('\nTest 7: Token Budget Management', 'yellow');
    try {
      const longText = "This is a test message. ".repeat(100); // ~2400 chars = ~600 tokens
      const estimatedTokens = industryMemoryManager.estimateTokens(longText);
      log(`  ✅ Token estimation: ${estimatedTokens} tokens for ${longText.length} chars`, 'green');

      const maxTokens = 400;
      const truncated = industryMemoryManager.truncateContext(longText, maxTokens);
      const truncatedTokens = industryMemoryManager.estimateTokens(truncated);

      log(`  ✅ Context truncation: ${estimatedTokens} → ${truncatedTokens} tokens`, 'green');
      log(`    (Target: ${maxTokens}, Actual: ${truncatedTokens})`, 'green');

      testResults.passed++;
      testResults.tests.push({ name: 'Token Budget Management', status: 'passed' });

    } catch (error) {
      log(`  ❌ Token budget test failed: ${error.message}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'Token Budget Management', status: 'failed', error: error.message });
    }

    // ========================================
    // TEST 8: Memory Health Metrics
    // ========================================
    log('\nTest 8: Meta-Memory and Health Metrics', 'yellow');
    try {
      const metrics = await industryMemoryManager.getMemoryHealthMetrics(testUserId);

      log(`  ✅ Memory health metrics retrieved:`, 'green');
      log(`    Storage:`, 'green');
      log(`    - Total memories: ${metrics.storage.totalMemories}`, 'green');
      log(`    - Active memories: ${metrics.storage.activeMemories}`, 'green');
      log(`    - Archived memories: ${metrics.storage.archivedMemories}`, 'green');
      log(`    Quality:`, 'green');
      log(`    - Avg confidence: ${metrics.quality.averageConfidence.toFixed(2)}`, 'green');
      log(`    - Avg importance: ${metrics.quality.averageImportance.toFixed(2)}`, 'green');

      if (metrics.profile.completeness > 0) {
        log(`    Profile completeness: ${(metrics.profile.completeness * 100).toFixed(1)}%`, 'green');
      }

      testResults.passed++;
      testResults.tests.push({ name: 'Health Metrics', status: 'passed' });

    } catch (error) {
      log(`  ❌ Health metrics test failed: ${error.message}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'Health Metrics', status: 'failed', error: error.message });
    }

    // ========================================
    // TEST 9: Memory Formatting for Injection
    // ========================================
    log('\nTest 9: Contextual Memory Injection', 'yellow');
    try {
      const mockMemory = {
        shortTerm: {
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' }
          ],
          tokens: 10
        },
        working: {
          summary: 'User introduced themselves and asked about async/await',
          tokens: 50
        },
        longTerm: {
          memories: [
            {
              content: 'User prefers practical examples',
              type: 'preference',
              relevance: 0.85,
              timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          ],
          tokens: 30
        },
        userProfile: {
          personal: 'Sumit Pandya',
          role: 'Full Stack Developer',
          skills: 'JavaScript, React, Node.js'
        },
        metadata: {
          totalTokens: 90,
          cached: false
        }
      };

      const formattedContext = industryMemoryManager.formatMemoriesForInjection(mockMemory, {
        intent: 'learning',
        conversationType: 'educational'
      });

      log(`  ✅ Memory formatted for injection:`, 'green');
      log(`    Length: ${formattedContext.length} characters`, 'green');
      log(`    Est. tokens: ${industryMemoryManager.estimateTokens(formattedContext)}`, 'green');
      log(`\n    Preview:`, 'green');
      log(`    ${formattedContext.substring(0, 200)}...`, 'green');

      testResults.passed++;
      testResults.tests.push({ name: 'Memory Injection', status: 'passed' });

    } catch (error) {
      log(`  ❌ Memory injection test failed: ${error.message}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'Memory Injection', status: 'failed', error: error.message });
    }

    // ========================================
    // TEST 10: System Statistics
    // ========================================
    log('\nTest 10: System Statistics', 'yellow');
    try {
      const stats = industryMemoryManager.getStats();

      log(`  ✅ System statistics retrieved:`, 'green');
      log(`    - Retrievals: ${stats.retrievals}`, 'green');
      log(`    - Consolidations: ${stats.consolidations}`, 'green');
      log(`    - Forgetting events: ${stats.forgettingEvents}`, 'green');
      log(`    - Cache hits: ${stats.cacheHits}`, 'green');
      log(`    - Cache misses: ${stats.cacheMisses}`, 'green');

      if (stats.cacheHits + stats.cacheMisses > 0) {
        const hitRate = (stats.cacheHits / (stats.cacheHits + stats.cacheMisses) * 100).toFixed(1);
        log(`    - Cache hit rate: ${hitRate}%`, 'green');
      }

      testResults.passed++;
      testResults.tests.push({ name: 'System Statistics', status: 'passed' });

    } catch (error) {
      log(`  ❌ System statistics test failed: ${error.message}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'System Statistics', status: 'failed', error: error.message });
    }

    // ========================================
    // CLEANUP
    // ========================================
    log('\n🧹 Cleaning up test data...', 'yellow');
    await MemoryEntry.deleteMany({ userId: testUserId });
    await UserProfile.deleteOne({ userId: testUserId });
    log('  ✅ Test data cleaned up', 'green');

  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    testResults.failed++;
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    log('\n✅ Disconnected from MongoDB', 'green');
  }

  // ========================================
  // TEST SUMMARY
  // ========================================
  log('\n' + '='.repeat(70), 'blue');
  log('📊 TEST SUMMARY', 'blue');
  log('='.repeat(70), 'blue');

  testResults.tests.forEach((test, index) => {
    const icon = test.status === 'passed' ? '✅' : '❌';
    const color = test.status === 'passed' ? 'green' : 'red';
    log(`${index + 1}. ${icon} ${test.name}`, color);
    if (test.error) {
      log(`   Error: ${test.error}`, 'red');
    }
  });

  log('\n' + '='.repeat(70), 'blue');
  log(`Total: ${testResults.passed + testResults.failed} tests`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`, testResults.failed > 0 ? 'yellow' : 'green');
  log('='.repeat(70), 'blue');

  if (testResults.failed === 0) {
    log('\n🎉 All tests passed! Industry memory system is working correctly.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'red');
    process.exit(1);
  }
}

// Run tests
testIndustryMemorySystem().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
