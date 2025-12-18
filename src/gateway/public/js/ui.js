function ensureToastContainer() {
  let el = document.getElementById("toast-container");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast-container";
    el.className = "fixed top-4 right-4 space-y-2 z-50";
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = "info") {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  const styles = {
    info: "bg-slate-900 border-slate-700 text-slate-100",
    success: "bg-emerald-900 border-emerald-700 text-emerald-100",
    error: "bg-red-900 border-red-700 text-red-100"
  };
  toast.className = `border px-4 py-3 rounded-lg shadow-lg text-sm ${styles[type] || styles.info}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

window.showToast = showToast;
