require('dotenv').config();
const app = require('./app');
const { getDatabase } = require('./db');

const PORT = process.env.PORT || 5000;

// Initialize database
getDatabase();

app.listen(PORT, () => {
  console.log(`Lawazia Toto Desk Backend running on port ${PORT}`);
});
