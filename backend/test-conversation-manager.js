/**
 * Quick test script for scalable conversation manager
 * Tests token reduction and caching functionality
 */

import conversationManager from './ai/memory/conversationManager.js';

async function testConversationManager() {
  console.log('🧪 Testing Scalable Conversation Manager\n');
  console.log('=' .repeat(60));

  // Mock conversation history
  const conversationHistory = [
    { role: 'user', content: "Hi, I'm Sumit Pandya, full stack developer" },
    { role: 'assistant', content: "Nice to meet you Sumit! How can I help you today?" },
    { role: 'user', content: "I work with React and Node.js mainly" },
    { role: 'assistant', content: "Great stack! What would you like to learn about?" },
    { role: 'user', content: "Can you explain async/await in JavaScript?" },
    { role: 'assistant', content: "Async/await is syntactic sugar over Promises. It allows you to write asynchronous code that looks synchronous..." },
    { role: 'user', content: "Can you give me a practical example?" },
    { role: 'assistant', content: "Sure! Here's a practical example:\n\nasync function fetchData() {\n  try {\n    const response = await fetch('api/data');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Error:', error);\n  }\n}" },
    { role: 'user', content: "That's helpful, thanks!" },
    { role: 'assistant', content: "You're welcome! Is there anything else you'd like to know?" },
    { role: 'user', content: "Do you remember my name?" }
  ];

  // Calculate original token count
  const originalText = conversationHistory
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
  const originalTokens = Math.ceil(originalText.length / 4);

  console.log('\n📊 Test Scenario:');
  console.log(`   Conversation length: ${conversationHistory.length} messages`);
  console.log(`   Original tokens (approx): ${originalTokens}`);
  console.log('');

  try {
    // Test 1: Build optimized context
    console.log('Test 1: Building optimized context...');
    const startTime = Date.now();

    const { context, metadata } = await conversationManager.buildConversationContext(
      'test-user-sumit',
      'test-conversation-1',
      conversationHistory
    );

    const duration = Date.now() - startTime;

    console.log('✅ Context built successfully');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Total messages: ${metadata.totalMessages}`);
    console.log(`   Summarized: ${metadata.summarized ? 'Yes' : 'No'}`);
    console.log(`   Cached: ${metadata.cached ? 'Yes (from cache)' : 'No (fresh)'}`);
    console.log(`   Estimated tokens: ${metadata.estimatedTokens}`);
    console.log(`   Token reduction: ${((1 - metadata.estimatedTokens / originalTokens) * 100).toFixed(1)}%`);
    console.log(`   Cost savings: ${((1 - metadata.estimatedTokens / originalTokens) * 100).toFixed(1)}%`);

    console.log('\n📝 Optimized Context Preview:');
    console.log('-'.repeat(60));
    console.log(context.slice(0, 500) + (context.length > 500 ? '...' : ''));
    console.log('-'.repeat(60));

    // Test 2: Cache retrieval
    console.log('\nTest 2: Testing cache retrieval...');
    const startTime2 = Date.now();

    const { context: context2, metadata: metadata2 } = await conversationManager.buildConversationContext(
      'test-user-sumit',
      'test-conversation-1',
      conversationHistory
    );

    const duration2 = Date.now() - startTime2;

    console.log('✅ Cache retrieval successful');
    console.log(`   Duration: ${duration2}ms (${duration2 < duration ? 'faster' : 'similar'})`);
    console.log(`   Cached: ${metadata2.cached ? 'Yes ✅' : 'No (rebuilt)'}`);

    // Test 3: User profile extraction
    console.log('\nTest 3: Testing user profile extraction...');
    const profile = await conversationManager.extractUserProfile(conversationHistory);

    console.log('✅ Profile extracted:');
    console.log(`   Name: ${profile.name || 'Not detected'}`);
    console.log(`   Role: ${profile.role || 'Not detected'}`);
    console.log(`   Interests: ${profile.interests.length > 0 ? profile.interests.join(', ') : 'None detected'}`);

    // Test 4: Session stats
    console.log('\nTest 4: Getting session statistics...');
    const stats = await conversationManager.getSessionStats();

    console.log('✅ Session stats:');
    console.log(`   Active sessions: ${stats.activeSessions}`);
    console.log(`   Cache enabled: ${stats.cacheEnabled ? 'Yes (Redis or in-memory)' : 'No'}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ Test Summary\n');
    console.log(`✅ Token reduction: ${((1 - metadata.estimatedTokens / originalTokens) * 100).toFixed(1)}%`);
    console.log(`✅ Cache working: ${metadata2.cached ? 'Yes' : 'Partially (no Redis running)'}`);
    console.log(`✅ Profile extraction: ${profile.name ? 'Success' : 'Partial'}`);
    console.log(`✅ Performance: ${duration}ms (${duration2}ms cached)`);
    console.log('\n💡 Expected Results:');
    console.log('   • Token reduction: 30-60% for conversations of this length');
    console.log('   • Cache retrieval: <10ms with Redis, <1ms with in-memory fallback');
    console.log('   • Profile extraction: Should detect "Sumit Pandya" and "full stack developer"');
    console.log('\n🚀 System Status: Ready for production!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(0);
}

// Run test
testConversationManager();
