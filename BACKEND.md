# Backend Documentation

## Overview

The Mini AI Tutor backend is built with Express.js 4.18.2 running on Node.js with MongoDB as the primary database, Redis for caching and session management, and ChromaDB for vector storage. The server provides RESTful API endpoints, WebSocket connections for real-time voice interactions, and Server-Sent Events for streaming AI responses. The architecture supports millions of concurrent users through horizontal scaling, distributed caching, and efficient database indexing.

## Server Architecture

The server initialization follows a multi-phase async startup pattern to ensure all dependencies are properly configured before accepting requests. The entry point in server.js loads environment variables using dotenv, establishes the MongoDB connection, initializes the cache system with circuit breaker protection, configures Socket.IO for WebSocket communication, and starts the HTTP server on the configured port.

Express middleware is configured in a specific order to handle security, parsing, logging, and routing. Helmet provides security headers to protect against common web vulnerabilities. CORS is configured to allow requests from the frontend origin with credentials support. Body parser middleware handles JSON and URL-encoded request bodies up to the configured size limits. Morgan logs HTTP requests in development mode for debugging. Rate limiting middleware protects against abuse by limiting requests per IP address across different tiers.

The server implements graceful shutdown handlers that respond to SIGTERM and SIGINT signals. When a shutdown signal is received, the server stops accepting new connections, finishes processing in-flight requests, closes the database connection, shuts down the cache system, stops background jobs, and exits the process. This ensures data integrity and prevents request failures during deployments.

Error handling is centralized in middleware that catches unhandled errors from routes and services. Errors are logged with full stack traces for debugging while returning sanitized error messages to clients. The error handler distinguishes between operational errors that should be reported to users and programming errors that indicate bugs. Operational errors include validation failures, authentication errors, and resource not found errors, while programming errors trigger alerts for investigation.

## Database Architecture

MongoDB serves as the primary datastore with Mongoose as the ODM layer providing schema validation, middleware hooks, and query building. The database uses 18 collections organized around core entities including users, courses, lessons, enrollments, conversations, messages, memory entries, flashcards, and roadmaps. Each collection has carefully designed schemas with validation rules, default values, indexes, and virtuals.

The User schema stores authentication credentials with bcrypt-hashed passwords, profile information including name and email, subscription tier for feature access, reputation score for gamification, earned badges, settings and preferences, and API usage quotas for rate limiting. Compound indexes on email ensure fast authentication lookups while indexes on reputation enable leaderboard queries. The schema includes instance methods for password comparison, token generation, and reputation updates.

The Course schema represents learning content with comprehensive metadata. Fields include title and description for search and display, category classification for filtering, difficulty level for learner matching, creator reference linking to the User who created it, contributor array tracking all participants with revenue share percentages, embedding vector for semantic search using ChromaDB, publication status tracking draft versus published state, quality score derived from ratings and completions, and statistics including enrollment count and completion rate. Indexes optimize queries by category, level, creator, and publication status.

The Module schema organizes courses into logical sections with fields for parent course reference, title and description, order for sequential presentation, objectives listing learning goals, and publication status. Modules contain references to lessons and track statistics like total lesson count and duration. The schema enforces proper ordering and validates that modules belong to existing courses.

The Lesson schema stores individual learning units with fields for parent module reference, title and content, order within the module, duration in minutes, lesson type indicating interactive versus passive content, objectives specific to this lesson, content structure including key points and examples, AI instructions for contextual tutoring, and publication status. Lessons can embed rich content including code blocks, videos, and interactive exercises. The schema validates proper sequencing and content completeness.

The Enrollment schema tracks student progress through courses with fields for user and course references, enrollment date, progress metrics including completion percentage and time spent, quiz scores and assessment results, last accessed timestamp, and completion status. Compound indexes on user and course enable efficient progress lookups. The schema calculates completion based on lessons finished and updates statistics when progress changes.

The Conversation schema manages chat histories with fields for user reference, title derived from first message, message count, last message timestamp, and metadata including total tokens used. Conversations are soft-deleted with a deletedAt timestamp for data retention. The schema provides instance methods to add messages, calculate token usage, and retrieve recent context.

The Message schema stores individual chat messages with fields for parent conversation, role indicating user or assistant, content text, token count, timestamp, and optional metadata like model used or retrieval sources. Messages are ordered by timestamp within conversations. The schema validates role values and tracks token usage for cost monitoring.

