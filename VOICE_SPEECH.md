# Voice and Speech Processing Documentation

## Overview

The Mini AI Tutor voice and speech system provides real-time voice interactions enabling students to speak with the AI tutor naturally. The system implements speech-to-text transcription, text-to-speech synthesis, real-time audio streaming, and complete voice session management. The architecture uses a hybrid approach with multiple fallback chains to ensure reliability, combining free services from Hugging Face and browser APIs with commercial options as backups.

## Speech-to-Text Implementation

Speech-to-text transcription converts spoken audio into text using a three-tier fallback chain that ensures transcription always succeeds. The primary transcription service is Hugging Face's free Whisper API providing good quality at zero cost. When Hugging Face is unavailable or rate-limited, the system falls back to OpenAI's Whisper API. If both external services fail, the system uses the browser's built-in Web Speech API ensuring transcription never completely fails.

The STT service in services/sttService.js implements the fallback chain with automatic provider switching. When audio arrives for transcription, the service first checks the health status of each provider. Providers that recently failed are temporarily disabled using circuit breaker patterns to avoid wasting time on known failures. The service selects the highest priority available provider and attempts transcription.

Hugging Face transcription sends audio to their hosted Whisper model through their inference API. The audio is converted to the required format, sent via HTTP POST with the API key in headers, and the response contains the transcribed text along with confidence scores. The service handles common errors like rate limiting by detecting 429 status codes and triggering fallback to the next provider. Temporary failures like network timeouts trigger retries with exponential backoff before falling back.

OpenAI Whisper transcription uses the official OpenAI client library which handles authentication and retries automatically. Audio is uploaded as a file stream with the whisper-1 model selected. The API returns high quality transcriptions but costs money per minute of audio. This provider serves as the middle tier when free options fail but before resorting to the less accurate browser API.

Browser Web Speech API transcription runs entirely in the user's browser using the SpeechRecognition interface available in modern browsers. This option requires no server-side processing and has zero latency for setup, but accuracy varies by browser and language. The browser captures audio directly from the microphone, processes it locally or via browser-vendor cloud services, and returns transcription results through events. This serves as the ultimate fallback ensuring transcription always works.

Provider health tracking maintains statistics for each transcription service including success rate, average latency, recent failures, and last successful call timestamp. When a provider fails, its health score decreases and a circuit breaker may open temporarily disabling it. After a cooling period, the circuit enters half-open state allowing test requests. Successful tests close the circuit and restore the provider. Failed tests extend the open period.

Transcription quality varies across providers with OpenAI providing the best accuracy, Hugging Face providing good accuracy, and browser APIs providing acceptable accuracy. The system logs which provider was used for each transcription enabling analysis of fallback frequency. High fallback rates indicate issues with primary providers requiring investigation.

Audio format handling ensures compatibility across providers. Browsers typically capture audio as WebM or WAV formats. The system converts formats as needed for each provider, though most accept common formats directly. Audio is streamed rather than buffered entirely to reduce latency and memory usage. Chunks are processed incrementally when possible.

## Text-to-Speech Implementation

Text-to-speech synthesis converts AI responses into spoken audio using the browser's built-in Web Speech Synthesis API. This client-side approach provides instant playback without server processing or external API calls. The browser manages voice selection, synthesis, and audio playback entirely locally.

The TTS implementation uses the SpeechSynthesis interface available in all modern browsers. When the AI generates a response, the text is sent to the browser where a SpeechSynthesisUtterance object is created with the text content. The browser selects an appropriate voice based on user preferences and language settings. Synthesis begins immediately and audio plays through the user's speakers or headphones.

Voice selection allows users to choose from voices available on their device. Different operating systems and browsers provide different voice options with varying quality and naturalness. The system defaults to a high-quality voice appropriate for the content language. Users can change voices through settings which persist across sessions.

Playback controls enable users to pause, resume, or stop synthesis at any time. The pause function temporarily halts synthesis while maintaining position for resumption. The stop function terminates synthesis and clears the queue. Volume and rate controls adjust loudness and speaking speed according to user preference. These controls integrate with the voice chat interface through intuitive buttons.

