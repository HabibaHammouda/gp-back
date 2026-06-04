const express = require('express');
const router = express.Router();
const state = require('../data/state');

router.get('/', (req, res) => {
  res.json(state.alerts);
});

router.post('/:id/ack', (req, res) => {
  const alert = state.alerts.find((a) => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  alert.resolved = true;
  res.json({ success: true });
});

module.exports = router;
