// ==============================
//   SAMVI — Fine Jewellery
//   script.js  v3
// ==============================

const WA_NUMBER   = '918291257387';
const STORAGE_KEY = 'samvi_v3_products';

let products    = [];
let pendingImage = null;
let IS_ADMIN     = false; // set by each page

// ─── BOOT ────────────────────────────────────────────────
function initApp(isAdmin) {
  IS_ADMIN = isAdmin;
  loadStorage();
  renderGrid();

  if (isAdmin && document.getElementById('imageInput')) {
    document.getElementById('imageInput')
      .addEventListener('change', handleImageSelect);
  }
}

// ─── STORAGE ─────────────────────────────────────────────
function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    products = raw ? JSON.parse(raw) : [];
  } catch { products = []; }
}

function saveStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    // Storage full — try saving without images as fallback info
    console.warn('Storage quota hit. Consider smaller images.', e);
    alert('⚠️ Storage limit reached. Try using smaller/compressed images.');
  }
}

// ─── ADMIN: TOGGLE FORM ──────────────────────────────────
function toggleForm() {
  const panel = document.getElementById('formPanel');
  const btn   = document.getElementById('toggleBtn');
  const isOpen = panel.classList.toggle('open');
  btn.innerHTML = isOpen
    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close Form`
    : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Product`;
  if (isOpen) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── ADMIN: IMAGE PREVIEW ────────────────────────────────
function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    pendingImage = ev.target.result;
    const preview = document.getElementById('imgPreview');
    const label   = document.getElementById('uploadLabel');
    preview.src = pendingImage;
    preview.classList.remove('hidden');
    label.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ─── ADMIN: ADD PRODUCT ──────────────────────────────────
function addProduct() {
  const name  = document.getElementById('pName').value.trim();
  const desc  = document.getElementById('pDesc').value.trim();   // optional
  const price = document.getElementById('pPrice').value.trim();
  const qtyRaw = document.getElementById('pQty') ? document.getElementById('pQty').value.trim() : '';
  const errEl = document.getElementById('formErr');

  // Only name, price, image are required
  if (!name || !price || !pendingImage) {
    errEl.classList.remove('hidden');
    errEl.textContent = 'Please enter Product Name, Price and upload an Image.';
    setTimeout(() => errEl.classList.add('hidden'), 3500);
    return;
  }

  errEl.classList.add('hidden');

  const product = {
    id:    Date.now(),
    name,
    desc,                           // may be empty string — that's fine
    price: parseFloat(price),
    qty:   qtyRaw !== '' ? parseInt(qtyRaw, 10) : null,  // null = not set
    image: pendingImage,
  };

  products.unshift(product);
  saveStorage();
  renderGrid();
  resetForm();

  // Close form and scroll down to catalogue
  const panel = document.getElementById('formPanel');
  if (panel.classList.contains('open')) toggleForm();
  setTimeout(() => {
    document.getElementById('catalogueSection')
      .scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 350);
}

function resetForm() {
  document.getElementById('pName').value  = '';
  document.getElementById('pDesc').value  = '';
  document.getElementById('pPrice').value = '';
  if (document.getElementById('pQty')) document.getElementById('pQty').value = '';
  const preview = document.getElementById('imgPreview');
  preview.src = ''; preview.classList.add('hidden');
  document.getElementById('uploadLabel').style.display = '';
  document.getElementById('imageInput').value = '';
  pendingImage = null;
}

// ─── DELETE PRODUCT ──────────────────────────────────────
function deleteProduct(id) {
  if (!confirm('Remove this product from your catalogue?')) return;
  products = products.filter(p => p.id !== id);
  saveStorage();
  renderGrid();
}

// ─── RENDER GRID ─────────────────────────────────────────
function renderGrid() {
  const grid  = document.getElementById('catGrid');
  const empty = document.getElementById('emptyState');
  if (!grid) return;

  grid.innerHTML = '';

  if (products.length === 0) {
    empty && empty.classList.add('show');
    return;
  }
  empty && empty.classList.remove('show');

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'p-card';

    // Qty badge (shown if qty is set)
    const qtyBadge = (p.qty !== null && p.qty !== undefined)
      ? `<div class="qty-badge">Qty: ${p.qty}</div>`
      : '';

    // Delete button (admin only, top-right corner)
    const delBtn = IS_ADMIN
      ? `<button class="btn-del-card" onclick="deleteProduct(${p.id})" title="Delete product">✕</button>`
      : '';

    // Description (only show if not empty)
    const descHtml = p.desc
      ? `<div class="p-desc">${esc(p.desc)}</div>`
      : '';

    card.innerHTML = `
      ${qtyBadge}
      ${delBtn}
      <div class="p-img-wrap">
        ${p.image
          ? `<img src="${p.image}" alt="${esc(p.name)}" loading="lazy" />`
          : `<div class="p-img-empty">💎</div>`}
      </div>
      <div class="p-body">
        <div class="p-name">${esc(p.name)}</div>
        ${descHtml}
        <div class="p-price">${fmtPrice(p.price)}</div>
        <a href="${waLink(p.name, p.price)}" target="_blank" class="btn-wa">
          ${waIconSVG()} Order on WhatsApp
        </a>
      </div>`;
    grid.appendChild(card);
  });
}

