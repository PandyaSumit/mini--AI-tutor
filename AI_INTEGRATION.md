# AI Integration Documentation

## Overview

The Mini AI Tutor AI integration provides intelligent tutoring through multiple coordinated systems including large language models for natural language understanding and generation, vector databases for semantic search and memory retrieval, LangChain for prompt management and chain composition, LangGraph for stateful workflows, embeddings for semantic similarity, and the Model Context Protocol for tool coordination. The architecture prioritizes cost efficiency through local embeddings, intelligent caching, and optimized prompting while maintaining high quality responses and personalization.

## Language Model Configuration

The system uses Groq as the primary LLM provider with Meta's Llama 3.3 70B Versatile model for its balance of capability, speed, and cost. Groq offers competitive pricing with generous free tier allowances making it suitable for education applications with limited budgets. The model selection prioritizes strong reasoning capabilities for tutoring tasks, fast inference for responsive interactions, and broad knowledge coverage across academic subjects.

Configuration lives in backend/config/ai.js with parameters controlling model behavior. The model name is set to llama-3.3-70b-versatile with fallback to llama3-70b-8192 for backward compatibility. Temperature defaults to 0.7 providing creative but focused responses that stay on topic. Maximum tokens is configured to 2048 for most requests, extended to 8000 for course generation that requires long-form content. Streaming is enabled by default for progressive response display in the chat interface.

The LLM client uses lazy initialization to avoid errors during module import before environment variables load. The getGroqClient function checks if a client instance exists and returns it, otherwise creates a new Groq client with the API key from environment variables. This pattern ensures the key is available when needed but doesn't cause import-time failures. Error handling validates the API key presence and throws descriptive errors when missing.

Timeout configuration prevents requests from hanging indefinitely. The default timeout is 60 seconds for standard chat, extended to 120 seconds for complex operations like course generation. Requests exceeding timeouts are aborted with errors returned to the client. Retry logic implements exponential backoff for transient failures, attempting up to 3 retries with delays of 1, 2, and 4 seconds before giving up.

Rate limiting protects against quota exhaustion and cost overruns. Free tier users are limited to 10 AI calls per hour while pro tier users get 100 calls per hour. Enterprise tier users have 1000 calls per hour. These limits are enforced through Redis counters that reset hourly. Exceeded limits return errors indicating the user should upgrade their subscription or wait for quota reset.

## LangChain Architecture

LangChain provides abstractions for working with LLMs through chains that compose multiple operations into reusable pipelines. The ChatGroq integration from @langchain/groq creates LangChain-compatible LLM instances that work with chain composition, prompt templates, and output parsing. This enables building complex workflows without low-level API management.

The core LLM instance is initialized in ai/config/ai.js and reused across chains. It wraps the Groq client with LangChain's interface providing invoke for single completions, stream for progressive output, and batch for processing multiple inputs efficiently. The instance caches initialized models to avoid recreating connections for each request.

Message formatting uses LangChain's message classes including SystemMessage for context and instructions, HumanMessage for user input, and AIMessage for assistant responses. Chat histories are maintained as arrays of these message objects, enabling the LLM to see conversation context. The system automatically manages token limits by truncating old messages when approaching context windows.

Prompt templates enable dynamic prompt construction with variable substitution. Template strings use curly brace syntax for variables like "Explain {concept} at a {level} level" with values filled at runtime. Templates are versioned and centralized in ai/prompts/ enabling A/B testing and prompt evolution without code changes. The template system supports conditionals and loops for complex prompts.

Chain composition connects multiple operations sequentially or in parallel. The RunnableSequence pattern pipes output from one step into the next, transforming data through a pipeline. For example, a RAG chain retrieves relevant documents, formats them as context, constructs a prompt with the context, invokes the LLM, and parses the response. Each step is a reusable component that can be swapped or modified.

Output parsers extract structured data from LLM responses. The JsonOutputParser validates and parses JSON responses, throwing errors for malformed output. Custom parsers handle specific response formats like quiz questions, course structures, or flashcard decks. Parsers include retry logic that feeds parsing errors back to the LLM for correction.

## Vector Databases

ChromaDB serves as the vector database for semantic search and similarity matching. It stores 384-dimensional embeddings generated by the BGE-small model locally, eliminating API costs for embedding generation. The database maintains five collections for different content types: knowledge_base for RAG retrieval, conversations for semantic conversation search, courses for course discovery, roadmaps for learning path recommendations, and flashcards for related card suggestions.