The MemoryEntry schema implements the long-term memory system with fields for user reference, content text, memory type classifying facts versus preferences versus experiences, namespace providing hierarchical organization, importance scoring from multiple factors, temporal data including creation and access times, privacy metadata with consent tracking, semantic embedding ID linking to ChromaDB, and access history logging every retrieval. The schema includes methods to calculate importance scores, determine if memories should be forgotten based on age and access patterns, and update access statistics. Compound indexes optimize queries by user, category, and importance.

The UserProfile schema aggregates extracted information from conversations with sections for personal details, professional background, learning preferences, behavioral patterns, and engagement metrics. The schema calculates profile completeness based on filled fields and provides methods to update interests, track engagement, and extract information from conversation text. This profile informs personalized recommendations and adaptive tutoring.

The VoiceSession schema tracks voice interaction sessions with fields for user reference, session status, audio file references in MinIO, transcription text, AI response text, processing timestamps, and error details. Sessions track state transitions from initialized to recording to processing to completed. The schema provides methods to update status and record processing times for performance monitoring.

The Flashcard schema implements spaced repetition learning with fields for user and deck references, question and answer content, difficulty level, scheduling data including next review date and interval, performance metrics tracking review count and success rate, and tags for organization. The schema includes SM-2 algorithm implementation to calculate next review intervals based on user ratings. Indexes optimize queries for cards due for review.

The Roadmap schema stores personalized learning plans with fields for user reference, goal description, total duration and weekly commitment, weekly modules with objectives and resources, milestones marking progress checkpoints, current week tracking, and completion status. Each module includes prerequisite references enforcing sequential learning. The schema validates that modules form a valid directed acyclic graph without circular dependencies.

## API Endpoints

The API provides over 121 endpoints organized into logical groups by domain. All endpoints follow RESTful conventions with appropriate HTTP methods and status codes. Request validation occurs before processing, and errors return consistent JSON structures with success flags and error messages.

Authentication endpoints include POST /api/auth/register for creating new accounts with email and password, POST /api/auth/login for existing user authentication returning JWT tokens, POST /api/auth/logout for token invalidation, POST /api/auth/refresh for obtaining new access tokens, and GET /api/auth/me for fetching the current user profile. Registration validates email format and password strength, hashes passwords with bcrypt, and returns JWT tokens for immediate login. Login compares password hashes and issues tokens valid for 24 hours. Token refresh checks the refresh token validity and issues new access tokens.

User endpoints include GET /api/user/profile for fetching complete profiles, PUT /api/user/profile for updating profile information, GET /api/user/stats for aggregated statistics, PUT /api/user/settings for preference updates, and GET /api/user/badges for earned achievements. Profile updates validate field types and constraints. Statistics aggregate data across enrollments, progress, and engagement metrics.

Chat endpoints include POST /api/chat for sending messages with Server-Sent Events responses, GET /api/chat/history for retrieving conversation history, DELETE /api/chat/conversations/:id for removing conversations, and GET /api/chat/conversations for listing all user conversations. The chat endpoint accepts a message and optional conversation ID, processes the message through the AI orchestrator with RAG retrieval when appropriate, and streams the response back progressively. History endpoints support pagination and filtering.

Course endpoints include GET /api/courses for browsing all courses with filtering, POST /api/courses for creating new courses, GET /api/courses/:id for detailed course information, PUT /api/courses/:id for updating course details, DELETE /api/courses/:id for removing courses, POST /api/courses/generate for AI-generated course creation, GET /api/courses/:id/modules for fetching course structure, and GET /api/courses/search for semantic search. The generate endpoint accepts natural language descriptions and uses the Groq LLM to produce complete course structures. Search supports both keyword and semantic matching through ChromaDB.

Module endpoints include POST /api/courses/:courseId/modules for creating modules, GET /api/courses/:courseId/modules/:id for module details, PUT /api/courses/:courseId/modules/:id for updates, DELETE /api/courses/:courseId/modules/:id for deletion, and PUT /api/courses/:courseId/modules/reorder for changing module order. Module operations validate ownership and enforce course structure integrity.

Lesson endpoints include POST /api/courses/:courseId/modules/:moduleId/lessons for lesson creation, GET /api/courses/:courseId/modules/:moduleId/lessons/:id for content retrieval, PUT /api/courses/:courseId/modules/:moduleId/lessons/:id for content updates, DELETE /api/courses/:courseId/modules/:moduleId/lessons/:id for removal, and PUT /api/courses/:courseId/modules/:moduleId/lessons/reorder for sequencing. Lessons support rich content with code blocks, embedded media, and interactive elements.

