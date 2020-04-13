require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const localStrategy = require("passport-local");
const passportlocalMongoose = require("passport-local-mongoose");
const methodOverride = require("method-override")
const app = express();

app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(session({
    secret: "mylittlesecret",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());




app.set("view engine", "ejs")


const postSchema = mongoose.Schema({
    title: String,
    content: String,
    url: String
})

const Post = new mongoose.model("post", postSchema);

const userSchema = mongoose.Schema({
    username: String,
    password: String,

})
userSchema.plugin(passportlocalMongoose)

const User = new mongoose.model("user", userSchema)

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect("mongodb://localhost:27017/loggerApp", { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false })
mongoose.set("useCreateIndex", true)
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
    const id = req.params.id;

    Post.findOne({ _id: id }, (err, result) => {
        if (!err) {
            if (result) {
                res.render("post", { post: result })

            }
        }
    })


})

app.put("/article/:id", (req, res) => {
    const id = req.params.id;

    Post.findOneAndUpdate({ _id: id }, {
        title: req.body.title,
        url: req.body.url,
        content: req.body.content
    }, { overwrite: true }, (err, result) => {
        if (!err) {
            res.redirect(`/article/${id}`)

        }
    })
})


app.delete("/article/:id", (req, res) => {
    const id = req.params.id;

    Post.findOneAndRemove({ _id: id }, (err, result) => {
        if (!err) {
            res.redirect(`/`)

        }
    })
})


app.get("/article/:id/edit", (req, res) => {
    const id = req.params.id;
    Post.findOne({ _id: id }, (err, result) => {
        if (!err) {
            if (result) {
                res.render("edit", { post: result })
            }
        }
    })

})




app.get("/register", (req, res) => {
    res.render("register")
})

app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, result) => {
        if (err) {
            console.log(err)
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/")
            })
        }
    })
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.listen(3000, () => {
    console.log("Server Has Started on Port 3000")
})