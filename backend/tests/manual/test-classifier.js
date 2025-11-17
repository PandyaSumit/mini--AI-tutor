/**
 * Manual Test for Query Classifier
 * Run with: node tests/manual/test-classifier.js
 */

import queryClassifier from '../../ai/classifiers/queryClassifier.js';

const testQueries = [
  // RAG queries
  { query: 'What is Python?', expected: 'rag', description: 'Factual question' },
  { query: 'How does async/await work?', expected: 'rag', description: 'Technical question' },
  { query: 'Explain object-oriented programming', expected: 'rag', description: 'Explanation request' },
  { query: 'Tell me about Python course', expected: 'rag', description: 'Course query' },
  { query: 'I want to learn React', expected: 'rag', description: 'Learning query' },

  // Simple queries
  { query: 'Hi', expected: 'simple', description: 'Greeting' },
  { query: 'Hello there!', expected: 'simple', description: 'Greeting with punctuation' },
  { query: 'How are you?', expected: 'simple', description: 'Conversational question' },
  { query: 'Tell me a joke', expected: 'simple', description: 'Casual request' },
  { query: 'Thanks', expected: 'simple', description: 'Short acknowledgment' },
];

async function runTests() {
  console.log('🧪 Manual Query Classifier Test\n');
  console.log('━'.repeat(80));

  let passed = 0;
  let failed = 0;

  for (const test of testQueries) {
    try {
      const result = await queryClassifier.classify(test.query, { useLLM: false });
      const match = result.mode === test.expected;

      if (match) {
        passed++;
        console.log(`✅ PASS: "${test.query}"`);
      } else {
        failed++;
        console.log(`❌ FAIL: "${test.query}"`);
        console.log(`   Expected: ${test.expected}, Got: ${result.mode}`);
      }

      console.log(`   Description: ${test.description}`);
      console.log(`   Mode: ${result.mode}, Confidence: ${result.confidence.toFixed(2)}, Method: ${result.method}`);
      console.log('');

    } catch (error) {
      failed++;
      console.log(`❌ ERROR: "${test.query}"`);
      console.log(`   ${error.message}`);
      console.log('');
    }
  }

  console.log('━'.repeat(80));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testQueries.length} tests`);

  // Test statistics
  console.log('\n📈 Classifier Statistics:');
  const stats = queryClassifier.getStats();
  console.log(JSON.stringify(stats, null, 2));

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
console.log('Starting manual tests...\n');
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
