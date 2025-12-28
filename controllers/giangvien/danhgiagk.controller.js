const SinhVien = require("../../models/sinhVien.model");
const DeTai = require("../../models/detai.model");
const DanhGia = require("../../models/danhGiaGiuaKy.model");
const DiemHuongDan = require("../../models/diemHuongDan.model");
const DiemPhanBien = require("../../models/diemPhanBien.model");
const PhanCongPhanBien = require("../../models/phancongphanbien.model");

// LIST

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
    const diemHDs = await DiemHuongDan.find({}).lean();
    const diemPBs = await DiemPhanBien.find({}).lean();

    const filter = req.query.filter || "all";

    const rows = svs.map((sv) => {
      // Tìm đề tài của sinh viên
      const detai =
        detais.find(
          (dt) =>
            (dt.sv1 && dt.sv1.toString() === sv._id.toString()) ||
            (dt.sv2 && dt.sv2.toString() === sv._id.toString())
        ) || null;

      // Tìm đánh giá giữa kỳ
      const dg =
        danhgias.find((d) => d.sv_id.toString() === sv._id.toString()) || null;

      // ==== KIỂM TRA ĐIỂM HƯỚNG DẪN ====
      // Tìm điểm HD của CHÍNH SINH VIÊN NÀY
      const diemHD = diemHDs.find(
        (d) => d.sv_id && d.sv_id.toString() === sv._id.toString()
      );
      const hasDiemHD = diemHD !== undefined && diemHD.tongDiem > 0;

      // ==== KIỂM TRA ĐIỂM PHẢN BIỆN ====
      let hasDiemPB = false;
      // Tìm điểm PB của CHÍNH SINH VIÊN NÀY
      const diemPB = diemPBs.find(
        (d) => d.sv_id && d.sv_id.toString() === sv._id.toString()
      );

      if (diemPB) {
        // Kiểm tra sinh viên có trong điểm PB không
        if (
          diemPB.sv1 &&
          diemPB.sv1.sv_id &&
          diemPB.sv1.sv_id.toString() === sv._id.toString()
        ) {
          hasDiemPB = diemPB.sv1.tongDiem > 0 || diemPB.sv1.phanTichVanDe > 0;
        } else if (
          diemPB.sv2 &&
          diemPB.sv2.sv_id &&
          diemPB.sv2.sv_id.toString() === sv._id.toString()
        ) {
          hasDiemPB = diemPB.sv2.tongDiem > 0 || diemPB.sv2.phanTichVanDe > 0;
        }
      }

      // XÁC ĐỊNH TRẠNG THÁI NÚT
      let buttonType = "create";

      if (dg) {
        // ĐÃ CÓ ĐÁNH GIÁ
        if (hasDiemHD || hasDiemPB) {
          buttonType = "view"; // Đã có điểm → chỉ xem
        } else {
          buttonType = "edit"; // Chưa có điểm → sửa
        }
      }

      return {
        sv,
        detai,
        dg,
        buttonType,
      };
    });

    // Lọc theo filter
    let filteredRows = rows;
    if (filter === "dadanhgia") {
      filteredRows = rows.filter((row) => row.dg);
    } else if (filter === "chua") {
      filteredRows = rows.filter((row) => !row.dg);
    }

    // Sắp xếp theo nhóm
    filteredRows.sort((a, b) => {
      const groupA = a.sv.group || "";
      const groupB = b.sv.group || "";
      return groupA.localeCompare(groupB);
    });

    res.render("giangvien/pages/danhgiagk/index", {
      pageTitle: "Đánh giá GK",
      rows: filteredRows,
      filter,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error("Lỗi list:", err);
    req.flash("error", "Lỗi lấy danh sách đánh giá!");
    res.redirect("/giangvien/dashboard");
  }
};

