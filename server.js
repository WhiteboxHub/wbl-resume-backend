const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const hbs = require("hbs");
const handlebars = require("handlebars");
const handlebarsWax = require("handlebars-wax");
const puppeteer = require("puppeteer");
const moment = require("moment");
const fs = require("fs");
const cors = require("cors");
const crypto = require("crypto");
const mysql = require("mysql2");
const app = express();

const jwt = require('jsonwebtoken');
require("dotenv").config();



const port = process.env.NODE_PUBLIC_API_URL
  ? new URL(process.env.NODE_PUBLIC_API_URL).port
  : 8001;
// Ensure this line is present
app.use(express.json()); 

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "hbs");
// Set directory for template files
app.set("views", path.join(__dirname, "src")); 

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
  console.log("Connected to the database as ID:", connection.threadId);
});

// Register Handlebars helpers
handlebars.registerHelper({
  removeProtocol: (url) => url.replace(/.*?:\/\//g, ""),
  concat: (...args) => args.filter((arg) => typeof arg !== "object").join(""),
  formatAddress: (...args) =>
    args.filter((arg) => typeof arg !== "object").join(" "),
  formatDate: (date) => moment(date).format("MM/YYYY"),
  lowercase: (s) => s.toLowerCase(),
  eq: (a, b) => a === b,
});

// Initialize HandlebarsWax with Handlebars
const Handlebars = handlebarsWax(handlebars);

// Register partials
Handlebars.partials(path.join(__dirname, "src", "partials", "", "*.hbs"));

// Function to render resume using Handlebars
function renderResume(formData) {
  const css = fs.readFileSync(
    path.join(__dirname, "src", "style.css"),
    "utf-8"
  );
  const resumeTemplate = fs.readFileSync(
    path.join(__dirname, "src", "resume.hbs"),
    "utf-8"
  );
  const template = Handlebars.compile(resumeTemplate);
  const html = template({
    style: `<style>${css}</style>`,
    resume: formData,
  });
  return html;
}

// Function to generate a unique 7-digit alphanumeric GUID
function generateGuid() {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 7);
}




// Endpoint to submit form data and render HTML
// sahas check
// app.post("/submit-form", (req, res) => {
//   const formData = req.body;
//   // console.log(formData);

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
//  // Return the HTML content as JSON
//   res.json({ html }); 
// });




app.post('/api/resume/submit-form', (req, res) => {
  const formData = req.body;

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

    const candidateId = decodedToken.candidateid; // Extract candidateId from the decoded token

    if (!candidateId) {
      return res.status(400).json({ error: 'User not logged in' });
    }

    const publicId = generateGuid(); // Generate a new GUID if needed
    const candidateJson = JSON.stringify(formData);

    // Update existing candidate_resume entry with the new resume details
    const query = 'UPDATE candidate_resume SET candidate_json = ?, public_id = ? WHERE candidate_id = ?';
    connection.query(query, [candidateJson, publicId, candidateId], (error, results) => {
      if (error) {
        console.error('Error updating data:', error);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Candidate not found' });
      }

      console.log('Data updated for candidate_id:', candidateId);

      // Render the resume and return the HTML content as JSON
      const html = renderResume(formData);
      res.json({ html });
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});












// Endpoint to download the json file from the data
app.post("/api/resume/download-json", (req, res) => {
  const formData = req.body; 

  // Convert the JSON object to a string
  const jsonStr = JSON.stringify(formData, null, 2);

  // Create a Buffer from the JSON string
  const buffer = Buffer.from(jsonStr, "utf-8");

  // Set the response headers to trigger a file download
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="resume-data.json"'
  );
  res.setHeader("Content-Type", "application/json");

  // Send the buffer as the file content
  res.send(buffer);
});

//Endpoint to generate the pdf from html
app.post("/api/resume/generate-pdf", async (req, res) => {
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

// get the resume html in the UI and it's will only for readability
app.get("/resume/:id", (req, res) => {
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
        const parsedData = JSON.parse(retrievedData);
        const html = renderResume(parsedData);

        // Serve the HTML directly without generating a PDF
        res.setHeader("Content-Type", "text/html");
        res.send(html);
      } catch (parseErr) {
        console.error("Error parsing JSON:", parseErr);
        res.status(500).send("An error occurred while parsing JSON data.");
      }
    } else {
      res.json({ message: "Resume not found. Please create a new resume." });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = {
  renderResume,
};
