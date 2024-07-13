const express = require("express");
const app = express();
const path = require('path');
const engine = require("ejs-mate");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/dinesh',)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Define product schema
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: String,
    price: Number,
    category: String
});

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const Product = mongoose.model("Product", productSchema);
const User = mongoose.model("User", userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('ejs', engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/login", (req, res) => {
    res.render('user/login');
});

app.post("/login", async (req, res) => {
    let logUser = {email:req.body.email,password:req.body.pass}
    let user = await User.findOne(logUser);
    if(user){
        res.send("logged in")
    }else{
        res.send("no")
    }
});

app.get("/signup", (req, res) => {
    res.render("user/signup");
});

app.post("/signup", async (req, res) => {
    let newUser = new User({
        username: req.body.user,
        email: req.body.email,
        password: req.body.password
    });
    await newUser.save();
    res.render("user/login");
});

app.get("/", async (req, res) => {
    const prod = new Product({
        name: "shirt",
        image: "shiva",
        price: 1000,
        category: "Cloth"
    });
    await prod.save();
    res.send("Product saved");
});

// Start the server on port 8080
app.listen(8080, () => {
    console.log("App is running on port 8080");
});
