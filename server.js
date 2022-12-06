const express = require("express");
const morgan = require("morgan");
const cookieSession = require("cookie-session");
const app = express();
const port = 8181;

const {
  getUserByEmail,
  getUserByUserId,
  userLogin,
  userRegister,
} = require("./helper/user");

const {
  urlsForUser,
  shortenUrl,
  getUrlById,
  isMyUrl,
} = require("./helper/url");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(
  cookieSession({
    name: "session",
    keys: ["session"],
    maxAge: 24 * 60 * 60 * 1000,
  })
);

// import db and user objects (aka database) from external files.
const users = require("./db/users");
const urls = require("./db/urls");

app.get("/", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let userId = "";
  let email = "";

  if (req.session.userId) {
    userId = req.session.userId;
  }

  const getUser = getUserByUserId(userId, users);
  if (getUser) {
    email = getUser.email;
  }

  if (!getUser) {
    let templateVars = {
      userId: userId,
      email: email,
      messageBody: `<p>You are trying to access a page that requires you to be logged in.</p>
      <p>Please <a href="/login">Login here</a> with your account.</p>
      <p>If you do not have an account, please <a href="/register">Register here
      </a>.</p>`,
      messageTitle: "Not Logged In",
    };
    return res.render("error_page", templateVars);
  }

  const user = getUser;

  email = user.email;
  myUrls = urlsForUser(userId);
  templateVars = {
    userId: userId,
    email: email,
    urls: myUrls,
  };
  res.render("url_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect("/login");
  }

  const user = getUserByUserId(userId, users);

  if (!user) {
    return res.redirect("/login");
  }

  const message = null;
  const email = user.email;
  const templateVars = {
    userId,
    email,
    message,
  };

  res.render("url_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session.userId;

  const id = req.params.id;

  if (!urls[id]) {
    const templateVars = {
      userId: null,
      messageTitle: `Not a valid short URL`,
      messageBody: `The short URL you have provided <b>${id}</b> is not valid.`,
    };
    return res.render("error_page", templateVars);
  }

  if (!userId) {
    const templateVars = {
      userId: null,
      messageTitle: "Not Logged in",
      messageBody: "You have to be logged in to view this page.",
    };
    return res.render("error_page", templateVars);
  }

  const user = getUserByUserId(userId, users);

  if (!user) {
    return res.redirect("/login");
  }

  const email = user.email;

  if (urls[id].userId !== userId) {
    const templateVars = {
      userId: null,
      messageTitle: "Forbidden",
      messageBody:
        "You do not have access to this page. This URL does not belong to you.",
    };
    return res.render("error_page", templateVars);
  }

  const longUrl = urls[id].longUrl;

  const templateVars = {
    userId,
    email,
    message: null,
    id: id,
    longUrl: longUrl,
  };
  res.render("url_show", templateVars);
});

app.get("/urls/:id/edit", (req, res) => {
  const id = req.params.id;

  const userId = req.session.userId;
  let message = "";

  if (!userId) {
    return res.redirect("/login");
  }

  const user = getUserByUserId(userId, users);

  if (!user) {
    return res.redirect("/login");
  }

  const email = user.email;

  if (urls[id].userId !== userId) {
    const templateVars = {
      userId: null,
      messageTitle: `Forbidden`,
      messageBody: `The short URL you are trying to access <b>${id}</b> does not belong to you.`,
    };
    return res.status(403).render("error_page", templateVars);
  }

  const longUrl = urls[id].longUrl;

  const templateVars = {
    userId: req.session.userId,
    id: id,
    longUrl: longUrl,
    shortUrl: id,
    email,
    message,
  };
  res.render("url_edit", templateVars);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const url = getUrlById(id, urls);
  if (!url) {
    const templateVars = {
      userId: null,
      messageTitle: "Short URL Not Found",
      messageBody: `The Short URL provided (${id})was not found`,
    };
    return res.render("error_page", templateVars);
  }
  res.redirect(url.longUrl);
});

