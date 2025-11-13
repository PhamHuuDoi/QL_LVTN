const Sinhvien = require("../../models/sinhvien.model");
const GV = require("../../models/giangVien.model");
const path = require("path");
const xlsx = require("xlsx");
const fs = require("fs");
const moment = require("moment");

// [GET] /admin/sinhvien
// [GET] /admin/sinhvien
module.exports.index = async (req, res) => {
  try {
    const { keyword } = req.query;
    let filter = {};

    if (keyword && keyword.trim() !== "") {
      const regex = new RegExp(keyword, "i"); // tìm gần đúng, không phân biệt hoa thường
      filter = {
        $or: [
          { ten: regex },
          { msvv: regex },
          { lop: regex },
          { nganh: regex },
          { group: regex },
          { email: regex },
          { "supervisor.hoten": regex }, // nếu bạn populate GVHD
        ],
      };
    }

    const sinhviens = await Sinhvien.find(filter).populate("supervisor");
    res.render("admin/pages/sinhvien/index", {
      pageTitle: "Danh sách sinh viên",
      sinhviens,
      prefixAdmin: "admin",
      keyword,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/sinhvien");
  }
};

// [GET] /admin/sinhvien/create
module.exports.create = (req, res) => {
  
  res.render("admin/pages/sinhvien/create", {
    pageTitle: "Thêm sinh viên"
  });
};

// [POST] /admin/sinhvien/create
module.exports.createPost = async (req, res) => {
  try {
    await Sinhvien.create(req.body);
    req.flash("success", "Thêm sinh viên thành công!");
    res.redirect("/admin/sinhvien");
  } catch (err) {
    req.flash("error", "Lỗi khi thêm sinh viên: " + err.message);
    res.redirect("back");
  }
};

// [GET] /admin/sinhvien/edit/:id
module.exports.edit = async (req, res) => {
  const sv = await Sinhvien.findById(req.params.id);
  res.render("admin/pages/sinhvien/edit", {
    pageTitle: "Sửa sinh viên",
    sv
  });
};

// [POST] /admin/sinhvien/edit/:id
module.exports.editPost = async (req, res) => {
  try {
    await Sinhvien.updateOne({ _id: req.params.id }, req.body);
    req.flash("success", "Cập nhật sinh viên thành công!");
    res.redirect("/admin/sinhvien");
  } catch (err) {
    req.flash("error", "Lỗi khi cập nhật: " + err.message);
    res.redirect("/admin/sinhvien");
  }
};

// [DELETE] /admin/sinhvien/delete/:id
module.exports.delete = async (req, res) => {
  try {
    await Sinhvien.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: "Xóa sinh viên thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi khi xóa sinh viên!" });
  }
};

// [POST] /admin/sinhvien/import
const removeDiacritics = (str = "") => {
  return str
    .normalize("NFD") // tách dấu
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/\s+/g, " ") // chuẩn hóa khoảng trắng
    .trim()
    .toLowerCase();
};

module.exports.importExcel = async (req, res) => {
  try {
    if (!req.file) {
      req.flash("error", "Vui lòng chọn file Excel!");
      return res.redirect("/admin/sinhvien");
    }

    // Đọc Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const sinhviens = rows.map((r) => {
      // Chuẩn hóa key cột
      const normalized = {};
      for (let key in r) {
        const cleanKey = removeDiacritics(key); // xóa dấu, viết thường
        normalized[cleanKey] = r[key];
      }

      // Ghép họ + tên
      const ho =
        normalized["ho"] ||
        normalized["holot"] ||
        normalized["ho lot"] ||
        normalized["ho va ten dem"] ||
        "";
      const ten = normalized["ten"] || "";
      const hoTen = (ho + " " + ten).trim() || normalized["ho ten"] || "";

      return {
        lop: normalized["lop"] || "",
        msvv: normalized["mssv"] || "",
        nganh: normalized["nganh"] || "",
        ten: hoTen,
        email: normalized["email"] || "",
        group: normalized["nhom"] || "",
      };
    });

    // Lưu dữ liệu
    await Sinhvien.insertMany(sinhviens);
    fs.unlinkSync(req.file.path);

    req.flash("success", "Import danh sách sinh viên thành công!");
    res.redirect("/admin/sinhvien");
  } catch (err) {
    console.error("❌ Lỗi import Excel:", err);
    req.flash("error", "Lỗi khi import Excel!");
    res.redirect("/admin/sinhvien");
  }
};