import User from '../models/User.js';
import Course from '../models/Course.js';
import nodemailer from 'nodemailer';

/**
 * Automated service to identify and invite high-quality students to become contributors
 */
class ContributorInvitationService {
    constructor() {
        this.emailTransporter = null;
        this.initializeEmailTransporter();
    }

    /**
     * Initialize email transporter for sending invitations
     */
    initializeEmailTransporter() {
        // Configure with your email service
        // This is a placeholder - you'll need to configure with actual credentials
        if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
            this.emailTransporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }
    }

    /**
     * Check all users and invite eligible ones
     * Run this as a daily cron job
     */
    async checkAndInviteEligibleStudents() {
        try {
            console.log('🔍 Checking for eligible students to invite as contributors...');

            // Find users who haven't been invited yet
            const users = await User.find({
                'contributorActivity.invitedToContribute': false
            });

            let invitedCount = 0;

            for (const user of users) {
                if (user.shouldBeInvitedAsContributor()) {
                    await this.inviteUserAsContributor(user);
                    invitedCount++;
                }
            }

            console.log(`✅ Invited ${invitedCount} users to become contributors`);

            return {
                success: true,
                invitedCount,
                message: `Invited ${invitedCount} eligible students`
            };
        } catch (error) {
            console.error('❌ Error checking eligible students:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Invite a specific user to become a contributor
     */
    async inviteUserAsContributor(user) {
        try {
            // Mark as invited
            user.contributorActivity.invitedToContribute = true;
            user.contributorActivity.invitedAt = new Date();
            await user.save();

            // Award reputation for being invited
            await user.awardReputation(25, 'contributor_invitation');

            // Send email invitation
            await this.sendInvitationEmail(user);

            console.log(`📧 Invited ${user.email} to become a contributor`);

            return {
                success: true,
                user: user._id,
                email: user.email
            };
        } catch (error) {
            console.error(`❌ Error inviting user ${user.email}:`, error);
            throw error;
        }
    }

    /**
     * Send invitation email to user
     */
    async sendInvitationEmail(user) {
        if (!this.emailTransporter) {
            console.log('⚠️  Email transporter not configured, skipping email');
            return;
        }

        const emailContent = {
            from: process.env.EMAIL_FROM || 'noreply@ailearning.com',
            to: user.email,
            subject: '🎉 You\'ve Been Invited to Become a Course Contributor!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Congratulations, ${user.name}!</h1>

          <p>We've noticed your excellent contributions to our learning community, and we'd like to invite you to become an official course contributor.</p>

          <h2>Your Achievements:</h2>
          <ul>
            <li>✓ ${user.contributorActivity.errorReports} error reports submitted</li>
            <li>✓ ${user.contributorActivity.suggestionsSubmitted} improvement suggestions</li>
            <li>✓ ${user.contributorActivity.suggestionsImplemented} suggestions implemented</li>
            <li>✓ Quality score: ${user.contributorActivity.qualityScore}/100</li>
          </ul>

          <h2>As a Contributor, You Can:</h2>
          <ul>
            <li>💡 Submit improvement suggestions for any course</li>
            <li>💰 Earn 2-5% revenue share when your suggestions are implemented</li>
            <li>⭐ Build your reputation on the platform</li>
            <li>🎓 Help improve the learning experience for thousands of students</li>
            <li>🚀 Potentially become a co-creator for courses in your expertise</li>
          </ul>

          <p style="background: #F3F4F6; padding: 15px; border-radius: 8px;">
            <strong>Note:</strong> With 50+ reputation points or as an invited contributor,
            you can apply to become a co-creator and earn 10-20% revenue share!
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contributor/welcome"
               style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Start Contributing Now
            </a>
          </div>

          <p style="color: #6B7280; font-size: 14px;">
            We're excited to have you join our community of contributors!
          </p>
        </div>
      `
        };

        try {
            await this.emailTransporter.sendMail(emailContent);
            console.log(`✅ Invitation email sent to ${user.email}`);
        } catch (error) {
            console.error(`❌ Error sending email to ${user.email}:`, error);
        }
    }

    /**
     * Get statistics about contributor invitations
     */
    async getInvitationStats() {
        try {
            const totalInvited = await User.countDocuments({
                'contributorActivity.invitedToContribute': true
            });

            const activeContributors = await User.countDocuments({
                'contributorActivity.invitedToContribute': true,
                'contributorActivity.suggestionsSubmitted': { $gt: 0 }
            });

            const eligibleButNotInvited = await User.countDocuments({
                'contributorActivity.invitedToContribute': false,
                $or: [
                    { 'contributorActivity.errorReports': { $gte: 10 } },
                    { 'contributorActivity.suggestionsSubmitted': { $gte: 5 } },
                    { 'contributorActivity.qualityScore': { $gte: 70 } }
                ]
            });

            return {
                totalInvited,
                activeContributors,
                conversionRate: totalInvited > 0 ? (activeContributors / totalInvited) * 100 : 0,
                eligibleButNotInvited
            };
        } catch (error) {
            console.error('Error getting invitation stats:', error);
            throw error;
        }
    }

    /**
     * Manually invite a specific user (for admins)
     */
    async manuallyInviteUser(userId) {
        try {
            const user = await User.findById(userId);

            if (!user) {
                throw new Error('User not found');
            }

            if (user.contributorActivity.invitedToContribute) {
                throw new Error('User has already been invited');
            }

            await this.inviteUserAsContributor(user);

            return {
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            };
        } catch (error) {
            console.error('Error manually inviting user:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new ContributorInvitationService();
