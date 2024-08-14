const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const puppeteer = require("puppeteer");
const hbs = require("hbs");
const handlebars = require("handlebars");
const handlebarsWax = require("handlebars-wax");
const moment = require("moment");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();
const crypto = require("crypto");
const axios = require("axios");
const mysql = require("mysql2");
const app = express();
const PDFDocument = require('pdfkit');
const blobStream = require('blob-stream');


const port = process.env.NODE_PUBLIC_API_URL
  ? new URL(process.env.NODE_PUBLIC_API_URL).port
  : 8001;
app.use(express.json()); // Ensure this line is present
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "src")); // Set directory for template files

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
app.post("/submit-form", (req, res) => {
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
  //console.log(typeof html, html); // Log HTML for debugging
  res.json({ html }); // Return the HTML content as JSON
});





app.post("/download-json", (req, res) => {
  const formData = req.body; // Get the form data from the request body

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





// // Endpoint to generate PDF
// app.post('/generate-pdf', async (req, res) => {
//   const { html } = req.body;

//   if (!html) {
//       return res.status(400).json({ error: 'HTML content is required' });
//   }

//   try {
//       // Launch Puppeteer and create a new page
//       const browser = await puppeteer.launch({
//         headless: true,
//         args: ['--no-sandbox', '--disable-setuid-sandbox'],
//       });
//       const page = await browser.newPage();

//       // Set the content of the page to the HTML from the request
//       await page.setContent(html, { waitUntil: 'networkidle0' });
//       // await page.waitForTimeout(1000)

//       // Generate PDF with options for better rendering
//       const pdfBuffer = await page.pdf({
//           format: 'A4',
//           printBackground: true,
//       });

//       // Close the browser
//       await browser.close();

//       // Set headers and send the PDF
//       res.setHeader("Content-Type", "application/pdf");
//       res.setHeader("Content-Disposition", "inline; filename=resume.pdf");
//       res.send(pdfBuffer);
//   } catch (error) {
//       console.error('Error generating PDF:', error);
//       res.status(500).json({ error: 'Failed to generate PDF' });
//   }
// });

app.post("/generate-pdf", async (req, res) => {
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




// // Endpoint to generate PDF
// app.post('/generate-pdf', async (req, res) => {
//   const html = req.body;

//   if (!html) {
//       return res.status(400).json({ error: 'HTML content is required' });
//   }

//   try {
//     // Create a new PDF document
//     const doc = new PDFDocument();

//     // Create a stream to capture the PDF data
//     const stream = doc.pipe(blobStream());

//     // Add content to the PDF
//     doc.text(html); // Simple text content, for HTML rendering, use a library like 'pdfkit-html' or similar

//     // Finalize the PDF and end the stream
//     doc.end();

//     // Wait for the stream to finish
//     stream.on('finish', () => {
//       // Set headers and send the PDF
//       res.setHeader("Content-Type", "application/pdf");
//       res.setHeader("Content-Disposition", "inline; filename=resume.pdf");
//       res.send(stream.toBlobURL('application/pdf'));
//     });

//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     res.status(500).json({ error: 'Failed to generate PDF' });
//   }
// });




//fetch resume based upon the guid/public id
app.get("/resume/:id", (req, res) => {
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
              headers: {
                Accept: "application/pdf",
              },
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











// app.post('/validate-resume', (req, res) => {
//   const userId = req.user.id;  // Assuming user ID is stored in req.user after authentication

//   const query = 'SELECT * FROM candidate WHERE candidate_id = ?';
//   connection.query(query, [userId], (err, results) => {
//       if (err) return res.status(500).json({ error: 'Database query failed' });

//       if (results.length > 0) {
//           // User found, proceed to check if they have a resume
//           const resumeQuery = 'SELECT * FROM candidate_resume WHERE candidate_id = ?';
//           connection.query(resumeQuery, [userId], (err, resumeResults) => {
//               if (err) return res.status(500).json({ error: 'Database query failed' });

//               if (resumeResults.length > 0) {
//                   res.json({ valid: true, resumeExists: true });
//               } else {
//                   res.json({ valid: true, resumeExists: false });
//               }
//           });
//       } else {
//           res.status(404).json({ valid: false, message: 'User not found' });
//       }
//   });
// });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = {
  renderResume,
};
