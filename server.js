const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const puppeteer = require("puppeteer");
const hbs = require("hbs");
const handlebars = require("handlebars");
const handlebarsWax = require("handlebars-wax");
const moment = require("moment");
const fs = require("fs");
const cors = require('cors');
require('dotenv').config();
const crypto = require('crypto');
const axios = require('axios');
const mysql = require('mysql2');
const app = express();
const port = process.env.NODE_PUBLIC_API_URL ? new URL(process.env.NODE_PUBLIC_API_URL).port : 8001;

app.use(express.json()); // Ensure this line is present

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "src")); // Set directory for template files

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

// Endpoint to submit form data and render HTML
app.post("/submit-form", (req, res) => {
  const formData = req.body;
  const html = renderResume(formData);
  console.log(typeof html, html); // Log HTML for debugging
  res.json({ html }); // Return the HTML content as JSON
});

app.post("/download-json", (req, res) => {  
  const formData = req.body; // Get the form data from the request body

  // Convert the JSON object to a string
  const jsonStr = JSON.stringify(formData, null, 2);

  // Create a Buffer from the JSON string
  const buffer = Buffer.from(jsonStr, 'utf-8');

  // Set the response headers to trigger a file download
  res.setHeader('Content-Disposition', 'attachment; filename="resume-data.json"');
  res.setHeader('Content-Type', 'application/json');

  // Send the buffer as the file content
  res.send(buffer);
});

app.post("/generate-pdf", async (req, res) => {
  const { html } = req.body; // Get HTML from request body

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(1000); // Wait for additional rendering time if needed

    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.send(buffer);
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).send("An error occurred while generating the PDF.");
  }
});




app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = {
  renderResume,
};
