const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

const DeTai = require("../../models/detai.model");
const SinhVien = require("../../models/sinhVien.model");

const DanhGia = require("../../models/danhGiaGiuaKy.model"); 
// LIST
const list = async (req, res) => {
  try {
    let gvId = req.session.user?._id;
    if (!gvId) {
      req.flash("error", "Không xác định được giảng viên!");
      return res.redirect("/giangvien/detai");
    }

    gvId = gvId.toString();
    const filter = req.query.filter || "all";

    // 1. Lấy tất cả sinh viên của giảng viên này
    let svs = await SinhVien.find({ supervisor: gvId }).lean();
    // Loại bỏ sinh viên không có nhóm
    svs = svs.filter((sv) => sv.group && sv.group.trim() !== "");
    // 2. Nhóm sinh viên theo nhóm
    const groups = {};
    svs.forEach((sv) => {
      const g = sv.group || "Không có nhóm";
      if (!groups[g]) groups[g] = [];
      groups[g].push(sv);
    });

    // 3. Lấy tất cả đề tài của giảng viên này
    const detais = await DeTai.find({ giangvien_id: gvId })
      .populate({ path: "sv1", model: "Sinhvien" })
      .populate({ path: "sv2", model: "Sinhvien" })
      .lean();

    // 4. Lấy tất cả đánh giá giữa kỳ của giảng viên này
    const danhgias = await DanhGia.find({ giangvien_id: gvId }).lean();

    const rows = [];

    // 5. Duyệt qua từng nhóm để tìm đề tài CHÍNH XÁC
    for (const groupName in groups) {
      const students = groups[groupName];
      const sv1 = students[0] || null;
      const sv2 = students[1] || null;

      // Tìm đề tài CHÍNH XÁC cho nhóm này
      let detai = null;
      let hasDanhGia = false; // Biến kiểm tra có đánh giá GK chưa

      if (sv1 && sv2) {
        // Nhóm có 2 sinh viên: tìm đề tài có cả 2
        detai = detais.find(
          (dt) =>
            (dt.sv1 &&
              dt.sv1._id.toString() === sv1._id.toString() &&
              dt.sv2 &&
              dt.sv2._id.toString() === sv2._id.toString()) ||
            (dt.sv1 &&
              dt.sv1._id.toString() === sv2._id.toString() &&
              dt.sv2 &&
              dt.sv2._id.toString() === sv1._id.toString())
        );

        // Kiểm tra cả 2 sinh viên đã có đánh giá GK chưa
        if (detai) {
          const sv1HasDanhGia = danhgias.some(
            (d) => d.sv_id && d.sv_id.toString() === sv1._id.toString()
          );
          const sv2HasDanhGia = danhgias.some(
            (d) => d.sv_id && d.sv_id.toString() === sv2._id.toString()
          );
          // Nếu 1 trong 2 sinh viên đã có đánh giá thì không cho sửa đề tài
          hasDanhGia = sv1HasDanhGia || sv2HasDanhGia;
        }
      } else if (sv1) {
        // Nhóm chỉ có 1 sinh viên: tìm đề tài có sv1
        detai = detais.find(
          (dt) =>
            (dt.sv1 && dt.sv1._id.toString() === sv1._id.toString()) ||
            (dt.sv2 && dt.sv2._id.toString() === sv1._id.toString())
        );

        // Kiểm tra sinh viên đã có đánh giá GK chưa
        if (detai) {
          hasDanhGia = danhgias.some(
            (d) => d.sv_id && d.sv_id.toString() === sv1._id.toString()
          );
        }
      }

      // Nếu không tìm thấy đề tài chính xác, để null
      if (!detai) {
        detai = null;
      }

      rows.push({
        group: groupName,
        sv1,
        sv2,
        detai,
        hasDanhGia, // true = đã có đánh giá GK, false = chưa có
      });
    }

    let filteredRows = rows;
    if (filter === "hasDetai") {
      filteredRows = rows.filter((row) => row.detai);
    } else if (filter === "noDetai") {
      filteredRows = rows.filter((row) => !row.detai);
    }

    res.render("giangvien/pages/detai/index", {
      pageTitle: "Quản lý Đề tài",
      rows: filteredRows,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(" Lỗi list:", err);
    req.flash("error", "Có lỗi xảy ra khi tải danh sách!");
    res.redirect("/giangvien/detai");
  }
};
// FORM CREATE

const formCreate = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const gvId = req.session.user?._id;
    const group = req.query.group;

    if (!group) {
      req.flash("error", "Thiếu thông tin nhóm!");
      return res.redirect("/giangvien/detai");
    }

    const students = await SinhVien.find({ supervisor: gvId, group }).lean();

    const sv1 = students[0] || null;
    const sv2 = students[1] || null;

    res.render("giangvien/pages/detai/create", {
      pageTitle: "Tạo đề tài",
      group,
      sv1,
      sv2,
      today,
      gv: req.session.user,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(" Lỗi form create:", err);
    req.flash("error", "Không thể mở form tạo đề tài!");
    res.redirect("/giangvien/detai");
  }
};

// =============================
// CREATE
// =============================
const create = async (req, res) => {
  try {
    const gvId = req.session.user?._id;

    await DeTai.create({
      ten: req.body.ten,
      mota: req.body.mota,
      nhiemvu: req.body.nhiemvu?.split("\n") || [],
      giangvien_id: gvId,
      sv1: req.body.sv1,
      sv2: req.body.sv2 || null,
      ngaygiao: req.body.ngaygiao || null,
      ngayhoanthanh: req.body.ngayhoanthanh || null,
      trangthai: "Đang hướng dẫn",
    });

    req.flash("success", "Tạo đề tài thành công!");
    res.redirect("/giangvien/detai");
  } catch (err) {
    console.error(" Lỗi tạo:", err);
    req.flash("error", "Không thể tạo đề tài!");
    res.redirect("/giangvien/detai");
  }
};

// =============================
// FORM EDIT
// =============================
const formEdit = async (req, res) => {
  try {
    const id = req.params.id;

    const detai = await DeTai.findById(id)
      .populate({ path: "sv1", model: "Sinhvien" })
      .populate({ path: "sv2", model: "Sinhvien" })
      .populate({ path: "giangvien_id", model: "Giangvien" })
      .lean();

    if (!detai) {
      req.flash("error", "Không tìm thấy đề tài!");
      return res.redirect("/giangvien/detai");
    }

    res.render("giangvien/pages/detai/edit", {
      pageTitle: "Sửa đề tài",
      detai,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(" Lỗi form edit:", err);
    req.flash("error", "Không thể mở form chỉnh sửa!");
    res.redirect("/giangvien/detai");
  }
};

// =============================
// UPDATE
// =============================
const update = async (req, res) => {
  try {
    await DeTai.findByIdAndUpdate(req.params.id, {
      ten: req.body.ten,
      mota: req.body.mota,
      nhiemvu: req.body.nhiemvu?.split("\n") || [],
      ngaygiao: req.body.ngaygiao,
      ngayhoanthanh: req.body.ngayhoanthanh,
      trangthai: req.body.trangthai,
    });

    req.flash("success", "Cập nhật đề tài thành công!");
    res.redirect("/giangvien/detai");
  } catch (err) {
    console.error("Lỗi update:", err);
    req.flash("error", "Cập nhật thất bại!");
    res.redirect("/giangvien/detai");
  }
};

// =============================
// DETAIL
// =============================
const detail = async (req, res) => {
  try {
    const detai = await DeTai.findById(req.params.id)
      .populate({ path: "sv1", model: "Sinhvien" })
      .populate({ path: "sv2", model: "Sinhvien" })
      .populate({ path: "giangvien_id", model: "Giangvien" })
      .lean();

    if (!detai) {
      req.flash("error", "Không tìm thấy đề tài!");
      return res.redirect("/giangvien/detai");
    }

    res.render("giangvien/pages/detai/detail", {
      pageTitle: "Chi tiết Đề tài",
      detai,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(" Lỗi chi tiết:", err);
    req.flash("error", "Không thể xem chi tiết đề tài!");
    return res.redirect("/giangvien/detai");
  }
};

// =============================
// EXPORT WORD
// =============================
const exportWord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "ID đề tài không hợp lệ!");
      return res.redirect("/giangvien/detai");
    }

    const detai = await DeTai.findById(id)
      .populate("sv1 sv2 giangvien_id")
      .lean();

    if (!detai) {
      req.flash("error", "Không tìm thấy đề tài!");
      return res.redirect("/giangvien/detai");
    }

    const templatePath = path.join(
      __dirname,
      "../../templates/NhiemVuDeTai.docx"
    );

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    // 🔥 FIX CHÍNH Ở ĐÂY
    const doc = new Docxtemplater(zip, {
      delimiters: { start: "<<", end: ">>" },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });

    doc.setData({
      ten_detai: detai.ten,
      mota: detai.mota || "",
      nhiemvu_list: detai.nhiemvu?.length
        ? "• " + detai.nhiemvu.join("\n• ")
        : "",
      gv_name: detai.giangvien_id?.hoten,
      gv_magv: detai.giangvien_id?.magv,
      sv1_name: detai.sv1?.ten,
      sv1_mssv: detai.sv1?.msvv,
      sv1_lop: detai.sv1?.lop,
      sv1_nganh: detai.sv1?.nganh,
      sv2_name: detai.sv2?.ten || "",
      sv2_mssv: detai.sv2?.msvv || "",
      sv2_lop: detai.sv2?.lop || "",
      sv2_nganh: detai.sv2?.nganh || "",
      ngay_giao: detai.ngaygiao
        ? detai.ngaygiao.toLocaleDateString("vi-VN")
        : "",
      ngay_hoanthanh: detai.ngayhoanthanh
        ? detai.ngayhoanthanh.toLocaleDateString("vi-VN")
        : "",
    });

    doc.render();

    const buffer = doc.getZip().generate({ type: "nodebuffer" });
    const mssv1 = detai.sv1?.msvv || "unknown";
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Detai_${mssv1}.docx`
    );
    res.send(buffer);
  } catch (err) {
    console.error(" Lỗi export:", err);
    req.flash("error", "Xuất file thất bại!");
    res.redirect("/giangvien/detai");
  }
};

module.exports = {
  list,
  formCreate,
  create,
  formEdit,
  update,
  detail,
  exportWord,
};
