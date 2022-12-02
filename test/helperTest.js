const chai = require("chai"); // 1
const assert = chai.assert;

const users = require("../db/users");
const urls = require("../db/urls");

const {
  getUserByEmail,
  getUserByUserId,
  userLogin,
  userRegister,
} = require("../helper/user");


const testUsers = {
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

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(expectedUserID, user.id);
  });

  it('should return undefined', function() {
    const user = getUserByEmail("ussdfer@example.com", testUsers);
    const expectedUserID = undefined;
    assert.strictEqual(expectedUserID, user);
  });


});