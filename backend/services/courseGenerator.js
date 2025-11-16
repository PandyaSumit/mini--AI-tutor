import Groq from 'groq-sdk';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';

// Lazy initialization of Groq client to avoid import-time errors
// when GROQ_API_KEY is not yet available (before dotenv loads)
let groq = null;

function getGroqClient() {
    if (groq) return groq;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error(
            'GROQ_API_KEY is not configured. Please set it in your .env file or environment variables.'
        );
    }

    groq = new Groq({ apiKey });
    return groq;
}

/**
 * Generate embedding vector for text using AI
 * Creates a 384-dimensional vector representation
 */
async function generateEmbedding(text) {
    try {
        // For now, generate a simple hash-based embedding
        // In production, use a proper embedding model like BGE-small via HuggingFace or similar
        const hashEmbedding = createSimpleEmbedding(text);
        return hashEmbedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        return null;
    }
}

/**
 * Simple embedding generation using text features
 * In production, replace with proper BGE-small or similar model
 */
function createSimpleEmbedding(text) {
    const normalized = text.toLowerCase();
    const words = normalized.split(/\s+/);
    const embedding = new Array(384).fill(0);

    // Create feature vector based on text characteristics
    words.forEach((word, index) => {
        const hash = simpleHash(word);
        const position = hash % 384;
        embedding[position] += 1;
    });

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
        return 0;
    }

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        mag1 += vec1[i] * vec1[i];
        mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) {
        return 0;
    }

    return dotProduct / (mag1 * mag2);
}

/**
 * AI Course Generator
 * Generates complete course structure using Groq AI based on user prompts
 */
class CourseGeneratorService {
    /**
     * Generate complete course from user prompt
     * @param {string} prompt - User's description of what they want to learn
     * @param {string} userId - ID of the user creating the course
     * @param {Object} options - Additional options (level, numModules, etc.)
     * @returns {Promise<Object>} - Complete course structure with modules and lessons
     */
    async generateCourse(prompt, userId, options = {}) {
        try {
            const {
                level = 'beginner',
                numModules = 5,
                lessonsPerModule = 4
            } = options;

            console.log(`Generating course for: "${prompt}"`);

            // Generate course structure using AI
            const courseStructure = await this.generateCourseStructure(
                prompt,
                level,
                numModules,
                lessonsPerModule
            );

            // Create course in database
            const course = await this.createCourseInDatabase(courseStructure, userId);

            return {
                success: true,
                course,
                message: 'Course generated successfully'
            };
        } catch (error) {
            console.error('Error generating course:', error);
            throw error;
        }
    }

