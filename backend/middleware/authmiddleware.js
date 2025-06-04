const jwt = require('jsonwebtoken');
 require('dotenv').config(); // Ensure JWT_SECRET is loaded

 module.exports = function(req, res, next) {
     const authHeader = req.header('Authorization');
     console.log(`authMiddleware - Path: ${req.path} - Received Authorization header:`, authHeader); // LOG A

     if (!authHeader) {
         console.log("authMiddleware - No token header provided.");
         return res.status(401).json({ message: 'No token, authorization denied' });
     }

     const parts = authHeader.split(' ');
     if (parts.length !== 2 || parts[0] !== 'Bearer') {
         console.log("authMiddleware - Token format incorrect. Header:", authHeader);
         return res.status(401).json({ message: 'Token format is "Bearer <token>"' });
     }
     
     const tokenValue = parts[1];
     console.log("authMiddleware - Extracted tokenValue:", tokenValue); // LOG B

     if (!process.env.JWT_SECRET) {
        console.error("authMiddleware - FATAL: JWT_SECRET is not defined in .env!");
        return res.status(500).json({ message: 'Server configuration error (auth).' });
     }

     try {
         const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
         console.log("authMiddleware - Token decoded successfully. User ID:", decoded.user?.id); // LOG C
         req.user = decoded.user; 
         next();
     } catch (err) {
         console.error("authMiddleware - Token verification failed:", err.message); // LOG D
         res.status(401).json({ message: 'Token is not valid' });
     }
 };