// const mysql = require('mysql2');

// // Connect to the database
// const db = mysql.createConnection({
//   host: '35.232.56.51',
//   user: 'whiteboxqa',
//   password: 'Innovapath1',
//   database: 'whiteboxqa',
// });

// const getLeads = (req, res) => {
//   db.query('SELECT * FROM leads', (err, results) => {
//     if (err) {
//       console.error('Database query error:', err);
//       return res.status(500).json({ message: 'Database error' });
//     }
//     res.json(results);
//   });
// };


// const insertLead = (req, res) => {
//   const newLead = req.body;

//   // Make sure to sanitize and validate input data as necessary
//   req.db.query('INSERT INTO leads SET ?', newLead, (err, results) => {
//     if (err) {
//       console.error('Database insert error:', err);
//       return res.status(500).json({ message: 'Database error' });
//     }
//     res.status(201).json({ id: results.insertId, ...newLead });
//   });
// };

// module.exports = { getLeads, insertLead }; // Export the new function along with existing ones

// // module.exports = { getLeads };



const mysql = require('mysql2');

// Connect to the database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

const getLeads = (req, res) => {
  db.query('SELECT * FROM leads', (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
};

const insertLead = (req, res) => {
  const newLead = req.body;

  // Make sure to sanitize and validate input data as necessary
  db.query('INSERT INTO leads SET ?', newLead, (err, results) => {
    if (err) {
      console.error('Database insert error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(201).json({ id: results.insertId, ...newLead });
  });
};

// Update a lead
const updateLead = (req, res) => {
  const leadId = req.params.id;
  const updatedLead = req.body;
  console.log('PUT request received for ID:', leadId);
  // Ensure leadId and updatedLead are present
  if (!leadId || !updatedLead) {
    return res.status(400).json({ message: 'Lead ID and data are required' });
  }

  // Update the lead
  db.query('UPDATE leads SET ? WHERE leadid = ?', [updatedLead, leadId], (err, results) => {
    if (err) {
      console.error('Database update error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(200).json({ leadid: leadId, ...updatedLead });
  });
};

module.exports = { getLeads, insertLead, updateLead };
