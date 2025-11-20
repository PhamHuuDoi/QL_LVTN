const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth.controller.js");

router.get("/login", controller.getLogin);
router.get("/login", (req, res) => {
    res.render("auth/login");
});

router.post("/login", controller.postLogin);

router.get("/logout", controller.logout);

module.exports = router;