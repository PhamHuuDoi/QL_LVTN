// routes/admin/ketQua.route.js
const router = require("express").Router();
const ctrl = require("../../controllers/admin/ketqua.controller");

router.get("/", ctrl.index);
router.get("/export", ctrl.exportExcel);

module.exports = router;
