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
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
})
app.use(session({
    secret: "mylittlesecret",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());




app.set("view engine", "ejs")
const commentSchema = mongoose.Schema({
    name: String,
    comment: String,
    id: String
})

const Comment = new mongoose.model("comment", commentSchema);

const postSchema = mongoose.Schema({
    title: String,
    content: String,
    url: String,
    comments: [commentSchema]
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
    const currentUser = req.user
    Post.find({}, (err, result) => {
        if (!err) {
            if (result) {
                res.render("home", { posts: result, currentUser: req.user })
            }
        }
    })

})

app.get("/article", (req, res) => {
    res.render("article", { currentUser: req.user })
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
                Comment.find({ id: id }, (err, found) => {
                    res.render("post", { post: result, comments: found, currentUser: req.user })
                })


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
                res.render("edit", { post: result, currentUser: req.user })
            }
        }
    })

})

app.get("/article/:id/comment", isLoggedIn, (req, res) => {
    const id = req.params.id;
    res.render("comment", { id: id, currentUser: req.user })

})

app.post("/article/:id/comment", (req, res) => {
    const name = req.body.name;
    const comment = req.body.comment;
    const id = req.body.id
    const newComment = new Comment({
        name: name,
        comment: comment,
        id: id
    })
    newComment.save();

    res.redirect("/article/" + id)

})




app.get("/register", (req, res) => {
    res.render("register", { currentUser: req.user })
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
    res.render("login", { currentUser: req.user })
})

app.post("/login", (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, (err) => {
        if (err) {
            console.log(err)
            res.redirect("/")
        } else {
            passport.authenticate("local", {
                successRedirect: "/",
                failureRedirect: "/login"
            })(req, res, () => {

            })
        }
    })
})


app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/")
})

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    } else {
        res.redirect("/login")
    }
}

app.listen(3000, () => {
    console.log("Server Has Started on Port 3000")
})