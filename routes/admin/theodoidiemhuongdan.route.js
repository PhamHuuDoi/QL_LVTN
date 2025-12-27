const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/theodoidiemhuongdan.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
router.use(authMiddleware.requireAdmin);
router.get("/", ctrl.index);
router.get("/export", ctrl.exportExcel);
router.get("/detail/:id", ctrl.detail);

module.exports = router;
