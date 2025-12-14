const DeTai = require("../../models/detai.model");
const GiangVien = require("../../models/giangVien.model");
const PhanCongPB = require("../../models/phanCongPhanBien.model");

module.exports.index = async (req, res) => {
  try {
    const detais = await DeTai.find()
      .populate({ path: "sv1", model: "Sinhvien" })
      .populate({ path: "sv2", model: "Sinhvien" })
      .populate({ path: "giangvien_id", model: "Giangvien" })
      .lean();

    const giangviens = await GiangVien.find().lean();
    const phanbiens = await PhanCongPB.find()
      .populate({ path: "gvphanbien_id", model: "Giangvien" })
      .lean();

    // Gắn phân công PB & group cho từng đề tài
    detais.forEach(dt => {
      // Lấy phân công PB nếu có
      dt.phanbien = phanbiens.find(
        pb => pb.detai_id.toString() === dt._id.toString()
      ) || null;

      // trả về nhóm
      dt.group = dt.sv1?.group || dt.sv2?.group || "—";

      // Dropdown GV PB (loại GVHD)
      dt.availablePB = giangviens.filter(gv =>
        gv._id.toString() !== dt.giangvien_id?._id?.toString()
      );
    });

    res.render("admin/pages/phancongphanbien/index", {
      pageTitle: "Phân công phản biện",
      detais,
      success: req.flash("success"),
      error: req.flash("error"),
    });

  } catch (err) {
    console.error("❌ Lỗi list:", err);
    req.flash("error", "Không tải được danh sách phân công!");
    res.redirect("/admin");
  }
};



// =============================
// XỬ LÝ PHÂN CÔNG / CẬP NHẬT PHẢN BIỆN
// =============================
module.exports.assign = async (req, res) => {
  try {
    const { detai_id, gvphanbien_id } = req.body;

    if (!gvphanbien_id || !detai_id) {
      return res.json({ success: false, message: "Thiếu dữ liệu!" });
    }

    // Kiểm tra đã có phân công chưa
    let existed = await PhanCongPB.findOne({ detai_id });

    if (existed) {
      // 🔄 Cập nhật giảng viên PB
      existed.gvphanbien_id = gvphanbien_id;
      await existed.save();
    } else {
      // ➕ Tạo mới nếu chưa có
      existed = await PhanCongPB.create({ detai_id, gvphanbien_id });
    }

    // Đảm bảo GV mới có role "phanbien"
    const gv = await GiangVien.findById(gvphanbien_id);
    if (gv && !gv.roles.includes("phanbien")) {
      gv.roles.push("phanbien");
      await gv.save();
    }

    return res.json({
      success: true,
      message: "Cập nhật phân công phản biện thành công!"
    });

  } catch (err) {
    console.error("❌ Lỗi assign:", err);
    return res.json({
      success: false,
      message: "Không thể phân công!"
    });
  }
};
