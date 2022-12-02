const express = require("express");
const morgan = require("morgan");
const cookieSession = require("cookie-session");
const app = express();
const port = 80;

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
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect("/login");
  }

  const user = getUserByUserId(userId, users);
  if (!user) {
    return res.redirect("/login");
  }

  const email = user.email;
  const myUrls = urlsForUser(userId);
  const templateVars = {
    userId: userId,
    email: email,
    urls: myUrls,
  };
  res.render("url_index", templateVars);
});

app.get("/url/new", (req, res) => {
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

app.get("/url/:id", (req, res) => {
  const id = req.params.id;

  if (!urls[id]) {
    return res.redirect("/urls");
  }

  const userId = req.session.userId;

  if (!userId) {
    return res.redirect("/login");
  }

  const user = getUserByUserId(userId, users);

  if (!user) {
    return res.redirect("/login");
  }

  const email = user.email;

  if (urls[id].userId !== userId) {
    return res.redirect("/urls");
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

app.get("/url/:id/edit", (req, res) => {
  const id = req.params.id;

  const userId = req.session.userId;
  // let email = "";
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
    return res.send("nacho url!");
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
    return res.redirect("/");
  }
  res.redirect(url.longUrl);
});

app.get("/login", (req, res) => {
  const userId = req.session.userId;

  if (userId) {
    return res.redirect("/urls");
  }

  const templateVars = {
    message: null,
    userId: null,
    email: null,
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
    message: null,
    userId: null,
    email: null,
  };
  res.render("user_register", templateVars);
});

app.post("/url/new", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.send(`Sorry, you need to be logged in.`);
  }

  const longUrl = req.body.longUrl;
  const shortUrl = shortenUrl();
  urls[shortUrl] = {
    longUrl,
    shortUrl,
    userId,
  };
  res.redirect(`/url/${shortUrl}`);
});

app.post("/url/:id/delete", (req, res) => {
  const id = req.body.id;
  const userId = req.session.userId;

  if (isMyUrl(userId, id, urls)) {
    delete urls[id];
  } else {
    res.redirect("/urls");
  }

  res.redirect("/urls");
});

app.post("/url/:id/edit", (req, res) => {
  const userId = req.session.userId;
  const { id, newUrl } = req.body;
  urls[id] = { shortUrl: id, longUrl: newUrl, userId: userId };
  res.redirect(`/url/${id}`);
});

app.post("/login", (req, res) => {
  const emailInput = req.body.email;
  const passwordInput = req.body.password;

  if (!emailInput || !passwordInput) {
    const templateVars = {
      message: "Email & Password fields must not be empty.",
    };
    return res.status(400).render("user_login", templateVars);
  }
  const user = userLogin(emailInput, passwordInput, users);
  if (!user) return res.send("Login Error.");
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
  if (!newUser) return res.send("Somethign went wrong during registration");

  req.session.userId = newUser.userId;
  res.redirect("/urls");
});

app.get("/cookie", (req, res) => {
  req.session.userId = "this is a cookie";
  res.send("cookie set");
});

app.get("/admin/urls", (req, res) => {
  res.json(urls);
});

app.get("*", (req, res) => {
  res.render("page_not_found");
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
