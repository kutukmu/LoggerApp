const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))
mongoose.connect("mongodb://localhost:27017/loggerApp", { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true })

app.set("view engine", "ejs")


const postSchema = mongoose.Schema({
    title: String,
    content: String,
    url: String
})

const Post = new mongoose.model("post", postSchema);



app.get("/", (req, res) => {
    Post.find({}, (err, result) => {
        if (!err) {
            if (result) {
                res.render("home", { posts: result })
            }
        }
    })

})

app.get("/article", (req, res) => {
    res.render("article")
})

app.post("/article", (req, res) => {
    const { title, url, content } = req.body;
    const newPost = new Post({
        title: title,
        content: content,
        url: url
    })

    newPost.save();

    res.redirect("/")
})

app.get("/article/:id", (req, res) => {
    const title = req.params.id;
    Post.findOne({ title: title }, (err, result) => {
        if (!err) {
            if (result) {
                res.render("post", { post: result })
            }
        }
    })


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