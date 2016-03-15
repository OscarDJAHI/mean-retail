function setupAuth(User, Config, app){
  var passport = require('passport');
  var FacebookStrategy = require('passport-facebook').Strategy;

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findOne({ _id: id }, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new FacebookStrategy({
      clientID: Config.facebookClientId,
      clientSecret: Config.facebookClientSecret,
      callbackURL: "http://localhost:3000/auth/facebook/callback",
      profileFields: ['emails']
    },
    function(accessToken, refreshToken, profile, done){
      if (!profile.emails || !profile.emails.length){
        return done('No emails asscociated with this account!');
      }

      User.findOneAndUpdate(
        { 'data.oauth': profile.id },
        {
          $set: {
            'profile.username': profile.emails[0].value,
            'profile.picture': 'http://graph.facebook.com' +
              profile.id.toString() + '/picture?type=large'
          }
        },
        { new: true, upsert: true, runValidators: true },
        function(error, user){
          done(error, user);
        }
      )
    }
  ));

  // Express middleware
  app.use(require('express-session')({
    secret: 'This is a secret!',
    resave: false,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  // Express routes for auth
  app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
  );

  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/fail' }),
    function(req, res){
      res.send('Welcome ' + req.user.profile.username);
    });
}

module.exports = setupAuth;