const express = require('express');
const router = express.Router();
const dashboardRoute = require('../../controllers/giangvien/dashboard.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.use(authMiddleware.requireGiangVien);

router.get('/', dashboardRoute.index);


module.exports = router;