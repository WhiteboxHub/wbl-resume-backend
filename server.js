// const express = require("express");
// const bodyParser = require("body-parser");
// const puppeteer = require("puppeteer");
// const cors = require("cors");
// const crypto = require("crypto");
// const mysql = require("mysql2");
// const app = express();
// const jwt = require('jsonwebtoken');
// const theme = require('jsonresume-theme-macchiato');
// require("dotenv").config();

// const port = 8001;
// app.use(express.json());

// const corsOptions = {
//   origin: [
//     "http://localhost:3000",
//     "https://whitebox-learning.com",
//     "https://www.whitebox-learning.com",
//     "*.whitebox-learning.com"
//   ],
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

// app.use(cors(corsOptions));

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// const secretKey = process.env.SECRET_KEY
// // Create MySQL connection pool
// const pool = mysql.createPool({
//   connectionLimit: 20,
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT,
//   connectTimeout: 100000
// });

// // Function to generate a GUID
// function generateGuid() {
//   return crypto.randomBytes(4).toString('hex').toLowerCase().slice(0, 7);
// }

// // Middleware to verify JWT token
// app.use((req, res, next) => {
//   const authHeader = req.headers.authorization;
//   const token = authHeader && authHeader.split(' ')[1];
//   if (!token) {
//     return res.status(401).json({ error: 'No token provided' });
//   }
//   try {
//     req.decodedToken = jwt.verify(token, process.env.SECRET_KEY);
//     next();
//   } catch (err) {
//     res.status(403).json({ error: 'Invalid or expired token' });
//   }
// });

// // Route to handle PDF download
// app.post('/api/node/download-pdf', (req, res) => {
//   const { html, resumeJson } = req.body;
//   const candidateId = req.decodedToken?.candidateid;

//   if (!candidateId) {
//     return res.status(401).json({ error: 'Please register with a new email to continue' });
//   }

//   const publicId = generateGuid();
//   const query = 'UPDATE candidate_resume SET candidate_json = ?, public_id = ? WHERE candidate_id = ?';

//   pool.getConnection((err, connection) => {
//     if (err) {
//       console.error('Error getting connection from pool:', err);
//       return res.status(500).json({ error: 'Database connection error' });
//     }

//     connection.query(query, [resumeJson, publicId, candidateId], (error, results) => {
//       connection.release(); // Release the connection after the query
//       if (error) {
//         console.error('Error updating data:', error);
//         return res.status(500).json({ error: 'Database error' });
//       }

//       if (results.affectedRows === 0) {
//         return res.status(401).json({ error: 'Candidate not found' });
//       }

//       // Generate PDF from HTML
//       generatePdf(html)
//         .then(buffer => {
//           const filename = `resume_${publicId}.pdf`;
//           res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
//           res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//           res.setHeader('Content-Type', 'application/pdf');
//           res.end(buffer);
//         })
//         .catch(err => {
//           console.error('Error generating PDF:', err.message);
//           res.status(500).json({ error: `An error occurred while generating the PDF: ${err.message}` });
//         });
//     });
//   });
// });

// async function generatePdf(html) {
//   let browser;
//   try {
//     browser = await puppeteer.launch({
//       headless: true, // Change to false for debugging
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });

//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: 'networkidle0' });
//     page.on('console', msg => console.log('PAGE LOG:', msg.text()));
//     page.on('error', error => console.error('PAGE ERROR:', error));

//     const buffer = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//     });
//     return buffer;
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     throw error;
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// }

// app.get("/api/node/:id", (req, res) => {
//   const resumeId = req.params.id;
//   const query = "SELECT candidate_json FROM candidate_resume WHERE public_id = ?";

//   pool.getConnection((err, connection) => {
//     if (err) {
//       console.error("Error getting connection from pool:", err);
//       return res.status(500).json({ message: "Database connection error" });
//     }

//     connection.query(query, [resumeId], (err, results) => {
//       connection.release(); // Release the connection after the query
//       if (err) {
//         console.error("Error retrieving data:", err);
//         return res.status(500).json({ message: "Error retrieving data", error: err });
//       }

//       if (results.length > 0) {
//         const retrievedData = results[0].candidate_json;
//         try {
//           const resumeData = JSON.parse(retrievedData);
//           const resumeHtml = theme.render(resumeData);
//           res.setHeader("Content-Type", "text/html");
//           res.send(resumeHtml);
//         } catch (parseErr) {
//           console.error("Error processing data:", parseErr);
//           res.status(500).send("An error occurred while processing the data.");
//         }
//       } else {
//         res.json({ message: "Resume not found. Please create a new resume." });
//       }
//     });
//   });
// });

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const cors = require("cors");
const crypto = require("crypto");
const mysql = require("mysql2");
const app = express();
const jwt = require('jsonwebtoken');
const theme = require('jsonresume-theme-macchiato');
require("dotenv").config();

// -----------------------------------------------------------------------sairam's code-------------------
// const authRoutes = require('./routes/adminAuthRoutes');
// const leadsRoutes = require('./routes/leadsRoutes');

// -----------------------------------------------------------------------


const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://whitebox-learning.com",
    "https://www.whitebox-learning.com", 
    "*.whitebox-learning.com",
    "http://34.171.229.185",
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization","authtoken"],
};
app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// -----------------------------------------------------------------------
const pool = mysql.createPool({
  connectionLimit: 20,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectTimeout: 100000
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Admin API Database connection failed:', err.message);
    return;
  } 
  console.log('Admin API connected to the database');
});
app.use('/admin/api/*',(req, res, next) => {
  req.db = pool;
  next();
});
//  ------------ sai ram code-------------------------------------------

// app.use('/admin/api/auth', authRoutes);
// app.use('/admin/api', leadsRoutes);

// -----------------------------------------------------------------------

const port = 8001;
app.use(express.json());
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
  const query = 'UPDATE candidate_resume SET candidate_json = ?, public_id = ? WHERE candidate_id = ?';

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      return res.status(500).json({ error: 'Database connection error' });
    }

    connection.query(query, [resumeJson, publicId, candidateId], (error, results) => {
      connection.release(); // Release the connection after the query
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
          res.status(500).json({ error: `An error occurred while generating the PDF: ${err.message} `});
        });
    });
  });
});

async function generatePdf(html) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // Change to false for debugging
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

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection from pool:", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    connection.query(query, [resumeId], (err, results) => {
      connection.release(); // Release the connection after the query
      if (err) {
        console.error("Error retrieving data:", err);
        return res.status(500).json({ message: "Error retrieving data", error: err });
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
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});