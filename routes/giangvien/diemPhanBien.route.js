const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/giangvien/diemPhanBien.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
router.use(authMiddleware.requireGiangVien);

router.get(
  "/",
  (req, res, next) => {
    console.log("✅ ROUTE /giangvien/diemphanbien ĐÃ CHẠY");
    next();
  },
  ctrl.list
);
router.get("/form/:pcId", ctrl.form);
router.post("/save", ctrl.save);
router.get("/export/:pcId", ctrl.exportWord);

module.exports = router;
