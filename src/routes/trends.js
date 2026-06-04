const express = require('express');
const router = express.Router();
const { generateTrendData, MOCK_MAP_STATS } = require('../data/mockData');

const VALID_RANGES = ['1h', '6h', '12h', '24h'];

router.get('/', (req, res) => {
  const range = VALID_RANGES.includes(req.query.range) ? req.query.range : '1h';
  res.json(generateTrendData(range));
});

router.get('/stats', (req, res) => {
  res.json(MOCK_MAP_STATS);
});

module.exports = router;
