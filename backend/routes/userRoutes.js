const express = require("express");
const { loginOrCreateUser } = require("../controllers/userController");

const router = express.Router();

router.post("/login", loginOrCreateUser);

module.exports = router;