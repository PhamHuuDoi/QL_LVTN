const SinhVien = require("../../models/sinhVien.model");
const GiangVien = require("../../models/giangVien.model");
const DeTai = require("../../models/detai.model");
const PhanCongHuongDan = require("../../models/phanCongHuongDan.model");
// [GET] /admin/phancong
module.exports.index = async (req, res) => {
  try {
    // Lấy tất cả SV (có populate giáo viên hiện tại nếu có)
    const sinhviens = await SinhVien.find().populate("supervisor");

    // Lấy danh sách GV để đổ combobox
    const giangviens = await GiangVien.find();

    // Sắp xếp theo nhóm
    sinhviens.sort((a, b) => {
      if (a.group < b.group) return -1;
      if (a.group > b.group) return 1;
      return 0;
    });

    // Thêm thông tin xem sinh viên đã có đề tài chưa
    const sinhviensWithDetaiInfo = await Promise.all(
      sinhviens.map(async (sv) => {
        const svObj = sv.toObject();

        // Kiểm tra xem sinh viên này đã có đề tài chưa
        const detaiExists = await DeTai.findOne({
          $or: [{ sv1: sv._id }, { sv2: sv._id }],
        });

        svObj.hasDetai = !!detaiExists;
        return svObj;
      })
    );

    // Lọc theo trạng thái
    const filter = req.query.filter || "all";
    let filteredSinhViens = sinhviensWithDetaiInfo;

    if (filter === "yes") {
      // Đã phân công (có supervisor)
      filteredSinhViens = sinhviensWithDetaiInfo.filter((sv) => sv.supervisor);
    } else if (filter === "no") {
      // Chưa phân công (không có supervisor)
      filteredSinhViens = sinhviensWithDetaiInfo.filter((sv) => !sv.supervisor);
    } else if (filter === "hasDetai") {
      // Đã có đề tài
      filteredSinhViens = sinhviensWithDetaiInfo.filter((sv) => sv.hasDetai);
    } else if (filter === "noDetai") {
      // Chưa có đề tài
      filteredSinhViens = sinhviensWithDetaiInfo.filter((sv) => !sv.hasDetai);
    }

    res.render("admin/pages/phancong/index", {
      pageTitle: "Phân công hướng dẫn",
      prefixAdmin: "admin",
      sinhviens: filteredSinhViens,
      giangviens,
      filter,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(err);
    res.redirect("/admin");
  }
};

// [POST] /admin/phancong/assign
module.exports.assign = async (req, res) => {
  try {
    const { svid, gvid } = req.body;

    // Tìm sinh viên được chọn
    const sv = await SinhVien.findById(svid);
    if (!sv) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sinh viên!",
      });
    }

    // Lấy nhóm của sinh viên
    const group = sv.group;

    // Tìm tất cả sinh viên trong nhóm này
    const svsInGroup = await SinhVien.find({ group }).populate("supervisor");

    // Lấy giảng viên hiện tại của nhóm (nếu có)
    let currentGV = null;
    let currentGVName = "";
    if (svsInGroup.length > 0 && svsInGroup[0].supervisor) {
      currentGV = svsInGroup[0].supervisor._id;
      currentGVName = svsInGroup[0].supervisor.hoten;
    }

    // KIỂM TRA XEM SINH VIÊN TRONG NHÓM ĐÃ CÓ ĐỀ TÀI CHƯA
    // Lấy danh sách ID của tất cả sinh viên trong nhóm
    const svIdsInGroup = svsInGroup.map((sv) => sv._id);

    // Kiểm tra xem có sinh viên nào trong nhóm đã có đề tài chưa
    const hasDetai = await DeTai.findOne({
      $or: [{ sv1: { $in: svIdsInGroup } }, { sv2: { $in: svIdsInGroup } }],
    });

    // Nếu đã có đề tài thì không cho thay đổi giảng viên
    if (hasDetai && currentGV && currentGV.toString() !== gvid) {
      return res.status(400).json({
        success: false,
        message: `Không thể thay đổi giảng viên! Nhóm ${group} đã có đề tài với giảng viên ${currentGVName}.`,
        hasDetai: true,
      });
    }

    // Cập nhật supervisor cho tất cả sinh viên trong cùng nhóm
    await SinhVien.updateMany({ group }, { supervisor: gvid });  
    // Lưu cập nhật bảng phân công hướng dẫn cho từng SV trong nhóm
    for (let svItem of svsInGroup) {
      await PhanCongHuongDan.findOneAndUpdate(
        { svid: svItem._id }, // nếu SV đã có phân công thì update
        {
          gvid,
          svid: svItem._id,
          group,
          trangthai: "Đang hướng dẫn",
        },
        { upsert: true, new: true } // chưa có thì tạo mới
      );
    }
    // Cập nhật role giảng viên
    const gv = await GiangVien.findById(gvid);
    if (gv) {
      const roles = Array.isArray(gv.roles) ? gv.roles : [];
      if (!roles.includes("huongdan")) {
        roles.push("huongdan");
        gv.roles = roles;
        await gv.save();
      }
    }

    return res.json({
      success: true,
      message: `✅ Đã phân công giảng viên cho nhóm ${group}`,
    });
  } catch (err) {
    console.error("❌ Lỗi phân công:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi phân công!",
    });
  }
};
