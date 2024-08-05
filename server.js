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


const crypto = require('crypto');
const axios = require('axios');
const mysql = require('mysql2');

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




// Endpoint to generate PDF resume
app.post("/generate-pdf", async (req, res) => {
  const { html } = req.body; // Get HTML from request body

  //getting html here - debugging
  console.log(req.body);

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
    //oldOne res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    res.setHeader("Content-Disposition", "inline; filename=resume.pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.send(buffer);
  } catch (err) {

    console.error("Error generating PDF:", err); // Log the error for debugging
    res.status(500).send("An error occurred while generating the PDF.");
  }
});




//Sahas
// Create MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'mysql'
});

// Connect to MySQL
connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});


// Endpoint to submit form data and store them in DB and render HTML
app.post("/submit-form", (req, res) => { 
  const formData = req.body;

  const guid = generateAlphanumericId(7); //function call to generate 7 digits guid

  const html = renderResume(formData);

  const query = 'INSERT INTO formData (guid, data) VALUES (?, ?)';

  connection.query(query, [guid, JSON.stringify(formData)], (err, results) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).json({ message: 'Error saving data', error: err });
      return;
    }
    console.log('Form data inserted with GUID:', guid);
  });

  res.json({ html }); // Return the HTML content as JSON
});


//generation GUID
function generateAlphanumericId(length) {
  return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}


//view resume based on guid with this api.
app.get('/resume/:id', (req, res) => {
  const resumeId = req.params.id;
  const query = 'SELECT data FROM formData WHERE guid = ?';
  connection.query(query, [resumeId], async (err, results) => {
    if (err) {
      console.error('Error retrieving data:', err);
      res.status(500).json({ message: 'Error retrieving data', error: err });
      return;
    }
    //checking if we are getting the response ot not
    if (results.length > 0) {
      const retrievedData = results[0].data;
      console.log('Retrieved data:', retrievedData);  // received response (json data from DB)

      //sending the response Json to renderResume method to generate html
      // Render the HTML for the resume
      const html = renderResume(retrievedData); 
      //Now send html to api which generates the pdf using the html
      try {
        // Make a POST request to the /generate-pdf endpoint
        const pdfResponse = await axios.post('http://localhost:8001/generate-pdf', { html }, {
          responseType: 'arraybuffer',
          headers: {
            'Accept': 'application/pdf',
          },
        });

        // Send the PDF response
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfResponse.data);
      } catch (pdfErr) {
        console.error('Error generating PDF:', pdfErr); 
        res.status(500).send('An error occurred while generating the PDF.');
      }
    } else {
      res.json({ message: 'Resume not found. Please create a new resume.' });
    }

  });
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = {
  renderResume,
};
