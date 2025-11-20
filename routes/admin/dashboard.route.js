const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/auth.middleware");
router.use(authMiddleware.requireAdmin);
const controller = require("../../controllers/admin/dashboard.controller");

router.get("/", controller.index);

module.exports = router;