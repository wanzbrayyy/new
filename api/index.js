const app = require('../app');
const { connectMongoDb } = require('../database/connect');

let readyPromise = null;

module.exports = async (req, res) => {
  if (!readyPromise) {
    readyPromise = connectMongoDb().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }

  try {
    await readyPromise;
    return app(req, res);
  } catch (error) {
    console.error('[ERROR] Failed to connect to MongoDB:', error.message);
    return res.status(500).send('database connection failed');
  }
};
