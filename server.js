// const express = require("express");
// const bodyParser = require("body-parser");
// const path = require("path");
// const puppeteer = require("puppeteer");
// const hbs = require("hbs");
// const handlebars = require("handlebars");
// const handlebarsWax = require("handlebars-wax");
// const moment = require("moment");
// const fs = require("fs");
// const cors = require("cors");
// require("dotenv").config();
// const crypto = require("crypto");
// const axios = require("axios");
// const mysql = require("mysql2");
// const app = express();
// const PDFDocument = require('pdfkit');
// const blobStream = require('blob-stream');


// const port = process.env.NODE_PUBLIC_API_URL
//   ? new URL(process.env.NODE_PUBLIC_API_URL).port
//   : 8001;
// app.use(express.json()); // Ensure this line is present
// app.use(cors());

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, "public")));
// app.set("view engine", "hbs");
// app.set("views", path.join(__dirname, "src")); // Set directory for template files

// // Database connection setup using environment variables
// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// // Check database connection
// connection.connect((err) => {
//   if (err) {
//     console.error("Error connecting to the database:", err.stack);
//     return;
//   }
//   console.log("Connected to the database as ID:", connection.threadId);
// });

// // Register Handlebars helpers
// handlebars.registerHelper({
//   removeProtocol: (url) => url.replace(/.*?:\/\//g, ""),
//   concat: (...args) => args.filter((arg) => typeof arg !== "object").join(""),
//   formatAddress: (...args) =>
//     args.filter((arg) => typeof arg !== "object").join(" "),
//   formatDate: (date) => moment(date).format("MM/YYYY"),
//   lowercase: (s) => s.toLowerCase(),
//   eq: (a, b) => a === b,
// });

// // Initialize HandlebarsWax with Handlebars
// const Handlebars = handlebarsWax(handlebars);

// // Register partials
// Handlebars.partials(path.join(__dirname, "src", "partials", "", "*.hbs"));

// // Function to render resume using Handlebars
// function renderResume(formData) {
//   const css = fs.readFileSync(
//     path.join(__dirname, "src", "style.css"),
//     "utf-8"
//   );
//   const resumeTemplate = fs.readFileSync(
//     path.join(__dirname, "src", "resume.hbs"),
//     "utf-8"
//   );
//   const template = Handlebars.compile(resumeTemplate);
//   const html = template({
//     style: `<style>${css}</style>`,
//     resume: formData,
//   });
//   return html;
// }

// // Function to generate a unique 7-digit alphanumeric GUID
// function generateGuid() {
//   return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 7);
// }

// // Endpoint to submit form data and render HTML
// app.post("/submit-form", (req, res) => {
//   const formData = req.body;
//   console.log(formData);

//   const publicId = generateGuid();
//   const candidateJson = JSON.stringify(formData);

//   // Insert data into the database
//   const query =
//     "INSERT INTO candidate_resume (public_id, candidate_id, candidate_json) VALUES (?, ?, ?)";
//   connection.query(query, [publicId, null, candidateJson], (error, results) => {
//     if (error) {
//       console.error("Error inserting data:", error);
//       return res.status(500).json({ error: "Database error" });
//     }
//     console.log("Data inserted with ID:", results.insertId);
//   });

//   const html = renderResume(formData);
//   //console.log(typeof html, html); // Log HTML for debugging
//   res.json({ html }); // Return the HTML content as JSON
// });





// app.post("/download-json", (req, res) => {
//   const formData = req.body; // Get the form data from the request body

//   // Convert the JSON object to a string
//   const jsonStr = JSON.stringify(formData, null, 2);

//   // Create a Buffer from the JSON string
//   const buffer = Buffer.from(jsonStr, "utf-8");

//   // Set the response headers to trigger a file download
//   res.setHeader(
//     "Content-Disposition",
//     'attachment; filename="resume-data.json"'
//   );
//   res.setHeader("Content-Type", "application/json");

//   // Send the buffer as the file content
//   res.send(buffer);
// });


// app.post("/generate-pdf", async (req, res) => {
//   const { html } = req.body;

//   try {
//     const browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });
//     const page = await browser.newPage();

