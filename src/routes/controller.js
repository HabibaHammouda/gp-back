const express = require('express');
const router = express.Router();
const state = require('../data/state');

router.get('/', (req, res) => {
  res.json(state.controllerConfig);
});

router.put('/', (req, res) => {
  const previous = { ...state.controllerConfig };
  state.controllerConfig = { ...state.controllerConfig, ...req.body };

  state.history.push({
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'config_change',
    timestamp: new Date().toISOString(),
    data: { previous, updated: state.controllerConfig },
    description: `Controller config updated — mode: ${state.controllerConfig.mode}, targetMAP: ${state.controllerConfig.targetMAP} mmHg`,
  });

  res.json(state.controllerConfig);
});

module.exports = router;
