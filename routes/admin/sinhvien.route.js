const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/sinhvien.controller");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../../middlewares/auth.middleware");
router.use(authMiddleware.requireAdmin);
// Cấu hình lưu file tạm khi upload Excel
const upload = multer({
  dest: path.join(__dirname, "../../../uploads"),
});
// Danh sách sinh viên
router.get("/", controller.index);

// Tạo mới
router.get("/create", controller.create);
router.post("/create", controller.createPost);

// Sửa
router.get("/edit/:id", controller.edit);
router.post("/edit/:id", controller.editPost);

// Xóa
router.delete("/delete/:id", controller.delete);

// Import từ Excel
router.post("/import", upload.single("excelFile"), controller.importExcel);

module.exports = router;