    /**
     * Generate course structure using Groq AI
     */
    async generateCourseStructure(prompt, level, numModules, lessonsPerModule) {
        const systemPrompt = `You are an expert course curriculum designer. Create a comprehensive course structure based on the user's request.

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "title": "Course Title",
  "description": "Detailed course description (2-3 sentences)",
  "category": "one of: programming, mathematics, science, language, business, design, other",
  "level": "${level}",
  "tags": ["tag1", "tag2", "tag3"],
  "learningOutcomes": ["outcome1", "outcome2", "outcome3"],
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "Module description",
      "objectives": ["objective1", "objective2"],
      "lessons": [
        {
          "title": "Lesson 1 Title",
          "content": "Detailed lesson content (5-8 paragraphs explaining the topic thoroughly)",
          "duration": 15,
          "objectives": ["Learn X", "Understand Y"],
          "keyPoints": ["Point 1", "Point 2", "Point 3"],
          "examples": [
            {
              "title": "Example Title",
              "code": "code example if applicable",
              "explanation": "What this example demonstrates"
            }
          ]
        }
      ]
    }
  ]
}

Requirements:
- Create exactly ${numModules} modules
- Each module should have exactly ${lessonsPerModule} lessons
- Lesson content must be comprehensive (minimum 300 words)
- Include practical examples
- Tailor difficulty to ${level} level
- Make it engaging and educational`;

        const completion = await getGroqClient().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 8000
        });

        const response = completion.choices[0]?.message?.content;

        if (!response) {
            throw new Error('No response from AI');
        }

        // Parse JSON response
        try {
            // Remove markdown code blocks if present
            const cleanedResponse = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const courseStructure = JSON.parse(cleanedResponse);
            return courseStructure;
        } catch (parseError) {
            console.error('Failed to parse AI response:', response);
            throw new Error('Failed to parse course structure from AI response');
        }
    }

    /**
     * Create course, modules, and lessons in database
     */
    async createCourseInDatabase(structure, userId, specializationInfo = null) {
        // Generate embedding for course similarity matching
        const embeddingText = `${structure.title} ${structure.description} ${structure.tags?.join(' ') || ''}`;
        const embedding = await generateEmbedding(embeddingText);

        // Create the course
        const course = await Course.create({
            title: structure.title,
            description: structure.description,
            category: structure.category || 'other',
            level: structure.level || 'beginner',
            tags: structure.tags || [],
            createdBy: userId,
            contributors: [{
                user: userId,
                contributionType: 'founder',
                contributionDate: new Date(),
                contributionScore: 100,
                revenueShare: 100,
                approvalStatus: 'approved'
            }],
            embedding: embedding,
            specializationType: specializationInfo?.type || 'general',
            specializationJustification: specializationInfo?.justification || null,
            parentCourse: specializationInfo?.parentCourse || null,
            isDraft: true,
            isPublished: false,
            qualityScore: 0,
            metadata: {
                language: 'en-US',
                learningOutcomes: structure.learningOutcomes || []
            }
        });

        let totalDuration = 0;
        let totalLessons = 0;

        // Create modules and lessons
        for (let moduleIndex = 0; moduleIndex < structure.modules.length; moduleIndex++) {
            const moduleData = structure.modules[moduleIndex];

            const module = await Module.create({
                course: course._id,
                title: moduleData.title,
                description: moduleData.description,
                order: moduleIndex,
                objectives: moduleData.objectives || [],
                isPublished: false
            });

            let moduleDuration = 0;

            // Create lessons for this module
            for (let lessonIndex = 0; lessonIndex < moduleData.lessons.length; lessonIndex++) {
                const lessonData = moduleData.lessons[lessonIndex];

                const lesson = await Lesson.create({
                    module: module._id,
                    title: lessonData.title,
                    content: lessonData.content,
                    order: lessonIndex,
                    duration: lessonData.duration || 15,
                    objectives: lessonData.objectives || [],
                    isPublished: false,
                    lessonType: 'interactive',
                    content_structure: {
                        keyPoints: lessonData.keyPoints || [],
                        examples: lessonData.examples || []
                    },
                    aiInstructions: {
                        systemPrompt: `You are an expert tutor teaching "${lessonData.title}". Provide clear, detailed explanations and encourage questions. Tailor your responses to ${structure.level} level students.`,
                        teachingStyle: 'conversational',
                        contextGuidelines: `Always refer back to the lesson content when answering questions. The key learning objectives are: ${lessonData.objectives?.join(', ') || 'understanding the fundamentals'}.`
                    }
                });

                moduleDuration += lesson.duration;
                totalLessons += 1;
            }

            // Update module statistics
            module.statistics.totalLessons = moduleData.lessons.length;
            module.statistics.totalDuration = moduleDuration;
            await module.save();

            totalDuration += moduleDuration;
        }

        // Update course statistics
        course.statistics.totalModules = structure.modules.length;
        course.statistics.totalLessons = totalLessons;
        course.statistics.totalDuration = totalDuration;
        await course.save();

        // Populate course with modules
        const populatedCourse = await Course.findById(course._id)
            .populate({
                path: 'modules'
            });

        return populatedCourse;
    }

    /**
     * Generate a quick course preview (without saving to database)
     * Useful for showing user what will be created before confirmation
     */
    async generatePreview(prompt, level = 'beginner', numModules = 5) {
        const systemPrompt = `Generate a brief course outline based on this request.

Return ONLY a valid JSON object:
{
  "title": "Course Title",
  "description": "Course description",
  "category": "category",
  "level": "${level}",
  "modulesTitles": ["Module 1", "Module 2", ...],
  "estimatedDuration": 120
}`;

        const completion = await getGroqClient().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const response = completion.choices[0]?.message?.content;
        const cleanedResponse = response
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        return JSON.parse(cleanedResponse);
    }

    /**
     * Find similar existing courses using embedding-based cosine similarity
     * @param {string} prompt - User's course creation prompt
     * @param {string} level - Course level
     * @returns {Promise<Array>} - Array of similar courses with similarity scores (85%+ threshold)
     */
    async findSimilarCourses(prompt, level) {
        try {
            // Generate embedding for the user's prompt
            const queryEmbedding = await generateEmbedding(prompt);

            if (!queryEmbedding) {
                return [];
            }

            // Get all published courses with embeddings
            const allCourses = await Course.find({
                isPublished: true,
                embedding: { $exists: true, $ne: null }
            })
                .populate('createdBy', 'name email')
                .populate({
                    path: 'contributors',
                    populate: { path: 'user', select: 'name' }
                })
                .select('title description category level tags statistics createdBy contributors embedding')
                .limit(100);

            if (allCourses.length === 0) {
                return [];
            }

            // Calculate cosine similarity for each course
            const coursesWithSimilarity = allCourses.map(course => {
                const similarity = cosineSimilarity(queryEmbedding, course.embedding);
                const similarityScore = Math.round(similarity * 100);

                // Generate reason based on matching features
                let reason = '';
                if (course.level === level) {
                    reason += 'Same difficulty level. ';
                }
                if (similarityScore >= 90) {
                    reason += 'Nearly identical course content and objectives.';
                } else if (similarityScore >= 85) {
                    reason += 'Very similar topics and learning outcomes.';
                }

                return {
                    _id: course._id,
                    title: course.title,
                    description: course.description,
                    category: course.category,
                    level: course.level,
                    tags: course.tags,
                    statistics: course.statistics,
                    createdBy: course.createdBy,
                    contributors: course.contributors,
                    similarityScore,
                    similarityReason: reason.trim() || 'Similar course content and structure.'
                };
            });

            // Filter courses with similarity >= 85% (high threshold)
            const similarCourses = coursesWithSimilarity
                .filter(c => c.similarityScore >= 85)
                .sort((a, b) => {
                    // Sort by similarity first, then by enrollment count
                    if (b.similarityScore !== a.similarityScore) {
                        return b.similarityScore - a.similarityScore;
                    }
                    return (b.statistics?.enrollmentCount || 0) - (a.statistics?.enrollmentCount || 0);
                })
                .slice(0, 5); // Top 5 similar courses

            return similarCourses;
        } catch (error) {
            console.error('Error finding similar courses:', error);
            // Return empty array on error - don't block course creation
            return [];
        }
    }
}

export default new CourseGeneratorService();
