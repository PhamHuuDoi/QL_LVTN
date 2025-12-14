const express = require('express');
const router = express.Router();
const dashboardRoute = require('./dashboard.route');
const sinhvienRoute = require('./sinhvien.route');
const detaiRoute = require('./detai.route');
const danhGiaGiuaKy=require('./danhgiaGk.route');

router.use('/dashboard', dashboardRoute);
router.use('/sinhvien', sinhvienRoute);

router.use('/detai', detaiRoute);
router.use('/danhgiagk', danhGiaGiuaKy);

module.exports = router;