const DeTai = require("../../models/detai.model");
const SinhVien = require("../../models/sinhVien.model");
const list = async (req, res) => {
  try {
    const detais = await DeTai.find()
      .populate({ path: "sv1", model: "Sinhvien" })
      .populate({ path: "sv2", model: "Sinhvien" })
      .populate({ path: "giangvien_id", model: "Giangvien" })
      .lean();
    // sắp xếp theo nhóm của sv1 hoặc sv2
    detais.sort((a, b) => {
      const groupA = a.sv1 ? a.sv1.group : (a.sv2 ? a.sv2.group : "");
      const groupB = b.sv1 ? b.sv1.group : (b.sv2 ? b.sv2.group : "");
      return groupA.localeCompare(groupB);
    });
    res.render("admin/pages/detai/index", {
      pageTitle: "Danh sách đề tài",
      detais,
      success: req.flash("success"),
      error: req.flash("error"),
    });

  } catch (err) {
    console.error(" Lỗi lấy danh sách đề tài:", err);
    req.flash("error", "Không thể tải danh sách đề tài!");
    res.redirect("/admin/dashboard");
  }
};
const detail = async (req, res) => {
  try {
    const detai = await DeTai.findById(req.params.id)
      .populate({ path: "sv1", model: "Sinhvien" })
      .populate({ path: "sv2", model: "Sinhvien" })
      .populate({ path: "giangvien_id", model: "Giangvien" })
      .lean();

    if (!detai) {
      req.flash("error", "Không tìm thấy đề tài!");
      return res.redirect("/admin/detai");
    }

    res.render("admin/pages/detai/detail", {
      pageTitle: "Chi tiết đề tài",
      detai,
    });

  } catch (err) {
    console.log("❌ Lỗi detail:", err);
    req.flash("error", "Không thể xem chi tiết đề tài!");
    res.redirect("/admin/detai");
  }
};

module.exports = {
  list,
  detail,
};
