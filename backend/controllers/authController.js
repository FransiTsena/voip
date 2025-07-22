const Agent = require('../models/agent');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';



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
        res.json({ token, agent: { id: agent._id, username: agent.username, name: agent.name, email: agent.email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        req.agent = decoded;
        next();
    });
};