Synthesis quality depends on the browser and operating system voices available. Modern devices typically include neural voices with natural prosody and intonation. Older systems may use robotic-sounding voices. The system detects available voices on startup and selects the best option automatically.

Streaming synthesis processes long responses in chunks to begin playback sooner. Rather than waiting for the complete AI response, synthesis starts as soon as the first chunk arrives. Subsequent chunks queue for synthesis maintaining continuous audio playback. This reduces perceived latency making the interaction feel more responsive.

Error handling manages synthesis failures gracefully. If synthesis fails due to unsupported text or missing voices, the system falls back to displaying text only. Network interruptions during response generation don't affect TTS since it runs entirely in the browser. User interruptions during playback clear the queue and stop current synthesis immediately.

## Audio Streaming and Processing

Real-time audio streaming enables live voice interactions using WebSocket connections through Socket.IO. Audio flows bidirectionally with user speech streaming to the server for transcription and AI responses streaming back as audio or text. The streaming architecture minimizes latency through chunked processing and overlapping operations.

Audio capture uses the browser's MediaRecorder API to access the user's microphone with permission. The MediaRecorder records audio in chunks of configurable duration, typically 500-1000ms. Each chunk is sent to the server via WebSocket immediately upon recording without waiting for the complete recording to finish. This streaming approach reduces the time before transcription begins.

WebSocket communication maintains a persistent connection between browser and server for the duration of the voice session. The Socket.IO library handles the WebSocket protocol including automatic reconnection, heartbeat management, and message buffering. Events flow in both directions with audio_chunk events carrying audio data from client to server and transcription_result events carrying text from server to client.

Chunk processing on the server begins as soon as each audio chunk arrives. Small chunks can be transcribed individually or buffered into larger segments for better accuracy. The system balances chunk size for optimal trade-off between latency and transcription quality. Smaller chunks reduce latency but may have more errors. Larger chunks improve accuracy but increase wait time.

Audio format negotiation ensures client and server agree on audio encoding. The browser typically captures audio as WebM with Opus codec or WAV with PCM encoding. The server declares supported formats during session initialization and the browser selects a compatible format. Mismatches trigger format conversion though most modern combinations work without conversion.

Network optimization reduces bandwidth usage through audio compression and adaptive quality. The Opus codec provides excellent compression ratios making streaming viable on slower connections. Quality adapts automatically based on network conditions with higher bitrates on fast connections and lower bitrates when bandwidth is constrained.

Latency optimization overlaps operations to minimize end-to-end delay. While the first audio chunk transcribes, the second chunk transmits. While transcription completes, the AI begins generating its response. While the AI generates, text-to-speech synthesis begins. This pipelining reduces total latency from seconds to hundreds of milliseconds.

## Voice Session Management

Voice sessions track the state and lifecycle of voice interactions from initialization through completion or termination. Each session has a unique identifier, belongs to a specific user, maintains its current state, and references associated data including audio files and transcriptions.

Session creation begins when a user initiates voice chat. The server creates a VoiceSession record in the database with status initialized, generates a unique session ID, establishes a WebSocket connection with the client, and returns the session details. The client uses the session ID to associate subsequent audio chunks with this session.

State transitions move sessions through defined states: initialized when first created, recording while capturing audio, processing during transcription and AI generation, completed after successful interaction, failed if errors occur, and terminated if the user cancels. State changes are atomic and logged for monitoring. Invalid state transitions are rejected with errors.

Audio file management stores recorded audio in MinIO object storage for later review and training data. As audio chunks arrive, they are appended to a file in MinIO using streaming writes that avoid loading entire files into memory. The VoiceSession record stores the MinIO object key enabling retrieval. Retention policies automatically delete audio files after configured periods.

Transcription storage saves the complete transcription text in the VoiceSession record along with metadata like which provider was used, confidence scores, and processing time. Multiple transcriptions from different providers can be stored for comparison. The best transcription based on confidence scores becomes the canonical version used for AI processing.

AI response tracking stores the generated response text in the session record alongside metadata about model used, tokens consumed, and generation time. If text-to-speech synthesis occurred, the audio file reference is also stored. This complete history enables session replay and debugging.

