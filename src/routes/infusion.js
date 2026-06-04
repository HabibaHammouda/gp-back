const express = require('express');
const router = express.Router();
const sim = require('../simulation');
const state = require('../data/state');

router.get('/', (req, res) => {
  res.json(sim.getCurrentInfusionState());
});

router.put('/rate', (req, res) => {
  const body = req.body;
  const delta = body && body.delta;

  if (typeof delta !== 'number') {
    return res.status(400).json({ error: 'delta must be a number', received: body });
  }

  const previous = sim.getExternalTarget();
  sim.setExternalTarget(previous + delta);
  const updated = sim.getExternalTarget();

  state.adjustmentsSinceDecision++;
  state.history.push({
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'infusion_adjustment',
    timestamp: new Date().toISOString(),
    data: { previous, updated, delta },
    description: `Infusion target adjusted from ${previous.toFixed(1)} to ${updated.toFixed(1)} μg/min (Δ${delta > 0 ? '+' : ''}${delta})`,
  });

  res.json(sim.getCurrentInfusionState());
});

module.exports = router;
