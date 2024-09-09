const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const { SignJWT, jwtVerify } = require('jose');
const { TextEncoder } = require('util');
const pool = require('../db'); // Import the connection pool

const oauth2Client = new OAuth2Client(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);
const SECRET_KEY = process.env.SECRET_KEY;

async function queryDb(query, params) {
  const connection = await pool.promise().getConnection();
  const [results] = await connection.execute(query, params);
  connection.release();
  return results;
}

async function generateToken(data, expiresInMinutes = 60) {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(SECRET_KEY);
  const expirationTime = Math.floor(Date.now() / 1000) + (expiresInMinutes * 60);
  return new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expirationTime)
    .sign(secretKey);
}

router.get('/signin', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'select_account consent'
  });
  res.redirect(url);
});

router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { name: fullname, email: uname } = payload;

    const [users, candidates] = await Promise.all([
      queryDb('SELECT * FROM authuser WHERE uname = ?', [uname]),
      queryDb('SELECT candidateid FROM candidate WHERE email = ?', [uname])
    ]);

    if (users.length === 0 || candidates.length === 0) {
      req.session.fullname = fullname;
      req.session.uname = uname;
      return res.redirect('/additional-info');
    }

    const user = users[0];
    if (user.status !== 'active') {
      return res.send(`
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #f7f9fc;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            .container {
              text-align: center;
              padding: 20px;
              border: 1px solid #ddd;
              background-color: #fff;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            h1 {
              color: #333;
            }
            p {
              color: #666;
            }
            a {
              color: #007bff;
              text-decoration: none;
              font-weight: bold;
            }
            a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Account Disabled</h1>
            <p>Your account has been disabled. Please contact support for further assistance.</p>
            <p><a href="/signin">Sign in again</a></p>
          </div>
        </body>
        </html>
      `);
    }

    const candidateid = candidates[0].candidateid;
    const token = await generateToken({ candidateid });
    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).send('An error occurred during authentication');
  }
});

router.post('/additional-info', async (req, res) => {
  const { email, phone, education, work } = req.body;
  const uname = req.session.uname;
  const fullname = req.session.fullname;

  if (!uname || !fullname) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const results = await queryDb('SELECT candidateid FROM candidate WHERE email = ?', [uname]);
    if (results.length === 0) {
      return res.status(404).send('Candidate not found');
    }

    const candidateid = results[0].candidateid;

    await queryDb('INSERT INTO candidate (email, phone, education, work, candidateid, fullname) VALUES (?, ?, ?, ?, ?, ?)', [email, phone, education, work, candidateid, fullname]);
    req.session.uname = null; // Clear session data
    req.session.fullname = null;
    res.redirect('http://localhost:3000');
  } catch (error) {
    console.error('Error handling additional info submission:', error);
    res.status(500).send('An error occurred while processing your information');
  }
});

module.exports = router;
