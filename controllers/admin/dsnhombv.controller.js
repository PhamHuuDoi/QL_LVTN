const DsNhomHoiDong = require("../../models/dsnhomHd.model");
const SinhVien = require("../../models/sinhVien.model");
const DeTai = require("../../models/detai.model");
const HoiDong = require("../../models/hoidong.model");
const DiemHD = require("../../models/diemHuongDan.model");
const DiemPB = require("../../models/diemPhanBien.model");
const ExcelJS = require("exceljs");

// ===== LIST =====
module.exports.index = async (req, res) => {
  try {
    // 1️ SV được bảo vệ từ điểm HD
    const diemHDs = await DiemHD.find({ deNghiGV: "Được bảo vệ" }).lean();
    const svIds = diemHDs.map((d) => d.sv_id.toString());

    if (!svIds.length) {
      return res.render("admin/pages/phanconghoidong/index", {
        pageTitle: "Phân công hội đồng cho nhóm SV",
        rows: [],
        hoidongs: await HoiDong.find().lean(),
      });
    }

    // 2️ Lấy SV
    const svs = await SinhVien.find({ _id: { $in: svIds } })
      .populate("supervisor")
      .lean();

    // 3️ Lấy đề tài của các SV đó
    const detais = await DeTai.find({
      $or: [{ sv1: { $in: svIds } }, { sv2: { $in: svIds } }],
    }).lean();

    //  Lấy điểm phản biện + populate tới đề tài
    const diemPBs = await DiemPB.find()
      .populate({
        path: "phancongphanbien_id",
        populate: { path: "detai_id" },
      })
      .lean();

    const hoidongs = await HoiDong.find().lean();

    const phancongs = await DsNhomHoiDong.find()
      .populate("hd_id")
      .populate({
        path: "sv1",
        populate: { path: "supervisor", model: "Giangvien" },
      })
      .populate({
        path: "sv2",
        populate: { path: "supervisor", model: "Giangvien" },
      })
      .populate("detai_id")
      .lean();

    const rows = [];

    for (const dt of detais) {
      const sv1 = svs.find((s) => dt.sv1?.toString() === s._id.toString());
      const sv2 = svs.find((s) => dt.sv2?.toString() === s._id.toString());
      if (!sv1) continue;

      //  chỉ lấy nếu đề tài này đã có điểm phản biện
      const hasPB = diemPBs.find(
        (pb) =>
          pb.phancongphanbien_id?.detai_id?._id.toString() === dt._id.toString()
      );
      if (!hasPB) continue;

      const pc = phancongs.find(
        (p) =>
          p.sv1?._id.toString() === sv1._id.toString() &&
          (!sv2 || p.sv2?._id.toString() === sv2._id.toString())
      );

      rows.push({
        group: sv1.group,
        sv1,
        sv2,
        gvhd: sv1.supervisor,
        detai: dt,
        hoidong: pc?.hd_id || null,
        pcId: pc?._id || null,
      });
    }

    res.render("admin/pages/phanconghoidong/index", {
      pageTitle: "Phân công hội đồng cho nhóm SV",
      rows,
      hoidongs,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(" LIST PHAN CONG HD:", err);
    res.redirect("/admin/dashboard");
  }
};



// ===== ASSIGN =====
module.exports.assign = async (req, res) => {
  try {
    const { sv1, sv2, detai_id, hd_id } = req.body;

    await DsNhomHoiDong.create({
      sv1,
      sv2: sv2 || null,
      detai_id,
      hd_id,
    });

    req.flash("success", "Đã phân công hội đồng!");
    res.redirect("/admin/dsnhombv");
  } catch (err) {
    console.error(" ASSIGN HD:", err);
    req.flash("error", "Nhóm đã được phân công hoặc lỗi dữ liệu!");
    res.redirect("/admin/dsnhombv");
  }
};
// ===== UPDATE PHÂN CÔNG =====
module.exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { hd_id } = req.body;

    await DsNhomHoiDong.findByIdAndUpdate(id, { hd_id });

    req.flash("success", "Cập nhật hội đồng thành công!");
  } catch (err) {
    console.error(" UPDATE PHÂN CÔNG:", err);
    req.flash("error", "Lỗi khi cập nhật hội đồng!");
  }
  res.redirect("/admin/dsnhombv");
};
// ===== EXPORT EXCEL =====
module.exports.exportExcel = async (req, res) => {
  try {
    const { ngaybv } = req.query;

    const filter = {};
    if (ngaybv) filter["hd_id.ngaybv"] = new Date(ngaybv);

    const docs = await DsNhomHoiDong.find()
      .populate("hd_id")
      .populate({
        path: "sv1",
        populate: { path: "supervisor", model: "Giangvien" },
      })
      .populate({
        path: "sv2",
        populate: { path: "supervisor", model: "Giangvien" },
      })
      .populate("detai_id")
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("PhanCongHoiDong");

    sheet.columns = [
      { header: "Nhóm", key: "group", width: 10 },
      { header: "MSSV", key: "mssv", width: 15 },
      { header: "Tên SV", key: "ten", width: 25 },
      { header: "Đề tài", key: "detai", width: 35 },
      { header: "GVHD", key: "gvhd", width: 25 },
      { header: "Hội đồng", key: "hoidong", width: 25 },
      { header: "Phòng", key: "phong", width: 15 },
      { header: "Ngày BV", key: "ngay", width: 15 },
    ];

    docs.forEach((d) => {
      const gvhd = d.sv1?.supervisor;
      const hd = d.hd_id;

      const addRow = (sv) => {
        if (!sv) return;
        sheet.addRow({
          group: sv.group || "",
          mssv: sv.msvv,
          ten: sv.ten,
          detai: d.detai_id?.ten || "",
          gvhd: gvhd?.hoten || "",
          hoidong: hd?.tenhd || "",
          phong: hd?.phonghd || "",
          ngay: hd?.ngaybv
            ? new Date(hd.ngaybv).toLocaleDateString("vi-VN")
            : "",
        });
      };

      addRow(d.sv1);
      addRow(d.sv2);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PhanCongHoiDong.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(" EXPORT HD:", err);
    res.redirect("/admin/dsnhombv");
  }
};
