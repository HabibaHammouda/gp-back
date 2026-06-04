const express = require('express');
const router = express.Router();
const state = require('../data/state');

const MAP_MIN = 65;
const MAP_MAX = 100;

router.get('/summary', (req, res) => {
  const vitalReadings = state.history.filter((h) => h.type === 'vital_reading');
  const safetyAlerts = state.history.filter((h) => h.type === 'safety_alert');

  const inTarget = vitalReadings.filter(
    (h) => h.data.map >= MAP_MIN && h.data.map <= MAP_MAX
  ).length;

  const averageMAP = vitalReadings.length
    ? Math.round(vitalReadings.reduce((s, h) => s + h.data.map, 0) / vitalReadings.length)
    : null;

  const timeInTarget = vitalReadings.length
    ? Math.round((inTarget / vitalReadings.length) * 1000) / 10
    : null;

  const controllerUptimeSeconds = Math.round(
    (Date.now() - new Date(state.startTime).getTime()) / 1000
  );

  res.json({
    totalEvents: state.history.length,
    timeInTarget,
    safetyAlerts: safetyAlerts.length,
    averageMAP,
    controllerUptimeSeconds,
  });
});

router.get('/', (req, res) => {
  const { limit, type, since } = req.query;

  let results = [...state.history];

  if (type) {
    results = results.filter((h) => h.type === type);
  }

  if (since) {
    const sinceDate = new Date(since);
    if (!isNaN(sinceDate.getTime())) {
      results = results.filter((h) => new Date(h.timestamp) > sinceDate);
    }
  }

  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (limit) {
    const n = parseInt(limit, 10);
    if (!isNaN(n) && n > 0) results = results.slice(0, n);
  }

  res.json(results);
});

module.exports = router;
