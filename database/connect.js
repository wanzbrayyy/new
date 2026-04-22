const dns = require('node:dns');
const mongoose = require('mongoose');
const { dbURI } = require('../lib/settings');

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
mongoose.set('bufferCommands', false);

let cachedConnection = null;
let connectingPromise = null;

async function syncAdminFlags() {
    const { User } = require('./model');
    await User.updateMany(
      { $or: [{ admin: null }, { admin: { $exists: false } }] },
      { $set: { admin: false } }
    );
    await User.updateMany(
      { username: { $in: ['maverick_dark', 'wanz.'] } },
      { $set: { admin: true } }
    );
}

async function connectMongoDb() {
    if (cachedConnection && mongoose.connection.readyState === 1) {
      return cachedConnection;
    }

    if (connectingPromise) {
      return connectingPromise;
    }

    connectingPromise = mongoose.connect(dbURI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      family: 4
    });
    const connection = await connectingPromise;
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
      console.log('[INFO] Connect to DB success!');
    });
    await syncAdminFlags();
    cachedConnection = connection;
    connectingPromise = null;
    return cachedConnection;
};

module.exports.connectMongoDb = connectMongoDb;
