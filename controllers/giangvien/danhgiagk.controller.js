const SinhVien = require("../../models/sinhVien.model");
const DeTai = require("../../models/detai.model");
const DanhGia = require("../../models/danhGiaGiuaKy.model");


// =============================
// LIST
// =============================
const list = async (req, res) => {
  try {
    const gvId = req.session.user?._id;
    if (!gvId) {
      req.flash("error", "Bạn chưa đăng nhập!");
      return res.redirect("/login");
    }

    const svs = await SinhVien.find({ supervisor: gvId }).lean();
    const detais = await DeTai.find({ giangvien_id: gvId }).lean();
    const danhgias = await DanhGia.find({ giangvien_id: gvId }).lean();

    const rows = svs.map(sv => {
      const detai = detais.find(dt =>
        (dt.sv1 && dt.sv1.toString() === sv._id.toString()) ||
        (dt.sv2 && dt.sv2.toString() === sv._id.toString())
      ) || null;

      const dg = danhgias.find(d => d.sv_id.toString() === sv._id.toString()) || null;

      return { sv, detai, dg };
    });

    res.render("giangvien/pages/danhgiagk/index", { 
      pageTitle: "Đánh giá GK",
      rows,
      success: req.flash("success"),
      error: req.flash("error")
    });

  } catch (err) {
    console.error(err);
    req.flash("error", "Lỗi lấy danh sách đánh giá!");
    res.redirect("/giangvien/dashboard");
  }
};



// =============================
// FORM ĐÁNH GIÁ
// =============================
const form = async (req, res) => {
  try {
    const { svId } = req.params;
    const gvId = req.session.user._id;

    const sv = await SinhVien.findById(svId).lean();
    if (!sv) {
      req.flash("error", "Không tìm thấy sinh viên!");
      return res.redirect("/giangvien/danhgiagk");
    }

    const detai = await DeTai.findOne({
      giangvien_id: gvId,
      $or: [{ sv1: svId }, { sv2: svId }],
    }).lean();

    if (!detai) {
      req.flash("error", "Sinh viên này chưa có đề tài — không thể đánh giá!");
      return res.redirect("/giangvien/danhgiagk");
    }

    const dg = await DanhGia.findOne({ sv_id: svId });

    res.render("giangvien/pages/danhgiagk/form", {
      pageTitle: "Đánh giá giữa kỳ",
      sv,
      detai,
      dg,
      success: req.flash("success"),
      error: req.flash("error")
    });

  } catch (err) {
    console.log("Lỗi:", err);
    req.flash("error", "Lỗi mở form đánh giá!");
    res.redirect("/giangvien/danhgiagk");
  }
};



// =============================
// LƯU ĐÁNH GIÁ
// =============================
const save = async (req, res) => {
  try {
    const { sv_id, detai_id } = req.body;
    const gv_id = req.session.user._id;

    if (!detai_id) {
      req.flash("error", "Sinh viên chưa có đề tài — không thể lưu đánh giá!");
      return res.redirect("/giangvien/danhgiagk");
    }

    const data = {
      sv_id,
      detai_id,
      giangvien_id: gv_id,
      diem: req.body.diem,
      ketqua: req.body.ketqua,
      nhanxet: req.body.nhanxet,
    };

    let dg = await DanhGia.findOne({ sv_id });

    if (!dg) {
      await DanhGia.create(data);
      req.flash("success", "Đã tạo đánh giá giữa kỳ thành công!");
    } else {
      await DanhGia.findByIdAndUpdate(dg._id, data);
      req.flash("success", "Cập nhật đánh giá giữa kỳ thành công!");
    }

    res.redirect("/giangvien/danhgiagk");

  } catch (err) {
    console.log("Lỗi:", err);
    req.flash("error", "Lỗi khi lưu đánh giá!");
    res.redirect("/giangvien/danhgiagk");
  }
};



module.exports = {
  list,
  form,
  save,
};
