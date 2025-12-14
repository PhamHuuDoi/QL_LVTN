document.addEventListener("DOMContentLoaded", function() {
    const alerts = document.querySelectorAll('.show-alert');

    alerts.forEach(alert => {
        const time = parseInt(alert.dataset.time) || 30000; // default 30s

        setTimeout(() => {
            alert.classList.add("hide");
        }, time);

        // Xóa khỏi DOM sau khi fade-out
        setTimeout(() => {
            alert.remove();
        }, time + 600);
    });
});
