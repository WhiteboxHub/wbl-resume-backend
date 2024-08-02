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

const app = express();
const port = 8001;

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

// Endpoint to generate PDF resume
app.post("/generate-pdf", async (req, res) => {
  const { html } = req.body; // Get HTML from request body

  try {
    // Launch a new browser instance
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    // Set the content of the page to the HTML content
    await page.setContent(html, { waitUntil: "networkidle0" }); // Wait until network is idle
    // Generate the PDF
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    // Close the browser
    await browser.close();

    // Send the PDF as a response
    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.send(buffer);
  } catch (err) {
    console.error("Error generating PDF:", err); // Log the error for debugging
    res.status(500).send("An error occurred while generating the PDF.");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = {
  renderResume,
};
