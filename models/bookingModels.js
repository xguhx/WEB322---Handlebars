const mongoose = require("mongoose");

const Schema = mongoose.Schema;
//var AutoIncrement = require('mongoose-sequence')(mongoose);

mongoose.Promise = require("bluebird"); //control of promises

var db = mongoose.createConnection(process.env.mongoDB_atlas, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

db.on("error", (err) => {
  console.log(`DB error: ${err}`);
});
db.once("open", () => {
  console.log("DB connection success!");
});

var bookingSchema = new Schema({
  fname: String,
  lname: String,
  email: String,
  Days: Number,
  bnbName: String,
  bnbPrice: String,
  guests: Number,
});

var saveBooking = function (newBooking, bookingModel, FORM_DATA) {
  newBooking.save((err) => {
    if (err) {
      console.log("There was an error saving the Booking");
      return;
    } else {
      console.log("The Booking was saved to the Bookings collection");
      bookingModel
        .find({ name: FORM_DATA.fname })
        .exec() //makes findOne as a promise
        .then((bookingMatch) => {
          if (!bookingMatch) {
            console.log("No Booking could be found");
          } else {
            console.log(bookingMatch);
          }
          // exit the program after saving and finding
          // process.exit(); //just for this example
        })
        .catch((err) => {
          console.log(`There was an error: ${err}`);
        });
    }
  });
};

var bookingModel = db.model("Bookings", bookingSchema);

module.exports = { bookingModel, saveBooking };
