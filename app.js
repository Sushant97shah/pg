const NOT_LISTED = "Not listed";
const baseDataset = Array.isArray(window.BANGALORE_PGS) ? window.BANGALORE_PGS : [];
const stays = baseDataset.map((pg, index) => ({
  ...pg,
  id: pg.id || index + 1,
  name: pg.name || NOT_LISTED,
  location: `${pg.area || pg.locality || "Bengaluru"}, Bengaluru`,
  type: pg.type || "pg",
  rent: pg.priceSingleSharing || NOT_LISTED,
  rooms: "Single / Double / Triple / 4 Sharing",
  amenities: Array.isArray(pg.amenities) && pg.amenities.length ? pg.amenities : [NOT_LISTED],
  image: pg.coverImage || pg.image || "",
  verified: pg.verified === true
}));
const grid = document.querySelector("#listing-grid");
const empty = document.querySelector("#empty-state");
let activeFilter = "all";
const typeName = (type) => type === "co-living" ? "Co-living" : type === "pg" ? "PG" : "Hostel";
const display = (value) => value === undefined || value === null || value === "" ? NOT_LISTED : value;
const money = (value) => typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : display(value);
const escapeHtml = (value) => String(display(value)).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const googleReviews = (stay) => stay.reviews > 0 && stay.rating ? `★ ${stay.rating} · ${stay.reviews.toLocaleString("en-IN")} Google reviews` : "Google reviews: Not listed";

function render() {
  const query = (document.querySelector("#filter-location")?.value || "").toLowerCase();
  const budget = Number(document.querySelector("#hero-search [name=budget]")?.value || 0);
  const sort = document.querySelector("#sort-stays")?.value;
  let items = stays.filter((stay) =>
    (activeFilter === "all" || stay.type === activeFilter) &&
    `${stay.name} ${stay.location}`.toLowerCase().includes(query) &&
    (!budget || typeof stay.rent !== "number" || stay.rent <= budget)
  );
  if (sort === "price") items.sort((a, b) => (typeof a.rent === "number" ? a.rent : Infinity) - (typeof b.rent === "number" ? b.rent : Infinity));
  if (sort === "rating") items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  grid.innerHTML = items.map((stay) => `<article class="listing-card" data-id="${stay.id}">
    <div class="listing-image" ${stay.image ? `style="background-image:url('${stay.image}')"` : ""}>
      ${stay.verified ? '<span class="badge">✓ GOOGLE LISTING</span>' : ""}
      <button class="heart" aria-label="Save stay">♡</button>
    </div>
    <div class="listing-info"><h3>${escapeHtml(stay.name)}</h3>
      <div class="location">⌖ ${escapeHtml(stay.location)}</div>
      <div class="card-meta"><span>${typeName(stay.type)}</span><span>•</span><span>${stay.rooms}</span></div>
      <div class="card-bottom"><div class="price">${money(stay.rent)} <small>${typeof stay.rent === "number" ? "/ month" : ""}</small></div><div class="rating">${googleReviews(stay)}</div></div>
    </div></article>`).join("");
  empty.classList.toggle("hidden", items.length > 0);
  grid.querySelectorAll(".listing-card").forEach((card) => card.addEventListener("click", (event) => {
    if (!event.target.closest(".heart")) showDetail(Number(card.dataset.id));
  }));
}

function openModal(html) {
  document.querySelector("#modal-content").innerHTML = `<button class="modal-close" data-action="close">×</button>${html}`;
  document.querySelector("#modal").classList.remove("hidden");
}

