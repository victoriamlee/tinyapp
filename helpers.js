// Created a random 6 character string
const generateRandomString = () => {
  let id = Math.random().toString(36).slice(2,8);
  return id;
};

// Confirms if email exists
const emailLookUp = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  } return false;
};

// Finds urls that are associated with the user
const urlsForUser = (id, database) => {
  let filteredData = {};
  if (!id) {
    return false;
  } else {
    for (let short in database) {
      if (database[short].userID === id) {
        filteredData[short] = database[short];
      }
    }
  } return filteredData;
};

// Loops up if user exists in the database
const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
};

// If the longURLInput doesn't start with http://, add it to the beginning
const createURL = (url) => {
  if (!url.startsWith("http://") || !url.startsWith("https://")) {
    url = "http://" + url;
    return url;
  } else {
    return url;
  }
};

// Checks if user is logged in
const userLoggedIn = (req) => {
  if (!req.session.user_id || req.session.user_id === undefined) {
    return false;
  } else {
    return true;
  }
};

// Checks if the user created the URL
const usersURL = (req, database) => {
  if (req.session.user_id !== database[req.params.id].userID) {
    return false;
  } else {
    return true;
  }
};

module.exports = { generateRandomString, emailLookUp, urlsForUser, getUserByEmail, createURL, userLoggedIn, usersURL };