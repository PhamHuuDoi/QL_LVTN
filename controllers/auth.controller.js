const GV = require("../models/giangVien.model"); 
const Account = require("../models/acount.model");
const createDefaultAdmin = require("../config/creatDefalutAdmin");
const md5 = require("md5");

module.exports.getLogin = async (req, res) => {
  try {
    await createDefaultAdmin(); // tạo admin mặc định nếu chưa có
  } catch (err) {
    console.error("Lỗi tạo admin mặc định:", err);
  }

  res.render("auth/login", { error: null });
};

module.exports.postLogin = async (req, res) => {
  const { username, password } = req.body;

  const hashedPass = md5(password);
  const prefix = username.substring(0, 2).toLowerCase();
  if (prefix === "ad") {
    const user = await Account.findOne({ username, password: hashedPass, role: "admin" });
    if (!user) return res.render("auth/login", { error: "Sai tài khoản admin!" });

    req.session.user = user;
    req.session.role = "admin";

    return res.redirect("/admin/dashboard");
  }

  if (prefix === "gv") {
  // Tìm account giảng viên
  const account = await Account.findOne({
    username,
    password: hashedPass,
    role: "giangvien"
  });

  if (!account) {
    return res.render("auth/login", { error: "Sai tài khoản giảng viên!" });
  }

  // Lấy thông tin giảng viên từ GV
  const giangvien = await GV.findById(account.giangvienId);

  req.session.user = giangvien; // lưu thông tin GV vào session
  req.session.role = "giangvien";

  return res.redirect("/giangvien/dashboard");
}
  return res.render("auth/login", { error: "Loại tài khoản không hợp lệ!" });
};
module.exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};