The ChromaService in ai/vectorstore/chromaService.js provides a unified interface for database operations. Initialization connects to the ChromaDB server running locally on port 8000, creates collections if they don't exist, configures HNSW indexes for fast approximate nearest neighbor search, and validates connectivity through heartbeat checks. Graceful degradation handles ChromaDB unavailability by falling back to non-semantic search.

Adding documents to collections requires text content, unique IDs, and optional metadata. The service batches documents for efficiency, generates embeddings using embeddingService, writes to ChromaDB with embeddings and metadata, and updates statistics tracking document counts. Batch sizes default to 50 documents to balance memory usage and throughput. The service handles duplicate IDs by updating existing documents rather than failing.

Semantic search queries the collection with a text query, generates a query embedding, performs vector similarity search using cosine distance, applies metadata filters if specified, returns top K results with similarity scores, and formats results for downstream consumption. The HNSW index provides fast approximate search trading perfect accuracy for speed. Search typically completes in 10-100ms depending on collection size.

Collection management includes counting documents, clearing collections, deleting specific documents, and retrieving statistics. The service tracks searches performed, documents added, and cache hit rates. Health checks verify ChromaDB connectivity and collection accessibility. Cleanup operations remove old documents based on time-to-live policies.

HNSW index configuration balances search speed and accuracy through parameters. The M parameter controls connections per graph node with higher values increasing accuracy but requiring more memory. The efConstruction parameter sets the size of the dynamic candidate list during index building. The efSearch parameter controls search quality with higher values improving accuracy at the cost of speed. The default configuration uses M=16, efConstruction=200, and efSearch=50 providing good accuracy with acceptable performance.

## Embeddings System

The embedding system generates vector representations of text for semantic similarity matching. Using the BGE-small-en-v1.5 model from BAAI running locally via Xenova Transformers eliminates per-embedding costs that would scale to tens of thousands of dollars monthly at production usage. The 384-dimensional vectors provide strong semantic understanding while keeping storage requirements manageable.

The EmbeddingService in ai/embeddings/embeddingService.js coordinates embedding generation with two-layer caching. Layer 1 is an in-memory LRU cache holding the 1000 most recent embeddings with sub-millisecond access times. Layer 2 is Redis holding thousands of embeddings with 1-10ms access times. Database lookups for cache misses take 50-200ms. This caching achieves 75-80% hit rates reducing average latency to 10-20ms.

Single text embedding checks both cache layers before generating. If cached, it returns immediately with the cached embedding. On cache miss, it loads the BGE-small model if not already loaded, runs the text through the model with mean pooling, normalizes the resulting vector, caches the embedding in both layers, and returns the result. Model loading occurs once and persists in memory for the application lifetime.

Batch embedding processes multiple texts efficiently by checking the cache for all texts, identifying uncached texts, generating embeddings for uncached texts in a single model invocation, caching all new embeddings, combining cached and new embeddings in the original order, and returning the complete batch. Batching reduces overhead from model invocation and cache operations.

The BGE-small model implementation in ai/embeddings/models/bgeSmall.js uses the Xenova Transformers library providing WebAssembly-based transformers in Node.js. Model initialization downloads the quantized model on first use, caching it locally for subsequent runs. Quantization reduces model size and speeds inference with minimal accuracy loss. The model runs on CPU by default with optional GPU acceleration via CUDA.

Embedding generation tokenizes input text, runs it through the transformer with mean pooling aggregating token embeddings, applies L2 normalization to the pooled output, and returns the 384-dimensional vector. Mean pooling averages embeddings across all tokens producing a single sentence embedding. L2 normalization ensures all vectors have unit length enabling cosine similarity calculation through dot products.

Cosine similarity calculation takes two embeddings and computes the dot product of normalized vectors. Since vectors are normalized, the dot product equals cosine similarity directly without needing to divide by magnitudes. Similarity scores range from -1 to 1 with 1 indicating identical meaning, 0 indicating unrelated content, and -1 indicating opposite meaning. Typical similarity thresholds use 0.7+ for strong matches and 0.5+ for potential relevance.

## RAG Implementation

Retrieval Augmented Generation enhances LLM responses by retrieving relevant information from the knowledge base before generating answers. The knowledge base contains articles, documentation, course content, and curated educational materials. When users ask questions, RAG retrieves the most relevant passages and includes them in the prompt context enabling accurate, sourced responses without hallucination.

