// =============================================================================
// NeuroPy Simulation Engine
// Runs every 2s, driving a physiologically plausible MAP trajectory.
// Simulates the RL-PID controller response from the paper.
// =============================================================================

const state = require('./data/state');

const MAP_MIN = 65;
const MAP_MAX = 100;
const MAP_TARGET = 85;
const INFUSION_MAX = 20;
const INFUSION_MIN = 0;

// --- Internal physiological state ---
let _map = 70;
let _heartRate = 96;          // elevated — compensatory tachycardia in septic shock
let _infusionRate = 8.5;
let _infusionTarget = 8.5;
let _prevRate = 8.5;
let _tickCount = 0;
let _totalDelivered = 142.3;  // pre-seeded (patient already on drip)
let _sessionStart = Date.now();
let _lastVitals = null;

// Disturbance scheduling
let _nextDisturbanceTick = randomDisturbanceTick(0);
let _lastDisturbanceTime = null;
let _disturbanceActive = false;
let _disturbanceRecoveryTicks = 0;

// ─────────────────────────────────────────────────────────────────────────────

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function makeId() {
  return `sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function randomDisturbanceTick(fromTick) {
  // Next disturbance in 5–10 minutes (150–300 ticks at 2s each)
  return fromTick + 150 + Math.floor(Math.random() * 150);
}

// ─────────────────────────────────────────────────────────────────────────────
// RL-PID Controller (simulates paper's controller logic)
// Aggressive correction outside safe range, fine-tuning within.
// ─────────────────────────────────────────────────────────────────────────────
function rlPidControl(map) {
  if (map < MAP_MIN) {
    // Critical hypotension: scale response with severity
    return clamp(0.5 + (MAP_MIN - map) * 0.04, 0.5, 2.0);
  }
  if (map > MAP_MAX) {
    return clamp(-(0.5 + (map - MAP_MAX) * 0.03), -2.0, -0.5);
  }
  // Within range: PID proportional term + noise
  const error = MAP_TARGET - map;
  return clamp(error * 0.015 + (Math.random() - 0.5) * 0.08, -0.2, 0.2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Derive systolic/diastolic from MAP using pulse-pressure model
// ─────────────────────────────────────────────────────────────────────────────
function deriveVitals(timestamp) {
  const pp = clamp(38 + (_map - 70) * 0.4, 22, 68); // pulse pressure narrows in shock
  const diastolic = _map - pp / 3;
  const systolic = diastolic + pp;
  return {
    map: Math.round(_map),
    systolic: Math.round(systolic),
    diastolic: Math.round(diastolic),
    heartRate: Math.round(_heartRate),
    timestamp: timestamp || new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main simulation tick (runs every 2 seconds)
// ─────────────────────────────────────────────────────────────────────────────
function tick() {
  _tickCount++;
  const now = new Date().toISOString();
  let disturbanceFired = false;

  // ── Disturbance event ────────────────────────────────────────────────────
  if (_tickCount >= _nextDisturbanceTick && !_disturbanceActive) {
    const drop = 8 + Math.random() * 7; // 8–15 mmHg
    _map = clamp(_map - drop, 38, _map);
    _disturbanceActive = true;
    _disturbanceRecoveryTicks = 20 + Math.floor(Math.random() * 20); // 40–80s
    _lastDisturbanceTime = now;
    disturbanceFired = true;
    _nextDisturbanceTick = randomDisturbanceTick(_tickCount);

    const alert = {
      id: `dist-${Date.now()}`,
      type: 'critical',
      title: 'Hemodynamic Disturbance Detected',
      message: `MAP dropped to ${Math.round(_map)} mmHg — suspected hemorrhage event. RL-PID controller responding.`,
      timestamp: now,
      resolved: false,
    };
    state.alerts.unshift(alert);

    state.history.push({
      id: makeId(),
      type: 'safety_alert',
      timestamp: now,
      data: { map: Math.round(_map), drop: Math.round(drop), event: 'hemorrhage_disturbance' },
      description: `CRITICAL: Hemodynamic disturbance — MAP dropped ${Math.round(drop)} mmHg to ${Math.round(_map)} mmHg`,
    });
  }

  if (_disturbanceActive) {
    _disturbanceRecoveryTicks--;
    if (_disturbanceRecoveryTicks <= 0) _disturbanceActive = false;
  }

  // ── RL-PID controller ────────────────────────────────────────────────────
  const isEmergency = _map < MAP_MIN || _map > MAP_MAX;
  const delta = rlPidControl(_map);
  _infusionTarget = clamp(_infusionTarget + delta, INFUSION_MIN, INFUSION_MAX);

  if (isEmergency) {
    state.adjustmentsSinceDecision++;
  }

  // Infusion rate converges toward target (pharmacokinetic lag)
  _prevRate = _infusionRate;
  const rateAdj = (_infusionTarget - _infusionRate) * 0.18 + (Math.random() - 0.5) * 0.04;
  _infusionRate = clamp(_infusionRate + rateAdj, INFUSION_MIN, INFUSION_MAX);
  _totalDelivered += (_infusionRate / 60) * 2; // μg delivered per 2s tick

  // ── MAP physiology ───────────────────────────────────────────────────────
  // Norepinephrine raises MAP via vasoconstriction (7.5 μg/min ≈ neutral for patient)
  const norEffect = (_infusionRate - 7.5) * 0.55;
  // Septic shock: natural downward bias + noise
  const drift = (Math.random() - 0.49) * 1.6;
  // Body homeostasis: soft pull toward MAP_TARGET
  const homeostasis = (MAP_TARGET - _map) * 0.022;
  _map = clamp(_map + norEffect * 0.13 + drift + homeostasis, 35, 135);

  // ── Heart rate (compensatory tachycardia) ────────────────────────────────
  // Lower MAP → higher HR; range 55–130 bpm
  const hrTarget = clamp(122 - (_map - 50) * 0.55, 55, 130);
  _heartRate = clamp(
    _heartRate + (hrTarget - _heartRate) * 0.09 + (Math.random() - 0.5) * 1.5,
    55, 130
  );

  const vitals = deriveVitals(now);
  _lastVitals = vitals;

  // ── Record to history ────────────────────────────────────────────────────
  state.history.push({
    id: makeId(),
    type: 'vital_reading',
    timestamp: now,
    data: vitals,
    description: `Vitals recorded — MAP ${vitals.map} mmHg, HR ${vitals.heartRate} bpm`,
  });

  state.vitalCount++;
  state.recentVitals.push({ map: vitals.map, timestamp: now });

  // Safety alert for sustained out-of-range (separate from disturbance alert)
  if (!disturbanceFired && (vitals.map < MAP_MIN || vitals.map > MAP_MAX)) {
    const direction = vitals.map < MAP_MIN ? 'below' : 'above';
    const bound = vitals.map < MAP_MIN ? MAP_MIN : MAP_MAX;
    state.history.push({
      id: makeId(),
      type: 'safety_alert',
      timestamp: now,
      data: { map: vitals.map, bound, direction },
      description: `MAP ${vitals.map} mmHg is ${direction} safe range (${MAP_MIN}–${MAP_MAX} mmHg) — DejaVu monitor triggered`,
    });
  }

  // Controller decision every 30 ticks
  if (state.vitalCount % 30 === 0) {
    const window = state.recentVitals.slice(-30);
    const avgMAP = Math.round(window.reduce((s, v) => s + v.map, 0) / window.length);
    const inTarget = window.filter((v) => v.map >= MAP_MIN && v.map <= MAP_MAX).length;
    const timeInTargetPct = Math.round((inTarget / window.length) * 1000) / 10;

    state.history.push({
      id: makeId(),
      type: 'controller_decision',
      timestamp: now,
      data: {
        readingsAssessed: window.length,
        averageMAP: avgMAP,
        timeInTargetPct,
        adjustmentsMade: state.adjustmentsSinceDecision,
        currentTargetRate: parseFloat(_infusionTarget.toFixed(1)),
      },
      description: `Controller assessment: avg MAP ${avgMAP} mmHg, ${timeInTargetPct}% in target, ${state.adjustmentsSinceDecision} adjustment(s) made`,
    });

    state.recentVitals = [];
    state.adjustmentsSinceDecision = 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

function getCurrentVitals() {
  return _lastVitals || deriveVitals();
}

function getCurrentInfusionState() {
  const trend =
    _infusionRate > _prevRate + 0.05 ? 'up' :
    _infusionRate < _prevRate - 0.05 ? 'down' : 'stable';
  return {
    currentRate: parseFloat(_infusionRate.toFixed(1)),
    targetRate: parseFloat(_infusionTarget.toFixed(1)),
    totalDelivered: parseFloat(_totalDelivered.toFixed(1)),
    duration: Math.round((Date.now() - _sessionStart) / 1000) + 9900,
    trend,
    controllerActive: true,
  };
}

function getSimulationState() {
  return {
    map: Math.round(_map),
    heartRate: Math.round(_heartRate),
    infusionRate: parseFloat(_infusionRate.toFixed(2)),
    infusionTarget: parseFloat(_infusionTarget.toFixed(2)),
    controllerMode: 'RL-PID',
    tickCount: _tickCount,
    disturbanceActive: _disturbanceActive,
    lastDisturbanceTime: _lastDisturbanceTime,
    nextDisturbanceInSeconds: (_nextDisturbanceTick - _tickCount) * 2,
  };
}

// Called by PUT /infusion/rate — overrides controller target
function setExternalTarget(value) {
  _infusionTarget = clamp(value, INFUSION_MIN, INFUSION_MAX);
}

function getExternalTarget() {
  return _infusionTarget;
}

function start() {
  tick(); // run immediately so /vitals has data before first 2s tick
  setInterval(tick, 2000);
}

module.exports = {
  start,
  getCurrentVitals,
  getCurrentInfusionState,
  getSimulationState,
  setExternalTarget,
  getExternalTarget,
};
