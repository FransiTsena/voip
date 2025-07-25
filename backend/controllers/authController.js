// Get current agent info from token/cookie
const { generateAndWritePjsipConfigs } = require('./agentControllers/pjsipConfigGenerators.js');

const Agent = require('../models/agent.js');
const Extension = require('../models/extension.js');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const me = async (req, res) => {
    try {
        // req.user is set by verifyToken middleware
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
        // Find agent in DB for up-to-date info
        const agent = await Agent.findById(req.user.id).select('-password');

        try {
            res.json({ agent, sip: { userExtension: agent.username, password: req.user.token.substring(0, 16) } });
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    } catch (error) {
        console.error('Error fetching current agent:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const logout = (req, res) => {
    // Clear the access token cookie
    res.clearCookie('access_token', { path: '/' });
    res.json({ message: 'Logged out successfully' });
};

const register = async (req, res) => {
    const { username, password, name, email } = req.body;
    try {
        // Check if agent already exists
        const existingAgent = await Agent.findOne({ userExtension: username });
        if (existingAgent) {
            return res.status(400).json({ message: 'Agent already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAgent = new Agent({ username, password: hashedPassword, name, email });
        await newAgent.save();
        res.status(201).json({ message: 'Agent registered successfully' });
    } catch (error) {
        console.error('Error registering agent:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const agent = await Agent.findOne({ username });
        if (!agent) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const isMatch = await bcrypt.compare(password, agent.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const token = jwt.sign({ id: agent._id, username: agent.username }, JWT_SECRET, { expiresIn: '8h' });

        // Update the agent's extension SIP password to the new token
        const sipPassword = token.substring(0, 16);
        const extension = await Extension.findOne({ userExtension: agent.username, });
        if (extension) {
            extension.passwordForNewUser = sipPassword;
            extension.secret = sipPassword;
            await extension.save();

            // Regenerate and reload PJSIP config for all extensions
            const allExtensions = await Extension.find();
            await generateAndWritePjsipConfigs(allExtensions);
        }

        // Set token as HttpOnly cookie
        res.cookie('access_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            // secure: true, // Uncomment if using HTTPS
            path: '/',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        });
        res.json({ agent: { id: agent._id, username: agent.username, name: agent.name, email: agent.email }, sip: { username: agent.username, password: sipPassword }, access_token: token });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


module.exports = {
    me,
    // refresh,
    register,
    login,
    logout,
};
