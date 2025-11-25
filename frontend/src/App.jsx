import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
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
import CreateCourse from './pages/CreateCourse';

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
            <Routes>
                {/* Public Routes - No Layout */}
                <Route
                    path="/login"
                    element={user ? <Navigate to="/dashboard" replace /> : <Login />}
                />
                <Route
                    path="/register"
                    element={user ? <Navigate to="/dashboard" replace /> : <Register />}
                />
                <Route
                    path="/"
                    element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
                />

                {/* Private Routes - Wrapped in Layout */}
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <Dashboard />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/chat"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <Chat />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/chat/:conversationId"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <Chat />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/conversations"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <Conversations />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/session/:sessionId"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <SessionDetails />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/courses"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <CourseCatalog />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/courses/create"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <CreateCourse />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/courses/:courseId"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <CourseDetails />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <Profile />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/roadmaps"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <MyRoadmaps />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/roadmaps/create"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <CreateRoadmap />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/roadmaps/:id"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <RoadmapDetail />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/flashcards"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <Flashcards />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/flashcards/study/:deckName"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <StudyFlashcards />
                            </Layout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/voice-tutor"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <VoiceTutorTest />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                {/* 404 - Not Found (No Layout) */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
