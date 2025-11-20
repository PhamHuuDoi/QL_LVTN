const express = require('express');
const router = express.Router();
const sinhvienController = require('../../controllers/giangvien/sinhvien.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.use(authMiddleware.requireGiangVien);// Danh sách sinh viên
router.get('/', sinhvienController.index);

// Đổi nhóm sinh viên
router.post('/update-group/:id', sinhvienController.changeGroup);

module.exports = router;