//     await page.setContent(html, { waitUntil: 'networkidle0' });
//     const buffer = await page.pdf({
//       format: "A4",
//       printBackground: true,
//     });

//     await browser.close();

//     res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
//     res.setHeader("Content-Type", "application/pdf");
//     res.send(buffer);
//   } catch (err) {
//     console.error("Error generating PDF:", err.message);
//     res.status(500).send(`An error occurred while generating the PDF: ${err.message}`);
//   }
// });



// //fetch resume based upon the guid/public id
// app.get("/resume/:id", (req, res) => {
//   const resumeId = req.params.id;
//   const query =
//     "SELECT candidate_json FROM candidate_resume WHERE public_id = ?";
//   connection.query(query, [resumeId], async (err, results) => {
//     if (err) {
//       console.error("Error retrieving data:", err);
//       res.status(500).json({ message: "Error retrieving data", error: err });
//       return;
//     }
//     if (results.length > 0) {
//       const retrievedData = results[0].candidate_json;

//       try {
//         const parsedData = JSON.parse(retrievedData);

//         const html = renderResume(parsedData);

//         try {
//           const pdfResponse = await axios.post(
//             "http://localhost:8001/generate-pdf",
//             { html },
//             {
//               responseType: "arraybuffer",
//               headers: {
//                 Accept: "application/pdf",
//               },
//             }
//           );

//           res.setHeader("Content-Type", "application/pdf");
//           res.send(pdfResponse.data);
//         } catch (pdfErr) {
//           console.error("Error generating PDF:", pdfErr);
//           res.status(500).send("An error occurred while generating the PDF.");
//         }
//       } catch (parseErr) {
//         console.error("Error parsing JSON:", parseErr);
//         res.status(500).send("An error occurred while parsing JSON data.");
//       }
//     } else {
//       res.json({ message: "Resume not found. Please create a new resume." });
//     }
//   });
// });



// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

// module.exports = {
//   renderResume,
// };



const express = require('express');
const mysql = require('mysql2/promise');
const { OAuth2Client } = require('google-auth-library');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const puppeteer = require('puppeteer');
const hbs = require('hbs');
const handlebars = require('handlebars');
const handlebarsWax = require('handlebars-wax');
const moment = require('moment');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();
const crypto = require('crypto');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const blobStream = require('blob-stream');

const app = express();
const PORT = process.env.PORT 
// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src'));

// Express session setup
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
}));

// Google OAuth2 client setup

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME 
};

// MySQL connection
async function queryDb(query, params) {
  const connection = await mysql.createConnection(dbConfig);
  const [results] = await connection.execute(query, params);
  await connection.end();
  return results;
}

// Register Handlebars helpers
handlebars.registerHelper({
  removeProtocol: (url) => url.replace(/.*?:\/\//g, ""),
  concat: (...args) => args.filter((arg) => typeof arg !== 'object').join(''),
  formatAddress: (...args) => args.filter((arg) => typeof arg !== 'object').join(' '),
  formatDate: (date) => moment(date).format('MM/YYYY'),
  lowercase: (s) => s.toLowerCase(),
  eq: (a, b) => a === b,
});

const Handlebars = handlebarsWax(handlebars);
Handlebars.partials(path.join(__dirname, 'src', 'partials', '', '*.hbs'));

// Function to render resume using Handlebars
function renderResume(formData) {
  const css = fs.readFileSync(path.join(__dirname, 'src', 'style.css'), 'utf-8');
  const resumeTemplate = fs.readFileSync(path.join(__dirname, 'src', 'resume.hbs'), 'utf-8');
  const template = Handlebars.compile(resumeTemplate);
  const html = template({ style: `<style>${css}</style>`, resume: formData });
  return html;
}

// Function to generate a unique 7-digit alphanumeric GUID
function generateGuid() {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 7);
}

// Routes
app.get('/signin', async (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'select_account'
  });
  res.redirect(url);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { name: fullname, email: uname } = payload;

  let users = await queryDb('SELECT * FROM authuser WHERE uname = ?', [uname]);
  if (users.length === 0) {
    req.session.fullname = fullname;
    req.session.uname = uname;
    return res.redirect('/additional-info');
  } else {
    req.session.userId = uname;
    return res.redirect('/home');
  }
});

