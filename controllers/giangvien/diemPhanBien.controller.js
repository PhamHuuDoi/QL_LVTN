const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

const PhanCongPB = require("../../models/phancongphanbien.model");
const DiemPB = require("../../models/diemPhanBien.model");

// helper tick
const tick = (val, expect) => (val === expect ? "☑" : "☐");

// =============================
// LIST
// =============================
module.exports.list = async (req, res) => {
  try {
    const gvId = req.session.user?._id;

    if (!gvId) {
      req.flash("error", "Bạn chưa đăng nhập!");
      return res.redirect("/login");
    }

    const pcs = await PhanCongPB.find({ gvphanbien_id: gvId })
      .populate({
        path: "detai_id",
        populate: [
          { path: "sv1", model: "Sinhvien" },
          { path: "sv2", model: "Sinhvien" },
          { path: "giangvien_id", model: "Giangvien" },
        ],
      })
      .lean();

    const rows = [];
    for (const pc of pcs) {
      if (!pc.detai_id) continue;

      const dt = pc.detai_id;

      // lấy group từ SV
      const group = dt.sv1?.group || dt.sv2?.group || "—";

      // console.log("SV1 group:", dt.sv1?.group);
      // console.log("SV2 group:", dt.sv2?.group);
      const dpb = await DiemPB.findOne({
        phancongphanbien_id: pc._id,
      }).lean();

      rows.push({
        pc,
        detai: { ...dt, group },
        dpb,
      });
    }

    res.render("giangvien/pages/diemphanbien/index", {
      pageTitle: "Nhập điểm phản biện",
      rows,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(" LIST PB:", err);
    req.flash("error", "Lỗi tải danh sách phản biện!");
    res.redirect("/giangvien/dashboard");
  }
};

// =============================
// FORM
// =============================
module.exports.form = async (req, res) => {
  try {
    const { pcId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pcId)) {
      req.flash("error", "ID phân công không hợp lệ!");
      return res.redirect("/giangvien/diemphanbien");
    }

    const pc = await PhanCongPB.findById(pcId)
      .populate({
        path: "detai_id",
        populate: [
          { path: "sv1", model: "Sinhvien" },
          { path: "sv2", model: "Sinhvien" },
          { path: "giangvien_id", model: "Giangvien" },
        ],
      })
      .lean();

    if (!pc) {
      req.flash("error", "Không tìm thấy phân công phản biện!");
      return res.redirect("/giangvien/diemphanbien");
    }

    const dpb = await DiemPB.findOne({
      phancongphanbien_id: pcId,
    }).lean();

    res.render("giangvien/pages/diemphanbien/form", {
      pageTitle: "Nhập điểm phản biện",
      pc,
      detai: pc.detai_id,
      dpb,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error("❌ FORM PB:", err);
    req.flash("error", "Không mở được form phản biện!");
    res.redirect("/giangvien/diemphanbien");
  }
};

// =============================
// SAVE
// =============================
module.exports.save = async (req, res) => {
  try {
    const { phancongphanbien_id } = req.body;

    if (!phancongphanbien_id) {
      req.flash("error", "Thiếu ID phân công!");
      return res.redirect("back");
    }

    const data = {
      phancongphanbien_id,

      nhanXetChung: req.body.nhanXetChung || "Đạt",
      yeuCauDieuChinh: req.body.yeuCauDieuChinh || "",
      uuDiem: req.body.uuDiem || "",
      thieuSot: req.body.thieuSot || "",
      cauHoiHoiDong: req.body.cauHoiHoiDong?.split("\n") || [],
      // 👉 gộp lại thành mảng chung

      sv1: {
        phanTichVanDe: Number(req.body.sv1_phanTichVanDe || 0),
        thietKeVanDe: Number(req.body.sv1_thietKeVanDe || 0),
        hienThucVanDe: Number(req.body.sv1_hienThucVanDe || 0),
        kiemTraSanPham: Number(req.body.sv1_kiemTraSanPham || 0),

        deNghi: req.body.sv1_deNghi || "Được bảo vệ",
      },

      sv2: {
        phanTichVanDe: Number(req.body.sv2_phanTichVanDe || 0),
        thietKeVanDe: Number(req.body.sv2_thietKeVanDe || 0),
        hienThucVanDe: Number(req.body.sv2_hienThucVanDe || 0),
        kiemTraSanPham: Number(req.body.sv2_kiemTraSanPham || 0),
        deNghi: req.body.sv2_deNghi || "Được bảo vệ",
      },
    };

    let dpb = await DiemPB.findOne({ phancongphanbien_id });

    if (!dpb) {
      dpb = new DiemPB(data);
    } else {
      dpb.set(data);
    }

    await dpb.save(); // 👉 để pre("save") tính tongDiem

    req.flash(
      "success",
      dpb.isNew
        ? "Đã lưu điểm phản biện!"
        : "Cập nhật điểm phản biện thành công!"
    );
    res.redirect("/giangvien/diemphanbien");
  } catch (err) {
    console.error(" SAVE PB:", err);
    req.flash("error", "Lưu điểm phản biện thất bại!");
    res.redirect("/giangvien/diemphanbien");
  }
};

// =============================
// EXPORT WORD
// =============================
module.exports.exportWord = async (req, res) => {
  try {
    const { pcId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pcId)) {
      req.flash("error", "ID phân công không hợp lệ!");
      return res.redirect("/giangvien/diemphanbien");
    }

    const dpb = await DiemPB.findOne({ phancongphanbien_id: pcId })
      .populate({
        path: "phancongphanbien_id",
        populate: {
          path: "detai_id",
          populate: [
            { path: "sv1", model: "Sinhvien" },
            { path: "sv2", model: "Sinhvien" },
            { path: "giangvien_id", model: "Giangvien" },
          ],
        },
      })
      .lean();

    if (!dpb) {
      req.flash("error", "Chưa có dữ liệu phản biện!");
      return res.redirect("/giangvien/diemphanbien");
    }

    const detai = dpb.phancongphanbien_id.detai_id;
    const sv1 = dpb.sv1 || {};
    const sv2 = dpb.sv2 || {};

    const templatePath = path.join(
      __dirname,
      "../../templates/PhieuChamPhanBien.docx"
    );

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: "<<", end: ">>" },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });
    const phanTramsv1 = Math.round((sv1.tongDiem / 10) * 100);
    const phanTramsv2 = Math.round((sv2.tongDiem / 10) * 100);
    doc.setData({
      ten_detai: detai?.ten || "",

      // ===== SV1 =====
      sv1_name: detai.sv1?.ten || "",
      sv1_mssv: detai.sv1?.msvv || "",
      sv1_lop: detai.sv1?.lop || "",
      sv1_pt: sv1.phanTichVanDe ?? "",
      sv1_tk: sv1.thietKeVanDe ?? "",
      sv1_ht: sv1.hienThucVanDe ?? "",
      sv1_kt: sv1.kiemTraSanPham ?? "",
      sv1_diem: sv1.tongDiem ?? "",
      sv1_ptram: phanTramsv1 + "%",
      sv1_ok: tick(sv1.deNghi, "Được bảo vệ"),
      sv1_no: tick(sv1.deNghi, "Không được bảo vệ"),
      sv1_fix: tick(sv1.deNghi, "Bổ sung/hiệu chỉnh để được bảo vệ"),

      // ===== SV2 =====
      sv2_name: detai.sv2?.ten || "",
      sv2_mssv: detai.sv2?.msvv || "",
      sv2_lop: detai.sv2?.lop || "",
      sv2_pt: sv2.phanTichVanDe ?? "",
      sv2_tk: sv2.thietKeVanDe ?? "",
      sv2_ht: sv2.hienThucVanDe ?? "",
      sv2_kt: sv2.kiemTraSanPham ?? "",
      sv2_diem: sv2.tongDiem ?? "",
      sv2_ptram: phanTramsv2 + "%",
      sv2_ok: tick(sv2.deNghi, "Được bảo vệ"),
      sv2_no: tick(sv2.deNghi, "Không được bảo vệ"),
      sv2_fix: tick(sv2.deNghi, "Bổ sung/hiệu chỉnh để được bảo vệ"),

      gvpb_name: req.session.user?.hoten || "",

      check_dat: dpb.nhanXetChung === "Đạt" ? "☑" : "☐",
      check_khongdat: dpb.nhanXetChung === "Không đạt" ? "☑" : "☐",
      yeu_cau: dpb.yeuCauDieuChinh || "",
      uu_diem: dpb.uuDiem || "",
      thieu_sot: dpb.thieuSot || "",
      cau_hoi: dpb.cauHoiHoiDong.join("\n") || "",
    });

    doc.render();

    const buffer = doc.getZip().generate({ type: "nodebuffer" });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=PhanBien_${detai.sv1?.msvv || "SV"}.docx`
    );
    res.send(buffer);
  } catch (err) {
    console.error("❌ EXPORT PB:", err);
    req.flash("error", "Xuất Word phản biện thất bại!");
    res.redirect("/giangvien/diemphanbien");
  }
};


