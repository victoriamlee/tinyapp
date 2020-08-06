const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const PORT = 8080;
const { generateRandomString, emailLookUp, urlsForUser, getUserByEmail, createURL } = require('./helpers');

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ['hello', 'there']
}));

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// Redirects to urls page if logged in, else redirects to login page
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Displays urls page if logged in
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).json({Error:"Please login or register!"});
  } else {
    let links = urlsForUser(req.session.user_id, urlDatabase);
    let templateVars = { user: users[req.session.user_id], urls: links };
    res.render("urls_index", templateVars);
  }
});

// Generates a short URL, saves it, and associates it with the user if the user is logged in
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).json({Error:"Please login or register!"});
  } else {
    let longURLInput = createURL(req.body.longURL);
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: longURLInput,
      userID: req.session.user_id
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

// Displays "create new url" page if logged in, else redirects to login page
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// Displays "short url" page if logged in and owns the URL for the given ID
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).json({Error:"Please login or register!"});
  } else if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(403).json({Error:"Can't access this page!"});
  } else {
    let templateVars = { user: users[req.session.user_id], shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL };
    res.render("urls_show", templateVars);
  }
});

// Updates the URL and redirects to urls page if the user is logged in and owns the URL for the given ID
app.post("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).json({Error:"Please login or register!"});
  } else if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(403).json({Error:"Can't access this page!"});
  } else {
    let longURLInput = createURL(req.body.longURL);
    urlDatabase[req.params.id].longURL = longURLInput;
    res.redirect("/urls/");
  }
});

//  Redirects to corresponding long URL if the URL exists
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id].longURL) {
    res.status(403).json({Error: "URL doesn't exist!"});
  } else {
    res.redirect(urlDatabase[req.params.id].longURL);
  }
});

// Deletes the URL if user is logged in and owns the URL for the given ID
app.post("/urls/:id/delete", (req, res) => {
// Checks if the user is logged in and owns the URL for the given ID
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(403).json({Error:"Can't access this page!"});
  }
});

// Displays register page if user is not logged in
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = { user: users[req.session.user_id] };
    res.render("urls_register", templateVars);
  }
});

// Creates new user, encrypt's password with bcrypt, sets a cookie, and redirects to urls page
app.post("/register", (req, res) => {
  const emailInput = req.body.email;
  const passwordInput = req.body.password;
  const hashedPassword = bcrypt.hashSync(passwordInput, 10);
  if (emailInput === "" || passwordInput === "") {
    res.status(400).json({Error:"Password or email can't be blank"});
  } else {
    if (!emailLookUp(emailInput, users)) {
      const newId = generateRandomString();
      users[newId] = {
        id: newId,
        email: emailInput,
        password: hashedPassword
      };
      req.session['user_id'] =  newId;
      res.redirect("/urls");
    } else {
      res.status(400).json({Error:"Email already exists"});
    }
  }
});

// Displays login page if user is not logged in
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = { user: users[req.session.user_id] };
    res.render("urls_login", templateVars);
  }
});

// Sets cookie and redirects to urls page if email and password match existing user
app.post("/login", (req, res) => {
  const emailInput = req.body.email;
  const passwordInput = req.body.password;
  if (emailLookUp(emailInput, users)) {
    let user = getUserByEmail(emailInput, users);
    if (bcrypt.compareSync(passwordInput, users[user].password)) {
      req.session['user_id'] = users[user].id;
      res.redirect("/urls");
    } else {
      console.log("Password is incorrect");
      res.status(403).json({Error:"Email or password is incorrect"});
    }
  } else {
    console.log("Email is incorrect");
    res.status(403).json({Error:"Email or password is incorrect"});
  }
});

// Deletes cookie and redirects to urls page
app.post("/logout", (req, res) => {
  req.session['user_id'] = null;
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});