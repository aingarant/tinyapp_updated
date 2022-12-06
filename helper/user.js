const users = require("../db/users");
const bcrypt = require("bcryptjs");

// Generate "user ID" (generate a 6 character random string)
const createUserId = () => Math.random().toString(36).substring(2, 8);

// Get user object from users DB for passed in userId
const getUserByUserId = (userId, users) => {
  // console.log(users, userId)
  let foundUser = null;
  for (const id in users) {
    if (userId === users[id].userId) {
      foundUser = users[id];
    }
  }
  return foundUser;
};

// Get user object from users DB for passed in email
const getUserByEmail = (email, users) => {
  let foundUser = undefined;
  for (const userId in users) {
    if (email === users[userId].email) foundUser = users[userId];
  }
  return foundUser;
};

// User Login helper function
const userLogin = (email, password, users) => {
  let returnedUser = null;
  let user = null;

  const foundUser = getUserByEmail(email, users);

  if (!foundUser) {
    return null;
  }

  bcrypt.compareSync(password, foundUser.password)
    ? (user = foundUser)
    : (user = null);

  if (!user) {
    return null;
  }

  returnedUser = {
    userId: user.userId,
    email: user.email,
  };

  return returnedUser;
};

// User Register helper function
const userRegister = (email, password, users) => {
  const userId = createUserId();

  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = (users[userId] = {
    userId: userId,
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  if (!newUser) return `Something went wrong`;

  const returnedUser = {
    userId: userId,
    email: email.toLowerCase(),
  };

  return returnedUser;
};

// Verify if session coookie in client belongs to valid user in "database"

module.exports = {
  getUserByEmail,
  getUserByUserId,
  userLogin,
  userRegister
};
