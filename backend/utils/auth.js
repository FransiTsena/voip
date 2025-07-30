const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const validateToken = (req, res, next) => {
    const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        // Check if token is expired
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            return res.status(401).json({ message: 'Token has expired' });
        }
        req.user = { id: decoded.id, username: decoded.username, token }; // Extract uid from token
        next();
    });
}

module.exports = {
    validateToken,
};