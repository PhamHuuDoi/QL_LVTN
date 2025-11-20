const Sinhvien = require("../../models/sinhVien.model");

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
    filter.group = { $exists: false }; // chưa có nhóm
  } else if (filterGroup === "single") {
    filter.group = { $exists: true };
    // Nhóm chỉ 1 thành viên
    // Chúng ta cần đếm số lượng trong mỗi nhóm -> Mongoose aggregate
    const sinhviensAll = await Sinhvien.find(filter);
    const groupCounts = {};
    sinhviensAll.forEach(sv => {
      if (sv.group) {
        groupCounts[sv.group] = (groupCounts[sv.group] || 0) + 1;
      }
    });
    const singleGroups = Object.keys(groupCounts).filter(g => groupCounts[g] === 1);
    filter.group = { $in: singleGroups };
  } else if (filterGroup === "full") {
    const sinhviensAll = await Sinhvien.find(filter);
    const groupCounts = {};
    sinhviensAll.forEach(sv => {
      if (sv.group) {
        groupCounts[sv.group] = (groupCounts[sv.group] || 0) + 1;
      }
    });
    const fullGroups = Object.keys(groupCounts).filter(g => groupCounts[g] >= 2);
    filter.group = { $in: fullGroups };
  }

  const sinhviens = await Sinhvien.find(filter);

  const successMsg = req.flash("success");
  const errorMsg = req.flash("error");

  res.render("giangvien/pages/sinhvien/index", {
    pageTitle: "Sinh viên phụ trách",
    sinhviens,
    keyword,
    filterGroup,
    success: successMsg.length ? successMsg[0] : null,
    error: errorMsg.length ? errorMsg[0] : null,
  });
};
module.exports.changeGroup = async (req, res) => {
  const { group } = req.body;
  const svID = req.params.id;

  // Đếm số lượng trong nhóm
  const count = await Sinhvien.countDocuments({ group });

  if (count >= 2) {
    req.flash("error", "Nhóm đã đủ 2 thành viên!");
    return res.redirect("/giangvien/sinhvien");
  }

  await Sinhvien.updateOne({ _id: svID }, { group });

  req.flash("success", "Cập nhật nhóm thành công!");
  res.redirect("/giangvien/sinhvien");
};