const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const cookieParser = require('cookie-parser');
const expressLayout = require('express-ejs-layouts');
const rateLimit = require("express-rate-limit");
const passport = require('passport');
const flash = require('connect-flash');
const MemoryStore = require('memorystore')(session);
const compression = require('compression');
const ms = require('ms');

const apiRouters = require('./server/api');
const userRouters = require('./server/users');
const verifyRouters = require('./server/verify');
const premiumRouters = require('./server/premium');
const adminRouters = require('./server/admin');

const { User, Changelog } = require('./database/model');
const { checkUsername } = require('./database/db');
const { isAuthenticated } = require('./lib/auth');
const { connectMongoDb } = require('./database/connect');
const { getTotalUser, cekExpiredDays } = require('./database/premium');
const { port } = require('./lib/settings');
const { dbURI } = require('./lib/settings');

const PORT = process.env.PORT || port;
const SESSION_SECRET = process.env.SESSION_SECRET || 'secret';

app.set('trust proxy', 1);
app.use(compression())

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 2000, 
  message: 'Oops too many requests'
});
app.use(limiter);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayout);
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  },
  store: dbURI ? MongoStore.create({
    mongoUrl: dbURI,
    ttl: 86400
  }) : new MemoryStore({
    checkPeriod: 86400000
  }),
}));
const formBodyParser = express.urlencoded({ extended: true });
const jsonBodyParser = express.json();

app.use((req, res, next) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    return next();
  }
  return formBodyParser(req, res, next);
});

app.use((req, res, next) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    return next();
  }
  return jsonBodyParser(req, res, next);
});
app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());
require('./lib/config')(passport);

app.use(flash());

app.use(function(req, res, next) {
  const user = req.user || null;
  const isAdmin = Boolean(user && (
    user.admin === true ||
    user.username === 'wanz.' ||
    user.username === 'maverick_dark'
  ));

  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = user;
  res.locals.isAdmin = isAdmin;
  res.locals.currentPath = req.path;
  res.locals.formatDateTime = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  };
  next();
})

app.get('/', (req, res) => {
  res.render('index', {
    layout: 'index'
  })
})

app.get('/docs', isAuthenticated, async (req, res) => { 
  let userjid = await getTotalUser()
  let { apikey, username, email, totalreq } = req.user
  res.render('docs', {
    username: username,
    apikey: apikey,
    email,
    user: userjid,
    totalreq,
    layout: 'docs'
  });
});

app.get('/profile', isAuthenticated, async (req, res) => { 
  let { apikey, username, limit, premium, email, totalreq, nomorWa } = req.user
  let cekexp = ms(await cekExpiredDays(username) - Date.now())
  let expired = '0 d'
  if (cekexp !== null) {
    expired = cekexp
  }
  res.render('profile', {
      username,
      apikey,
      limit,
      premium,
      email,
      totalreq,
      nomorWa,
      expired,
      layout: 'profile'
    });
});

app.post('/profile', async (req, res, next) => {
    let { email } = req.user
    let { username } = req.body
    let checkUser = await checkUsername(username);
    if (checkUser) {
         req.flash('error_msg', 'Username already exists.');
         return res.redirect(303, '/profile');
    } else {
    if (username !== null) await User.updateOne({email: email}, {username: username})
         req.flash('success_msg', 'Succesfully changed username');
         return res.redirect(303, '/profile')
    }
})

app.get('/downloader', isAuthenticated, async (req, res) => { 
  let { apikey, username, email } = req.user
  res.render('downloader', {
    username: username,
    apikey: apikey,
    email,
    layout: 'downloader'
  });
});

app.get('/searching', isAuthenticated, async (req, res) => { 
  let { apikey, username, email } = req.user
  res.render('searching', {
    username: username,
    apikey: apikey,
    email,
    layout: 'searching'
  });
});

app.get('/tools', isAuthenticated, async (req, res) => {
  let { apikey, username, email } = req.user
  res.render('tools', {
    username,
    apikey,
    email,
    layout: 'tools'
  })
})

app.get('/randomimage', isAuthenticated, async (req, res) => { 
  let { apikey, username, email } = req.user
  res.render('randomimage', {
    username: username,
    apikey: apikey,
    email,
    layout: 'randomimage'
  });
});

app.get('/animanga', isAuthenticated, async (req, res) => { 
  let { apikey, username, email } = req.user
  res.render('animanga', {
    username: username,
    apikey: apikey,
    email,
    layout: 'animanga'
  });
});

app.get('/melolo', isAuthenticated, async (req, res) => {
  let { apikey, username, email } = req.user
  res.render('melolo', {
    username,
    apikey,
    email,
    layout: 'melolo'
  })
})

app.get('/stalking', isAuthenticated, async (req, res) => { 
  let { apikey, username, email } = req.user
  res.render('stalking', {
    username: username,
    apikey: apikey,
    email,
    layout: 'stalking'
  });
});

app.get('/creator', isAuthenticated, async (req, res) => { 
  let { apikey, username, email } = req.user
  res.render('creator', {
    username: username,
    apikey: apikey,
    email,
    layout: 'creator'
  });
});

app.get('/entertainment', isAuthenticated, async (req, res) => { 
  let { apikey, username, email } = req.user
  res.render('entertainment', {
    username: username,
    apikey: apikey,
    email,
    layout: 'entertainment'
  });
});

app.get('/primbon', isAuthenticated, async (req, res) => { 
  let { apikey, username, email } = req.user
  res.render('primbon', {
    username: username,
    apikey: apikey,
    email,
    layout: 'primbon'
  });
});

app.get('/other', isAuthenticated, async (req, res) => { 
  let { apikey, username, email } = req.user
  res.render('other', {
    username: username,
    apikey: apikey,
    email,
    layout: 'other'
  });
});

app.get('/ai', isAuthenticated, async (req, res) => {
  let { apikey, username, email } = req.user
  res.render('ai', {
    username,
    apikey,
    email,
    layout: 'ai'
  });
});

app.get('/changelog', isAuthenticated, async (req, res) => { 
  const entries = await Changelog.find({}).sort({ updatedAt: -1, createdAt: -1 });
  let { username, email } = req.user
  res.render('changelog', {
    username: username,
    email,
    entries,
    layout: 'changelog'
  });
});

app.get('/pricing', isAuthenticated, async (req, res) => { 
  let { username, email } = req.user
  res.render('pricing', {
       username,
       email,
       layout: 'pricing'
   })
})

app.get('/listuser', isAuthenticated, async (req, res) => res.redirect('/admin/listuser'))

app.get('/index', isAuthenticated, async(req, res) => res.redirect('/admin/index'))


app.use('/api', apiRouters);
app.use('/users', userRouters);
app.use('/verification', verifyRouters);
app.use('/premium', premiumRouters);
app.use('/admin', adminRouters);

app.use(function (req, res, next) {
  if (res.statusCode == '200') {
    res.render('notfound', {
      layout: 'notfound'
    });
  }
});

app.set('json spaces', 4);

async function startServer() {
  await connectMongoDb();
  app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('[ERROR] Failed to connect to MongoDB:', error.message);
    process.exit(1);
  });
}

module.exports = app;
