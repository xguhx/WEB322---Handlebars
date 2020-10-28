const express = require('express');
const  path = require('path');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');


const app = express();

//Handlebars
app.engine('.hbs', hbs({extname: '.hbs'}));
app.set('view engine', '.hbs');

//MAILER 
const transporter = nodemailer.createTransport({
    service : 'gmail',
    auth: {
        user: 'gustavo.web322@gmail.com',
        pass: 'pleasedonthackme'
    }
})

//-----------------------------------------

app.use(express.static("views"));

var HTTP_PORT = process.env.PORT || 8080;

function onHttpStart(){
    console.log("Express Server Running on port " + HTTP_PORT);
}

//create a route that indicates what we do when person navigates to the root folder

app.get("/",function(req,res){
    //res.sendFile(path.join(__dirname, '/src/views/index.html'));

    res.render('index' , {layout: false});
});


app.get("/home",function(req,res){
    // res.sendFile(path.join(__dirname, '/src/views/index.html'));

    res.render('index' , {layout: false});
});

app.get("/rooms",function(req,res){
    //res.sendFile(path.join(__dirname, '/src/views/roomlisting.html'));


    res.render('roomlisting' , {layout: false});
});

app.get("/registration",function(req,res){
    //res.sendFile(path.join(__dirname, '/src/views/registration.html'));

    res.render('registration' , {layout: false});
});

app.get("/login",function(req,res){
    //res.sendFile(path.join(__dirname, '/src/views/login.html'));

    res.render('login' , {layout: false});
});

app.get("/roomdetail",function(req,res){
    //res.sendFile(path.join(__dirname, '/src/views/rdetail.html'));

    res.render('rdetail' , {layout: false});
});

app.get("/payment",function(req,res){
    //res.sendFile(path.join(__dirname, '/src/views/payment.html'));

    res.render('payment' , {layout: false});
});

app.get("/thanks",function(req,res){
    //res.sendFile(path.join(__dirname, '/src/views/thankyou.html'));

    res.render('thankyou' , {layout: false});
});

//Body-Parser

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.post("/dashboard",function(req,res){
    const FORM_DATA = req.body;
    //console.log(FORM_DATA, "FORM_DATA");


    var emailOptions = {
        from: 'gustavo.web322@gmail.com',
        to: FORM_DATA.email,
        subject: 'EMAIL FROM NODE.JS USING NODEMAILER',
        text: ' JUST TEXT ',
        html: '<p>HELLO ' + FORM_DATA.fname + " " + FORM_DATA.lname +" </p><p> THANK YOU FOR FILLING OUR FORM</p>"
    };

    transporter.sendMail(emailOptions, (error, info) => {
        if(error){
            console.log("error!"  + error);
        }else {
            console.log("Success" + info.response);
        }
    });




    res.render('dashboard' , {data : FORM_DATA, layout: false});
});



app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });



//setup the listener

app.listen(HTTP_PORT, onHttpStart);