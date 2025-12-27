// controllers/admin/hoiDong.controller.js
const HoiDong = require("../../models/hoidong.model");
const ChiTietHoiDong = require("../../models/chitiethoidong.model");
const GiangVien = require("../../models/giangVien.model");

// ===== LIST =====
module.exports.index = async (req, res) => {
  try {
    const hoidongs = await HoiDong.find().lean();
    const rows = [];

    for (const hd of hoidongs) {
      const chitiets = await ChiTietHoiDong.find({ hoidong_id: hd._id })
        .populate("gv_id")
        .lean();

      const chutich = chitiets.find((c) => c.chucvu === "Chủ tịch");
      const thuky = chitiets.find((c) => c.chucvu === "Thư ký");
      const uyviens = chitiets.filter((c) => c.chucvu === "Ủy viên");

      rows.push({
        id: hd._id,
        mahd: hd.tenhd, //dùng tên hd
        chutich,
        thuky,
        uyviens,
        ngaybv: hd.ngaybv,
        phonghd: hd.phonghd,
      });
    }

    res.render("admin/pages/hoidong/index", {
      pageTitle: "Quản lý hội đồng",
      rows,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(" LIST HOI DONG:", err);
    res.redirect("/admin/dashboard");
  }
};

// ===== FORM TẠO =====
module.exports.createForm = async (req, res) => {
  try {
    const gvs = await GiangVien.find().lean();

    res.render("admin/pages/hoidong/form", {
      pageTitle: "Tạo hội đồng",
      gvs,
      hoidong: {},
      chitiets: [],
    });
  } catch (err) {
    console.error(" FORM CREATE HD:", err);
    res.redirect("/admin/hoidong");
  }
};
module.exports.create = async (req, res) => {
  try {
    let { tenhd, mota, ngaybv, phonghd, chutich, thuky, uyviens = [] } = req.body;
    if (!Array.isArray(uyviens)) {
      uyviens = [uyviens];
    }

    // 1️ Tạo hội đồng
    const hd = await HoiDong.create({ tenhd, mota, ngaybv, phonghd });

    const details = [];

    // 2 Chủ tịch
    if (chutich) {
      details.push({
        hoidong_id: hd._id,
        gv_id: chutich,
        chucvu: "Chủ tịch",
      });
    }

    // 3 Thư ký
    if (thuky) {
      details.push({
        hoidong_id: hd._id,
        gv_id: thuky,
        chucvu: "Thư ký",
      });
    }

    // 4️ Ủy viên (mảng)
    if (Array.isArray(uyviens)) {
      uyviens.forEach((gvId) => {
        details.push({
          hoidong_id: hd._id,
          gv_id: gvId,
          chucvu: "Ủy viên",
        });
      });
    }

    if (details.length) {
      await ChiTietHoiDong.insertMany(details);
    }

    req.flash("success", "Tạo hội đồng thành công!");
    res.redirect("/admin/hoidong");
  } catch (err) {
    console.error(" CREATE HD:", err);
    req.flash("error", "Lỗi khi tạo hội đồng!");
    res.redirect("/admin/hoidong/create");
  }
};

// ===== ADD GV VÀO HỘI ĐỒNG =====
module.exports.addGiangVien = async (req, res) => {
  try {
    const { id } = req.params;
    const { gv_id, chucvu } = req.body;

    await ChiTietHoiDong.create({
      hoidong_id: id,
      gv_id,
      chucvu,
    });

    req.flash("success", "Đã thêm giảng viên vào hội đồng!");
  } catch (err) {
    console.error(" ADD GV HD:", err);
    req.flash("error", "GV đã tồn tại trong hội đồng hoặc lỗi dữ liệu!");
  }
  res.redirect(`/admin/hoidong/${req.params.id}`);
};
module.exports.editForm = async (req, res) => {
  const { id } = req.params;

  const hoidong = await HoiDong.findById(id).lean();
  const chitiets = await ChiTietHoiDong.find({ hoidong_id: id })
    .populate("gv_id")
    .lean();

  const gvs = await GiangVien.find().lean();

  res.render("admin/pages/hoidong/form", {
    pageTitle: "Sửa hội đồng",
    isEdit: true,
    hoidong,
    chitiets,
    gvs,
  });
};
module.exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    let { mota, ngaybv, phonghd, chutich, thuky, uyviens = [] } = req.body;
    if (!Array.isArray(uyviens)) {
      uyviens = [uyviens];
    }

    // chỉ update mô tả
    await HoiDong.findByIdAndUpdate(id, {   mota, ngaybv, phonghd });

    // xóa chi tiết cũ
    await ChiTietHoiDong.deleteMany({ hoidong_id: id });

    const details = [];

    if (chutich)
      details.push({ hoidong_id: id, gv_id: chutich, chucvu: "Chủ tịch" });

    if (thuky) details.push({ hoidong_id: id, gv_id: thuky, chucvu: "Thư ký" });

    if (Array.isArray(uyviens)) {
      uyviens.forEach((gvId) => {
        details.push({
          hoidong_id: id,
          gv_id: gvId,
          chucvu: "Ủy viên",
        });
      });
    }

    if (details.length) await ChiTietHoiDong.insertMany(details);

    req.flash("success", "Cập nhật hội đồng thành công!");
    res.redirect("/admin/hoidong");
  } catch (err) {
    console.error(" UPDATE HD:", err);
    req.flash("error", "Lỗi khi cập nhật!");
    res.redirect(`/admin/hoidong/${req.params.id}/edit`);
  }
};
// ===== DELETE =====
module.exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    await ChiTietHoiDong.deleteMany({ hoidong_id: id });
    await HoiDong.findByIdAndDelete(id);

    req.flash("success", "Đã xóa hội đồng!");
  } catch (err) {
    console.error(" DELETE HD:", err);
    req.flash("error", "Lỗi khi xóa hội đồng!");
  }
  res.redirect("/admin/hoidong");
};
