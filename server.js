const express = require("express")
const app = express()
const path = require('path')
const engine = require("ejs-mate");
const { sign } = require("crypto");

app.engine('ejs', engine);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"))

app.get("/login",(req,res)=>{
    res.render('user/login')
})

app.get("/signup",(req,res)=>{
    res.render("user/signup")
})

app.get("/",(req,res)=>{
    res.render("products/home")

})


app.listen(8080,()=>{
    console.log("app is runnig on 8080")
})