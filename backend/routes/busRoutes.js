const express = require("express");
const router = express.Router();
const { getBuses, seedBuses } = require("../controllers/busController");

router.get("/", getBuses);
router.get("/seed", seedBuses);

module.exports = router;