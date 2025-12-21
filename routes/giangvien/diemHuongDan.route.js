const express = require("express");
const router = express.Router();
const controller = require("../../controllers/giangvien/diemHuongDan.controller");

router.get("/", controller.list);
router.get("/form/:svId", controller.form);
router.post("/save", controller.save);
router.get("/export/:svId", controller.exportWord);

module.exports = router;
