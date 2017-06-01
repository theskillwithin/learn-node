const passport = require('passport')

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in'
})

exports.logout = (req, res) => {
  req.logout()
  req.flash('success', 'you are now logged out')
  res.redirect('/')
}

exports.isLoggedIn = (req, res, next) => {
  // check if user is authed
  if(req.isAuthenticated()) {
    next()
    return
  }
  req.flash('error', 'oops must be logged in')
  res.redirect('/login')
}
