const express = require('express');
const { login, getLeads } = require('../controllers/userController'); // Ensure correct import

const router = express.Router();

router.post('/login', login);
// router.get('/leads', getLeads); // This should correctly reference the function

module.exports = router;

