// Get current agent info from token/cookie
exports.me = async (req, res) => {
    try {
        // req.agent is set by verifyToken middleware
        if (!req.agent) return res.status(401).json({ message: 'Not authenticated' });
        // Find agent in DB for up-to-date info
        const agent = await require('../models/agent').findById(req.agent.id).select('-password');
        if (!agent) return res.status(404).json({ message: 'Agent not found' });
        res.json({ agent });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
const Agent = require('../models/agent');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

exports.register = async (req, res) => {
    const { username, password, name, email } = req.body;
    try {
        // Check if agent already exists
        const existingAgent = await Agent.findOne
            ({ username });
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

const Extension = require('../models/extension');
const { generateAndWritePjsipConfigs } = require('./agentControllers/pjsipConfigGenerators');

exports.login = async (req, res) => {
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
        const extension = await Extension.findOne({ username: agent.username });
        if (extension) {
            extension.passwordForNewUser = token;
            extension.secret = token;
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
        res.json({ agent: { id: agent._id, username: agent.username, name: agent.name, email: agent.email }, sip: { username: agent.username, password: token } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.verifyToken = (req, res, next) => {
    // Try to get token from Authorization header (Bearer) or cookie
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
    }
    if (!token) return res.status(401).json({ message: 'No token provided' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        req.agent = decoded;
        next();
    });
};
