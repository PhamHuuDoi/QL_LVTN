const express = require("express");
const router = express.Router();

// Import route con
const sinhvienRoute = require("./sinhvien.route");
const dashboardRoute = require("./dashboard.route");
const giangvienRoute = require("./giangvien.route");
const phancong = require("./phanCongHuongDan.route");
const detaiRoute = require("./detai.route");
const danhGiaGiuaKy = require("./danhgiagk.route");
const phanCongPhanBienRoute = require("./phanCongPhanBien.route");
const theodoidiemhdRoute = require("./theodoidiemhuongdan.route");
const theodoidiemphanbienRoute = require("./theodoidiemphanbien.route");
const dsnhombvRoute = require("./dsnhombv.route");
const hoidongRoute = require("./hoidong.route");
const ketquaRoute = require("./ketqua.route");
// Mount route con
router.use("/sinhvien", sinhvienRoute);
router.use("/dashboard", dashboardRoute);
router.use("/giangvien", giangvienRoute);
router.use("/phancong", phancong);
router.use("/detai", detaiRoute);
router.use("/danhgiagk", danhGiaGiuaKy);
router.use("/phancongphanbien", phanCongPhanBienRoute);
router.use("/theodoidiemhd", theodoidiemhdRoute);
router.use("/theodoidiempb", theodoidiemphanbienRoute);
router.use("/hoidong", hoidongRoute);
router.use("/dsnhombv", dsnhombvRoute);
router.use("/ketqua", ketquaRoute);
module.exports = router;
