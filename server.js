const express= require("express") ;
const bodyParser = require("body-parser");
const path = require("path");
const puppeteer = require("puppeteer");
const cors = require("cors");
const crypto = require("crypto");
const mysql = require("mysql2");
const app = express();
const jwt = require('jsonwebtoken');
const { type } = require("os");
const theme = require('jsonresume-theme-macchiato');
require("dotenv").config();

const port = 8001;
// Ensure this line is present
app.use(express.json()); 

const corsOptions = {
  origin: [
    // Adjust these origins based on your frontend 
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

const secretKey =  process.env.SECRET_KEY;

// Create MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 20,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 100000 // Increase timeout to 100 seconds
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error getting connection from pool:', err.stack);
    return;
  }
})
// Function to generate a GUID
function generateGuid() {
  return crypto.randomBytes(4).toString('hex').toLowerCase().slice(0, 7);
}

// Middleware to verify JWT token
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

// Route to handle PDF download
app.post('/api/node/download-pdf', (req, res) => {
  const { html, resumeJson } = req.body;
  const candidateId = req.decodedToken?.candidateid;

  if (!candidateId) {
    return res.status(401).json({ error: 'Please register with a new email to continue' });
  }

  const publicId = generateGuid();

  // Update existing candidate_resume entry with the new resume details
  const query = 'UPDATE candidate_resume SET candidate_json = ?, public_id = ? WHERE candidate_id = ?';
  
  pool.query(query, [resumeJson, publicId, candidateId], (error, results) => {
    if (error) {
      console.error('Error updating data:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(401).json({ error: 'Candidate not found' });
    }

    // Generate PDF from HTML
    generatePdf(html)
      .then(buffer => {
        const filename = `resume_${publicId}.pdf`;
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.end(buffer);
      })
      .catch(err => {
        console.error('Error generating PDF:', err.message);
        res.status(500).json({ error: `An error occurred while generating the PDF: ${err.message}` });
      });
  });
});
async function generatePdf(html) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,  // Change to false for debugging
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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

app.get("/api/node/:id", (req, res) => {
  const resumeId = req.params.id;
  const query = "SELECT candidate_json FROM candidate_resume WHERE public_id = ?";

  pool.query(query, [resumeId], (err, results) => {
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
