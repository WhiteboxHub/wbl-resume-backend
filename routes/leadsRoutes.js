const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController'); // Adjust the path to leadsController
const AdminValidationMiddleware = require('../Middleware/AdminValidationMiddleware');

// Route to get leads with pagination and search
router.get('/leads', AdminValidationMiddleware, (req, res) => {
  const db = req.db;
  if (!db) {
    return res.status(500).json({ message: 'Database connection error' });
  }

  const page = parseInt(req.query.page, 10) || 1; // Page number
  const pageSize = parseInt(req.query.pageSize, 10) || 100; // Number of items per page
  const searchQuery = req.query.search || ''; // Search query
  const offset = (page - 1) * pageSize;

  let query = 'SELECT * FROM leads';
  let countQuery = 'SELECT COUNT(*) AS total FROM leads';
  const queryParams = [];
  const countParams = [];

  // Add search functionality if a search query is provided
  if (searchQuery) {
    query += ' WHERE name LIKE ? OR id LIKE ?'; // Adjust fields as necessary
    countQuery += ' WHERE name LIKE ? OR id LIKE ?';
    queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
    countParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
  }

  query += ' LIMIT ? OFFSET ?';
  queryParams.push(pageSize, offset);

  // Query to fetch data with pagination and optional search
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Query to count total rows (considering search criteria)
    db.query(countQuery, countParams, (countErr, countResults) => {
      if (countErr) {
        console.error('Count query error:', countErr);
        return res.status(500).json({ message: 'Database error' });
      }

      const totalRows = countResults[0].total;
      res.json({ data: results, totalRows });
    });
  });
});

// Route to insert a new lead
router.post('/leads', (req, res) => {
  const newLead = req.body;
  const authtoken = req.header('authToken');

  // Insert the new lead
  req.db.query('INSERT INTO leads SET ?', newLead, (err, results) => {
    if (err) {
      console.error('Database insert error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(201).json({ id: results.insertId, ...newLead });
  });
});

// Route to update an existing lead
router.put('/leads/update/:id', AdminValidationMiddleware, leadsController.updateLead);

// Route to insert a new lead using the leadsController
router.put('/insert/leads', AdminValidationMiddleware, leadsController.insertLead);
router.get("/leads/search/:keyword", AdminValidationMiddleware, (req, res) => {
  const searchKeyWord = req.params.keyword;

  // Use parameterized queries to prevent SQL injection
  const getColumnsQuery = `
    SELECT * FROM whiteboxqa.leads
    WHERE CONCAT_WS(' ',name) LIKE ?;`;

  // Execute the query
  req.db.query(getColumnsQuery, [`%${searchKeyWord}%`], (error, results, fields) => {
    if (error) {
      console.error('Error executing query:', error.stack);
      return res.status(500).json({ error: 'An error occurred while fetching data.' });
    }

    res.json(results);
  });
});
module.exports = router;