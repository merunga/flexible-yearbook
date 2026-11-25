const dialog = document.createElement("dialog");
dialog.className = "lightbox";
dialog.innerHTML = '<img alt="">';
document.body.append(dialog);
const img = dialog.querySelector("img");

document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-lightbox]");
  if (a) {
    e.preventDefault();
    img.src = a.href;
    dialog.showModal();
  } else if (e.target === dialog || e.target === img) dialog.close();
});
