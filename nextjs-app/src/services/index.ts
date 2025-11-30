/**
 * Services Index
 * Barrel file that re-exports available services.
 * Adds small runtime stubs for services that were removed/missing
 * so the app can compile while the full implementations are restored.
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

// NOTE: Some services (enrollment, voice) were referenced by the app but
// their source files are missing in the workspace. To avoid build-time
// failures we provide small stub implementations here. These stubs throw
// descriptive errors when used so you can detect missing behavior at runtime
// and replace them with the real implementations later.

export const enrollmentService = {
    async getEnrollment(_courseId: string): Promise<any> {
        return Promise.reject(
            new Error('enrollmentService.getEnrollment is not implemented in this workspace')
        );
    },
    async updateCurrentLesson(_courseId: string, _lessonId: string): Promise<any> {
        return Promise.reject(
            new Error('enrollmentService.updateCurrentLesson is not implemented in this workspace')
        );
    },
};

export const voiceService = {
    async createSession(_data: any): Promise<any> {
        return Promise.reject(
            new Error('voiceService.createSession is not implemented in this workspace')
        );
    },
};

// Re-export a default object for convenience when code expects `import { default as services } from '@/services'`
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
