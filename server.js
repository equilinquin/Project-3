const express = require("express");
const cors = require("cors");
//const session = require("express-session");
const mongoose = require("mongoose");
const Marvel = require("marvel");
const path = require("path");
const passport = require("passport");
const router = require("./routes/api");
const User = require("./models/user");
const LocalStrategy = require("passport-local").Strategy;

// Configure Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Define middleware 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(User.serializeUser()); 
passport.deserializeUser(User.deserializeUser()); 

passport.use(new LocalStrategy({usernameField: 'email'}, User.authenticate()))

// Connect to the Mongo DB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/excelsiordb");

// Serve up static assets
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

// API routes

app.use('/user', router);

// Create an instance of the Marvel API library for use in API routes
const marvel = new Marvel(
  {
    // to-do: conceal these keys from view on GIT / production server
    publicKey: "4ec17a1ab75056cbf248564f7f463990",
    privateKey: "f6588b5911e153c8d42e62044dc91d2af43e8b90"
  }
);

// Find a character by name
app.get("/api/characters/:name", (req, res) => {
  const name = req.params.name;
  marvel.characters.nameStartsWith(name).get((err, resp) => {
    if (err) {
      return res.send(err).status(409).statusMessage("Server error");
    }
    res.json(resp);
  });
});

// Find a comic by title
app.get("/api/comics/:title", (req, res) => {
  const title = req.params.title;
  marvel.comics.titleStartsWith(title).get((err, resp) => {
    if (err) {
      return res.send(err).status(409).statusMessage("Server error");
    }
    res.json(resp);
  });
});

// Add a character to favorites
app.post("/api/favorites", (req, res) => {
  // Make sure a user is logged in
  if (!req.user) {
    return res.json({ error: "No user is signed in." });
  }
  const { email } = req.user;

  // Make sure user has an email address
  if (!email) {
    return res.json({ error: "Couldn't retrieve email address for current user" });
  }
  const { characterID } = req.body;

  // Make sure a character ID was included with the POST request
  if (!characterID) {
    return res.json({ error: "No character ID was given." });
  }

  // Search the Marvel API for the character to make sure the character ID is valid
  marvel.characters.id(characterID, character => {
    if (!character || character.length === 0) {
      return res.json({ error: "Character not found." });
    }

    // Add the character ID to the user's favorites
    req.user.favorites.push(characterID);

    // Save changes
    req.user.save((err, savedResult) => {
      if (err) {
        return res.json(err);
      }

      // Respond with the saved document as confirmation save was successful
      res.json(savedResult);
    });
  });
});

// Send every other request to the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

// Start the API server
app.listen(PORT, function () {
  console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
});