function showDetail(id) {
  const stay = stays.find((item) => item.id === id);
  if (!stay) return;
  const cover = stay.coverImage || stay.image;
  const gallery = Array.isArray(stay.gallery) ? stay.gallery.filter(Boolean) : [];
  const prices = stay.prices || {};
  const reviews = JSON.parse(localStorage.getItem(`reviews-${stay.id}`) || "[]");
  const reviewMarkup = reviews.length ? reviews.map((review) => `<li><strong>${escapeHtml(review.name)}</strong> · ${"★".repeat(review.rating)}<br>${escapeHtml(review.text)}</li>`).join("") : `<li>${NOT_LISTED}</li>`;
  const imageMarkup = cover ? `<img src="${cover}" alt="${escapeHtml(stay.name)}">` : `<div class="missing-image">${NOT_LISTED}</div>`;
  openModal(`<div class="detail-head">${imageMarkup}<div><span class="eyebrow">GOOGLE PLACES LISTING</span><h2>${escapeHtml(stay.name)}</h2>
    <p class="location">⌖ ${escapeHtml(stay.address || stay.location)}</p><p class="rating">${googleReviews(stay)}</p>
    <p class="location">Area: ${escapeHtml(stay.area || stay.locality)} · Pincode: ${escapeHtml(stay.pincode)} · Landmark: ${escapeHtml(stay.nearestLandmark)}</p>
    <p class="contact-top"><strong>Contact:</strong> ${escapeHtml(stay.contactNumber || stay.phone)}</p>
  </div></div>
  ${gallery.length ? `<div class="photo-gallery">${gallery.map((image) => `<img src="${image}" alt="${escapeHtml(stay.name)}" class="photo-thumb">`).join("")}</div>` : ""}
  <div class="amenities">${(stay.amenities || [NOT_LISTED]).map((item) => `<span>✓ ${escapeHtml(item)}</span>`).join("")}</div>
  <div class="booking-box"><h3>Pricing & house details</h3><div class="booking-grid">
    <label>Single sharing<input value="${money(prices.singleSharing || stay.priceSingleSharing)}" readonly></label>
    <label>Double sharing<input value="${money(prices.doubleSharing || stay.priceDoubleSharing)}" readonly></label>
    <label>Triple sharing<input value="${money(prices.tripleSharing || stay.priceTripleSharing)}" readonly></label>
    <label>4 sharing<input value="${money(prices.fourSharing || stay.priceFourSharing)}" readonly></label>
    <label>Meals<input value="${escapeHtml(stay.meals)}" readonly></label><label>Deposit<input value="${money(stay.deposit)}" readonly></label>
  </div><p class="location">Gym: <strong>${escapeHtml(stay.gym)}</strong> · Parking: <strong>${escapeHtml(stay.parking)}</strong></p>
  <a class="btn btn-dark" href="${stay.googleMapUrl || "#"}" target="_blank" rel="noopener noreferrer">Open in Google Maps →</a></div>
  <div class="booking-box"><h3>Leave a review</h3><form id="review-form" class="booking-grid">
    <label>Your name<input required name="name" maxlength="60"></label><label>Rating<select required name="rating"><option value="">Select</option><option value="5">★★★★★</option><option value="4">★★★★</option><option value="3">★★★</option><option value="2">★★</option><option value="1">★</option></select></label>
    <label class="wide-field">Your review<textarea required name="text" maxlength="500" rows="3"></textarea></label><button class="btn btn-dark">Submit review</button>
  </form></div>
  <div class="booking-box"><h3>User reviews</h3><ul class="review-list">${reviewMarkup}</ul></div>`);
  document.querySelector("#review-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const current = JSON.parse(localStorage.getItem(`reviews-${stay.id}`) || "[]");
    current.push({ name: form.get("name"), rating: Number(form.get("rating")), text: form.get("text") });
    localStorage.setItem(`reviews-${stay.id}`, JSON.stringify(current));
    showDetail(stay.id);
  });
}

document.querySelector("#hero-search").addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.target); document.querySelector("#filter-location").value = form.get("location"); activeFilter = form.get("type") || "all"; render(); document.querySelector("#explore").scrollIntoView({ behavior: "smooth" }); });
document.querySelector("#filter-location").addEventListener("input", render);
document.querySelector("#sort-stays").addEventListener("change", render);
document.querySelectorAll(".filter-chip").forEach((button) => button.addEventListener("click", () => { activeFilter = button.dataset.filter; document.querySelectorAll(".filter-chip").forEach((item) => item.classList.toggle("active", item === button)); render(); }));
document.addEventListener("click", (event) => { if (event.target.closest("[data-action=close]") || event.target.id === "modal") document.querySelector("#modal").classList.add("hidden"); });
render();
