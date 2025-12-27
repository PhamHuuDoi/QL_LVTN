const DiemPB = require("../../models/diemPhanBien.model");
const ExcelJS = require("exceljs");
//List
module.exports.index = async (req, res) => {
  try {
    const docs = await DiemPB.find()
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

    const rows = [];

    docs.forEach((d) => {
      const dt = d.phancongphanbien_id?.detai_id;
      if (!dt) return;

      const gvhd = dt.giangvien_id?.hoten || "";
      const hasSv2 = !!dt.sv2;

      //  SV1 (hàng đầu – có nút + rowspan nếu có SV2)
      if (dt.sv1) {
        rows.push({
          group: dt.sv1.group || "—",
          mssv: dt.sv1.msvv,
          ten: dt.sv1.ten,
          detai: dt.ten,
          gvhd,
          diem: d.sv1?.tongDiem ?? "—",
          denghi: d.sv1?.deNghi ?? "",
          id: d._id,
          showAction: true,
          rowspan: hasSv2 ? 2 : 1,
        });
      }

      //  SV2 (hàng thứ hai – không có nút)
      if (dt.sv2) {
        rows.push({
          group: dt.sv2.group || "—",
          mssv: dt.sv2.msvv,
          ten: dt.sv2.ten,
          detai: dt.ten,
          gvhd,
          diem: d.sv2?.tongDiem ?? "—",
          denghi: d.sv2?.deNghi ?? "",
          showAction: false,
        });
      }
    });

    rows.sort((a, b) => a.group.localeCompare(b.group));

    res.render("admin/pages/theodoidiempb/index", {
      pageTitle: "Theo dõi điểm phản biện",
      rows,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(" LIST PB:", err);
    res.redirect("/admin/dashboard");
  }
};
// DETAIL - Admin xem chi tiết điểm phản biện
module.exports.detail = async (req, res) => {
  try {
    const { id } = req.params;

    const dpb = await DiemPB.findById(id)
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
      return res.redirect("/admin/theodoidiempb");
    }

    const detai = dpb.phancongphanbien_id.detai_id;

    res.render("admin/pages/theodoidiempb/detail", {
      pageTitle: "Chi tiết điểm phản biện",
      dpb,      // giống form giảng viên
      detai,    // để dùng detai.sv1, sv2, ten, gv...
    });
  } catch (err) {
    console.error("❌ DETAIL PB:", err);
    res.redirect("/admin/theodoidiempb");
  }
};

//EXPORT EXCEL
module.exports.exportExcel = async (req, res) => {
  try {
    const docs = await DiemPB.find()
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

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("TheoDoiDiemPhanBien");

    sheet.columns = [
      { header: "Nhóm", key: "group", width: 10 },
      { header: "MSSV", key: "mssv", width: 20 },
      { header: "Tên SV", key: "ten", width: 30 },
      { header: "Đề tài", key: "detai", width: 35 },
      { header: "GVHD", key: "gvhd", width: 25 },
      { header: "Điểm PB", key: "diem", width: 15 },
      { header: "Đề nghị", key: "denghi", width: 30 },
    ];

    docs.forEach((d) => {
      const dt = d.phancongphanbien_id?.detai_id;
      if (!dt) return;

      const gvhd = dt?.giangvien_id?.hoten || "";
      const detaiTen = dt?.ten || "";

      // ===== SV1 =====
      if (dt.sv1) {
        sheet.addRow({
          group: dt.sv1.group || "—",
          mssv: dt.sv1.msvv || "",
          ten: dt.sv1.ten || "",
          detai: detaiTen,
          gvhd,
          diem: d.sv1?.tongDiem ?? "",
          denghi: d.sv1?.deNghi || "",
        });
      }

      // ===== SV2 =====
      if (dt.sv2) {
        sheet.addRow({
          group: dt.sv2.group || "—",
          mssv: dt.sv2.msvv || "",
          ten: dt.sv2.ten || "",
          detai: detaiTen,
          gvhd,
          diem: d.sv2?.tongDiem ?? "",
          denghi: d.sv2?.deNghi || "",
        });
      }
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=TheoDoiDiemPhanBien.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ EXPORT PB:", err);
    res.redirect("/admin/theodoidiempb");
  }
};

