var express = require('express');
var path = require('path');
var app = express();
app.use(express.static("src"));

var HTTP_PORT = process.env.PORT || 8080;

function onHttpStart(){
    console.log("Express Server Running on port " + HTTP_PORT);
}

//create a route that indicates what we do when person navigates to the root folder

app.get("/",function(req,res){
    res.sendFile(path.join(__dirname, '/src/views/index.html'));
});


app.get("/home",function(req,res){
    res.sendFile(path.join(__dirname, '/src/views/index.html'));
});

app.get("/rooms",function(req,res){
    res.sendFile(path.join(__dirname, '/src/views/roomlisting.html'));
});


app.get("/registration",function(req,res){
    res.sendFile(path.join(__dirname, '/src/views/registration.html'));
});

app.get("/login",function(req,res){
    res.sendFile(path.join(__dirname, '/src/views/login.html'));
});


//setup the listener

app.listen(HTTP_PORT, onHttpStart);