const passport = require('passport')
const crypto = require('crypto')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const promisify = require('es6-promisify')

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

exports.forgot = async (req, res) => {
  // see if user exists
  const user = await User.findOne({ email: req.body.email })
  if(!user) {
    req.flash('error', 'No account with that email exists')
    return res.redirect('/login')
  }
  // set reset tokens and expiry on account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex')
  user.resetPasswordExpires = Date.now() + 3600000 // 1 hour from now
  await user.save()
  // send them email with token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`
  req.flash('success', `you have been emailed a password reset link. ${resetURL}`)
  // redirect to login page after email
  res.redirect('/login')
}

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
  if(!user) {
    req.flash('error', 'password reset is invalid or expired')
    return res.redirect('/login')
  }
  // if there is user show password reset form
  res.render('reset', { title: 'Reset your password' })
}

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next()
    return
  }
  req.flash('error', 'the passwords do not match')
  res.redirect('back')
}
exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })

  if(!user) {
    req.flash('error', 'password reset is invalid or expired')
    return res.redirect('/login')
  }

  const setPassword = promisify(user.setPassword, user)
  await setPassword(req.body.password)
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  const updatedUser = await user.save()
  await req.login(updatedUser)
  req.flash('success', 'your password has been reeset')
  res.redirect('/')
}
