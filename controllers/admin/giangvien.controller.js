// controllers/admin/giangvien.controller.js
const GV = require("../../models/giangVien.model");
const Account = require("../../models/acount.model");
const md5 = require("md5");
const xlsx = require("xlsx");
const fs = require("fs");

// Hàm loại bỏ dấu tiếng Việt
const removeDiacritics = (str = "") => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

// [GET] /admin/giangvien
module.exports.index = async (req, res) => {
  try {
    const { keyword } = req.query;
    let filter = {};

    if (keyword && keyword.trim() !== "") {
      const regex = new RegExp(keyword, "i");
      filter = {
        $or: [
          { hoten: regex },
          { magv: regex },
          { email: regex },
          { roles: regex },
        ],
      };
    }

    const giangviens = await GV.find(filter);

    res.render("admin/pages/giangvien/index", {
      pageTitle: "Danh sách giảng viên",
      giangviens,
      prefixAdmin: "admin",
      keyword,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/giangvien");
  }
};

// [GET] /admin/giangvien/create
module.exports.create = (req, res) => {
  res.render("admin/pages/giangvien/create", {
    pageTitle: "Thêm giảng viên",
    prefixAdmin: "admin",
  });
};

// [POST] /admin/giangvien/create
module.exports.createPost = async (req, res) => {
  try {
    const newGV = await GV.create(req.body);

    await Account.create({
      username: newGV.magv,
      password: md5(newGV.magv),
      role: "giangvien",
      giangvienId: newGV._id
    });

    req.flash("success", "Thêm giảng viên + tài khoản thành công!");
    res.redirect("/admin/giangvien");
  } catch (err) {
    console.error(err);
    req.flash("error", "Lỗi khi tạo giảng viên!");
    res.redirect("/admin/giangvien");
  }
};

// [GET] /admin/giangvien/edit/:id
module.exports.edit = async (req, res) => {
  const gv = await GV.findById(req.params.id);
  res.render("admin/pages/giangvien/edit", {
    pageTitle: "Sửa giảng viên",
    gv,
  });
};

// [POST] /admin/giangvien/edit/:id
module.exports.editPost = async (req, res) => {
  try {
    await GV.updateOne({ _id: req.params.id }, req.body);
    req.flash("success", "Cập nhật giảng viên thành công!");
    res.redirect("/admin/giangvien");
  } catch (err) {
    req.flash("error", "Lỗi khi cập nhật: " + err.message);
    res.redirect("/admin/giangvien");
  }
};

// [DELETE] /admin/giangvien/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const gvId = req.params.id;

    // Xóa giảng viên
    await GV.deleteOne({ _id: gvId });

    // Xóa luôn tài khoản tương ứng
    await Account.deleteOne({ giangvienId: gvId });

    res.json({ success: true, message: "Xóa giảng viên + tài khoản thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi khi xóa giảng viên!" });
  }
};

// [POST] /admin/giangvien/import
module.exports.importExcel = async (req, res) => {
  try {
    if (!req.file) {
      req.flash("error", "Vui lòng chọn file Excel!");
      return res.redirect("/admin/giangvien");
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const giangviens = [];

    for (const r of rows) {
      const normalized = {};
      for (let key in r) {
        const cleanKey = removeDiacritics(key);
        normalized[cleanKey] = r[key];
      }

      const ho =
        normalized["ho"] ||
        normalized["holot"] ||
        normalized["ho lot"] ||
        normalized["ho va ten dem"] ||
        "";
      const ten = normalized["ten"] || "";
      const hoTen = (ho + " " + ten).trim() || normalized["ho ten"] || "";

      const magv = normalized["magv"] || normalized["ma giang vien"] || "";
      const email = normalized["email"] || "";

      // Tạo giảng viên
      const newGV = await GV.create({ magv, hoten: hoTen, email });

      // Tạo tài khoản tương ứng
      await Account.create({
        username: magv,
        password: md5(magv),
        role: "giangvien",
        giangvienId: newGV._id,
      });

      giangviens.push(newGV);
    }

    fs.unlinkSync(req.file.path);
    req.flash("success", "Import danh sách giảng viên + tạo tài khoản thành công!");
    res.redirect("/admin/giangvien");
  } catch (err) {
    console.error("❌ Lỗi import Excel:", err);
    req.flash("error", "Lỗi khi import Excel!");
    res.redirect("/admin/giangvien");
  }
};