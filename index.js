/* #region Require */
const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator/check");
const clientSessions = require("client-sessions");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();
const PHOTODIRECTORY = "./public/photos/";

const userImport = require("./models/userModels");
const roomImport = require("./models/roomModels");
const bookingImport = require("./models/bookingModels");

const mailer = require("./models/mailerOptions.js");
const checkLogin = require("./models/dashboard_userCheck.js");
const adminCheck = require("./models/admin_userCheck.js");

/*#endregion */

const app = express();

if (!fs.existsSync(PHOTODIRECTORY)) {
  fs.mkdir(PHOTODIRECTORY, { recursive: true }, (err) => {});
}

//Bcryptjs
var salt = bcrypt.genSaltSync(10);

//Handlebars
//-----------------------------------------
app.engine(".hbs", hbs({ extname: ".hbs" }));
app.set("view engine", ".hbs");

//Body-Parser
//-----------------------------------------

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Multer
//-----------------------------------------
const storage = multer.diskStorage({
  destination: "./public/photos/",
  filename: function (req, file, cb) {
    // we write the filename as the current date down to the millisecond
    // in a large web service this would possibly cause a problem if two people
    // uploaded an image at the exact same time. A better way would be to use GUID's for filenames.
    // this is a simple example.
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// tell multer to use the diskStorage function for naming files instead of the default.
const upload = multer({ storage: storage });

//Client Session
//-----------------------------------------

app.use(
  clientSessions({
    cookieName: "session",
    secret: process.env.clientSession_secret,
    duration: 2 * 60 * 1000, //2 minutes
    activeDuration: 1000 * 60, //1 minute
  })
);

//Static Folders
//-----------------------------------------
app.use(express.static("."));
app.use(express.static("views"));
//app.use(express.static(public)); NOT WORKING

var HTTP_PORT = process.env.PORT || 8080;

/* #region general Router*/

function onHttpStart() {
  console.log("Express Server Running on port " + HTTP_PORT);
}

//create a route that indicates what we do when person navigates to the root folder

app.get("/", function (req, res) {
  res.render("index", { data: req.session.user, layout: false });
});

app.get("/home", function (req, res) {
  res.render("index", { data: req.session.user, layout: false });
});

app.get("/registration", function (req, res) {
  res.render("registration", { data: req.session.user, layout: false });
});

app.get("/login", function (req, res) {
  res.render("login", { data: req.session.user, layout: false });
});

/*#endregion */

/* #region REGISTRATION POST*/
app.post(
  "/registration",
  [
    //DATA VALIDATION

    body("email", "Invalid Email").isEmail(),
    body("password", "Invalid Password").matches(
      /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/,
      "i"
    ),
    body("email", "Invalid Email").isEmail(),
    body("fname", "First name is invalid").matches(/^[a-z ,.'-]+$/i, "i"),
    body("lname", "Last name is invalid").matches(/^[a-z ,.'-]+$/i, "i"),
    body("birthday", "Birthday name is invalid").isDate(),
  ],
  function (req, res) {
    const FORM_DATA = req.body;

    var errors = validationResult(req); //GET RESULT OF DATAVALIDATION - IF EMPTY THEM PROCEED

    if (!errors.isEmpty()) {
      // IF THERE IS ERROR, RELOAD PAGE WITH ERROR MESSAGES

      return res.render("registration", { layout: false, data: errors });
    }

    if (errors.isEmpty()) {
      // REGISTER
      userImport.userModel
        .findOne({ email: FORM_DATA.email })
        .exec()
        .then((user) => {
          if (user) {
            return res.render("registration", {
              layout: false,
              error: "This email is already in use!",
            });
          } else {
            //Hashing password
            var hash = bcrypt.hashSync(FORM_DATA.password, salt);

            //MongoDB - Creating a user
            //-----------------------------------------

            var newUser = new userImport.userModel({
              fname: FORM_DATA.fname,
              lname: FORM_DATA.lname,
              email: FORM_DATA.email,
              status: FORM_DATA.status,
              bday: FORM_DATA.birthday,
              password: hash,
              isAdm: FORM_DATA.isAdm,
            });

            //MongoDB - SAVING a user
            //-----------------------------------------

            userImport.saveFunction(newUser, userImport.userModel, FORM_DATA);

            //Mailer
            //----------------------------------------
            mailer.sendEmail(FORM_DATA);

            res.render("login", { success: "Please Log In!", layout: false });
          }
        });
    }
  }
);

/*#endregion */

/* #region LOGIN POST*/
app.post(
  "/login",
  [
    body("email", "Invalid Email").isEmail(),
    body("password", "Invalid Password").matches(
      /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/,
      "i"
    ),
  ],
  function (req, res) {
    const FORM_DATA = req.body;
    var errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("login", { layout: false, errors: errors });
    }

    // LOG IN
    var user = userImport.userModel
      .findOne({ email: FORM_DATA.email })
      .lean() //lean enables sending it to handlebars
      .exec()
      .then((user) => {
        if (user) {
          bcrypt.compare(FORM_DATA.password, user.password, function (
            err,
            flag
          ) {
            if (flag) {
              //flag = password match

              req.session.user = {
                //create a session
                fname: user.fname,
                lname: user.lname,
                username: user.email,
                isAdm: user.isAdm,
                email: user.email,
              };

              if (user.isAdm) {
                return res.render("dashboard-adm", {
                  data: req.session.user,
                  layout: false,
                });
              }

              return res.render("dashboard", {
                data: req.session.user,
                layout: false,
              }); //redirect?
            } else {
              res.render("login", { layout: false, error: "Wrong Password!" });
            }
          });
        } else {
          res.render("login", { layout: false, error: "Wrong Email!" });
        }
      });
  }
);

/*#endregion */

app.get("/dashboard", checkLogin.checkLogin, function (req, res) {
  if (req.session.user.isAdm) {
    res.render("dashboard-adm", { data: req.session.user, layout: false });
  } else {
    res.render("dashboard", { data: req.session.user, layout: false });
  }
});

app.get("/createroom", checkLogin.checkLogin,adminCheck.adminCheck, function (req, res) {
  res.render("createroom", { data: req.session.user, layout: false });
});

/* #region CREATEROOM  - POST AND GET - CREATE AND UPDATE*/

app.post(
  "/createroom",
   checkLogin.checkLogin,
   adminCheck.adminCheck,
  upload.single("photo"),
  function (req, res) {
    const formFile = req.file; //formFile.filename
    const FORM_DATA = req.body;

    var newRoom = new roomImport.roomModel({
      name: FORM_DATA.name,
      price: FORM_DATA.price,
      location: FORM_DATA.location,
      hostedby: FORM_DATA.hostedby,
      bnbdetails: FORM_DATA.bnbdetails,
      feature0: FORM_DATA.feature0,
      feature0desc: FORM_DATA.feature0desc,
      feature1: FORM_DATA.feature1,
      feature1desc: FORM_DATA.feature1desc,
      feature2: FORM_DATA.feature2,
      feature2desc: FORM_DATA.feature2desc,
      feature3: FORM_DATA.feature3,
      feature3desc: FORM_DATA.feature3desc,
      maindescription: FORM_DATA.maindescription,
      amenities0: FORM_DATA.amenities0,
      amenities1: FORM_DATA.amenities1,
      amenities2: FORM_DATA.amenities2,
      amenities3: FORM_DATA.amenities3,
      amenities4: FORM_DATA.amenities4,
      amenities5: FORM_DATA.amenities5,
      amenities6: FORM_DATA.amenities6,
      amenities7: FORM_DATA.amenities7,
      amenities8: FORM_DATA.amenities8,
      amenities9: FORM_DATA.amenities9,
      photoid: formFile.filename,
    });

    if (req.body.edit === "1") {
      roomImport.roomModel
        .updateOne(
          { name: newRoom.name },
          {
            $set: {
              name: newRoom.name,
              price: newRoom.price,
              location: newRoom.location,
              hostedby: newRoom.hostedby,
              bnbdetails: newRoom.bnbdetails,
              feature0: newRoom.feature0,
              feature0desc: newRoom.feature0desc,
              feature1: newRoom.feature1,
              feature1desc: newRoom.feature1desc,
              feature2: newRoom.feature2,
              feature2desc: newRoom.feature2desc,
              feature3: newRoom.feature3,
              feature3desc: newRoom.feature3desc,
              maindescription: newRoom.maindescription,
              amenities0: newRoom.amenities0,
              amenities1: newRoom.amenities1,
              amenities2: newRoom.amenities2,
              amenities3: newRoom.amenities3,
              amenities4: newRoom.amenities4,
              amenities5: newRoom.amenities5,
              amenities6: newRoom.amenities6,
              amenities7: newRoom.amenities7,
              amenities8: newRoom.amenities8,
              amenities9: newRoom.amenities9,
              photoid: newRoom.photoid,
            },
          }
        )
        .exec()
        .then((result) => {
          if (result) {
            return res.render("createroom", {
              data: req.session.user,
              layout: false,
              msg: "Room updated!!",
            });
          } else {
            return res.render("createroom", {
              data: req.session.user,
              layout: false,
              error: "Something went wrong updating the room!",
            });
          }
        })
        .catch((err) => {
          console.log(err);
        }); //then
    } else {
      roomImport.roomModel
        .findOne({ name: FORM_DATA.name })
        .exec()
        .then((room) => {
          if (room) {
            return res.render("createroom", {
              data: req.session.user,
              layout: false,
              error: "There is a Room with this name already!",
            });
          } else {
            roomImport.saveRoom(newRoom, roomImport.roomModel, FORM_DATA);
            return res.render("createroom", {
              data: req.session.user,
              layout: false,
              msg: "Room added!",
            }); // pass number of the room from database
          }
        });
    }
  }
);

app.get(
  "/createroom/:name",
  checkLogin.checkLogin,
  //adminCheck.adminCheck,
  upload.single("photo"),
  function (req, res) {
    const formFile = req.file; //formFile.filename
    const FORM_DATA = req.body;
    const roomName = req.params.name;

    roomImport.roomModel
      .findOne({ name: req.params.name })
      .lean()
      .exec()
      .then((room) => {
        if (room)
          return res.render("createroom", {
            data: req.session.user,
            layout: false,
            room: room,
            editMode: true,
          });
        else {
          return res.render("createroom", {
            data: req.session.user,
            layout: false,
            error: "Cant edit the room!",
          });
        }
      })
      .catch((err) => {
        console.log("There was an error: " + err);
      });
  }
);

/*#endregion */

/* #region ROOM LISTING WITH SEARCH*/

app.get("/rooms", function (req, res) {
  var rooms = roomImport.roomModel
    .find({})
    .lean() //lean enables sending it to handlebars
    .exec()
    .then((rooms) => {
        return res.render("roomlisting", {
          data: req.session.user,
          hasRooms: !!rooms.length,
          layout: false,
          info: rooms,
        });
    });
});


app.post("/rooms", function (req, res) {
  //DO SEARCH

  if (req.body.location == "All") {
    var rooms = roomImport.roomModel
      .find({})
      .lean() //lean enables sending it to handlebars
      .exec()
      .then((rooms) => {
      
          //console.log(rooms);
          return res.render("roomlisting", {
            data: req.session.user,
            hasRooms: !!rooms.length,
            layout: false,
            info: rooms,
          });
      
      });
  } else if (req.body.location) {
    var rooms = roomImport.roomModel
      .find({ location: req.body.location })
      .lean() //lean enables sending it to handlebars
      .exec()
      .then((rooms) => {
        
          //console.log(rooms);
          return res.render("roomlisting", {
            data: req.session.user,
            hasRooms: !!rooms.length,
            layout: false,
            info: rooms,
          });
       
      });
  }
});


/*#endregion */

app.get("/roomdetail/:name", function (req, res) {
  var rooms = roomImport.roomModel
    .findOne({ name: req.params.name })
    .lean() //lean enables sending it to handlebars
    .exec()
    .then((rooms) => {
      if (rooms) {
        //console.log(rooms);
        return res.render("rdetail", {
          data: req.session.user,
          layout: false,
          info: rooms,
        }); //Populate rdetail
      } else {
        return res.render("roomlisting", {
          data: req.session.user,
          layout: false,
          error: "Cant find the room!",
        });
      }
    });
});

app.get("/logout", function (req, res) {
  //destroy Session
  req.session.destroy();
  //Render Home
  res.render("index", { layout: false });
});

app.get("/deleteroom/:name", function (req, res) {
  const roomName = req.params.name;

  roomImport.roomModel
    .findOne({ name: req.params.name })
    .lean() //lean enables sending it to handlebars
    .exec()
    .then((rooms) => {
      fs.unlink(PHOTODIRECTORY + rooms.photoid, (err) => {
        if (err) {
          return console.log(err);
        }
        console.log("Removed file : " + rooms.photoid);
      });
    });

  roomImport.roomModel.deleteOne({ name: roomName }).then((err) => {
    res.redirect("/rooms");
  });
});

app.post("/payment/:name", checkLogin.checkLogin, function (req, res) {
  //create new booking based on req.body
  var FORM_DATA = req.body;

  var end = req.body.checkout;
  var start = req.body.checkin;

  var enddate = new Date(end);
  var endh = enddate.getTime();

  var startdate = new Date(start);
  var starth = startdate.getTime();

  var totalhours = endh - starth;
  var days = totalhours / (1000 * 60 * 60 * 24);

  var newBooking;

  roomImport.roomModel //Search into rooms for name and price
    .findOne({ name: req.params.name })
    .lean() //lean enables sending it to handlebars
    .exec()
    .then((booking) => {
      var price = parseInt(booking.price);

      newBooking = {
        fname: req.session.user.fname,
        lname: req.session.user.lname,
        email: req.session.user.email,
        Days: days,
        bnbName: booking.name,
        bnbPrice: price * days,
        guests: FORM_DATA.guests,
      };

      //MAKE A HIDDEN UNPIT WITH NEWBOOKINGS VALUES TO SEND IT TO THANKS - IN THANKS ADD THIS VALUE TO BOOKING DATABASE

      res.render("payment", {
        data: req.session.user,
        layout: false,
        booking: newBooking,
      });

      if (!booking) {
        res.render("rooms", {
          data: req.session.user,
          layout: false,
          error: "Failed to create booking!",
        });
      }
    });
});

app.post("/thanks", checkLogin.checkLogin, function (req, res) {
  FORM_DATA = req.body;

  //CREDIT CARD VALIDATION -- MIDDLEWARE

  newBooking = new bookingImport.bookingModel({
    fname: req.session.user.fname,
    lname: req.session.user.lname,
    email: req.session.user.email,
    Days: FORM_DATA.Days,
    bnbName: FORM_DATA.bnbName,
    bnbPrice: FORM_DATA.bnbPrice,
    guests: FORM_DATA.guests,
  });

  bookingImport.saveBooking(newBooking, bookingImport.bookingModel, newBooking);

  res.render("thankyou", { data: req.session.user, layout: false });
});

app.get("/booking", checkLogin.checkLogin, function (req, res) {
  var bookings = bookingImport.bookingModel
    .find({})
    .lean() //lean enables sending it to handlebars
    .exec()
    .then((bookingsArray) => {
      if (bookingsArray) {
        return res.render("booking", {
          data: req.session.user,
          layout: false,
          bookings: bookingsArray,
        });
      } else {
        return res.render("booking", {
          data: req.session.user,
          layout: false,
          error: "There is no bookings here!",
        });
      }
    });
});

app.use((req, res) => {
  res.status(404).send("Page Not Found!");
});

//setup the listener

app.listen(HTTP_PORT, onHttpStart);
