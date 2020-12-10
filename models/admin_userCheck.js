const express = require("express");

function adminCheck(req, res, next) {
  if (!req.session.isAdm) {
    res.render("login", { error: "You need to an Admin!", layout: false });
  } else {
    next();
  }
}

exports.adminCheck = adminCheck;
