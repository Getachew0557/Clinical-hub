import User from '../models/User.js';
import jwt from 'jsonwebtoken';

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

        await user.save();

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
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
