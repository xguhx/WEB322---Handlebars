const mongoose = require("mongoose");
const Schema = mongoose.Schema;
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

var userSchema = new Schema({
  fname: String,
  lname: String,
  email: { type: String, unique: true, dropDups: true },
  status: { type: String, default: "Renter" },
  bday: Date,
  password: String,
  isAdm: Boolean,
});

var saveFunction = function (newUser, userModel, FORM_DATA) {
  newUser.save((err) => {
    if (err) {
      console.log("There was an error saving the newUser");
      return;
    } else {
      console.log("The newUser was saved to the User collection");
      userModel
        .findOne({ email: FORM_DATA.email })
        .exec() //makes findOne as a promise
        .then((userMatch) => {
          if (!userMatch) {
            console.log("No user could be found");
          } else {
            console.log(userMatch);
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

var userModel = db.model("Users", userSchema);
module.exports = { userModel, saveFunction };
