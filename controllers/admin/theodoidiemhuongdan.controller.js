const DiemHD = require("../../models/diemHuongDan.model");
const ExcelJS = require("exceljs");

// LIST
module.exports.index = async (req, res) => {
  try {
    const docs = await DiemHD.find()
      .populate("sv_id")
      .populate({
        path: "detai_id",
        populate: { path: "giangvien_id", model: "Giangvien" },
      })
      .lean();

    const rows = docs.map((d) => ({
      group: d.sv_id?.group || "—",
      mssv: d.sv_id?.msvv || "",
      ten: d.sv_id?.ten || "",
      detai: d.detai_id?.ten || "",
      gvhd: d.detai_id?.giangvien_id?.hoten || "",
      diem: d.tongDiem ?? "—",
      denghi: d.deNghiGV || "",
      id: d._id,
    }));

    //  sắp xếp theo nhóm
    rows.sort((a, b) => a.group.localeCompare(b.group));

    res.render("admin/pages/theodoidiemhd/index", {
      pageTitle: "Theo dõi điểm hướng dẫn",
      rows,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(" LIST THEO DÕI ĐIỂM HD:", err);
    res.redirect("/admin/dashboard");
  }
};
// DETAIL
module.exports.detail = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(" DETAIL ID:", id);

    const doc = await DiemHD.findById(id)
      .populate("sv_id")
      .populate({
        path: "detai_id",
        populate: { path: "giangvien_id", model: "Giangvien" },
      })
      .lean();


    if (!doc) return res.redirect("/admin/theodoidiemhd");

    res.render("admin/pages/theodoidiemhd/detail", {
      pageTitle: "Chi tiết điểm hướng dẫn",
      d: doc,
    });
  } catch (err) {
    console.error("❌ DETAIL HD:", err);
    res.redirect("/admin/theodoidiemhd");
  }
};

// EXPORT EXCEL
module.exports.exportExcel = async (req, res) => {
  try {
    const docs = await DiemHD.find()
      .populate("sv_id")
      .populate({
        path: "detai_id",
        populate: { path: "giangvien_id", model: "Giangvien" },
      })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("TheoDoiDiemHuongDan");

    sheet.columns = [
      { header: "Nhóm", key: "group", width: 10 },
      { header: "MSSV", key: "mssv", width: 15 },
      { header: "Tên SV", key: "ten", width: 25 },
      { header: "Đề tài", key: "detai", width: 35 },
      { header: "GVHD", key: "gvhd", width: 25 },
      { header: "Điểm", key: "diem", width: 10 },
      { header: "Đề nghị", key: "denghi", width: 30 },
    ];

    docs.forEach((d) => {
      sheet.addRow({
        group: d.sv_id?.group || "—",
        mssv: d.sv_id?.msvv || "",
        ten: d.sv_id?.ten || "",
        detai: d.detai_id?.ten || "",
        gvhd: d.detai_id?.giangvien_id?.hoten || "",
        diem: d.tongDiem ?? "",
        denghi: d.deNghiGV || "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=TheoDoiDiemHuongDan.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(" EXPORT EXCEL HD:", err);
    res.redirect("/admin/theodoidhd");
  }
};
