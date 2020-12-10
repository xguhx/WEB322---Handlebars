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

var roomSchema = new Schema({
  name: { type: String, unique: true },
  price: String,
  location: String,
  hostedby: String,
  bnbdetails: String,
  feature0: String,
  feature0desc: String,
  feature1: String,
  feature1desc: String,
  feature2: String,
  feature2desc: String,
  feature3: String,
  feature3desc: String,
  maindescription: String,
  amenities0: String,
  amenities1: String,
  amenities2: String,
  amenities3: String,
  amenities4: String,
  amenities5: String,
  amenities6: String,
  amenities7: String,
  amenities8: String,
  amenities9: String,
  photoid: String,
});

//roomSchema.plugin(AutoIncrement, {id:'order_seq',inc_field: 'order'});

var saveRoom = function (newRoom, roomModel, FORM_DATA) {
  console.log("im INSIDE SAVE ROOM");

  newRoom.save((err) => {
    if (err) {
      console.log("There was an error saving the newRoom");
      return;
    } else {
      console.log("The newRoom was saved to the Rooms collection");
      roomModel
        .findOne({ name: FORM_DATA.name })
        .exec() //makes findOne as a promise
        .then((roomMatch) => {
          if (!roomMatch) {
            console.log("No Room could be found");
          } else {
            console.log(roomMatch);
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

var roomModel = db.model("Rooms", roomSchema);

module.exports = { roomModel, saveRoom };
