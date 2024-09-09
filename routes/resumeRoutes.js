const express = require('express');
const router = express.Router();
const puppeteer = require("puppeteer");
const crypto = require("crypto");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const theme = require('jsonresume-theme-macchiato');
const pool = require('../db'); // Import the connection pool

// Function to generate a GUID
function generateGuid() {
  return crypto.randomBytes(4).toString('hex').toLowerCase().slice(0, 7);
}

// Route to handle PDF download
router.post('/download-pdf', async (req, res) => {
  const { html, resumeJson } = req.body;
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const candidateId = decodedToken.candidateid;

    if (!candidateId) {
      return res.status(400).json({ error: 'User not logged in' });
    }

    const publicId = generateGuid();

    const query = 'UPDATE candidate_resume SET candidate_json = ?, public_id = ? WHERE candidate_id = ?';
    pool.query(query, [resumeJson, publicId, candidateId], (error, results) => {
      if (error) {
        console.error('Error updating data:', error);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Candidate not found' });
      }

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
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

async function generatePdf(html) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
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

router.get("/:id", (req, res) => {
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
        const resumeData = JSON.parse(retrievedData);
        const resumeHtml = theme.render(resumeData);
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

module.exports = router;
