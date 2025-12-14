const express = require("express");
const router = express.Router();

const controller = require("../../controllers/admin/phancongphanbien.controller");
const auth = require("../../middlewares/auth.middleware");

router.use(auth.requireAdmin);

router.get("/", controller.index);
router.post("/assign", controller.assign);

module.exports = router;