const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/theodoidiemphanbien.controller");
const auth = require("../../middlewares/auth.middleware");

router.use(auth.requireAdmin);

router.get("/", ctrl.index);
router.get("/export", ctrl.exportExcel);
router.get("/detail/:id", ctrl.detail);

module.exports = router;