// FORM ĐÁNH GIÁ HOẶC XEM CHI TIẾT
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

    const dg = await DanhGia.findOne({ sv_id: svId }).lean();

    // Kiểm tra có điểm hướng dẫn không
    const hasDiemHD = await DiemHuongDan.exists({
      sv_id: svId,
    });

    // Kiểm tra có điểm phản biện không
    let hasDiemPB = false;

    // Tìm điểm phản biện của sinh viên này
    const diemPB = await DiemPhanBien.findOne({
      $or: [{ "sv1.sv_id": svId }, { "sv2.sv_id": svId }],
    }).lean();

    if (diemPB) {
      // Kiểm tra sinh viên này có trong điểm phản biện và đã có điểm
      if (
        diemPB.sv1 &&
        diemPB.sv1.sv_id &&
        diemPB.sv1.sv_id.toString() === svId
      ) {
        hasDiemPB = diemPB.sv1.tongDiem > 0 || diemPB.sv1.phanTichVanDe > 0;
      } else if (
        diemPB.sv2 &&
        diemPB.sv2.sv_id &&
        diemPB.sv2.sv_id.toString() === svId
      ) {
        hasDiemPB = diemPB.sv2.tongDiem > 0 || diemPB.sv2.phanTichVanDe > 0;
      }
    }

    // Xác định mode
    const isViewMode = hasDiemHD || hasDiemPB; // đã có điểm → chỉ xem
    const hasEvaluation = !!dg; // đã có đánh giá

    // DEBUG
    console.log(
      `SV: ${svId}, hasDiemHD: ${hasDiemHD}, hasDiemPB: ${hasDiemPB}, isViewMode: ${isViewMode}`
    );

    res.render("giangvien/pages/danhgiagk/form", {
      pageTitle: isViewMode
        ? "Xem đánh giá giữa kỳ"
        : hasEvaluation
        ? "Sửa đánh giá"
        : "Đánh giá giữa kỳ",
      sv,
      detai,
      dg,
      isViewMode,
      hasEvaluation,
      hasDiemHD, // <-- THÊM VÀO
      hasDiemPB, // <-- THÊM VÀO
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.log("Lỗi form:", err);
    req.flash("error", "Lỗi mở form đánh giá!");
    res.redirect("/giangvien/danhgiagk");
  }
};

// LƯU ĐÁNH GIÁ
const save = async (req, res) => {
  try {
    const { sv_id, detai_id } = req.body;
    const gv_id = req.session.user._id;

    // Kiểm tra có điểm hướng dẫn không
    const hasDiemHD = await DiemHuongDan.exists({
      sv_id: sv_id,
      giangvien_id: gv_id,
    });

    // Kiểm tra có điểm phản biện không
    let hasDiemPB = false;

    // Tìm phân công phản biện cho đề tài này
    const phanCongPB = await PhanCongPhanBien.findOne({
      detai_id: detai_id,
      gvphanbien_id: gv_id,
    }).lean();

    if (phanCongPB) {
      const diemPB = await DiemPhanBien.findOne({
        phancongphanbien_id: phanCongPB._id,
      }).lean();

      if (diemPB) {
        // Kiểm tra sinh viên này có điểm phản biện chưa
        const detai = await DeTai.findById(detai_id).lean();
        if (detai) {
          if (detai.sv1 && detai.sv1.toString() === sv_id) {
            hasDiemPB =
              diemPB.sv1 &&
              (diemPB.sv1.tongDiem > 0 || diemPB.sv1.phanTichVanDe > 0);
          } else if (detai.sv2 && detai.sv2.toString() === sv_id) {
            hasDiemPB =
              diemPB.sv2 &&
              (diemPB.sv2.tongDiem > 0 || diemPB.sv2.phanTichVanDe > 0);
          }
        }
      }
    }

    // Nếu đã có điểm thì không cho sửa
    if (hasDiemHD || hasDiemPB) {
      req.flash(
        "error",
        "Không thể chỉnh sửa vì sinh viên đã có điểm hướng dẫn/phản biện!"
      );
      return res.redirect(`/giangvien/danhgiagk/form/${sv_id}`);
    }

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
    console.log("Lỗi save:", err);
    req.flash("error", "Lỗi khi lưu đánh giá!");
    res.redirect("/giangvien/danhgiagk");
  }
};

module.exports = {
  list,
  form,
  save,
};