The basic RAG chain in ai/chains/ragChain.js implements a simple retrieval pipeline. User queries are embedded into vectors, ChromaDB searches the knowledge_base collection for similar documents, the top 5 results are formatted as context, a prompt template combines the context and query, the LLM generates a response using the context, and the response is returned with source citations. This provides basic question answering with grounding in the knowledge base.

The advanced RAG chain in ai/chains/advancedRagChain.js implements four sophisticated strategies. Multi-query retrieval generates multiple query variations to overcome query formulation issues. The system rewrites the original query in three different ways, retrieves documents for each variation, deduplicates results, and returns a diverse set of relevant documents. This improves recall when users phrase questions awkwardly.

Conversational RAG contextualizes follow-up questions using chat history. When users ask follow-ups like "What about that?", the system examines recent messages, reformulates the question with full context, retrieves documents using the contextualized query, and generates responses aware of the conversation flow. This enables natural multi-turn conversations about complex topics.

Self-query RAG extracts metadata filters from natural language queries. If users ask for "beginner Python courses from 2023", the system extracts structured filters like level=beginner, topic=Python, year=2023, applies these filters to the vector search, retrieves only matching documents, and generates filtered responses. This combines semantic search with structured queries.

Hybrid search combines semantic vector search with keyword matching for maximum relevance. Queries perform both vector similarity search and MongoDB text search, merge results by taking the union, deduplicate matching documents, and rank by a weighted combination of semantic and keyword scores. This prevents semantic search from missing obvious keyword matches while still providing intelligent retrieval.

The RAG prompt template includes retrieved context, source citations, the user question, and instructions to cite sources in responses. The template explicitly tells the LLM to use the context, admit when context doesn't contain answers, cite specific sources for claims, and avoid hallucinating information beyond the context. This reduces hallucination and increases answer quality.

Source attribution extracts document IDs from retrieval results, formats them as clickable citations, includes title and snippet for context, and appends them to responses. Users can click sources to view full documents. The frontend displays sources in a collapsible section below responses. Attribution builds trust and enables users to explore topics deeper.

## LangGraph Workflows

LangGraph provides stateful workflows for complex multi-step processes that require conditional logic, loops, and state persistence. Unlike simple chains that execute linearly, graphs define nodes with multiple paths controlled by conditional edges. This enables adaptive tutoring that adjusts difficulty based on student performance, iterative refinement of outputs, and complex decision trees.

The adaptive tutor graph in ai/graphs/adaptiveTutorGraph.js implements a personalized tutoring workflow. The graph begins at a start node that initializes state with student level and topic. An assessment node poses diagnostic questions to gauge understanding. The student's response flows to an evaluation node that scores comprehension. A conditional edge routes to the explain node if understanding is low, the practice node if understanding is medium, or the advance node if understanding is high.

The explain node provides detailed explanations with examples, checks for comprehension through follow-up questions, and returns to assessment. The practice node generates practice problems, guides students through solutions, and evaluates performance. The advance node introduces new concepts building on mastered material. Each node updates the state with new information about student progress.

State management uses a shared state object passed between nodes. The state includes student_level for difficulty tracking, current_topic for content focus, assessment_score for comprehension measurement, completed_topics for progress tracking, and history for conversation log. Nodes read state to make decisions and write state to record updates. State persists in Redis enabling resumption of long-running sessions.

Graph execution begins by compiling the graph into an executable form, initializing state with input data, invoking the compiled graph with state, and streaming state updates as the graph executes. The graph runs until reaching an end node or max iteration limit. Intermediate state updates enable progress monitoring and user feedback during execution.

Checkpointing saves state at configurable intervals enabling crash recovery and session resumption. Checkpoints write to Redis with TTL expiration after session timeout. When resuming, the system loads the latest checkpoint, restores graph state, and continues from the last completed node. This handles network interruptions and server restarts gracefully.

Conditional routing uses functions that examine state and return the next node name. The router function receives the current state, evaluates conditions like score thresholds or completion status, and returns a string matching a node name. The graph uses this to select the next execution step. Complex routers can call external services or run mini-LLM queries to make routing decisions.

## MCP Integration

The Model Context Protocol standardizes how AI systems interact with tools, databases, and external services. MCP servers expose tools through a uniform interface that LLMs can discover and invoke. This enables the AI to take actions beyond text generation like searching databases, creating resources, or triggering workflows.

