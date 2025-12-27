const DsNhomHoiDong = require("../../models/dsnhomHd.model");
const SinhVien = require("../../models/sinhVien.model");
const DeTai = require("../../models/detai.model");
const tinhVaLuuKetQua = require("../../utils/tinhkq");
// ===== INDEX =====
module.exports.index = async (req, res) => {
  try {
    const gvId = req.session.user._id;

    // lấy các phân công hội đồng
    const pcs = await DsNhomHoiDong.find()
      .populate("hd_id")
      .populate("sv1")
      .populate("sv2")
      .populate("detai_id")
      .lean();

    const rows = [];

    pcs.forEach((pc) => {
      // chỉ lấy SV do GV này hướng dẫn
      if (pc.sv1 && pc.sv1.supervisor?.toString() === gvId.toString()) {
        rows.push({
          pcId: pc._id,
          group: pc.sv1.group,
          sv: pc.sv1,
          svKey: "sv1",
          detai: pc.detai_id,
          hoidong: pc.hd_id,
          diem: pc.tongDiemSv1,
        });
      }

      if (pc.sv2 && pc.sv2.supervisor?.toString() === gvId.toString()) {
        rows.push({
          pcId: pc._id,
          group: pc.sv2.group,
          sv: pc.sv2,
          svKey: "sv2",
          detai: pc.detai_id,
          hoidong: pc.hd_id,
          diem: pc.tongDiemSv2,
        });
      }
    });
    const filter = req.query.filter || "all";
    let filteredRows = rows;
    if (filter === "yes") {
      filteredRows = rows.filter((r) => r.diem && r.diem > 0);
    } else if (filter === "no") {
      filteredRows = rows.filter((r) => !r.diem || r.diem === 0);
    }
    // Sắp xếp theo nhóm
    filteredRows.sort((a, b) => {
      const groupA = a.sv.group || "";
      const groupB = b.sv.group || "";
      return groupA.localeCompare(groupB);
    });

    res.render("giangvien/pages/diemhoidong/index", {
      pageTitle: "Nhập điểm hội đồng",
      rows: filteredRows,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(" INDEX DIEM HD:", err);
    res.redirect("/giangvien/dashboard");
  }
};

// ===== SAVE INLINE =====
module.exports.saveInline = async (req, res) => {
  try {
    const { pcId, svKey } = req.params;
    const { diem } = req.body;

    const field = svKey === "sv1" ? "tongDiemSv1" : "tongDiemSv2";

    const rs = await DsNhomHoiDong.findByIdAndUpdate(
      pcId,
      { [field]: Number(diem) || 0 },
      { new: true }
    );

    // ✅ TÍNH & LƯU KẾT QUẢ NGAY
    await tinhVaLuuKetQua.tinhVaLuuKetQua(pcId);

    //console.log("✅ AFTER UPDATE:", rs);

    req.flash("success", "Đã lưu điểm!");
    res.redirect("/giangvien/diemhoidong");
  } catch (err) {
    console.error(" SAVE DIEM HD:", err);
    req.flash("error", "Lỗi khi lưu điểm!");
    res.redirect("/giangvien/diemhoidong");
  }
};
