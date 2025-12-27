const express = require("express");
const router = express.Router();
const controller = require("../../controllers/giangvien/diemHuongDan.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
router.use(authMiddleware.requireGiangVien);
router.get("/", controller.list);
router.get("/form/:svId", controller.form);
router.post("/save", controller.save);
router.get("/detail/:svId", controller.detail);
router.get("/export/:svId", controller.exportWord);

module.exports = router;
