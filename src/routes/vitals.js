const express = require('express');
const router = express.Router();
const sim = require('../simulation');

// Simulation tick records history automatically every 2s.
// This route just returns the latest snapshot.
router.get('/', (req, res) => {
  res.json(sim.getCurrentVitals());
});

module.exports = router;
