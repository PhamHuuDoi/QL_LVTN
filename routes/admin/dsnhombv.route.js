// routes/admin/phanCongHoiDong.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/dsnhombv.controller");
const auth = require("../../middlewares/auth.middleware");
router.use(auth.requireAdmin);
router.get("/", ctrl.index);
router.post("/assign", ctrl.assign);
router.get("/export", ctrl.exportExcel);
router.post("/update/:id", ctrl.update);
module.exports = router;
