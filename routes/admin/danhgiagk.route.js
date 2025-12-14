const express = require("express");
const router = express.Router();

const controller = require("../../controllers/admin/danhgiagk.controller");
const auth = require("../../middlewares/auth.middleware");

router.use(auth.requireAdmin);

router.get("/", controller.list);
router.get("/detail/:id", controller.detail);

module.exports = router;