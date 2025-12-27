const express = require('express');
const router = express.Router();
const dashboardRoute = require('./dashboard.route');
const sinhvienRoute = require('./sinhvien.route');
const detaiRoute = require('./detai.route');
const danhGiaGiuaKy=require('./danhgiaGk.route');
const diemHuongDanRoute = require('./diemHuongDan.route');
const diemPhanBienRoute = require('./diemPhanBien.route');
const diemhoidongRoute = require('./diemhoidong.route');

router.use('/dashboard', dashboardRoute);
router.use('/sinhvien', sinhvienRoute);

router.use('/detai', detaiRoute);
router.use('/danhgiagk', danhGiaGiuaKy);
router.use('/diemhuongdan', diemHuongDanRoute);
router.use('/diemphanbien', diemPhanBienRoute);
router.use('/diemhoidong', diemhoidongRoute);
module.exports = router;