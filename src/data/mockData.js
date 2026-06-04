// =============================================================================
// NeuroPy ICU Dashboard — Mock Data (ported from frontend mockData.ts)
// =============================================================================

const MOCK_PATIENT = {
  id: 'ICU-2024-0847',
  age: 67,
  sex: 'M',
  weight: 82,
  height: 175,
  bmi: 26.8,
  admissionDate: 'Nov 24, 2025',
  bedId: 'ICU-203',
  diagnoses: ['Septic Shock', 'Pneumonia', 'Acute Kidney Injury'],
  medications: [
    { name: 'Norepinephrine', dose: '8.5 μg/min' },
    { name: 'Propofol', dose: '25 mg/h' },
    { name: 'Fentanyl', dose: '50 μg/h' },
    { name: 'Piperacillin', dose: '4.5g q6h' },
  ],
  labValues: [
    { name: 'Lactate', value: '2.8', unit: 'mmol/L' },
    { name: 'ScvO₂', value: '68', unit: '%' },
    { name: 'Hgb', value: '9.2', unit: 'g/dL' },
    { name: 'Platelets', value: '142', unit: 'K/μL' },
    { name: 'Creatinine', value: '1.9', unit: 'mg/dL' },
    { name: 'WBC', value: '14.2', unit: 'K/μL' },
  ],
};

const MOCK_CONTROLLER_CONFIG = {
  mode: 'auto',
  targetMAP: 85,
  aggressiveness: 50,
  safetyLimits: {
    maxInfusionRate: 20,
    minMAP: 65,
    maxMAP: 100,
  },
  pidGains: { kp: 0.8, ki: 0.3, kd: 0.1 },
  modelAdaptationRate: 0.05,
  noiseFilterBandwidth: 2.5,
  predictionHorizon: 5,
};

const MOCK_ALERTS = [
  {
    id: 'alert-1',
    type: 'critical',
    title: 'MAP Below Target Range',
    message: 'Mean arterial pressure dropped to 62 mmHg. Norepinephrine increased to 9.2 μg/min.',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    resolved: true,
  },
  {
    id: 'alert-2',
    type: 'warning',
    title: 'Infusion Rate Adjustment',
    message: 'Controller increased infusion rate by 1.5 μg/min due to MAP drift.',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    resolved: true,
  },
  {
    id: 'alert-3',
    type: 'info',
    title: 'Model Recalibration',
    message: 'Digital-twin model updated with latest patient response data.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: 'alert-4',
    type: 'warning',
    title: 'Sensor Quality Variance',
    message: 'Arterial line pressure waveform showing increased noise. Check transducer.',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    resolved: false,
  },
];

const MOCK_MAP_STATS = {
  averageMAP: 87,
  timeInTarget: 94.3,
  mapVariability: 4.2,
  hypotensiveEvents: 2,
  lastHypotensiveEvent: '4h ago',
};

// --- Dynamic Data Generators ---

let _systolic = 118;
let _diastolic = 72;
let _map = 87;
let _heartRate = 78;

function generateVitals() {
  _systolic = Math.max(100, Math.min(140, _systolic + (Math.random() - 0.5) * 4));
  _diastolic = Math.max(60, Math.min(90, _diastolic + (Math.random() - 0.5) * 3));
  _map = Math.max(70, Math.min(110, _map + (Math.random() - 0.5) * 2));
  _heartRate = Math.max(65, Math.min(95, _heartRate + (Math.random() - 0.5) * 2));

  return {
    map: Math.round(_map),
    systolic: Math.round(_systolic),
    diastolic: Math.round(_diastolic),
    heartRate: Math.round(_heartRate),
    timestamp: new Date().toISOString(),
  };
}

let _infusionRate = 8.5;
let _infusionTarget = 8.5;

function setInfusionTarget(value) {
  _infusionTarget = Math.max(0, Math.min(20, value));
}

function getInfusionTarget() {
  return _infusionTarget;
}

function generateInfusionState() {
  const adjustment = (_infusionTarget - _infusionRate) * 0.1 + (Math.random() - 0.5) * 0.2;
  _infusionRate = Math.max(0, Math.min(20, _infusionRate + adjustment));

  let trend = 'stable';
  if (adjustment > 0.05) trend = 'up';
  else if (adjustment < -0.05) trend = 'down';

  return {
    currentRate: parseFloat(_infusionRate.toFixed(1)),
    targetRate: parseFloat(_infusionTarget.toFixed(1)),
    totalDelivered: 142.3,
    duration: 9900,
    trend,
    controllerActive: true,
  };
}

function generateTrendData(range) {
  const now = new Date();
  const dataPoints = range === '1h' ? 60 : range === '6h' ? 72 : range === '12h' ? 144 : 288;
  const intervalMinutes = range === '1h' ? 1 : 5;

  return Array.from({ length: dataPoints }, (_, i) => {
    const time = new Date(now.getTime() - (dataPoints - i) * intervalMinutes * 60000);
    const baseMAP = 85 + Math.sin(i / 10) * 8 + (Math.random() - 0.5) * 4;

    return {
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      map: Math.round(baseMAP),
      target: 85,
      systolic: Math.round(baseMAP * 1.35 + 20),
      diastolic: Math.round(baseMAP * 0.75 - 5),
    };
  });
}

module.exports = {
  MOCK_PATIENT,
  MOCK_CONTROLLER_CONFIG,
  MOCK_ALERTS,
  MOCK_MAP_STATS,
  generateVitals,
  generateInfusionState,
  setInfusionTarget,
  getInfusionTarget,
  generateTrendData,
};
