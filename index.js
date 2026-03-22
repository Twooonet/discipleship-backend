require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

const authRouter = require('./routes/auth');
const threadsRouter = require('./routes/threads');
const calendarRouter = require('./routes/calendar');
const offeringsRouter = require('./routes/offerings');
const feedbackRouter = require('./routes/feedback');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/threads', threadsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/offerings', offeringsRouter);
app.use('/api/feedback', feedbackRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
