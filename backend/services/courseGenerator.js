import Groq from 'groq-sdk';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import embeddingService from '../ai/embeddings/embeddingService.js';
import bgeSmallModel from '../ai/embeddings/models/bgeSmall.js';
import {
    getCourseStructurePrompt,
    getCoursePreviewPrompt,
    getLessonTutorPrompt
} from '../ai/prompts/coursePrompts.js';

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
 * Generate embedding vector for text using proper BGE-small model
 * Creates a 384-dimensional vector representation using embeddingService
 */
async function generateEmbedding(text) {
    try {
        const result = await embeddingService.embed(text);
        return result.embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        return null;
    }
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
        // Use centralized prompt
        const prompts = getCourseStructurePrompt({
            level,
            numModules,
            lessonsPerModule,
            userPrompt: prompt
        });

        const completion = await getGroqClient().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: prompts.system },
                { role: 'user', content: prompts.user }
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
            let cleanedResponse = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            // Try to extract JSON if it's embedded in other text
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanedResponse = jsonMatch[0];
            }

            console.log('Attempting to parse AI response...');
            const courseStructure = JSON.parse(cleanedResponse);
            console.log('Successfully parsed course structure:', courseStructure.title);
            return courseStructure;
        } catch (parseError) {
            console.error('Failed to parse AI response. Parse error:', parseError.message);
            console.error('Raw AI response (first 500 chars):', response.substring(0, 500));
            console.error('Cleaned response (first 500 chars):', response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim().substring(0, 500));
            throw new Error(`Failed to parse course structure from AI response: ${parseError.message}`);
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

                // Use centralized lesson tutor prompt
                const lessonPrompts = getLessonTutorPrompt({
                    lessonTitle: lessonData.title,
                    level: structure.level,
                    objectives: lessonData.objectives || []
                });

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
                        systemPrompt: lessonPrompts.system,
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
        // Use centralized prompt
        const prompts = getCoursePreviewPrompt({
            level,
            userPrompt: prompt
        });

        const completion = await getGroqClient().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: prompts.system },
                { role: 'user', content: prompts.user }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const response = completion.choices[0]?.message?.content;

        if (!response) {
            throw new Error('No preview response from AI');
        }

        try {
            let cleanedResponse = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            // Try to extract JSON if it's embedded in other text
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanedResponse = jsonMatch[0];
            }

            return JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('Failed to parse preview response. Parse error:', parseError.message);
            console.error('Raw preview response (first 300 chars):', response.substring(0, 300));
            throw new Error(`Failed to parse preview: ${parseError.message}`);
        }
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

            // Calculate cosine similarity for each course using BGE-small model
            const coursesWithSimilarity = allCourses.map(course => {
                const similarity = bgeSmallModel.cosineSimilarity(queryEmbedding, course.embedding);
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