app.get('/please-signup', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Please sign up first before accessing your Google account</h1>
        <a href="/signin">Sign In with Google</a>
      </body>
    </html>
  `);
});

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
            <button type="submit">Submit</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

app.post('/submit-info', async (req, res) => {
  const { country, phone, city, zip } = req.body;
  const { fullname, uname } = req.session;

  await queryDb('INSERT INTO authuser (fullname, uname, country, phone, city, zip) VALUES (?, ?, ?, ?, ?, ?)', 
    [fullname, uname, country, phone, city, zip]);
  
  req.session.userId = uname;
  res.redirect('/home');
});

app.get('/home', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }

  let users = await queryDb('SELECT * FROM authuser WHERE uname = ?', [req.session.userId]);
  if (users.length === 0) {
    return res.redirect('/');
  }

  res.send(`
    <html>
      <body>
        <h1>Welcome to Home Page</h1>
      </body>
    </html>
  `);
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f4f4f4;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            outline: none;
            color: #fff;
            background-color: #4CAF50;
            border: none;
            border-radius: 15px;
            box-shadow: 0 4px #999;
          }
          .button:hover {background-color: #3e8e41}
          .button:active {
            background-color: #3e8e41;
            box-shadow: 0 2px #666;
            transform: translateY(2px);
          }
        </style>
      </head>
      <body>
        <a href="/signin" class="button">Sign In with Google</a>
      </body>
    </html>
  `);
});

app.post('/submit-form', (req, res) => {
  const formData = req.body;
  console.log(formData);

  const publicId = generateGuid();
  const candidateJson = JSON.stringify(formData);

  // Insert data into the database
  const query =
    "INSERT INTO candidate_resume (public_id, candidate_id, candidate_json) VALUES (?, ?, ?)";
  connection.query(query, [publicId, null, candidateJson], (error, results) => {
    if (error) {
      console.error("Error inserting data:", error);
      return res.status(500).json({ error: "Database error" });
    }
    console.log("Data inserted with ID:", results.insertId);
  });

  const html = renderResume(formData);
  res.json({ html }); // Return the HTML content as JSON
});

app.post('/download-json', (req, res) => {
  const formData = req.body;
  const jsonStr = JSON.stringify(formData, null, 2);
  const buffer = Buffer.from(jsonStr, 'utf-8');

  res.setHeader("Content-Disposition", 'attachment; filename="resume-data.json"');
  res.setHeader("Content-Type", "application/json");
  res.send(buffer);
});

app.post('/generate-pdf', async (req, res) => {
  const { html } = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.send(buffer);
  } catch (err) {
    console.error("Error generating PDF:", err.message);
    res.status(500).send(`An error occurred while generating the PDF: ${err.message}`);
  }
});

app.get('/resume/:id', (req, res) => {
  const resumeId = req.params.id;
  const query =
    "SELECT candidate_json FROM candidate_resume WHERE public_id = ?";
  connection.query(query, [resumeId], async (err, results) => {
    if (err) {
      console.error("Error retrieving data:", err);
      res.status(500).json({ message: "Error retrieving data", error: err });
      return;
    }
    if (results.length > 0) {
      const retrievedData = results[0].candidate_json;

      try {
        const parsedData = JSON.parse(retrievedData);
        const html = renderResume(parsedData);

        try {
          const pdfResponse = await axios.post(
            "http://localhost:8001/generate-pdf",
            { html },
            {
              responseType: "arraybuffer",
              headers: { Accept: "application/pdf" },
            }
          );

          res.setHeader("Content-Type", "application/pdf");
          res.send(pdfResponse.data);
        } catch (pdfErr) {
          console.error("Error generating PDF:", pdfErr);
          res.status(500).send("An error occurred while generating the PDF.");
        }
      } catch (parseErr) {
        console.error("Error parsing JSON:", parseErr);
        res.status(500).send("An error occurred while parsing JSON data.");
      }
    } else {
      res.json({ message: "Resume not found. Please create a new resume." });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});









