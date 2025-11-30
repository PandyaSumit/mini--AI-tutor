/**
 * Services Index
 * Barrel file that re-exports all available services
 */

export { courseService } from './course/courseService';
export { authService } from './auth/authService';
export { userService } from './user/userService';
export { studyMaterialService } from './studyMaterial/studyMaterialService';
export { flashcardService } from './flashcard/flashcardService';
export { dashboardService } from './dashboard/dashboardService';
export { chatService } from './chat/chatService';
export { roadmapService } from './roadmap/roadmapService';
export { aiService } from './ai/aiService';
export { enrollmentService } from './enrollment/enrollmentService';
export { voiceService } from './voice/voiceService';

// Re-export a default object for convenience
export default {
    courseService,
    authService,
    userService,
    studyMaterialService,
    flashcardService,
    dashboardService,
    chatService,
    roadmapService,
    aiService,
    enrollmentService,
    voiceService,
};
