const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))
mongoose.connect("mongodb://localhost:27017/loggerApp", { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true })

app.set("view engine", "ejs")


app.get("/", (req, res) => {
    res.render("home")
})

app.get("/article", (req, res) => {
    res.render("article")
})


app.get("/register", (req, res) => {
    res.render("register")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.listen(3000, () => {
    console.log("Server Has Started on Port 3000")
})