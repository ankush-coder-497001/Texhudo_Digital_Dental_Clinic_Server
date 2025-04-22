const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Doctor = require('../models/Doctor.model');

const authMiddleware = (requiredUserTypes = []) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Authorization token missing or invalid format' 
                });
            }

            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Check token expiration explicitly
                if (decoded.exp < Date.now() / 1000) {
                    return res.status(401).json({ 
                        success: false,
                        message: 'Token has expired' 
                    });
                }

                // Verify user still exists in database
                let user;
                if (decoded.type === 'user') {
                    user = await User.findById(decoded.id).select('-password');
                } else if (decoded.type === 'doctor') {
                    user = await Doctor.findById(decoded.id).select('-password');
                }

                if (!user) {
                    return res.status(401).json({ 
                        success: false,
                        message: 'User not found or access revoked' 
                    });
                }

                req.user = {
                    id: decoded.id,
                    type: decoded.type,
                    ...user._doc
                };

                if (requiredUserTypes.length > 0 && !requiredUserTypes.includes(req.user.type)) {
                    return res.status(403).json({ 
                        success: false,
                        message: 'Access denied: insufficient permissions' 
                    });
                }

                next();
            } catch (error) {
                if (error.name === 'JsonWebTokenError') {
                    return res.status(401).json({ 
                        success: false,
                        message: 'Invalid token' 
                    });
                }
                throw error;
            }
        } catch (error) {
            return res.status(500).json({ 
                success: false,
                message: 'Authentication error', 
                error: error.message 
            });
        }
    };
};

module.exports = authMiddleware;