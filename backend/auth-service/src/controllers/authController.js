import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { publishEvent } from '../utils/eventBus.js';
import { Op } from 'sequelize';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

export const register = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Restriction: Only Admin/Receptionist can specify a role other than 'Patient'
        let finalRole = 'Patient';
        if (role && ['Admin', 'Receptionist', 'Doctor'].includes(role)) {
            // If try to set privileged role, MUST be authorized
            if (req.user && ['Admin', 'Receptionist'].includes(req.user.role)) {
                finalRole = role;
            } else if (role !== 'Patient') {
                return res.status(403).json({ message: 'Only administrators can register staff members' });
            }
        }

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ fullName, email, password, role: finalRole });

        // Always create a patient profile for Patient role — directly via HTTP to patient-service
        if (finalRole === 'Patient') {
            const patientServiceUrl = process.env.PATIENT_SERVICE_URL;
            if (patientServiceUrl) {
                const baseUrl = patientServiceUrl.replace('/api/patients', '');
                axios.post(`${baseUrl}/api/internal/events`, {
                    routingKey: 'user.registered',
                    data: { userId: user.id, fullName: user.fullName, email: user.email }
                }).catch(err => console.warn('[Auth] Could not notify patient-service:', err.message));
            }
            if (!['Admin', 'Receptionist'].includes(req.user?.role)) {
                publishEvent('user.registered', {
                    userId: user.id, fullName: user.fullName, email: user.email
                }).catch(() => {});
            }
        }

        // Send welcome notification to the new user
        const notifyUrl = process.env.NOTIFICATION_SERVICE_URL;
        if (notifyUrl) {
            const isAdminCreated = req.user && ['Admin', 'Receptionist'].includes(req.user.role);
            axios.post(notifyUrl, {
                userId: user.id,
                title: 'Welcome to Biruh Tena!',
                message: isAdminCreated
                    ? `Your ${finalRole} account has been created. You can now log in with your credentials.`
                    : `Welcome, ${user.fullName}! Your patient account is ready. You can now book appointments.`,
                type: 'Success',
                link: '/dashboard'
            }).catch(() => {});

            // Also notify admins about new registration
            if (!isAdminCreated && finalRole === 'Patient') {
                // Get all admin users and notify them
                const adminUsers = await User.findAll({ where: { role: 'Admin' } });
                adminUsers.forEach(admin => {
                    axios.post(notifyUrl, {
                        userId: admin.id,
                        title: 'New Patient Registered',
                        message: `${user.fullName} (${user.email}) has self-registered as a patient.`,
                        type: 'Info',
                        link: '/patients'
                    }).catch(() => {});
                });
            }
        }

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            },
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            },
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMe = async (req, res) => {
    try {
        const { fullName, email } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        
        if (req.file) {
            user.profilePhoto = req.file.path.replace(/\\/g, '/').split('uploads/').pop();
            // Just the filename or relative path from uploads
            user.profilePhoto = `uploads/${user.profilePhoto}`;
        }

        await user.save();

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                profilePhoto: user.profilePhoto
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user || !(await user.comparePassword(oldPassword))) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/auth/forgot-password
 * Generates a reset token and (in production) emails it.
 * In development, returns the token directly for testing.
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ where: { email } });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.status(200).json({
                message: 'If an account with that email exists, a reset link has been sent.'
            });
        }

        // Generate a secure random token
        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        user.resetPasswordToken = token;
        user.resetPasswordExpires = expires;
        await user.save();

        // In production: send email with reset link
        // For now: return token in response (dev mode only)
        const isDev = process.env.NODE_ENV !== 'production';
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

        console.log(`[Auth] Password reset token for ${email}: ${token}`);

        res.status(200).json({
            message: 'If an account with that email exists, a reset link has been sent.',
            ...(isDev && { resetUrl, token }) // Only expose in dev
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/auth/reset-password
 * Validates the token and sets a new password.
 */
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        const user = await User.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        user.password = newPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
