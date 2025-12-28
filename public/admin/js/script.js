document.addEventListener("DOMContentLoaded", function () {
  const alerts = document.querySelectorAll(".show-alert");

  if (alerts.length > 0) {
    alerts.forEach((alert) => {
      // Lấy thời gian từ data-time, mặc định là 3000ms nếu không nhập
      // Lưu ý: Nếu bạn muốn 30s thì truyền vào mixin là 30000
      const time = parseInt(alert.getAttribute("data-time")) || 3000;

      // Sau khoảng 'time', thêm class 'hide' để mờ dần (opacity: 0)
      setTimeout(() => {
        alert.classList.add("hide");
      }, time);

      // Sau khi mờ hẳn (đợi thêm 500ms transition), xóa hẳn khỏi DOM
      setTimeout(() => {
        alert.remove();
      }, time + 500);
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Xử lý toggle menu group
  document.querySelectorAll(".menu-group > span").forEach((el) => {
    el.addEventListener("click", () => {
      el.nextElementSibling.classList.toggle("open");
    });
  });

  // Tự động mở sub-menu nếu link con đang active
  document.querySelectorAll(".sub-menu a").forEach((link) => {
    if (
      link.classList.contains("active") ||
      link.href === window.location.href
    ) {
      link.classList.add("active");
      const subMenu = link.closest(".sub-menu");
      if (subMenu) {
        subMenu.classList.add("open");
      }
    }
  });

  // Thêm class active cho link hiện tại
  const currentPath = window.location.pathname;
  document.querySelectorAll(".inner-menu a[href]").forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });
});
// Add thêm ủy
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("uyvien-wrapper");
  const addBtn = document.getElementById("addUyVienBtn");
  const chutichSelect = document.getElementById("chutichSelect");
  const thukySelect = document.getElementById("thukySelect");

   const chutich = chutichSelect?.value;
   const thuky = thukySelect?.value;

   const uyvienSelects = wrapper.querySelectorAll(".uyvien-select");
   const selectedUyviens = Array.from(uyvienSelects).map((s) => s.value);

   

  // ===== Cập nhật ẩn option trùng =====
  function updateOptions() {
    const chutich = chutichSelect?.value;
    const thuky = thukySelect?.value;

    const uyvienSelects = wrapper.querySelectorAll(".uyvien-select");
    const selectedUyviens = Array.from(uyvienSelects).map((s) => s.value);
    // ===== Chủ tịch =====
    if (chutichSelect) {
      Array.from(chutichSelect.options).forEach((opt) => {
        if (!opt.value) return;
        opt.hidden = opt.value === thuky || selectedUyviens.includes(opt.value);
      });

      //  nếu đang trùng thì reset
      if (chutich && (chutich === thuky || selectedUyviens.includes(chutich))) {
        chutichSelect.value = "";
      }
    }

    // ===== Thư ký =====
    if (thukySelect) {
      Array.from(thukySelect.options).forEach((opt) => {
        if (!opt.value) return;
        opt.hidden =
          opt.value === chutich || selectedUyviens.includes(opt.value);
      });

      //  nếu đang trùng thì reset
      if (thuky && (thuky === chutich || selectedUyviens.includes(thuky))) {
        thukySelect.value = "";
      }
    }
    uyvienSelects.forEach((select) => {
      Array.from(select.options).forEach((opt) => {
        if (!opt.value) return;

        let hide = false;

        // trùng chủ tịch hoặc thư ký
        if (opt.value === chutich || opt.value === thuky) hide = true;

        // trùng ủy viên khác
        if (selectedUyviens.includes(opt.value) && select.value !== opt.value)
          hide = true;

        opt.hidden = hide;
      });
    });
  }

  // ===== Thêm ô ủy viên =====
  function addUyVien() {
    const first = wrapper.querySelector(".uyvien-item");
    const clone = first.cloneNode(true);

    const select = clone.querySelector("select");
    select.value = "";

    // đổi nút + thành -
    const btn = clone.querySelector("button");
    btn.textContent = "-";
    btn.classList.remove("btn-success");
    btn.classList.add("btn-danger");
    btn.classList.remove("ml-2");
    btn.classList.add("ml-2", "removeUyVienBtn");
    btn.removeAttribute("id");

    wrapper.appendChild(clone);

    select.addEventListener("change", updateOptions);
    btn.addEventListener("click", () => {
      clone.remove();
      updateOptions();
    });

    updateOptions();
  }

  // ===== Sự kiện =====
  if (addBtn) addBtn.addEventListener("click", addUyVien);

  chutichSelect?.addEventListener("change", updateOptions);
  thukySelect?.addEventListener("change", updateOptions);

  wrapper.querySelectorAll(".uyvien-select").forEach((sel) => {
    sel.addEventListener("change", updateOptions);
  });

  wrapper.querySelectorAll(".removeUyVienBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.target.closest(".uyvien-item").remove();
      updateOptions();
    });
  });

  // init
  updateOptions();
});