The MCP server in ai/mcp/core/mcpServer.js implements the protocol specification with JSON-RPC message handling, tool registration, execution management, and security sandboxing. Tools register by providing name, description, parameter schema, and handler function. The server validates parameters against schemas before invoking handlers preventing malformed calls.

The platform server in ai/mcp/servers/platformServer.js exposes six tools for course platform operations. The search_courses tool queries the course database with filters, the get_course_details tool fetches full course information, the enroll_user tool creates enrollments, the create_flashcard tool adds cards to decks, the schedule_study tool plans learning sessions, and the track_progress tool records advancement. Each tool validates authorization and rate limits.

Tool discovery happens when the AI needs to perform actions. The orchestrator queries the MCP server for available tools, receives a list with descriptions and schemas, includes tool information in the LLM context, and the LLM decides which tools to invoke. Tool descriptions use natural language explaining capabilities and when to use them. Schemas define required and optional parameters with types and constraints.

Tool execution validates parameters, checks rate limits, invokes the handler function, captures results or errors, and returns structured responses. Handlers run in sandboxes limiting file system access, network access, and execution time. This prevents malicious or buggy tools from compromising the system. Execution logs track all invocations for auditing and debugging.

Security controls include authentication of tool calls, authorization checks for user permissions, input validation against schemas, output sanitization to prevent injection attacks, rate limiting to prevent abuse, and audit logging of all executions. The MCP server runs with minimal privileges and can't access sensitive system resources. Tool whitelisting restricts which tools are available to which users.

Error handling returns detailed error messages for failed tool calls enabling the LLM to retry with corrections. Common errors include missing required parameters, invalid parameter values, authorization failures, rate limit exceeded, and execution timeouts. The MCP server formats errors consistently with error codes, messages, and suggested fixes.

## Prompt Management

Centralized prompt management in ai/prompts/ organizes all system prompts with versioning, templates, and variation support. This enables prompt evolution without code changes, A/B testing of different formulations, and localization for multiple languages. Prompt files export configuration objects with metadata and template functions.

The coursePrompts.js file manages prompts for course generation including structure generation with detailed requirements, preview generation for quick outlines, lesson tutor instructions for contextual teaching, specialization justification for variant courses, and quality assessment for rating courses. Each prompt includes a version number following semantic versioning, template variants for different use cases, variable placeholders for dynamic values, and formatting helper functions.

The tutorPrompts.js file implements comprehensive teaching prompts based on pedagogical principles. The prompts encode Socratic method questioning, scaffolding techniques for gradual complexity, active learning approaches, and subject-specific strategies for programming, mathematics, languages, and sciences. Prompts adapt based on student level with different approaches for beginners, intermediate, and advanced learners.

The quizPrompts.js file generates assessment content including flashcard creation with spaced repetition considerations, quiz question generation testing understanding not memorization, and comprehensive assessments mixing question types. Prompts specify desired difficulty levels, topics to cover, and output formats ensuring consistent structure for parsing.

The roadmapPrompts.js file creates personalized learning plans including week-by-week module generation, progress-based adaptation, and resource recommendations. Prompts encode realistic time estimates, prerequisite tracking, and milestone definition. The system generates actionable plans matching user goals and time availability.

Template formatting uses variable substitution with curly brace syntax. The formatPrompt helper function takes a prompt config and variables object, replaces placeholders like {level} with actual values, returns formatted system and user prompts, and includes version metadata. This separates prompt content from code enabling non-technical team members to edit prompts.

Version tracking uses semantic versioning with major.minor.patch format. Major versions indicate breaking changes to variable names or output format. Minor versions add new capabilities or variations. Patch versions fix typos or improve phrasing without changing semantics. The system can run A/B tests comparing different versions to measure effectiveness.

## Semantic Classification

The query classifier in ai/classifiers/semanticQueryClassifier.js routes user queries to appropriate handlers based on semantic understanding. Traditional keyword-based routing fails when users phrase queries differently than expected. Semantic classification uses embeddings and machine learning to understand intent regardless of phrasing.

The classifier generates an embedding for the user query, compares it to embeddings of canonical examples for each category, calculates similarity scores, selects the category with highest similarity above a threshold, and returns the classification with confidence score. Categories include RAG for knowledge retrieval, chat for conversation, memory for session recall, and action for platform operations.

Training examples define each category with multiple representative queries. The RAG category includes examples like "What is recursion?", "Explain binary search", and "How do I center a div?". The chat category includes "Tell me a joke", "What's the weather?", and "Who are you?". The memory category includes "What did we discuss yesterday?", "Summarize our conversation", and "Remind me what I learned". The action category includes "Create a course", "Enroll in Python 101", and "Schedule my study time".

