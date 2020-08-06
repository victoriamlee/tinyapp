const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

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

const emailLookUp = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return user;
    }
  } return false;
};

const urlsForUser = (id) => {
  let filteredData = {};
  if (!id){
    return false
  } else {
    for (let short in urlDatabase) {
      if (urlDatabase[short].userID === id){
        filteredData[short] = urlDatabase[short];
      }
    }     
  } return filteredData;
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
    let links = urlsForUser(req.cookies.user_id);
    let templateVars = { user: users[req.cookies.user_id], urls: links };
    res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  if (!longURL.startsWith("http://") || !longURL.startsWith("https://")) {
    longURL = "http://" + longURL;
  } 
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { 
    longURL: longURL, 
    userID: req.cookies.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies.user_id) {
    let templateVars = { user: users[req.cookies.user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { currentUser: req.cookies.user_id, user: users[req.cookies.user_id], shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL, userID: urlDatabase[req.params.id].userID };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  if (req.cookies.user_id === urlDatabase[req.params.id].userID) {
    let longURLInput = req.body.longURL
    if (!longURLInput.startsWith("http://") || !longURLInput.startsWith("https://")) {
      longURLInput = "http://" + longURLInput;  
  } 
    urlDatabase[req.params.id].longURL = longURLInput;
    res.redirect(`/urls/${req.params.id}`);
  } else {
    res.redirect(`/urls/${req.params.id}`);
  }
});

app.get("/u/:id", (req, res) => {
  res.redirect(urlDatabase[req.params.id].longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  if (req.cookies.user_id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.redirect("/urls");
  }
});

app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const emailInput = req.body.email;
  const passwordInput = req.body.password;
  if (emailInput === "" || passwordInput === "") {
    res.status(400).json({error:"Password or email can't be blank"});
  } else {
    if (!emailLookUp(emailInput)) {
      const newId = generateRandomString();
      users[newId] = {
        id: newId,
        email: emailInput,
        password: passwordInput
      };
      res.cookie('user_id', newId);
      res.redirect("/urls");
    } else {
      res.status(400).json({error:"Email already exists"});
    }
  }
});

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const emailInput = req.body.email;
  const passwordInput = req.body.password;
  if (emailLookUp(emailInput)) {
    let user = emailLookUp(emailInput);
    if (users[user].password === passwordInput) {
      res.cookie('user_id', users[user].id);
      res.redirect("/urls");
    } else {
      console.log("Password is incorrect");
      res.status(403).json({error:"Email or password is incorrect"});
    }
  } else {
    console.log("Email is incorrect");
    res.status(403).json({error:"Email or password is incorrect"});
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
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