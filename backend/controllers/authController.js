const { generateAndWritePjsipConfigs } = require('./agentControllers/pjsipConfigGenerators.js');
const User = require('../models/userModel.js');
const AgentProfile = require('../models/agentProfileModel.js');
const Extension = require('../models/extension.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const me = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
        const user = await User.findById(req.user.id).select('-password');

        if (user) {
            res.json({ user, sip: { userExtension: user.userExtension, password: req.user.token.substring(0, 16) } });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const logout = (req, res) => {
    res.clearCookie('access_token', { path: '/' });
    res.json({ message: 'Logged out successfully' });
};

const register = async (req, res) => {
    const { displayName, email, password, role, userExtension, queues } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            displayName,
            email,
            password,
            role,
            userExtension,
        });


        if (user) {
            res.status(201).json({
                _id: user._id,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '8h' });


            res.cookie('access_token', token, {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                maxAge: 8 * 60 * 60 * 1000 // 8 hours
            });

            res.json({
                _id: user._id,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                token,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const refresh = async (req, res) => {
    // This needs to be implemented
}

module.exports = {
    me,
    refresh,
    register,
    login,
    logout,
};
