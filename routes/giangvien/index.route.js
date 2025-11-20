const express = require('express');
const router = express.Router();
const dashboardRoute = require('./dashboard.route');
const sinhvienRoute = require('./sinhvien.route');

router.use('/dashboard', dashboardRoute);
router.use('/sinhvien', sinhvienRoute);

module.exports = router;