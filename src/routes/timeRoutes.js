const express = require('express');
const router = express.Router();
const timeController = require('../controllers/timeController');

router.get('/', timeController.getTimeZones);

module.exports = router;