Session cleanup removes temporary data and closes connections when voice interactions complete. After a configurable timeout period with no activity, sessions automatically transition to terminated state, connections close gracefully, temporary audio buffers clear, and logs finalize. Failed sessions undergo the same cleanup to prevent resource leaks.

## WebSocket Integration

WebSocket connections provide the real-time bidirectional communication required for voice interactions. Socket.IO builds on WebSocket with additional features like automatic reconnection, event-based messaging, and fallback to long polling when WebSockets are unavailable.

The Socket.IO server initializes during application startup by attaching to the HTTP server created by Express. The server configuration enables CORS for the frontend origin, sets transports to prefer WebSocket with long polling fallback, and configures ping timeouts and intervals for connection health monitoring.

Voice handlers register event listeners for voice-specific Socket.IO events. The handlers are located in socketHandlers/voiceHandlers.js and voiceHandlersProd.js with production using the latter for additional safeguards. Each handler validates requests, processes events, and emits responses or errors.

The startRecording event initiates a new voice session when the client begins recording. The handler creates a VoiceSession database record, transitions it to recording state, stores the session ID in the socket's context for subsequent events, and acknowledges success to the client. Validation ensures the user is authenticated and not already in an active session.

The audio_chunk event processes incoming audio data during recording. The handler retrieves the session from context, validates the session is in recording state, appends the audio chunk to MinIO storage, increments chunk counters, and periodically checks for session timeout. Large chunks are rejected to prevent abuse.

The stopRecording event finalizes audio capture when the user stops speaking. The handler transitions the session to processing state, triggers speech-to-text transcription of the complete audio, sends transcription progress events to the client, and awaits transcription completion. The transcription result is stored in the session record.

The transcription_complete event occurs when STT finishes processing audio. The handler sends the transcribed text to the AI orchestrator for response generation, updates the session with transcription details, emits a transcription_result event to the client showing what was heard, and awaits the AI response. Errors during transcription trigger fallback to alternative providers.

The ai_response event carries the generated AI response from server to client. The handler updates the session with response text and metadata, emits the response to the client for display and TTS synthesis, transitions the session to completed state, and logs completion metrics. The client receives the text and begins speaking it aloud.

The cancelSession event handles user-initiated cancellation during recording or processing. The handler transitions the session to terminated state, stops any ongoing transcription or AI processing, clears audio buffers, closes the connection gracefully, and releases resources. Cleanup occurs even for abandoned connections through timeout mechanisms.

Error events propagate failures to clients with appropriate messages. Handlers catch exceptions, log errors with full context, emit error events to the client with sanitized messages, transition sessions to failed state, and clean up resources. Different error types return specific error codes enabling clients to handle them appropriately.

## Voice Orchestration Workflow

The voice orchestrator coordinates the complete voice interaction pipeline from audio capture through AI response delivery. The workflow spans multiple services and asynchronous operations requiring careful coordination and error handling.

The workflow begins when the user clicks the record button in the voice chat interface. The browser requests microphone access, the user grants permission, and the MediaRecorder starts capturing audio. The startRecording event fires to the server establishing a new voice session. The server creates session state and begins accepting audio chunks.

Audio streaming occurs continuously while recording. The MediaRecorder generates audio chunks every 500ms and emits them via WebSocket. The server receives chunks, writes them to MinIO storage, and monitors for recording completion. The frontend displays a visual indicator showing recording is active. Users can speak naturally without managing starts and stops.

Recording completion happens when the user clicks stop recording or after a maximum duration elapses. The stopRecording event triggers server-side processing. The server stops accepting chunks, finalizes the audio file in MinIO, and begins the transcription phase. The frontend transitions from recording mode to processing mode.

Speech-to-text transcription processes the complete audio file through the STT service's fallback chain. Hugging Face receives the audio first, processes it, and returns the transcription. If successful, the text is stored in the session and sent to the client. If Hugging Face fails, OpenAI Whisper attempts transcription. Final fallback uses browser speech recognition if both external services fail.

AI processing receives the transcription text and generates a response through the AI orchestrator. The orchestrator determines if RAG retrieval is needed, builds appropriate context including conversation history, calls the LLM with constructed prompts, and streams the response back. Streaming enables progressive display and TTS synthesis.

