const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const PORT = 8080;
const getUserByEmail = require('./helpers');

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

const generateRandomString = () => {
  let id = Math.random().toString(36).slice(2,8);
  return id;
};

// Confirms if email exists
const emailLookUp = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  } return false;
};

// Finds urls that are associated with the user
const urlsForUser = (id) => {
  let filteredData = {};
  if (!id) {
    return false;
  } else {
    for (let short in urlDatabase) {
      if (urlDatabase[short].userID === id) {
        filteredData[short] = urlDatabase[short];
      }
    }
  } return filteredData;
};

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).json({Error:"Please login or register!"});
  } else {
    let links = urlsForUser(req.session.user_id);
    let templateVars = { user: users[req.session.user_id], urls: links };
    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  if (!longURL.startsWith("http://") || !longURL.startsWith("https://")) {
    longURL = "http://" + longURL;
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

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

app.post("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).json({Error:"Please login or register!"});
  } else if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(403).json({Error:"Can't access this page!"});
  } else {
    let longURLInput = req.body.longURL;
    if (!longURLInput.startsWith("http://") || !longURLInput.startsWith("https://")) {
      longURLInput = "http://" + longURLInput;
    }
    urlDatabase[req.params.id].longURL = longURLInput;
    res.redirect("/urls/");
  }
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(403).json({Error: "URL doesn't exist!"});
  } else {
    res.redirect(urlDatabase[req.params.id].longURL);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(403).json({Error:"Can't access this page!"});
  }
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = { user: users[req.session.user_id] };
    res.render("urls_register", templateVars);
  }
});

app.post("/register", (req, res) => {
  const emailInput = req.body.email;
  const passwordInput = req.body.password;
  const hashedPassword = bcrypt.hashSync(passwordInput, 10);
  if (emailInput === "" || passwordInput === "") {
    res.status(400).json({Error:"Password or email can't be blank"});
  } else {
    if (!emailLookUp(emailInput)) {
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

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = { user: users[req.session.user_id] };
    res.render("urls_login", templateVars);
  }
});

app.post("/login", (req, res) => {
  const emailInput = req.body.email;
  const passwordInput = req.body.password;
  if (emailLookUp(emailInput)) {
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