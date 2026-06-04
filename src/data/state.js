const { MOCK_ALERTS, MOCK_CONTROLLER_CONFIG } = require('./mockData');

const state = {
  infusionRate: 8.5,
  infusionTarget: 8.5,
  alerts: [...MOCK_ALERTS],
  controllerConfig: { ...MOCK_CONTROLLER_CONFIG },
  history: [],
  startTime: new Date().toISOString(),
  vitalCount: 0,
  recentVitals: [],            // rolling buffer of last 30 MAP readings
  adjustmentsSinceDecision: 0, // infusion adjustments since last controller_decision
};

module.exports = state;
