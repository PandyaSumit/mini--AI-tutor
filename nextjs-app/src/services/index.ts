/**
 * Services Index
 * Barrel file that re-exports all available services
 */

import { courseService } from './course/courseService';
import { authService } from './auth/authService';
import { userService } from './user/userService';
import { studyMaterialService } from './studyMaterial/studyMaterialService';
import { flashcardService } from './flashcard/flashcardService';
import { dashboardService } from './dashboard/dashboardService';
import { chatService } from './chat/chatService';
import { roadmapService } from './roadmap/roadmapService';
import { aiService } from './ai/aiService';
import { enrollmentService } from './enrollment/enrollmentService';
import { voiceService } from './voice/voiceService';

// Export named services
export {
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

// Export default object for convenience
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
