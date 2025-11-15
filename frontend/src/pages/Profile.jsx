import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { User, Mail, Calendar, Settings } from 'lucide-react';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || ''
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await userService.getStats();
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await userService.updateProfile(formData);
            updateUser(response.data.user);
            setEditing(false);
            alert('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            {/* Profile Info */}
            <div className="card mb-8">
                <div className="flex items-start justify-between mb-6">
                    <h2 className="text-xl font-bold">Personal Information</h2>
                    <button
                        onClick={() => setEditing(!editing)}
                        className="btn-secondary"
                    >
                        {editing ? 'Cancel' : 'Edit'}
                    </button>
                </div>

                {editing ? (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input-field"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary">
                            Save Changes
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="font-medium text-gray-900">{user?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium text-gray-900">{user?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-600">Member Since</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(user?.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Learning Statistics */}
            <div className="card">
                <h2 className="text-xl font-bold mb-6">Learning Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Total Conversations</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {stats?.totalConversations || 0}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Total Messages</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {stats?.totalMessages || 0}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {stats?.currentStreak || 0} days
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Recent Activity (7 days)</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {stats?.recentActivity?.last7Days || 0}
                        </p>
                    </div>
                </div>

                {/* Topic Progress */}
                {stats?.topicProgress && Object.keys(stats.topicProgress).length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">Progress by Topic</h3>
                        <div className="space-y-3">
                            {Object.entries(stats.topicProgress).map(([topic, count]) => (
                                <div key={topic} className="flex items-center justify-between">
                                    <span className="capitalize text-gray-700">{topic}</span>
                                    <span className="font-semibold text-primary-600">{count} messages</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