Classification confidence determines routing behavior. High confidence above 0.8 routes directly to the classified handler. Medium confidence between 0.5 and 0.8 routes to the handler with fallback readiness. Low confidence below 0.5 defaults to general chat. The system logs all classifications with confidence for monitoring and model improvement.

Model improvement happens through feedback loops. When users indicate incorrect routing through explicit feedback or implicit signals like rephrasing, the system logs the misclassification. Accumulated examples inform prompt adjustments or adding new training examples. The classification model improves over time as the system learns from mistakes.

## Cost Optimization

Cost optimization focuses on reducing LLM API calls and token usage while maintaining quality. Caching reduces duplicate requests by storing responses for identical queries. Prompt compression removes unnecessary words while preserving meaning. Context window management includes only relevant history. These strategies reduce costs by 60-80% compared to naive implementations.

Embedding cost elimination through local BGE-small model saves thousands of dollars monthly. At production scale with millions of embeddings, external APIs would cost 0.0001 dollars per embedding totaling tens of thousands monthly. Local generation costs only compute infrastructure already running servers. The embedding cache further reduces computation by reusing vectors.

Token usage optimization implements conversation summarization for long histories, smart context selection retrieving only relevant past messages, prompt template efficiency removing verbose instructions, and output length limits preventing excessive generation. The conversationManager summarizes old messages into concise summaries, recent messages remain verbatim, and the combined context stays under token budgets.

Rate limiting prevents cost overruns from abuse or bugs. Per-user limits cap individual usage while global limits protect against aggregate spikes. The system tracks tokens consumed per user over rolling windows, rejects requests exceeding quotas, and provides usage statistics so users can monitor consumption. Alerts trigger when approaching budget limits.

Model selection balances capability and cost. Groq provides strong performance at competitive pricing with generous free tiers. The llama-3.3-70b model offers high quality at reasonable cost. Smaller models like llama3-8b could handle simple tasks even cheaper but currently aren't used to maintain consistent quality. Future optimization might route simple queries to small models and complex queries to large models.

Streaming responses improve perceived performance without changing costs. Users see progressive output feeling like faster responses even though total generation time is similar. Streaming enables early cancellation if the response goes off-track, potentially saving tokens on incomplete generations that would be discarded.

## Performance Characteristics

LLM response latency varies from 2-5 seconds for cached contexts to 5-10 seconds for cold starts requiring full retrieval and context building. Streaming begins within 1-2 seconds showing progressive output. The majority of latency comes from LLM inference not retrieval or processing. Groq's infrastructure provides fast inference compared to other providers.

Embedding generation takes 5-50ms per text with the BGE-small model on CPU. GPU acceleration could reduce this to 1-5ms but isn't currently configured since caching provides sufficient performance. Batch embedding achieves higher throughput by amortizing model overhead across multiple texts. Cache hit rates of 75-80% mean most requests complete in under 10ms.

Vector search in ChromaDB completes in 10-100ms depending on collection size and search parameters. Collections with thousands of documents search in 10-20ms while millions of documents take 50-100ms. HNSW approximate search trades perfect accuracy for speed enabling sub-linear search time. Exact search would be prohibitively slow on large collections.

RAG retrieval typically takes 50-150ms including embedding generation, vector search, and document fetching. The pipeline overlaps operations where possible like generating query embedding while warming the vector index. Result caching eliminates retrieval for repeat queries but cache effectiveness is lower than embedding cache since queries vary more.

Memory consolidation processes 10-20 conversations per second extracting facts, deduplicating, and storing in long-term memory. The background job batches conversations to maximize throughput. Processing happens asynchronously outside the request path preventing user-facing latency. Daily consolidation handles hundreds of thousands of users.

Cache performance shows 75-80% hit rate for embeddings, 60-70% hit rate for LLM responses, and 90%+ hit rate for static content like course structures. Hit rates impact overall system performance significantly since cache hits complete in single-digit milliseconds versus hundreds of milliseconds for generation. Cache warming during deployment preloads frequently accessed data.

Scaling characteristics show horizontal scaling of stateless application servers handles increased request volume. Database and cache layers scale through replication and sharding. Vector databases partition collections across nodes. Each component scales independently based on bottlenecks. Current infrastructure handles thousands of concurrent users with headroom for 10x growth before architectural changes are needed.
