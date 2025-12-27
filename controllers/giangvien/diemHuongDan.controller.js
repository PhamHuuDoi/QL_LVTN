const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

const DeTai = require("../../models/detai.model");
const SinhVien = require("../../models/sinhVien.model");
const DanhGia = require("../../models/danhGiaGiuaKy.model");
const DiemHD = require("../../models/diemHuongDan.model");
const DsNhomHoiDong=require("../../models/dsnhomHd.model");
// List
const list = async (req, res) => {
  try {
    const gvId = req.session.user?._id;
    if (!gvId) {
      req.flash("error", "Bạn chưa đăng nhập!");
      return res.redirect("/login");
    }

    const danhgias = await DanhGia.find({
      giangvien_id: gvId,
      ketqua: "Làm tiếp",
    }).lean();

    const svIds = danhgias.map((dg) => dg.sv_id);

    const svs = await SinhVien.find({ _id: { $in: svIds } }).lean();
    const detais = await DeTai.find({ giangvien_id: gvId }).lean();
    const diemhds = await DiemHD.find({ sv_id: { $in: svIds } }).lean();

    // LẤY DANH SÁCH SINH VIÊN ĐÃ ĐƯỢC PHÂN CÔNG HỘI ĐỒNG
    const dsHoiDongs = await DsNhomHoiDong.find({
      $or: [{ sv1: { $in: svIds } }, { sv2: { $in: svIds } }],
    }).lean();

    const rows = svs.map((sv) => {
      const detai =
        detais.find(
          (dt) =>
            (dt.sv1 && dt.sv1.toString() === sv._id.toString()) ||
            (dt.sv2 && dt.sv2.toString() === sv._id.toString())
        ) || null;

      const dhd =
        diemhds.find((d) => d.sv_id.toString() === sv._id.toString()) || null;

      // KIỂM TRA XEM SINH VIÊN ĐÃ ĐƯỢC PHÂN CÔNG HỘI ĐỒNG CHƯA
      const daPhanCongHD = dsHoiDongs.some(
        (hd) =>
          (hd.sv1 && hd.sv1.toString() === sv._id.toString()) ||
          (hd.sv2 && hd.sv2.toString() === sv._id.toString())
      );

      return {
        sv,
        detai,
        dhd,
        daPhanCongHD, // true = đã phân công hội đồng, false = chưa
      };
    });
    // Loc theo filter
    const filter = req.query.filter || "all";
    let filteredRows = rows;
    if (filter === "yes") {
      filteredRows = rows.filter((r) => r.dhd && r.dhd.tongDiem > 0);
    } else if (filter === "no") {
      filteredRows = rows.filter((r) => !r.dhd || r.dhd.tongDiem === 0);
    } 
    // Sắp xep theo nhóm
    filteredRows.sort((a, b) => {
      const groupA = a.sv.group || "";
      const groupB = b.sv.group || "";
      return groupA.localeCompare(groupB);
    });
    res.render("giangvien/pages/diemhuongdan/index", {
      pageTitle: "Nhập điểm hướng dẫn",
      rows: filteredRows,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error("Lỗi list:", err);
    req.flash("error", "Lỗi tải danh sách!");
    res.redirect("/giangvien/dashboard");
  }
};

// =============================
// FORM
// =============================
const form = async (req, res) => {
  try {
    const { svId } = req.params;
    const gvId = req.session.user._id;

    if (!mongoose.Types.ObjectId.isValid(svId)) {
      req.flash("error", "ID sinh viên không hợp lệ!");
      return res.redirect("/giangvien/diemhuongdan");
    }

    const sv = await SinhVien.findById(svId).lean();

    const detai = await DeTai.findOne({
      giangvien_id: gvId,
      $or: [{ sv1: svId }, { sv2: svId }],
    }).lean();

    if (!sv || !detai) {
      req.flash("error", "Không tìm thấy sinh viên hoặc đề tài!");
      return res.redirect("/giangvien/diemhuongdan");
    }

    const dhd = await DiemHD.findOne({
      sv_id: svId,
      detai_id: detai._id,
    });

    res.render("giangvien/pages/diemhuongdan/form", {
      pageTitle: "Nhập điểm hướng dẫn",
      sv,
      detai,
      dhd,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error("Lỗi form:", err);
    req.flash("error", "Không thể mở form!");
    res.redirect("/giangvien/diemhuongdan");
  }
};

// =============================
// SAVE
// =============================
const save = async (req, res) => {
  try {
    const { sv_id, detai_id } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(sv_id) ||
      !mongoose.Types.ObjectId.isValid(detai_id)
    ) {
      req.flash("error", "ID không hợp lệ!");
      return res.redirect("/giangvien/diemhuongdan");
    }

    const data = {
      sv_id,
      detai_id,
      nhanXetChung: req.body.nhanXetChung,
      yeuCauDieuChinh: req.body.yeuCauDieuChinh,
      uuDiem: req.body.uuDiem,
      thieuSot: req.body.thieuSot,

      phanTichVanDe: req.body.phanTichVanDe,
      thietKeVanDe: req.body.thietKeVanDe,
      hienThucVanDe: req.body.hienThucVanDe,
      kiemTraSanPham: req.body.kiemTraSanPham,

      diemBangChu: req.body.diemBangChu,
      cauHoiHoiDong: req.body.cauHoiHoiDong?.split("\n") || [],
      deNghiGV: req.body.deNghiGV,
    };
    const toNum = (v) => (v === undefined || v === "" ? 0 : Number(v));

    const tong =
      toNum(req.body.phanTichVanDe) +
      toNum(req.body.thietKeVanDe) +
      toNum(req.body.hienThucVanDe) +
      toNum(req.body.kiemTraSanPham);

    data.tongDiem = tong;
    data.diemBangSo = tong;
    let dhd = await DiemHD.findOne({ sv_id, detai_id });
    
    if (!dhd) {
      await DiemHD.create(data);
      req.flash("success", "Đã lưu điểm hướng dẫn!");
    } else {
      await DiemHD.findByIdAndUpdate(dhd._id, data);
      req.flash("success", "Đã cập nhật điểm hướng dẫn!");
    }

    res.redirect("/giangvien/diemhuongdan");
  } catch (err) {
    console.error("Lỗi save:", err);
    req.flash("error", "Lỗi khi lưu điểm!");
    res.redirect("/giangvien/diemhuongdan");
  }
};

// Xem chi tiết điểm hướng dẫn
const detail = async (req, res) => {
  try {
    const { svId } = req.params;
    const gvId = req.session.user._id;

    if (!mongoose.Types.ObjectId.isValid(svId)) {
      req.flash("error", "ID sinh viên không hợp lệ!");
      return res.redirect("/giangvien/diemhuongdan");
    }

    const sv = await SinhVien.findById(svId).lean();
    const detai = await DeTai.findOne({
      giangvien_id: gvId,
      $or: [{ sv1: svId }, { sv2: svId }],
    }).lean();

    if (!sv || !detai) {
      req.flash("error", "Không tìm thấy sinh viên hoặc đề tài!");
      return res.redirect("/giangvien/diemhuongdan");
    }

    const dhd = await DiemHD.findOne({
      sv_id: svId,
      detai_id: detai._id,
    });

    if (!dhd) {
      req.flash("error", "Sinh viên chưa có điểm hướng dẫn!");
      return res.redirect("/giangvien/diemhuongdan");
    }

    // Tính tổng điểm
    const tongDiem =
      (dhd.phanTichVanDe || 0) +
      (dhd.thietKeVanDe || 0) +
      (dhd.hienThucVanDe || 0) +
      (dhd.kiemTraSanPham || 0);

    res.render("giangvien/pages/diemhuongdan/detail", {
      pageTitle: "Chi tiết điểm hướng dẫn",
      sv,
      detai,
      dhd,
      tongDiem,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error("Lỗi detail:", err);
    req.flash("error", "Không thể xem chi tiết!");
    res.redirect("/giangvien/diemhuongdan");
  }
};

// EXPORT WORD (theo SV)
const exportWord = async (req, res) => {
  try {
    const { svId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(svId)) {
      req.flash("error", "ID sinh viên không hợp lệ!");
      return res.redirect("/giangvien/diemhuongdan");
    }

    const dhd = await DiemHD.findOne({ sv_id: svId })
      .populate("sv_id")
      .populate({
        path: "detai_id",
        populate: { path: "giangvien_id", model: "Giangvien" },
      })
      .lean();

    if (!dhd) {
      req.flash("error", "Chưa có dữ liệu chấm điểm!");
      return res.redirect("/giangvien/diemhuongdan");
    }

    const sv = dhd.sv_id;
    const detai = dhd.detai_id;
    const gv = detai?.giangvien_id;

    // 👉 tính % tổng điểm (thang 10)
    const tong = dhd.tongDiem || 0;
    const phanTram = Math.round((tong / 10) * 100); // vd: 6.0 -> 60

    const templatePath = path.join(
      __dirname,
      "../../templates/PhieuChamHuongDan.docx"
    );

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: "<<", end: ">>" },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });

    doc.setData({
      // thông tin chung
      sv_name: sv?.ten || "",
      sv_mssv: sv?.msvv || "",
      sv_lop: sv?.lop || "",
      detai_ten: detai?.ten || "",
      gv_name: gv?.hoten || "",

      // điểm từng mục
      phan_tich: dhd.phanTichVanDe ?? "",
      thiet_ke: dhd.thietKeVanDe ?? "",
      hien_thuc: dhd.hienThucVanDe ?? "",
      kiem_tra: dhd.kiemTraSanPham ?? "",

      tong_diem: tong,
      phan_tram: phanTram + "%",
      diem_chu: dhd.diemBangChu || "",

      // tick đạt / không đạt
      check_dat: dhd.nhanXetChung === "Đạt" ? "☑" : "☐",
      check_khongdat: dhd.nhanXetChung === "Không đạt" ? "☑" : "☐",
      de_nghi: dhd.deNghiGV || "",
      // nhận xét (string như bạn muốn)
      nhanxet: dhd.nhanXetChung || "",
      yeu_cau: dhd.yeuCauDieuChinh || "",
      uu_diem: dhd.uuDiem || "",
      thieu_sot: dhd.thieuSot || "",
      cauhoi: dhd.cauHoiHoiDong?.join("\n") || "",
    });

    doc.render();

    const buffer = doc.getZip().generate({ type: "nodebuffer" });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ChamHuongDan_${sv?.msvv || "SV"}.docx`
    );
    res.send(buffer);
  } catch (err) {
    console.error("Lỗi export:", err);
    req.flash("error", "Xuất Word thất bại!");
    res.redirect("/giangvien/diemhuongdan");
  }
};

module.exports = {
  list,
  form,
  save,
  detail,
  exportWord,
};
