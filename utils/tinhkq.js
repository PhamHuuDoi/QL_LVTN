const KetQua = require("../models/ketqua.model");
const DsNhomHoiDong = require("../models/dsnhomHd.model");
const DiemHD = require("../models/diemHuongDan.model");
const DiemPB = require("../models/diemPhanBien.model");

// ===== hàm xếp loại =====
function xepLoai(d) {
  if (d >= 9) return "Xuất sắc";
  if (d >= 8) return "Giỏi";
  if (d >= 7) return "Khá";
  if (d >= 6) return "Trung bình khá";
  if (d >= 5.5) return "Trung bình";
  return "Không đạt";
}

// ===== TÍNH & LƯU KẾT QUẢ CHO 1 PHÂN CÔNG =====
async function tinhVaLuuKetQua(pcId) {
  const pc = await DsNhomHoiDong.findById(pcId)
    .populate("sv1")
    .populate("sv2")
    .populate("detai_id")
    .lean();

  if (!pc) return;
  const detai = pc.detai_id;

  const pbDocs = await DiemPB.find()
    .populate({
      path: "phancongphanbien_id",
      populate: { path: "detai_id" },
    })
    .lean();

  const pbDoc = pbDocs.find(
    (pb) =>
      pb.phancongphanbien_id?.detai_id?._id.toString() === detai._id.toString()
  );

  const handleSV = async (sv, diemHoiDong, svKey) => {
    if (!sv || diemHoiDong === undefined || diemHoiDong === null) return;

    const hd = await DiemHD.findOne({
      sv_id: sv._id,
      detai_id: detai._id,
      deNghiGV: "Được bảo vệ",
    }).lean();
    if (!hd || !pbDoc) return;

    const diemPB = svKey === "sv1" ? pbDoc.sv1?.tongDiem : pbDoc.sv2?.tongDiem;
    if (diemPB === undefined || diemPB === null) return;

    const diemHD = hd.tongDiem;
    const tong = diemHD * 0.2 + diemPB * 0.2 + diemHoiDong * 0.6;
    const kq = xepLoai(tong);

    await KetQua.findOneAndUpdate(
      { sv_id: sv._id, detai_id: detai._id },
      {
        sv_id: sv._id,
        detai_id: detai._id,
        gvhd_id: sv.supervisor,
        diemHD,
        diemPB,
        diemHoiDong,
        tongDiem: tong,
        ketQua: kq,
      },
      { upsert: true, new: true }
    );
  };

  await handleSV(pc.sv1, pc.tongDiemSv1, "sv1");
  await handleSV(pc.sv2, pc.tongDiemSv2, "sv2");
}

module.exports = { tinhVaLuuKetQua };
