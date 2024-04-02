const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');

router.get('/', cityController.getCities);
router.get('/find', cityController.findNearestCity);
router.get('/population', cityController.getPopulationDistribution);

module.exports = router;
