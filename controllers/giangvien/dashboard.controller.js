module.exports.index = (req, res) => {
  res.render("giangvien/pages/dashboard/index", {
    pageTitle: "Trang giảng viên",
    user: req.session.user
  });
};