Enrollment endpoints include POST /api/enrollments for enrolling in courses, GET /api/enrollments for listing user enrollments, GET /api/enrollments/:id for specific enrollment details, PUT /api/enrollments/:id/progress for updating progress, and DELETE /api/enrollments/:id for unenrolling. Progress updates track lesson completions, quiz scores, and time spent. The system prevents duplicate enrollments and validates course availability.

Voice endpoints include POST /api/voice/sessions for initiating voice sessions, GET /api/voice/sessions/:id for session status, PUT /api/voice/sessions/:id for updates, and DELETE /api/voice/sessions/:id for session termination. Voice sessions coordinate with WebSocket connections for real-time audio streaming.

Flashcard endpoints include GET /api/flashcards/decks for listing decks, POST /api/flashcards/decks for deck creation, GET /api/flashcards/decks/:id/cards for retrieving cards, POST /api/flashcards/decks/:id/cards for adding cards, PUT /api/flashcards/cards/:id/review for submitting reviews, and GET /api/flashcards/cards/due for fetching cards due for review. The review endpoint implements the SM-2 algorithm to calculate next intervals.

Roadmap endpoints include POST /api/roadmaps/generate for creating personalized learning plans, GET /api/roadmaps for listing user roadmaps, GET /api/roadmaps/:id for roadmap details, PUT /api/roadmaps/:id/progress for tracking advancement, and DELETE /api/roadmaps/:id for removal. Generation uses AI to create week-by-week plans based on goals and time availability.

## Authentication and Authorization

Authentication uses JSON Web Tokens with separate access and refresh token flows. When users log in, the server generates an access token valid for 24 hours and a refresh token valid for 30 days. Access tokens are short-lived to limit exposure if compromised, while refresh tokens enable long sessions without frequent re-authentication.

The auth middleware extracts the access token from the Authorization header using the Bearer scheme, verifies the token signature using the JWT secret, extracts the user ID from the token payload, fetches the user from the database, attaches the user object to the request, and continues to the route handler. If verification fails, the middleware returns a 401 Unauthorized response. If the user no longer exists, it returns 404 Not Found.

Token refresh requires a valid refresh token in the request body. The server verifies the refresh token, checks if it has been revoked in the blacklist, generates a new access token with updated expiration, and returns both new tokens to the client. Refresh tokens are stored in a Redis-backed blacklist upon logout to prevent reuse.

Password security follows industry best practices with bcrypt hashing using a cost factor of 10 rounds, salting each password uniquely, and storing only the hash in the database. Passwords must meet minimum complexity requirements including length of at least 8 characters, presence of uppercase and lowercase letters, and inclusion of numbers or special characters. Password reset implements time-limited tokens sent via email.

Authorization implements role-based access control with roles defined in the User schema. The founder role grants full access to owned courses, the co-creator role allows editing course content, the content_improver role permits suggesting improvements, and the reviewer role enables leaving feedback. Middleware checks roles before allowing specific operations on courses.

Course-level permissions use a contributor array in the Course schema tracking each participant's role, contribution score, revenue share percentage, and approval status. Permission checks verify that the requesting user appears in the contributors array with appropriate role and approved status. Founders can approve new co-creators and adjust revenue shares.

API rate limiting implements three tiers based on subscription level. Free tier users get 100 requests per hour and 10 AI calls per hour. Pro tier users get 1000 requests per hour and 100 AI calls per hour. Enterprise tier users get 10000 requests per hour and 1000 AI calls per hour. The rate limiter uses Redis to track request counts with sliding window counters that reset hourly. Exceeded limits return 429 Too Many Requests responses.

Content moderation applies to all user-generated content including chat messages, course descriptions, and lesson content. The moderation middleware checks text for prohibited content in eight categories: profanity, hate speech, violence, sexual content, spam, personal information, copyright infringement, and illegal content. Flagged content is blocked or queued for review depending on severity. Users can appeal moderation decisions.

## Services and Business Logic

The aiOrchestrator service coordinates AI interactions by routing queries to appropriate handlers based on semantic classification. When a user sends a message, the orchestrator determines if the query needs RAG retrieval from the knowledge base, simple chat with the LLM, session memory retrieval, or platform action through MCP tools. This routing uses semantic embeddings to classify query intent rather than keyword matching.

The courseGenerator service creates complete course structures from natural language descriptions using the Groq LLM. Users provide a topic, difficulty level, and desired structure. The service generates a detailed prompt incorporating these parameters, calls the LLM with appropriate temperature and token limits, parses the JSON response containing modules and lessons, validates the structure, creates database records for course, modules, and lessons, and returns the complete course object. Generated courses include learning objectives, detailed content, code examples where appropriate, and AI tutor instructions for each lesson.

