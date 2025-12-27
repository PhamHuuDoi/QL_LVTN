const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/giangvien/diemHoiDong.controller");
const auth = require("../../middlewares/auth.middleware");

router.use(auth.requireGiangVien);

router.get("/", ctrl.index);
router.post("/save/:pcId/:svKey", ctrl.saveInline);

module.exports = router;
