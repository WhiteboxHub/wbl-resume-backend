const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const SECRET_KEY ='innova-path'; // Using 'innova-path' as the JWT secret key

const hashPassword = (password) => {
  return crypto.createHash('md5').update(password).digest('hex');
};

const login = (req, res) => {
  const { username, password } = req.body;
  const db = req.db;

  // Query to check user credentials from the 'authuser' table
  db.query('SELECT * FROM whiteboxqa.authuser WHERE uname = ?', [username], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = results[0];

    // Hash the plaintext password and compare with the hashed password in the database
    if (hashPassword(password) === user.passwd) {
      // Create a JWT
      const token = jwt.sign({ id: user.id, username: user.uname }, SECRET_KEY, { expiresIn: '1h' });

      return res.json({ token, message: `Welcome back, ${user.uname}!` });
    } else {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
  });
};

const getLeads = (req, res) => {
  const { page = 1, pageSize = 100 } = req.query; // Default to page 1 and 100 items per page
  const offset = (page - 1) * pageSize;

  const query = 'SELECT * FROM whiteboxqa.leads LIMIT ? OFFSET ?';
  const queryParams = [parseInt(pageSize), parseInt(offset)];

  req.db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
};

module.exports = { login, getLeads };