// ─── WHATSAPP ─────────────────────────────────────────────
function waLink(name, price) {
  const msg = encodeURIComponent(
    `Hello SAMVI,\nI want to order this product:\nProduct Name: ${name}\nPrice: ${fmtPrice(price)}`
  );
  return `https://wa.me/${WA_NUMBER}?text=${msg}`;
}

function waIconSVG() {
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
}

// ─── FORMATTING ───────────────────────────────────────────
function fmtPrice(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}
function esc(str) {
  if (!str) return '';
  if (str.startsWith('data:')) return str;
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ─── PDF EXPORT ───────────────────────────────────────────
// Layout: ONE product per page, full-bleed image, info strip at bottom
async function downloadPDF() {
  if (products.length === 0) {
    alert('Please add at least one product first.');
    return;
  }

  const overlay = document.getElementById('pdfOverlay');
  overlay.classList.remove('hidden');
  await new Promise(r => setTimeout(r, 80));

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = 210, PH = 297;

    const C = {
      cream:  [253,248,243],
      rose:   [245,237,230],
      gold:   [184,132,58],
      goldL:  [212,165,92],
      dark:   [30,18,10],
      brown:  [107,66,38],
      muted:  [122,92,66],
      border: [220,195,175],
      white:  [255,255,255],
      green:  [34,197,94],
    };

    // ══════════════════════════
    //  PAGE 1 — COVER
    // ══════════════════════════
    doc.setFillColor(...C.cream);
    doc.rect(0, 0, PW, PH, 'F');

    // Dark top + bottom bars
    doc.setFillColor(...C.dark);
    doc.rect(0, 0, PW, 14, 'F');
    doc.rect(0, PH - 14, PW, 14, 'F');

    // Gold accent lines
    doc.setFillColor(...C.gold);
    doc.rect(0, 14, PW, 1, 'F');
    doc.rect(0, PH - 15, PW, 1, 'F');

    // Soft decorative circle
    doc.setFillColor(...C.rose);
    doc.circle(PW / 2, PH / 2 - 14, 72, 'F');

    // Brand name
    doc.setFont('times', 'normal');
    doc.setFontSize(62);
    doc.setTextColor(...C.dark);
    doc.text('SAMVI', PW / 2, PH / 2 - 14, { align: 'center' });

    // Gold divider line
    doc.setDrawColor(...C.gold);
    doc.setLineWidth(0.7);
    doc.line(PW / 2 - 32, PH / 2 - 3, PW / 2 + 32, PH / 2 - 3);

    // Tagline
    doc.setFont('times', 'italic');
    doc.setFontSize(14);
    doc.setTextColor(...C.muted);
    doc.text('Fine Jewellery', PW / 2, PH / 2 + 8, { align: 'center' });

    // Collection year + count
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C.muted);
    doc.text(
      `Collection ${new Date().getFullYear()}   ·   ${products.length} Exclusive Piece${products.length > 1 ? 's' : ''}`,
      PW / 2, PH / 2 + 20, { align: 'center' }
    );

    // Footer ornament
    doc.setFont('times', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...C.gold);
    doc.text('✦    ✦    ✦', PW / 2, PH - 21, { align: 'center' });

    // ══════════════════════════
    //  ONE PRODUCT PER PAGE
    //  Full-bleed image top ~75%
    //  Info strip bottom ~25%
    // ══════════════════════════
    const IMG_H   = PH * 0.72;   // image fills top 72% of page
    const INFO_Y  = IMG_H;       // info strip starts here
    const INFO_H  = PH - IMG_H;  // remaining space
    const PAD     = 10;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      doc.addPage();

      // ── Full-bleed product image ──
      if (p.image) {
        try {
          const fmt = p.image.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(p.image, fmt, 0, 0, PW, IMG_H, undefined, 'FAST');
        } catch {
          doc.setFillColor(...C.rose);
          doc.rect(0, 0, PW, IMG_H, 'F');
          doc.setFont('times', 'normal'); doc.setFontSize(28);
          doc.setTextColor(...C.border);
          doc.text('💎', PW / 2, IMG_H / 2, { align: 'center' });
        }
      } else {
        doc.setFillColor(...C.rose);
        doc.rect(0, 0, PW, IMG_H, 'F');
      }

      // Subtle gradient overlay at bottom of image (for readability transition)
      // Draw a semi-transparent rect — jsPDF doesn't support true gradients, use layered rects
      for (let g = 0; g < 20; g++) {
        const alpha = g / 20;
        const gy = IMG_H - 24 + g * 1.2;
        doc.setFillColor(253, 248, 243);
        doc.setGState(doc.GState({ opacity: alpha * 0.7 }));
        doc.rect(0, gy, PW, 1.5, 'F');
      }
      doc.setGState(doc.GState({ opacity: 1 })); // reset opacity

      // ── Small SAMVI branding on image (top-left) ──
      doc.setFillColor(...C.dark);
      doc.setFillColor(30, 18, 10);
      doc.roundedRect(PAD, PAD, 36, 10, 2, 2, 'F');
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...C.gold);
      doc.text('SAMVI', PAD + 18, PAD + 7, { align: 'center' });

      // Page number (top-right)
      doc.setFillColor(...C.dark);
      doc.roundedRect(PW - PAD - 20, PAD, 20, 10, 2, 2, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...C.gold);
      doc.text(`${i + 1} / ${products.length}`, PW - PAD - 10, PAD + 7, { align: 'center' });

      // ── INFO STRIP ────────────────────────────────
      doc.setFillColor(...C.cream);
      doc.rect(0, INFO_Y, PW, INFO_H, 'F');

      // Gold top rule
      doc.setFillColor(...C.gold);
      doc.rect(0, INFO_Y, PW, 0.8, 'F');

      let ty = INFO_Y + 10;

      // Product name
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...C.dark);
      const nameLines = doc.splitTextToSize(p.name, PW - PAD * 2).slice(0, 2);
      doc.text(nameLines, PAD, ty);
      ty += nameLines.length * 7.5;

      // Description (if available)
      if (p.desc) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...C.muted);
        const descLines = doc.splitTextToSize(p.desc, PW - PAD * 2).slice(0, 2);
        doc.text(descLines, PAD, ty);
        ty += descLines.length * 4.5 + 1;
      }

      // Qty (if set)
      if (p.qty !== null && p.qty !== undefined) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...C.muted);
        doc.text(`Available Qty: ${p.qty}`, PAD, ty);
        ty += 5;
      }

      // Price — large, gold
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...C.gold);
      doc.text(fmtPrice(p.price), PAD, ty + 4);

      // WhatsApp clickable button — right side of strip
      const btnW = 58, btnH = 12;
      const btnX = PW - PAD - btnW;
      const btnY = INFO_Y + INFO_H - PAD - btnH;

      doc.setFillColor(...C.green);
      doc.roundedRect(btnX, btnY, btnW, btnH, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('Order on WhatsApp', btnX + btnW / 2, btnY + 7.5, { align: 'center' });

      const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
        `Hello SAMVI,\nI want to order this product:\nProduct Name: ${p.name}\nPrice: ${fmtPrice(p.price)}`
      )}`;
      doc.link(btnX, btnY, btnW, btnH, { url: waUrl });

      // Bottom dark bar
      doc.setFillColor(...C.dark);
      doc.rect(0, PH - 6, PW, 6, 'F');
    }

    doc.save(`SAMVI_Catalogue_${new Date().toISOString().slice(0,10)}.pdf`);

  } catch (err) {
    console.error('PDF error:', err);
    alert('PDF generation failed. Please try again.');
  } finally {
    overlay.classList.add('hidden');
  }
}
