const SinhVien = require("../../models/sinhVien.model");
const GiangVien = require("../../models/giangVien.model");

// [GET] /admin/phancong
module.exports.index = async (req, res) => {
  try {
    // Lấy tất cả SV (có populate giáo viên hiện tại nếu có)
    const sinhviens = await SinhVien.find().populate("supervisor");

    // Lấy danh sách GV để đổ combobox
    const giangviens = await GiangVien.find();

    res.render("admin/pages/phancong/index", {
      pageTitle: "Phân công hướng dẫn",
      prefixAdmin: "admin",
      sinhviens,
      giangviens,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(err);
    res.redirect("/admin");
  }
};

// [POST] /admin/phancong/assign
module.exports.assign = async (req, res) => {
  try {
    const { svid, gvid } = req.body;

    // Tìm sinh viên được chọn
    const sv = await SinhVien.findById(svid);
    if (!sv) return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên!" });

    // Lấy nhóm của sinh viên
    const group = sv.group;

    // Cập nhật supervisor cho tất cả sinh viên trong cùng nhóm
    await SinhVien.updateMany({ group }, { supervisor: gvid });

    // Cập nhật role giảng viên
    const gv = await GiangVien.findById(gvid);
    if (gv) {
    const roles = Array.isArray(gv.roles) ? gv.roles : [];
    if (!roles.includes("huongdan")) {
        roles.push("huongdan");
        gv.roles = roles;
        await gv.save();
    }
}

    res.json({ success: true, message: `✅ Đã phân công giảng viên cho nhóm ${group}` });
  } catch (err) {
    console.error("❌ Lỗi phân công:", err);
    res.status(500).json({ success: false, message: "Lỗi khi phân công!" });
  }
};
