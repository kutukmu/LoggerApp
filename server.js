require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const localStrategy = require("passport-local");
const passportlocalMongoose = require("passport-local-mongoose");
const methodOverride = require("method-override")
const findOrCreate = require("mongoose-findorcreate")
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const app = express();



app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
})
app.use(session({
    secret: `${process.env.SECRET}`,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/article",
    userProfileURL: "https://www.google.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile)
        User.findOrCreate({ googleId: profile.id, googleName: profile.given_name }, function (err, user) {
            return cb(err, user);
        });
    }
));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/article",
    //callbackURL: "https://gentle-taiga-85346.herokuapp.com/auth/facebook/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile)
        User.findOrCreate({ facebookId: profile.id, facebookName: profile.displayName }, function (err, user) {
            return cb(err, user);
        });
    }
));





app.set("view engine", "ejs")
const commentSchema = mongoose.Schema({
    name: String,
    comment: String,
    id: String,

})

const Comment = new mongoose.model("comment", commentSchema);

const postSchema = mongoose.Schema({
    title: String,
    content: String,
    url: String,
    comments: [commentSchema],
    username: String,
    userid: String
})

const Post = new mongoose.model("post", postSchema);


const userSchema = mongoose.Schema({
    username: String,
    password: String,
    posts: [postSchema],
    comment: [commentSchema],
    googleId: String,
    googleName: String,
    facebookId: String,
    facebookName: String

})
userSchema.plugin(passportlocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("user", userSchema)

passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

mongoose.connect(`mongodb+srv://kerim:${process.env.PASSWORD}@cluster0-m839r.mongodb.net/loggerApp`, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false })
mongoose.set("useCreateIndex", true)
app.get("/", (req, res) => {
    const currentUser = req.user
    Post.find({}, (err, result) => {
        if (!err) {
            if (result) {
                console.log(result)
                res.render("home", { posts: result, currentUser: req.user })
            }
        }
    })

})

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/article",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/article");
    });
app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/article',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/article');
    });


app.get("/article", isLoggedIn, (req, res) => {
    res.render("article", { currentUser: req.user })
})

app.post("/article", (req, res) => {
    const { title, url, content } = req.body;
    const newPost = new Post({
        title: title,
        content: content,
        url: url,
        username: req.user.username || req.user.googleName || req.user.facebookName,
        userid: req.user._id
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
                    let isSame = false;
                    if (req.user) {
                        if (result.userid == req.user._id) {
                            isSame = true;
                        }
                    }

                    res.render("post", { post: result, comments: found, currentUser: req.user, isSame: isSame })
                    console.log(isSame)
                })


            }
        }
    })


})

app.patch("/article/:id", (req, res) => {
    const id = req.params.id;

    Post.findOneAndUpdate({ _id: id }, {
        username: req.user.username,
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

app.get("/article/:id/comment/:com_id/edit", (req, res) => {
    const postid = req.params.id;
    const commentid = req.params.com_id;

    Comment.findOne({ _id: commentid }, (err, found) => {
        if (!err) {
            if (found) {
                console.log(found)
                res.render("commentedit", { found: found })
            }

        }

    })


})
app.put("/article/:id/comment/:com_id", (req, res) => {
    const com_id = req.params.com_id;
    const comment = req.body.comment;

    Comment.findOneAndUpdate({ _id: com_id }, { comment: comment }, (err, result) => {
        if (!err) {
            res.redirect("/article/" + req.params.id)
        }
    })


})

app.delete("/article/:id/comment/:com_id", (req, res) => {
    const com_id = req.params.com_id;
    Comment.findOneAndRemove({ _id: com_id }, (err, result) => {
        if (!err) {
            res.redirect("/article/" + req.params.id)
        }
    })
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

app.listen(3000 || process.env.PORT, () => {
    console.log("Server Has Started on Port 3000")
})