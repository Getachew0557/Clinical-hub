import jwt from 'jsonwebtoken';

/**
 * Microservice Auth Middleware
 * Verifies the JWT issued by auth-service using the shared JWT_SECRET.
 * Does NOT query any database — all identity info lives in the token payload.
 */
export const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user identity from token (id + role)
            req.user = {
                id: decoded.id,
                role: decoded.role
            };

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * Role-based Authorization Guard
 * Usage: authorize('Admin', 'Receptionist')
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};
