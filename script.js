const $ = (id) => document.getElementById(id);

const form = $("paymentForm");
const totalInput = $("totalAmount");
const splitInput = $("splitAmount");

function money(n) {
  return new Intl.NumberFormat("en-IN", {style:"currency", currency:"INR", maximumFractionDigits:2}).format(n);
}
function clearErrors() {
  document.querySelectorAll(".error").forEach(e => e.textContent = "");
}
function updatePreview() {
  const total = parseFloat(totalInput.value);
  const split = parseFloat(splitInput.value);
  if (!(total > 0) || !(split > 0)) {
    $("previewText").textContent = "Enter amounts to preview";
    $("previewTotal").textContent = "—";
    return;
  }
  const full = Math.floor((total + 1e-9) / split);
  const remainder = Math.round((total - full * split) * 100) / 100;
  const count = full + (remainder > 0.001 ? 1 : 0);
  $("previewText").textContent = `${full} × ${money(split)}${remainder > 0.001 ? ` + ${money(remainder)}` : ""} • ${count} QR${count === 1 ? "" : "s"}`;
  $("previewTotal").textContent = money(total);
}
totalInput.addEventListener("input", updatePreview);
splitInput.addEventListener("input", updatePreview);

function validUpi(value) {
  return /^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}$/.test(value.trim());
}
function buildUpiUrl(upi, name, amount, note) {
  const params = new URLSearchParams({pa: upi, pn: name, am: amount.toFixed(2), cu: "INR"});
  if (note) params.set("tn", note);
  return "upi://pay?" + params.toString();
}
function makeReceiptNo() {
  const d = new Date();
  const stamp = d.getFullYear().toString().slice(-2) +
    String(d.getMonth()+1).padStart(2,"0") +
    String(d.getDate()).padStart(2,"0");
  return "SU-" + stamp + "-" + Math.random().toString(36).slice(2,7).toUpperCase();
}
function formatDate(d) {
  return d.toLocaleString("en-IN", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearErrors();
  const upi = $("upiId").value.trim();
  const name = $("holderName").value.trim();
  const total = parseFloat(totalInput.value);
  const split = parseFloat(splitInput.value);
  const note = $("note").value.trim();
  let ok = true;

  if (!validUpi(upi)) { $("upiError").textContent = "Enter a valid UPI ID, e.g. name@bank"; ok = false; }
  if (name.length < 2) { $("nameError").textContent = "Enter the account holder name"; ok = false; }
  if (!(total > 0)) { $("totalError").textContent = "Enter a valid total amount"; ok = false; }
  if (!(split > 0)) { $("splitError").textContent = "Enter a valid split amount"; ok = false; }
  if (total > 0 && split > total) { $("splitError").textContent = "Split amount cannot exceed total amount"; ok = false; }
  if (!ok) return;

  const totalCents = Math.round(total * 100);
  const splitCents = Math.round(split * 100);
  const amounts = [];
  let remaining = totalCents;
  while (remaining >= splitCents) {
    amounts.push(splitCents / 100);
    remaining -= splitCents;
  }
  if (remaining > 0) amounts.push(remaining / 100);

  $("outName").textContent = name;
  $("outUpi").textContent = upi;
  $("outTotal").textContent = money(total);
  $("resultSummary").textContent = `${amounts.length} QR codes • ${money(total)} total`;
  $("qrGrid").innerHTML = "";

  amounts.forEach((amount, index) => {
    const card = document.createElement("article");
    card.className = "qr-card" + (index === amounts.length - 1 && amount !== split ? " final" : "");
    const label = index === amounts.length - 1 && amount !== split ? "Final payment" : `Payment ${index+1}`;
    card.innerHTML = `<div class="qr-label">${label}</div><div class="qr-amount">${money(amount)}</div><div class="qr-box"></div><button class="secondary-btn download-qr">Download QR</button>`;
    $("qrGrid").appendChild(card);
    const box = card.querySelector(".qr-box");
    new QRCode(box, {text: buildUpiUrl(upi,name,amount,note), width:220, height:220, correctLevel:QRCode.CorrectLevel.M});
    card.querySelector(".download-qr").addEventListener("click", () => {
      const img = box.querySelector("img") || box.querySelector("canvas");
      const link = document.createElement("a");
      link.download = `SplitUPI-${index+1}-${amount.toFixed(2)}.png`;
      link.href = img.tagName === "CANVAS" ? img.toDataURL("image/png") : img.src;
      link.click();
    });
  });

  $("receiptNo").textContent = makeReceiptNo();
  $("receiptDate").textContent = formatDate(new Date());
  $("receiptName").textContent = name;
  $("receiptUpi").textContent = upi;
  $("receiptNote").textContent = note;
  $("receiptNoteWrap").style.display = note ? "block" : "none";
  $("receiptTotal").textContent = money(total);
  $("receiptRows").innerHTML = amounts.map((a,i) => `<tr><td>${i === amounts.length-1 && a !== split ? "Final payment" : "Payment " + (i+1)}</td><td>${money(a)}</td></tr>`).join("");

  $("results").classList.remove("hidden");
  $("results").scrollIntoView({behavior:"smooth", block:"start"});
});

$("printBtn").addEventListener("click", () => window.print());
$("printQrsBtn").addEventListener("click", () => {
  const original = $("receipt").style.display;
  $("receipt").style.display = "none";
  window.print();
  $("receipt").style.display = original;
});
$("newPayment").addEventListener("click", () => {
  $("results").classList.add("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
});