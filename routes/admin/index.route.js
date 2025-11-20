const express = require("express");
const router = express.Router();


// Import route con
const sinhvienRoute = require("./sinhvien.route");
const dashboardRoute = require("./dashboard.route");
const giangvienRoute=require("./giangvien.route");
const phancong=require("./phanCongHuongDan.route");
// Mount route con
router.use("/sinhvien", sinhvienRoute);
router.use("/dashboard", dashboardRoute);
router.use("/giangvien",giangvienRoute);
router.use("/phancong",phancong);
module.exports = router;