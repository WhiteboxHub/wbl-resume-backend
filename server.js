const express= require("express") ;
const bodyParser = require("body-parser");
const path = require("path");
const puppeteer = require("puppeteer");
const fs = require("fs");
const cors = require("cors");
const crypto = require("crypto");
const mysql = require("mysql2");
const app = express();
const jwt = require('jsonwebtoken');
const { type } = require("os");
const theme = require('jsonresume-theme-macchiato');
require("dotenv").config();




const port = process.env.NODE_PUBLIC_API_URL
  ? new URL(process.env.NODE_PUBLIC_API_URL).port
  : 8001;
// Ensure this line is present
app.use(express.json()); 

const corsOptions = {
  origin: [
    // Adjust these origins based on your frontend deployment
    "http://localhost:3000",
    "https://whitebox-learning.com",
    "https://www.whitebox-learning.com",
    // Consider using wildcards if your frontend URL can vary
    "*.whitebox-learning.com"
  ],
  credentials: true, // Allow cookies, authorization headers, etc.
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
};

app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use((req, res, next) => {
//   console.log(`Incoming request: ${req.method} ${req.url}`);
//   next();
// });

const secretKey =  process.env.SECRET_KEY;

// Database connection setup using environment variables
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Check database connection
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.stack);
    return;
  }
 
});

function generateGuid() {
  return crypto.randomBytes(4).toString("hex").toLowerCase().slice(0, 7);
}

app.post('/api/resume/download-pdf', async (req, res) => {
  const { html  } = req.body;
  const{ resumeJson } = req.body;
  // Retrieve the token from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(400).json({ error: 'No token provided' });
  }

  // Verify and decode the token
  try {
    const decodedToken = jwt.verify(token, secretKey);
    const candidateId = decodedToken.candidateid;

    if (!candidateId) {
      return res.status(400).json({ error: 'User not logged in' });
    }

    const publicId = generateGuid(); // Generate a new GUID if needed

    // Update existing candidate_resume entry with the new resume details
    const query = 'UPDATE candidate_resume SET candidate_json = ?, public_id = ? WHERE candidate_id = ?';
    connection.query(query, [resumeJson, publicId, candidateId], (error, results) => {
      if (error) {
        console.error('Error updating data:', error);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.affectedRows === 0) { 
        return res.status(404).json({ error: 'Candidate not found' });
      }

      // console.log('Data updated for candidate_id:', candidateId);

      // Generate PDF from HTML
      generatePdf(html).then(buffer => {
        const filename = `resume_${publicId}.pdf`;
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "application/pdf");
        res.end(buffer);
      }).catch(err => {
        console.error("Error generating PDF:", err.message);
        res.status(500).send(`An error occurred while generating the PDF: ${err.message}`);
      });
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

async function generatePdf(html) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,  // Change to false for debugging
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      dumpio: true,
    });
    
    const page = await browser.newPage();
    

    await page.setContent(html, { waitUntil: 'networkidle0' });
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('error', error => console.error('PAGE ERROR:', error));
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });
    return buffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

app.get("/api/resume/:id", (req, res) => {
  const resumeId = req.params.id;
  const query = "SELECT candidate_json FROM candidate_resume WHERE public_id = ?";

  connection.query(query, [resumeId], (err, results) => {
    if (err) {
      console.error("Error retrieving data:", err);
      res.status(500).json({ message: "Error retrieving data", error: err });
      return;
    }

    if (results.length > 0) {
      const retrievedData = results[0].candidate_json;

      try {
        // Parse the JSON data from the text column
        const resumeData = JSON.parse(retrievedData);
         const resumeHtml = theme.render(resumeData);
        // Serve the HTML with the theme
        res.setHeader("Content-Type", "text/html");
        res.send(resumeHtml);
      } catch (parseErr) {
        console.error("Error processing data:", parseErr);
        res.status(500).send("An error occurred while processing the data.");
      }
    } else {
      res.json({ message: "Resume not found. Please create a new resume." });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

