const Sinhvien = require("../../models/sinhVien.model");
const Detai = require("../../models/detai.model");
// Index
module.exports.index = async (req, res) => {
  const gvID = req.session.user._id;
  const keyword = req.query.keyword || "";
  const filterGroup = req.query.filterGroup || "";

  // Khởi tạo filter cơ bản: sinh viên do giảng viên phụ trách
  let filter = { supervisor: gvID };

  // Tìm theo tên hoặc mã sinh viên
  if (keyword.trim() !== "") {
    filter.$or = [
      { ten: { $regex: keyword, $options: "i" } },
      { msvv: { $regex: keyword, $options: "i" } },
    ];
  }

  // Lọc theo nhóm
  if (filterGroup === "none") {
    filter.$or = [
      { group: { $exists: false } },
      { group: null },
      { group: "" },
    ];
  } else if (filterGroup === "single") {
    filter.group = { $exists: true };
    // Nhóm chỉ 1 thành viên
    // Đếm số lượng trong mỗi nhóm -> Mongoose aggregate
    const sinhviensAll = await Sinhvien.find(filter);
    const groupCounts = {};
    sinhviensAll.forEach((sv) => {
      if (sv.group) {
        groupCounts[sv.group] = (groupCounts[sv.group] || 0) + 1;
      }
    });
    const singleGroups = Object.keys(groupCounts).filter(
      (g) => groupCounts[g] === 1
    );
    filter.group = { $in: singleGroups };
  } else if (filterGroup === "full") {
    const sinhviensAll = await Sinhvien.find(filter);
    const groupCounts = {};
    sinhviensAll.forEach((sv) => {
      if (sv.group) {
        groupCounts[sv.group] = (groupCounts[sv.group] || 0) + 1;
      }
    });
    const fullGroups = Object.keys(groupCounts).filter(
      (g) => groupCounts[g] >= 2
    );
    filter.group = { $in: fullGroups };
  }

  const sinhviens = await Sinhvien.find(filter);

  const successMsg = req.flash("success");
  const errorMsg = req.flash("error");
  sinhviens.sort((a, b) => {
    const groupA = a.group || "";
    const groupB = b.group || "";
    return groupA.localeCompare(groupB);
  });
  res.render("giangvien/pages/sinhvien/index", {
    pageTitle: "Sinh viên phụ trách",
    sinhviens,
    keyword,
    filterGroup,
    success: successMsg.length ? successMsg[0] : null,
    error: errorMsg.length ? errorMsg[0] : null,
  });
};
// Thay đổi nhóm sinh viên
module.exports.changeGroup = async (req, res) => {
  try {
    const { group } = req.body;
    const svID = req.params.id;

    //  Kiểm tra SV đã có đề tài chưa
    const existedDeTai = await Detai.findOne({
      $or: [{ sv1: svID }, { sv2: svID }],
    }).lean();

    if (existedDeTai) {
      req.flash(
        "error",
        "Sinh viên đã được phân công đề tài, không thể thay đổi nhóm!"
      );
      return res.redirect("/giangvien/sinhvien");
    }

    // Đếm số lượng trong nhóm mới
    const count = await Sinhvien.countDocuments({ group });

    if (count >= 2) {
      req.flash("error", "Nhóm đã đủ 2 thành viên!");
      return res.redirect("/giangvien/sinhvien");
    }

    // Update group
    await Sinhvien.updateOne({ _id: svID }, { group });

    req.flash("success", "Cập nhật nhóm thành công!");
    res.redirect("/giangvien/sinhvien");
  } catch (err) {
    console.error(" CHANGE GROUP:", err);
    req.flash("error", "Lỗi khi cập nhật nhóm!");
    res.redirect("/giangvien/sinhvien");
  }
};
