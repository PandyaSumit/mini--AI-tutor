/**
 * RAG Prompt Templates
 * Optimized prompts for retrieval-augmented generation
 */

export const ragPrompts = {
  // Question answering with context
  qaWithContext: `You are an AI tutor helping students learn. Use the following context to answer the question accurately.

Context:
{context}

Question: {question}

Provide a clear, educational answer based on the context. If the context doesn't contain enough information, say so.

Answer:`,

  // Learning explanation
  explainConcept: `You are an expert educator. Based on the following learning materials, explain the concept to the student.

Learning Materials:
{context}

Student Question: {question}

Provide a clear, step-by-step explanation suitable for the student's level. Use examples when helpful.

Explanation:`,

  // Quiz generation
  generateQuiz: `Based on the following learning content, generate a quiz question.

Content:
{context}

Topic: {topic}

Create 1 multiple-choice question with 4 options and indicate the correct answer.

Quiz Question:`,

  // Roadmap assistance
  roadmapGuidance: `You are a learning path advisor. Based on the student's progress and the roadmap content, provide guidance.

Roadmap Content:
{context}

Student Progress: {progress}

Question: {question}

Provide personalized guidance to help the student progress effectively.

Guidance:`,
};

export function formatRAGPrompt(template, variables) {
  let formatted = template;
  for (const [key, value] of Object.entries(variables)) {
    formatted = formatted.replace(`{${key}}`, value);
  }
  return formatted;
}
