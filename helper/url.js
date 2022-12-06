const urls = require("../db/urls");

// Generate "short URL" (generate a 6 character random string)
const shortenUrl = () => Math.random().toString(36).substring(2, 8);

// get a single URL by urlId (aka the "short URL").
const getUrlById = (shortUrl, urls) => {
  let foundUrl = null;
  for (const urlId in urls) {
    if (urls[urlId].shortUrl === shortUrl) {
      foundUrl = urls[urlId];
    }
  }
  return foundUrl;
};

// get all URLs for a particular user, by userId
const urlsForUser = (userId) => {
  let myUrls = [];

  for (const urlId in urls) {
    if (urls[urlId].userId === userId) {
      myUrls.push(urls[urlId]);
    }
  }

  return myUrls;
};

// Verify if the urlId passed belongs to userId
const isMyUrl = (userId, urlId, urls) => {
  return urls[urlId].userId !== userId ? false : true;
};



module.exports = {
  getUrlById,
  shortenUrl,
  urlsForUser,
  isMyUrl,
};
