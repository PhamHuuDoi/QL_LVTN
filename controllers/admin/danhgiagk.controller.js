const DanhGia = require("../../models/danhGiaGiuaKy.model");
const SinhVien = require("../../models/sinhVien.model");
const DeTai = require("../../models/detai.model");
const GiangVien = require("../../models/giangVien.model");

// =============================
// LIST
// =============================
module.exports.list = async (req, res) => {
  try {
    const danhgias = await DanhGia.find()
      .populate("sv_id")
      .populate("detai_id")
      .populate("giangvien_id")
      .lean();

    res.render("admin/pages/danhgiagk/index", {
      pageTitle: "Danh sách đánh giá giữa kỳ",
      danhgias,
    });
  } catch (err) {
    console.log(" Lỗi load list:", err);
    res.status(500).send("Lỗi tải danh sách");
  }
};

// =============================
// DETAIL
// =============================
module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id;

    const dg = await DanhGia.findById(id)
      .populate("sv_id")
      .populate("detai_id")
      .populate("giangvien_id")
      .lean();

    if (!dg) {
      req.flash("error", "Không tìm thấy đánh giá!");
      return res.redirect("/admin/danhgiagk");
    }

    res.render("admin/pages/danhgiagk/detail", {
      pageTitle: "Chi tiết đánh giá giữa kỳ",
      dg,
    });

  } catch (err) {
    console.log(" Lỗi detail:", err);
    req.flash("error", "Lỗi xem chi tiết!");
    res.redirect("/admin/danhgiagk");
  }
};
