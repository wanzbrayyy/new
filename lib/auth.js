module.exports = {
    isAuthenticated: function(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      req.flash('error_msg', 'Please login to continue');
      res.redirect('/users/login');
    },
    notAuthenticated: function(req, res, next) {
      if (!req.isAuthenticated()) {
        return next();
      }
      res.redirect('/docs');      
    },
    captchaRegister: function(req, res, next) {
      if (req.recaptcha.error) {
          req.flash('error_msg','reCAPTCHA Incorrect');
          res.redirect('/users/register');
      } else {
          return next();
     };
    },
    captchaLogin: function(req, res, next) {
      if (req.recaptcha.error) {
          req.flash('error_msg','reCAPTCHA Incorrect');
          res.redirect('/users/login');
      } else {
          return next();
      };
    },
    isAdmin: function(req, res, next) {
      const user = req.user;
      const isAdminUser = Boolean(user && (
        user.admin === true ||
        user.username === 'wanz.' ||
        user.username === 'maverick_dark'
      ));

      if (isAdminUser) {
        return next();
      }

      return res.redirect('/docs');
    }
  };
