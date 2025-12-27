    const KetQua = require("../../models/ketqua.model");
    const ExcelJS = require("exceljs");

    // ===== INDEX: HIỂN THỊ KẾT QUẢ CUỐI =====
    module.exports.index = async (req, res) => {
    try {
        const docs = await KetQua.find()
        .populate("sv_id")
        .populate("detai_id")
        .populate("gvhd_id")
        .lean();

        const rows = docs.map((d) => ({
        group: d.sv_id?.group || "",
        mssv: d.sv_id?.msvv || "",
        ten: d.sv_id?.ten || "",
        lop: d.sv_id?.lop || "",
        detai: d.detai_id || null,
        gvhd: d.gvhd_id || null,
        tong: d.tongDiem?.toFixed(2) || "0.00",
        ketqua: d.ketQua || "",
        }));

        res.render("admin/pages/ketqua/index", {
          pageTitle: "Kết quả cuối",
          rows,
          success: req.flash("success"),
          error: req.flash("error"),
        });
    } catch (err) {
        console.error(" INDEX KET QUA:", err);
        res.redirect("/admin/dashboard");
    }
    };

    // ===== EXPORT EXCEL =====
    module.exports.exportExcel = async (req, res) => {
    try {
        const docs = await KetQua.find()
        .populate("sv_id")
        .populate("detai_id")
        .populate("gvhd_id")
        .lean();

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("KetQua");

        sheet.columns = [
        { header: "Nhóm", key: "group", width: 10 },
        { header: "MSSV", key: "mssv", width: 15 },
        { header: "Tên SV", key: "ten", width: 25 },
        { header: "Lớp", key: "lop", width: 15 },
        { header: "Đề tài", key: "detai", width: 30 },
        { header: "GVHD", key: "gvhd", width: 25 },
        { header: "Điểm tổng", key: "tong", width: 12 },
        { header: "Kết quả", key: "ketqua", width: 15 },
        ];

        docs.forEach((d) => {
        sheet.addRow({
            group: d.sv_id?.group || "",
            mssv: d.sv_id?.msvv || "",
            ten: d.sv_id?.ten || "",
            lop: d.sv_id?.lop || "",
            detai: d.detai_id?.ten || "",
            gvhd: d.gvhd_id?.hoten || "",
            tong: d.tongDiem?.toFixed(2) || "",
            ketqua: d.ketQua || "",
        });
        });

        res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
        "Content-Disposition",
        "attachment; filename=KetQuaCuoi.xlsx"
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("❌ EXPORT KET QUA:", err);
        res.redirect("/admin/ketqua");
    }
    };
