/**
 * Thinking Process Generator
 * Generates realistic thinking steps for AI responses
 * Similar to Claude.ai and ChatGPT o1 extended thinking
 */

class ThinkingGenerator {
  /**
   * Generate thinking steps for a query
   * @param {string} query - User's question
   * @param {object} context - Additional context (RAG sources, mode, etc.)
   * @returns {Array} Array of thinking steps
   */
  generateThinkingSteps(query, context = {}) {
    const steps = [];
    const { mode, sources, hasRAG } = context;

    // Step 1: Understanding the query
    steps.push({
      phase: 'understanding',
      title: 'Understanding the question',
      content: this._generateUnderstandingStep(query),
      timestamp: Date.now(),
      duration: this._randomDuration(100, 300)
    });

    // Step 2: If RAG mode, mention searching knowledge base
    if (mode === 'rag' || hasRAG) {
      steps.push({
        phase: 'search',
        title: 'Searching knowledge base',
        content: this._generateSearchStep(query, sources),
        timestamp: Date.now() + 300,
        duration: this._randomDuration(200, 500)
      });
    }

    // Step 3: Analysis
    steps.push({
      phase: 'analysis',
      title: 'Analyzing information',
      content: this._generateAnalysisStep(query, context),
      timestamp: Date.now() + 800,
      duration: this._randomDuration(300, 600)
    });

    // Step 4: If sources found, mention them
    if (sources && sources.length > 0) {
      steps.push({
        phase: 'synthesis',
        title: 'Synthesizing from sources',
        content: `Found ${sources.length} relevant source${sources.length > 1 ? 's' : ''}. Integrating information to provide a comprehensive answer.`,
        timestamp: Date.now() + 1400,
        duration: this._randomDuration(200, 400)
      });
    }

    // Step 5: Formulating response
    steps.push({
      phase: 'formulation',
      title: 'Formulating response',
      content: this._generateFormulationStep(query, context),
      timestamp: Date.now() + 1800,
      duration: this._randomDuration(150, 350)
    });

    return steps;
  }

  /**
   * Generate understanding step content
   */
  _generateUnderstandingStep(query) {
    const queryLength = query.length;
    const hasQuestion = query.includes('?');
    const keywords = this._extractKeywords(query);

    let content = `Analyzing the user's query: "${query.substring(0, 100)}${queryLength > 100 ? '...' : ''}"`;

    if (keywords.length > 0) {
      content += ` Key topics identified: ${keywords.slice(0, 3).join(', ')}.`;
    }

    if (hasQuestion) {
      content += ' This is a direct question requiring a specific answer.';
    } else {
      content += ' This appears to be a statement or request for information.';
    }

    return content;
  }

  /**
   * Generate search step content
   */
  _generateSearchStep(query, sources = []) {
    if (sources && sources.length > 0) {
      return `Performing semantic search across knowledge base. Query embedded and compared against ${sources.length > 100 ? '100+' : sources.length} potential sources.`;
    }
    return 'Initiating semantic search to find relevant information from the knowledge base.';
  }

  /**
   * Generate analysis step content
   */
  _generateAnalysisStep(query, context) {
    const { mode, sources } = context;

    if (mode === 'rag' && sources && sources.length > 0) {
      const avgScore = sources.reduce((acc, s) => acc + (s.score || 0), 0) / sources.length;
      return `Evaluating ${sources.length} sources with average relevance score of ${(avgScore * 100).toFixed(1)}%. Determining the most pertinent information.`;
    }

    return 'Processing the query to determine the best approach for a comprehensive answer.';
  }

  /**
   * Generate formulation step content
   */
  _generateFormulationStep(query, context) {
    const { mode } = context;

    if (mode === 'rag') {
      return 'Crafting a response that combines retrieved knowledge with contextual understanding. Ensuring accuracy and citing sources.';
    }

    return 'Structuring a clear, accurate response based on the analysis. Ensuring the answer directly addresses the question.';
  }

  /**
   * Extract keywords from query (simple implementation)
   */
  _extractKeywords(query) {
    const stopWords = new Set(['what', 'how', 'why', 'when', 'where', 'who', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);

    const words = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    return [...new Set(words)].slice(0, 5);
  }

  /**
   * Generate random duration for realistic timing
   */
  _randomDuration(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate thinking summary
   */
  generateSummary(steps) {
    const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);
    const phases = [...new Set(steps.map(s => s.phase))];

    return {
      totalSteps: steps.length,
      totalDuration,
      phases,
      summary: `Completed ${steps.length} thinking steps across ${phases.length} phases in ${(totalDuration / 1000).toFixed(2)}s`
    };
  }
}

export default new ThinkingGenerator();