The courseRecommendation service suggests relevant courses based on user queries using semantic search through ChromaDB. When a user searches for courses, the service generates an embedding for the query, performs vector similarity search against all course embeddings, ranks results by semantic relevance, filters by difficulty level and category if specified, and returns the top matching courses. Fallback to regex-based keyword search occurs when ChromaDB is unavailable.

The voiceOrchestrator service manages voice interaction workflows including audio capture, speech-to-text transcription, AI response generation, and text-to-speech synthesis. Voice sessions progress through states of initialized, recording, processing, and completed. The orchestrator coordinates these transitions, calls appropriate services at each stage, handles errors with retries, and updates session records with timestamps and results.

The roadmapService generates personalized learning plans based on user goals, current skill level, and available time. The service calculates optimal duration, designs weekly modules with prerequisites, suggests learning resources, defines milestones, and formats the plan for storage. The AI generates realistic time estimates and progressive difficulty curves ensuring learners aren't overwhelmed.

The quizService creates quiz questions from lesson content, evaluates student responses, calculates scores, and tracks performance over time. Quiz generation uses the LLM to identify key concepts and create questions testing understanding rather than memorization. The service supports multiple question types including multiple choice, true/false, and short answer.

The flashcardService implements spaced repetition using the SM-2 algorithm. When users review cards, their ratings from 1 to 5 determine the next interval. The service calculates intervals as 1 day for rating 1, 3 days for rating 2, 6 days for rating 3, 10 days for rating 4, and multiplies the previous interval by 2.5 for rating 5. Cards with consistently high ratings extend to months between reviews while poorly remembered cards return quickly.

The contentModeration service analyzes text for prohibited content using pattern matching, sentiment analysis, and keyword detection. Detected violations are logged with severity levels. High severity violations block content immediately while moderate violations queue for human review. The service provides feedback to users about specific policy violations.

The audioStorage service manages audio file uploads, storage, and retrieval using MinIO as an S3-compatible object store. Audio streams are written directly to MinIO without loading into memory, preventing server memory exhaustion on large files. The service generates presigned URLs for secure time-limited access to stored audio. Cleanup jobs remove old audio files after retention periods expire.

## Caching Strategy

Redis provides distributed caching with a multi-layer architecture. The CacheManager implements cache-aside pattern where data is fetched from the database on cache miss and stored for subsequent requests. Cache keys follow a hierarchical naming convention using colons as separators like user:123:profile and course:456:modules.

Short-lived data like session context is cached for 5 to 60 minutes with automatic expiration. Medium-lived data like user profiles is cached for 1 to 24 hours. Long-lived data like course content is cached for days with explicit invalidation on updates. The cache implements stale-while-revalidate where expired cache entries continue serving while background refresh occurs.

Tag-based invalidation groups related cache entries under common tags. When a course is updated, all tags matching course:456:* are invalidated simultaneously. This ensures consistency across related data like course details, modules, lessons, and enrollment records. The CacheTagManager handles tag assignment and bulk invalidation.

Circuit breaker protection prevents cascading failures when Redis becomes unavailable. The circuit operates in closed state under normal conditions, open state when failures exceed thresholds, and half-open state during recovery testing. In open state, requests bypass cache and hit the database directly. This maintains service availability during cache outages.

Cache statistics track hit rates, miss rates, eviction counts, and memory usage. Monitoring alerts trigger when hit rates drop below 70%, indicating cache ineffectiveness or misconfiguration. Memory usage is monitored to prevent Redis exhaustion. Cache warming strategies preload frequently accessed data during deployment.

Distributed locking prevents cache stampede where many requests simultaneously try to populate the same cache entry. The first request acquires a lock, fetches data, populates cache, and releases the lock. Subsequent requests wait for the lock, then find the cache populated. Lock timeouts prevent permanent blocks if the initial request fails.

## Background Jobs

Background processing uses BullMQ with Redis as the queue backend. Jobs are organized into separate queues for different priorities and processing characteristics. The STT queue handles speech-to-text transcription with 5 concurrent workers, the AI queue processes LLM requests with 2 concurrent workers, the memory queue runs consolidation with 1 worker, and the cleanup queue removes expired data with 1 worker.

Memory consolidation jobs run daily to extract facts from conversations, deduplicate similar memories, calculate importance scores, and write to long-term storage. The job processes conversations that are at least 24 hours old to allow complete sessions to finish. Extracted facts are checked against existing memories using Jaccard similarity, and duplicates are merged by incrementing access frequency.

