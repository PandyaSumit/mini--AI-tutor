import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Conversations from './pages/Conversations';
import Profile from './pages/Profile';
import CreateRoadmap from './pages/CreateRoadmap';
import RoadmapDetail from './pages/RoadmapDetail';
import MyRoadmaps from './pages/MyRoadmaps';
import Flashcards from './pages/Flashcards';
import StudyFlashcards from './pages/StudyFlashcards';
import NotFound from './pages/NotFound';
import SessionDetails from './pages/SessionDetails';
import VoiceTutorTest from './pages/VoiceTutorTest';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetails from './pages/CourseDetails';

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <Router>
            <div className="min-h-screen bg-gray-50 flex">
                {user && <Sidebar />}
                <div className="flex-1 overflow-x-hidden">
                    <Routes>
                        {/* Public Routes */}
                        <Route
                            path="/login"
                            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
                        />
                        <Route
                            path="/register"
                            element={user ? <Navigate to="/dashboard" replace /> : <Register />}
                        />

                        {/* Private Routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <PrivateRoute>
                                    <Dashboard />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/chat"
                            element={
                                <PrivateRoute>
                                    <Chat />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/chat/:conversationId"
                            element={
                                <PrivateRoute>
                                    <Chat />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/conversations"
                            element={
                                <PrivateRoute>
                                    <Conversations />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/session/:sessionId"
                            element={
                                <PrivateRoute>
                                    <SessionDetails />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/courses"
                            element={
                                <PrivateRoute>
                                    <CourseCatalog />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/courses/:courseId"
                            element={
                                <PrivateRoute>
                                    <CourseDetails />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <PrivateRoute>
                                    <Profile />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/roadmaps"
                            element={
                                <PrivateRoute>
                                    <MyRoadmaps />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/roadmaps/create"
                            element={
                                <PrivateRoute>
                                    <CreateRoadmap />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/roadmaps/:id"
                            element={
                                <PrivateRoute>
                                    <RoadmapDetail />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/flashcards"
                            element={
                                <PrivateRoute>
                                    <Flashcards />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/flashcards/study/:deckName"
                            element={
                                <PrivateRoute>
                                    <StudyFlashcards />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/voice-tutor"
                            element={
                                <PrivateRoute>
                                    <VoiceTutorTest />
                                </PrivateRoute>
                            }
                        />

                        {/* Root - Landing page or redirect to dashboard */}
                        <Route
                            path="/"
                            element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
                        />

                        {/* 404 - Not Found */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
