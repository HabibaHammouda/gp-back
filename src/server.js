require('dotenv').config();
const express = require('express');
const cors = require('cors');
const simulation = require('./simulation');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/simulation', (req, res) => {
  res.json(simulation.getSimulationState());
});

app.use('/api/vitals', require('./routes/vitals'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/trends', require('./routes/trends'));
app.use('/api/infusion', require('./routes/infusion'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/controller', require('./routes/controller'));
app.use('/api/history', require('./routes/history'));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  simulation.start();
});