Memory decay jobs run daily to apply exponential decay to importance scores based on age and access patterns. Memories older than 90 days with low importance are marked for archival. User-marked important memories are exempt from automatic expiry. The decay function uses exponential calculation with a half-life of 14 days.

Cleanup jobs run weekly to remove soft-deleted conversations, expired tokens, old voice sessions, and temporary files. The job identifies records with deletedAt timestamps older than the retention period, permanently removes associated data from MinIO and ChromaDB, and deletes database records. Statistics are logged for monitoring retention compliance.

Health check jobs run hourly to verify service availability including database connectivity, cache responsiveness, vector store accessibility, and external API availability. Failed health checks trigger alerts to operations teams. Metrics are published to monitoring systems for trend analysis.

Email jobs process notification queues for welcome emails, password resets, course completion certificates, and weekly progress summaries. The job batches emails to avoid rate limiting and implements retry logic for temporary delivery failures. Bounce handling unsubscribes users from invalid email addresses.

Job monitoring tracks success rates, processing times, retry counts, and failure reasons. Dead letter queues capture jobs that fail after maximum retries for manual investigation. Job dashboards provide visibility into queue depths, worker utilization, and processing throughput.

## Error Handling and Logging

Error handling distinguishes between operational errors that are part of normal operation and programming errors indicating bugs. Operational errors include validation failures, resource not found, authentication failures, and external service timeouts. These return appropriate HTTP status codes with user-friendly messages. Programming errors include null reference exceptions, type errors, and assertion failures. These log full stack traces and return generic 500 Internal Server Error responses.

The error handler middleware catches all unhandled errors from routes and services, logs errors with contextual information including request ID, user ID, and request path, determines the appropriate response based on error type, sends formatted error responses to clients, and notifies monitoring systems of critical errors.

Request logging uses Morgan in development mode with detailed output including HTTP method, URL, status code, response time, and body size. Production logging uses JSON format with structured data enabling log aggregation and analysis. Request IDs correlate logs across service boundaries for distributed tracing.

Application logs use Winston with multiple transports including console for development, file rotation for persistent storage, and external services for centralized log management. Log levels include error for failures requiring investigation, warn for degraded conditions, info for significant events, debug for diagnostic information, and trace for detailed execution flow.

Security logs track authentication attempts, authorization failures, rate limit violations, content moderation flags, and suspicious patterns. These logs feed into security information and event management systems for threat detection. Failed login attempts trigger alerts after threshold violations.

Performance logs measure response times, database query durations, cache hit rates, and external API latencies. Slow query logs identify database optimization opportunities. Metrics are aggregated into time series for trend analysis and capacity planning.

## Deployment and Scaling

The backend deploys as containerized services using Docker with separate containers for the application server, MongoDB, Redis, and ChromaDB. Kubernetes orchestrates container deployment, scaling, and management across multiple nodes. Services communicate through internal networking with load balancers distributing traffic.

Horizontal scaling adds more application server instances behind a load balancer to handle increased traffic. Stateless design enables any instance to handle any request with session state stored in Redis. Database connections are pooled to prevent exhausting MongoDB connection limits. Worker processes can scale independently based on queue depth.

Database scaling uses MongoDB replica sets for read distribution and high availability. Write operations go to the primary while read operations distribute across secondaries. Indexes optimize common query patterns. Sharding partitions data across multiple servers when single-server capacity is exceeded.

Redis scaling uses clustering with multiple master nodes and replica slaves for high availability. Cache data is partitioned across masters using consistent hashing. Sentinel monitors health and performs automatic failover when masters fail.

ChromaDB scales through collection partitioning and query optimization. Large collections are split by user ID or time period. HNSW indexes provide fast approximate nearest neighbor search with configurable trade-offs between speed and accuracy.

Deployment pipelines automate testing, building, and releasing. Changes pushed to version control trigger automated tests including unit tests, integration tests, and end-to-end tests. Passed tests proceed to building Docker images with tagged versions. Images deploy to staging environments for validation before production rollout.

Blue-green deployment maintains two production environments with traffic routed to the active environment. New versions deploy to the inactive environment, undergo smoke testing, then receive traffic by switching the router. This enables zero-downtime deployments with instant rollback capability if issues arise.

Health checks and readiness probes ensure the load balancer only routes traffic to healthy instances. Liveness probes restart failed instances automatically. Graceful shutdown drains connections before terminating instances during deployments or scaling operations.