app.get("/login", (req, res) => {
  let userId = null;
  if (req.session.userId) {
    userId = req.session.userId;
  }

  if (userId) {
    return res.redirect("/urls");
  }

  const templateVars = {
    message: "",
    userId: "",
    email: "",
  };

  res.render("user_login", templateVars);
});

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.get("/register", (req, res) => {
  const userId = req.session.userId;

  if (userId) return res.redirect("/");

  const templateVars = {
    message: "",
    userId: "",
    email: "",
  };
  res.render("user_register", templateVars);
});

app.post("/urls/new", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    const templateVars = {
      userId: null,
      messageTitle: "Unauthorized",
      messageBody: "You have to be logged into submit a new URL.",
    };
    return res.status(401).render("error_page", templateVars);
  }

  const longUrl = req.body.longUrl;
  const shortUrl = shortenUrl();
  urls[shortUrl] = {
    longUrl,
    shortUrl,
    userId,
  };
  res.redirect(`/urls/${shortUrl}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.body.id;
  const userId = req.session.userId;

  if (!isMyUrl(userId, id, urls)) {
    const templateVars = {
      userId: null,
      messageTitle: "Unauthorized",
      messageBody:
        "You are trying to delete a URL that does not belong to you..",
    };
    return res.status(401).render("error_page", templateVars);
  }
  delete urls[id];

  res.redirect("/urls");
});

app.post("/urls/:id/edit", (req, res) => {
  const userId = req.session.userId;
  const { id, newUrl } = req.body;

  if (!isMyUrl(userId, id, urls)) {
    const templateVars = {
      userId: null,
      messageTitle: "Unauthorized",
      messageBody:
        "You are trying to Edit a URL that does not belong to you.",
    };
    return res.status(401).render("error_page", templateVars);
  }
  urls[id] = { shortUrl: id, longUrl: newUrl, userId: userId };
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  let userId = "";
  const emailInput = req.body.email;
  const passwordInput = req.body.password;

  if (!emailInput || !passwordInput) {
    const templateVars = {
      userId: "",
      message: "Email & Password fields must not be empty.",
    };
    return res.status(400).render("user_login", templateVars);
  }
  const user = userLogin(emailInput, passwordInput, users);
  if (!user) {
    const templateVars = {
      user: "",
      userId,
      message: "Login error.",
    };

    return res.render("user_login", templateVars);
  }

  req.session.userId = user.userId;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const emailInput = req.body.email;
  const passwordInput = req.body.password;

  if (!emailInput || !passwordInput) {
    const templateVars = {
      userId: req.session.userId,
      message: "Email & Password fields must be filled out.",
    };
    return res.render("user_register", templateVars);
  }

  // verify if user exists.
  const user = getUserByEmail(emailInput, users);
  if (user) {
    const templateVars = {
      userId: "",
      message: "User is already registered. Please <a href='/login'>Login</a>.",
    };

    return res.render("user_register", templateVars);
  }
  const newUser = userRegister(emailInput, passwordInput, users);
  if (!newUser) {
    const templateVars = {
      userId: "",
      message:
        "Something went wrong during registration. Please contact admin..",
    };

    return res.render("user_register", templateVars);
  }

  req.session.userId = newUser.userId;
  res.redirect("/urls");
});

app.get("*", (req, res) => {
  let userId = "";
  let email = "";

  if (req.session.userId) {
    userId = req.session.userId;
  }

  const getUser = getUserByUserId(userId, users);
  if (getUser) {
    email = getUser.email;
  }

  const templateVars = {
    userId: userId,
    email: email,
    messageBody: `<p>The page you are looking for was not found.</p>
    <p>Please check the spelling and try again.</p>`,
    messageTitle: "404 | Page Not Found",
  };
  return res.render("error_page", templateVars);
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
