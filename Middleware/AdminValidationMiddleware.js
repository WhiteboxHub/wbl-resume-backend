const jwt = require('jsonwebtoken')
require('dotenv').config()
const jwt_secret = process.env.SECRET_KEY;


const AdminValidation = async(req,res,next)=>{

    const authHeader = req.header('AuthToken'); // Get token from headers
//   const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
  if (!authHeader) {
    return res.status(401).json({ message: 'Token not provided' });
  }

  // Verify token
  jwt.verify(authHeader, jwt_secret, (err, decodedToken) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    const { username } = decodedToken;

    // Check if the username exists in the database
    const db = req.db; // Assuming the database connection is available in req.db
    db.query('SELECT * FROM whiteboxqa.authuser WHERE uname = ?', [username], (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length === 0) {
        // No user found with this username
        return res.status(404).json({ message: 'User not found' });
      }

      // User exists, proceed to the next middleware or route handler
      req.user = results[0]; // Attach the user data to the request object for use in subsequent handlers
      next();
    });
  });
}

module.exports = AdminValidation