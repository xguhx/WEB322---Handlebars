const express = require("express");

function checkLogin(req, res, next) {
  if (!req.session.user) {
    res.render("login", { error: "You need to Login!", layout: false });
  } else {
    next();
  }
}

exports.checkLogin = checkLogin;
