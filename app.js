const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const { OAuth2Client } = require('google-auth-library');
const session = require('express-session');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const { SignJWT,jwtVerify } = require('jose');
const { TextEncoder } = require('util'); 
require("dotenv").config();

const app = express();
const PORT = 8002;

// Middleware to parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Google OAuth2 client setup
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI ;

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// MySQL database setup
const dbConfig = {

  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME

};

async function queryDb(query, params) {
  const connection = await mysql.createConnection(dbConfig);
  const [results] = await connection.execute(query, params);
  await connection.end();
  return results;
}

// Express session setup
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
}));

const SECRET_KEY = process.env.SECRET_KEY; // Your secret key
const ALGORITHM = process.env.ALGORITHM; // Algorithm used for signing the token

async function generateToken(data, expiresInMinutes = 60) {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(SECRET_KEY); // Encode the secret key

  // Calculate expiration time as Unix timestamp
  const expirationTime = Math.floor(Date.now() / 1000) + (expiresInMinutes * 60); // Unix timestamp

  const jwt = await new SignJWT(data)
    .setProtectedHeader({ alg: ALGORITHM })
    .setExpirationTime(expirationTime) // Set expiration as Unix timestamp
    .sign(secretKey);

  return jwt;
}

// Route for sign in with Google
app.get('/api/node/signin', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'select_account consent'
  });
  res.redirect(url);
});

  

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    // If no code is provided, redirect to the sign-in page
    return res.redirect('/api/node/signin');
  }

  try {
    // Exchange the authorization code for access token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Verify the ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { name: fullname, email: uname } = payload;

    // Fetch user and candidate from the database
    const [users, candidates] = await Promise.all([
      queryDb('SELECT * FROM authuser WHERE uname = ?', [uname]),
      queryDb('SELECT candidateid FROM candidate WHERE email = ?', [uname])
    ]);

    // If user or candidate not found, redirect to additional info page
    if (users.length === 0 || candidates.length === 0) {
      req.session.fullname = fullname;
      req.session.uname = uname;
      return res.redirect('/additional-info');
    }

    // Check if user's status is 'active'
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
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
              padding: 40px;
              max-width: 400px;
              text-align: center;
              border: 1px solid #dfe1e5;
            }
            h1 {
              color: #333;
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 20px;
            }
            p {
              font-size: 16px;
              color: #555;
              margin-bottom: 30px;
            }
            .contact-btn {
              background-color: #0056b3;
              color: #ffffff;
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
              transition: background-color 0.3s ease;
            }
            .contact-btn:hover {
              background-color: #004494;
            }
            .home-btn {
              background-color: #4CAF50;
              color: #ffffff;
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
              margin-top: 20px;
              transition: background-color 0.3s ease;
            }
            .home-btn:hover {
              background-color: #45a049;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Account Inactive</h1>
            <p>Your account is currently inactive. Please contact the recruiting team for further assistance.</p>
            <p>Please contact Recruiting <br> '+1 925-557-1053'</p>
            <button class="contact-btn" onclick="window.location.href='mailto:recruiting@whitebox-learning.com'">Contact Recruiting Team</button>
            <button class="home-btn" onclick="window.location.href='https://whitebox-learning.com/'">Go to Home Page</button>
          </div>
        </body>
        </html>
      `);
    }

    // Increment the login count and update last login time
    let updateResult;
    if (user.logincount === null || user.logincount === undefined) {
      // Initialize logincount to 1 and set lastlogin to now if it's not set
      updateResult = await queryDb('UPDATE authuser SET logincount = 1, lastlogin = NOW() WHERE uname = ?', [uname]);
    } else {
      // Increment logincount and update lastlogin
      updateResult = await queryDb('UPDATE authuser SET logincount = logincount + 1, lastlogin = NOW() WHERE uname = ?', [uname]);
    }

    console.log('Update Result:', updateResult); // Log the result of the update query

    // Proceed if the status is active
    req.session.userId = uname;

    // Extract the candidateid from the query result
    const candidateid = candidates[0].candidateid;

    // Generate JWT token with required fields
    const jwtToken = await generateToken({ sub: uname, candidateid });

    // console.log('Generated JWT Token:', jwtToken); 
    // Ensure JWT token is correctly logged

    // Redirect to frontend home page with JWT token
    const redirectUrl = 'https://whitebox-learning.com/';
    res.redirect(`${redirectUrl}?access_token=${jwtToken}`);
  } catch (error) {
    console.error('Error during OAuth2 callback:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/api/user-data', async (req, res) => {
  const { jwt_token } = req.query;

  if (!jwt_token) {
    return res.status(400).json({ error: 'JWT token is required' });
  }

  // Verify and decode the JWT token
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(SECRET_KEY); // Convert secret key to Uint8Array for `jose` compatibility

    // Use `jwtVerify` to verify and decode the JWT
    const { payload } = await jwtVerify(jwt_token, secretKey);

    // Return the decoded payload as JSON response
    res.json(payload);
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired JWT token' });
  }
});

// Route to collect additional information
app.get('/additional-info', (req, res) => {
  res.send(`
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
            text-align: center;
            color: #333;
          }
          form {
            display: flex;
            flex-direction: column;
          }
          label {
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
          }
          input {
            margin-bottom: 10px;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          button {
            padding: 10px;
            background-color: #4CAF50;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Please Enter Your Details</h1>
          <form action="/submit-info" method="POST">
            <label for="country">Country:</label>
            <input type="text" id="country" name="country" required>
            <label for="phone">Phone Number:</label>
            <input type="text" id="phone" name="phone" required>
            <label for="city">City:</label>
            <input type="text" id="city" name="city" required>
            <label for="zip">ZIP Code:</label>
            <input type="text" id="zip" name="zip" required>
            <label for="address">Address:</label>
            <input type="text" id="address" name="address" required>
            <button type="submit">Submit</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

// Route to handle the form submission
app.post('/submit-info', async (req, res) => {
  const { country, phone, city, zip, address } = req.body;
  const { fullname, uname } = req.session;

  // Insert data into the authuser table
  await queryDb('INSERT INTO authuser (uname, fullname, country, phone, city, zip, address) VALUES (?, ?, ?, ?, ?, ?, ?)', 
    [uname, fullname, country, phone, city, zip, address]);

  // Insert data into the candidate table
  await queryDb('INSERT INTO candidate (email, name, phone, city, zip, address) VALUES (?, ?, ?, ?, ?, ?)', 
    [uname, fullname, phone, city, zip, address]);

  req.session.userId = uname;
  res.redirect('/home');
});

// Route to display the home page after sign in
app.get('/home', async (req, res) => {
  const redirectUrl = 'https://whitebox-learning.com/';
  if (!req.session.userId) {
    return res.redirect('/');
  }

  let users = await queryDb('SELECT * FROM authuser WHERE uname = ?', [req.session.userId]);
  if (users.length === 0) {
    
    return res.redirect('/');
  }
  return res.redirect(`${redirectUrl}`);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});