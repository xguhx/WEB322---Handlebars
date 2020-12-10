const nodemailer = require("nodemailer");

//MAILER
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.mailerUser,
    pass: process.env.mailerPass,
  },
});

var sendEmail = function (FORM_DATA) {
  var emailOptions = {
    from: process.env.mailerUser,
    to: FORM_DATA.email,
    subject: "EMAIL FROM NODE.JS USING NODEMAILER",
    text: " JUST TEXT ",
    html:
      "<p>HELLO " +
      FORM_DATA.fname +
      " " +
      FORM_DATA.lname +
      " </p><p> THANK YOU FOR FILLING OUR FORM</p>",
  };

  transporter.sendMail(emailOptions, (error, info) => {
    if (error) {
      console.log("error!" + error);
    } else {
      console.log("Success" + info.response);
    }
  });
};
exports.sendEmail = sendEmail;
