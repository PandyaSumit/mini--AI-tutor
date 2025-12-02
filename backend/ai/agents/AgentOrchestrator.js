/**
 * AgentOrchestrator - Central coordinator for all platform agents
 * Manages agent lifecycle, routes tasks, aggregates metrics
 */

import { EventEmitter } from 'events';
import ragChain from '../chains/ragChain.js';
import chromaService from '../vectorstore/chromaService.js';
import embeddingService from '../embeddings/embeddingService.js';

class AgentOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.isInitialized = false;

    // Shared dependencies for all agents
    this.sharedDependencies = {
      ragChain,
      chromaService,
      embeddingService
    };

    // Global stats
    this.globalStats = {
      totalCost: 0,
      totalTasks: 0,
      successRate: 0
    };
  }

  /**
   * Initialize all agents
   */
  async initialize() {
    console.log('🤖 Initializing Agent Orchestrator...');

    try {
      // Dynamically import all agents
      const { default: CoursePreparationAgent } = await import('./CoursePreparationAgent.js');
      const { default: TutoringAgent } = await import('./TutoringAgent.js');
      const { default: CostControlAgent } = await import('./CostControlAgent.js');
      const { default: ProgressTrackingAgent } = await import('./ProgressTrackingAgent.js');
      const { default: AdminAgent } = await import('./AdminAgent.js');
      const { default: InstructorVerificationAgent } = await import('./InstructorVerificationAgent.js');
      const { default: PaymentAgent } = await import('./PaymentAgent.js');

      // Register agents
      this.registerAgent('course_preparation', new CoursePreparationAgent());
      this.registerAgent('tutoring', new TutoringAgent());
      this.registerAgent('cost_control', new CostControlAgent());
      this.registerAgent('progress_tracking', new ProgressTrackingAgent());
      this.registerAgent('admin', new AdminAgent());
      this.registerAgent('instructor_verification', new InstructorVerificationAgent());
      this.registerAgent('payment', new PaymentAgent());

      // Initialize all agents with shared dependencies
      for (const [name, agent] of this.agents) {
        await agent.initialize(this.sharedDependencies);
        this.subscribeToAgentEvents(name, agent);
      }

      this.isInitialized = true;
      console.log(`✅ Agent Orchestrator initialized with ${this.agents.size} agents`);

      return { success: true };

    } catch (error) {
      console.error('❌ Agent Orchestrator initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register an agent
   */
  registerAgent(name, agent) {
    if (this.agents.has(name)) {
      throw new Error(`Agent ${name} already registered`);
    }

    this.agents.set(name, agent);
    console.log(`   📌 Registered agent: ${name}`);
  }

  /**
   * Subscribe to agent events for monitoring
   */
  subscribeToAgentEvents(name, agent) {
    agent.on('task:success', (data) => {
      this.globalStats.totalTasks++;
      this.globalStats.totalCost += data.result.cost || 0;
      this.updateSuccessRate();
      this.emit('agent:task:success', { agent: name, ...data });
    });

    agent.on('task:failed', (data) => {
      this.globalStats.totalTasks++;
      this.updateSuccessRate();
      this.emit('agent:task:failed', { agent: name, ...data });
    });

    agent.on('log', (logEntry) => {
      this.emit('agent:log', { agent: name, ...logEntry });
    });
  }

  /**
   * Route task to appropriate agent
   */
  async routeTask(agentName, task) {
    if (!this.isInitialized) {
      throw new Error('AgentOrchestrator not initialized');
    }

    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    return await agent.handle(task);
  }

  /**
   * Execute multiple agents in parallel
   */
  async executeParallel(tasks) {
    const promises = tasks.map(({ agent, task }) =>
      this.routeTask(agent, task).catch(error => ({
        success: false,
        agent,
        error: error.message
      }))
    );

    return await Promise.all(promises);
  }

  /**
   * Execute multiple agents in sequence
   */
  async executeSequence(tasks) {
    const results = [];

    for (const { agent, task } of tasks) {
      const result = await this.routeTask(agent, task);
      results.push(result);

      // Stop if any task fails (optional)
      if (!result.success && task.stopOnFailure) {
        break;
      }
    }

    return results;
  }

  /**
   * Get specific agent
   */
  getAgent(name) {
    return this.agents.get(name);
  }

  /**
   * Get all agent stats
   */
  getAllStats() {
    const agentStats = {};

    for (const [name, agent] of this.agents) {
      agentStats[name] = agent.getStats();
    }

    return {
      global: this.globalStats,
      agents: agentStats
    };
  }

  /**
   * Update global success rate
   */
  updateSuccessRate() {
    let totalSuccess = 0;
    let totalTasks = 0;

    for (const agent of this.agents.values()) {
      totalSuccess += agent.stats.successfulRequests;
      totalTasks += agent.stats.totalRequests;
    }

    this.globalStats.successRate = totalTasks > 0 ? (totalSuccess / totalTasks) * 100 : 0;
  }

  /**
   * Shutdown all agents
   */
  async shutdown() {
    console.log('🛑 Shutting down Agent Orchestrator...');

    for (const [name, agent] of this.agents) {
      await agent.shutdown();
    }

    this.isInitialized = false;
    console.log('✅ Agent Orchestrator shut down');
  }
}

// Export singleton instance
const orchestrator = new AgentOrchestrator();
export default orchestrator;
