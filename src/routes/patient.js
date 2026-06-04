const express = require('express');
const router = express.Router();
const { MOCK_PATIENT } = require('../data/mockData');

router.get('/', (req, res) => {
  res.json(MOCK_PATIENT);
});

module.exports = router;