Text-to-speech synthesis begins as soon as the AI response starts arriving. The client receives response chunks via WebSocket, queues them for synthesis, and starts playback. The browser's speech synthesis API speaks the text aloud while simultaneously displaying it on screen. Users can pause or stop playback at any time.

Session completion occurs when the AI finishes responding and TTS completes playback. The session transitions to completed state, audio files are marked for retention or deletion based on policy, statistics are logged for monitoring, and resources are released. The session remains in the database for history and analytics.

Error recovery handles failures at any stage of the workflow. Transcription failures trigger fallback providers automatically. AI generation failures return error messages explaining what went wrong. Network failures during audio streaming prompt reconnection attempts. Irrecoverable errors terminate the session gracefully with user notification.

## Performance Optimization

Voice interaction performance is critical for natural conversation flow. The system implements multiple optimizations to minimize latency and maximize responsiveness throughout the voice pipeline.

Audio chunk sizing balances latency and quality. Smaller chunks of 250-500ms reduce time to transcription start but may have lower accuracy due to insufficient context. Larger chunks of 1-2 seconds improve accuracy but delay transcription. The system uses 500ms chunks as an optimal middle ground. Adaptive chunking could adjust based on speech patterns.

Parallel processing overlaps operations to reduce end-to-end latency. While chunk N transcribes, chunk N+1 transmits over the network. While transcription completes, AI response generation begins. While the AI generates the first sentence, TTS synthesizes and plays it. This pipelining cuts perceived latency in half.

Provider selection prefers faster services when quality is acceptable. Hugging Face typically responds in 1-3 seconds while OpenAI takes 2-5 seconds. The faster service is preferred unless quality issues arise. Circuit breakers prevent using slow or failing providers reducing wasted time.

Caching strategies improve performance for repeated content. Transcriptions of common phrases like greetings are cached by audio fingerprint. AI responses to frequent questions are cached by semantic similarity. TTS synthesis results can be cached by text content. These caches reduce latency to tens of milliseconds for cache hits.

WebSocket connection pooling reduces overhead from establishing connections for each session. The Socket.IO server maintains persistent connections that are reused across multiple voice sessions. Connection setup occurs once per chat session rather than per voice interaction.

Resource preallocation initializes heavyweight resources during application startup rather than first use. The BGE embedding model loads at startup. Socket.IO servers start immediately. Database connection pools fill during initialization. This eliminates cold start latency on first requests.

## Error Handling and Recovery

Robust error handling ensures voice interactions degrade gracefully rather than failing completely. The system anticipates failure modes and implements recovery strategies for each.

Microphone access denials occur when users don't grant permission or when security policies block access. The system detects permission denied errors, displays a helpful message explaining how to grant access, and disables voice features until permission is granted. No errors are logged as these are user-controlled denials.

Network failures during WebSocket transmission are handled by Socket.IO's automatic reconnection. When the connection drops, Socket.IO attempts reconnection with exponential backoff. During reconnection, the client buffers audio chunks locally. Once reconnected, buffered chunks transmit resuming the session. If reconnection fails after maximum retries, the session terminates with a notification.

Provider failures during transcription trigger the fallback chain automatically. When Hugging Face returns errors, the STT service immediately tries OpenAI. When both external services fail, the browser speech API provides transcription. Users experience slight delays during fallback but transcription always succeeds.

AI generation failures return error messages explaining what went wrong. If the LLM is unavailable, the user is informed and prompted to retry. If generation times out, partial responses are returned with an indication more was cut off. Rate limit errors suggest waiting and retrying later.

Session timeout handling prevents abandoned sessions from consuming resources indefinitely. After 5 minutes of inactivity, sessions automatically terminate. Before termination, a warning is sent to the client allowing the user to extend the session. Unresponsive clients have their sessions forcefully closed.

Resource cleanup occurs even when errors prevent normal shutdown. Try-finally blocks ensure MinIO connections close, database transactions rollback, and memory buffers release. Failed sessions are marked for garbage collection removing orphaned records.

Logging and monitoring track error rates across all failure modes. High transcription fallback rates indicate primary provider issues. Frequent timeouts suggest performance problems. Connection drops correlate with network quality. These metrics guide infrastructure improvements.
