(() => {
  "use strict";

  const STORAGE_KEY = "student-management:data";
  const PER_PAGE = 5;

  // --- Data -----------------------------------------------------------------
  const seed = [
    ["231001", "Andi Pratama", "Informatika", "andi@mail.com"],
    ["231002", "Siti Aisyah", "Sistem Informasi", "siti@mail.com"],
    ["231003", "Budi Santoso", "Teknik Komputer", "budi@mail.com"],
    ["231004", "Nina Marlina", "Manajemen", "nina@mail.com"],
    ["231005", "Rizky Pratama", "Informatika", "rizky@mail.com"]
  ].map(([nim, nama, jurusan, email]) => ({ nim, nama, jurusan, email }));

  // Fill up to 50 sample records so pagination matches the mockup.
  const firstNames = ["Dewi", "Agus", "Rina", "Fajar", "Maya", "Hendra", "Lestari", "Bayu", "Putri", "Eko"];
  const lastNames = ["Wijaya", "Kusuma", "Hartono", "Saputra", "Utami"];
  const majors = ["Informatika", "Sistem Informasi", "Teknik Komputer", "Manajemen"];
  for (let i = seed.length; i < 50; i++) {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[Math.floor(i / 2) % lastNames.length];
    seed.push({
      nim: String(231001 + i),
      nama: `${first} ${last}`,
      jurusan: majors[i % majors.length],
      email: `${first.toLowerCase()}${i}@mail.com`
    });
  }

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable: fall back to seed */ }
    return seed.slice();
  };
  const persist = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(students)); } catch (e) { /* ignore */ }
  };

  let students = load();
  let page = 1;
  let query = "";

  // --- Elements -------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const form = $("studentForm");
  const fields = { nim: $("nim"), nama: $("nama"), jurusan: $("jurusan"), email: $("email") };
  const editId = $("editId");
  const body = $("studentBody");
  const info = $("info");
  const pagination = $("pagination");
  const search = $("search");

  const icons = {
    edit: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
    del: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'
  };

  const escapeHTML = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // --- Render ---------------------------------------------------------------
  const filtered = () => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.nim, s.nama, s.jurusan, s.email].some((v) => v.toLowerCase().includes(q))
    );
  };

  function render() {
    const data = filtered();
    const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
    page = Math.min(page, totalPages);
    const start = (page - 1) * PER_PAGE;
    const rows = data.slice(start, start + PER_PAGE);

    body.innerHTML = rows.length
      ? rows.map((s, i) => `
        <tr>
          <td>${start + i + 1}</td>
          <td>${escapeHTML(s.nim)}</td>
          <td>${escapeHTML(s.nama)}</td>
          <td>${escapeHTML(s.jurusan)}</td>
          <td>${escapeHTML(s.email)}</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn edit" data-edit="${escapeHTML(s.nim)}" aria-label="Edit ${escapeHTML(s.nama)}">${icons.edit}</button>
              <button class="icon-btn delete" data-delete="${escapeHTML(s.nim)}" aria-label="Hapus ${escapeHTML(s.nama)}">${icons.del}</button>
            </div>
          </td>
        </tr>`).join("")
      : '<tr><td class="empty" colspan="6">Tidak ada data yang cocok. Ubah kata kunci pencarian.</td></tr>';

    info.textContent = data.length
      ? `Menampilkan ${start + 1} - ${start + rows.length} dari ${data.length} data`
      : "Menampilkan 0 data";

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    const windowSize = 3;
    let from = Math.max(1, page - 1);
    let to = Math.min(totalPages, from + windowSize - 1);
    from = Math.max(1, to - windowSize + 1);

    let html = `<button class="page-btn" data-page="${page - 1}" ${page === 1 ? "disabled" : ""} aria-label="Sebelumnya">«</button>`;
    for (let p = from; p <= to; p++) {
      html += `<button class="page-btn ${p === page ? "active" : ""}" data-page="${p}">${p}</button>`;
    }
    html += `<button class="page-btn" data-page="${page + 1}" ${page === totalPages ? "disabled" : ""} aria-label="Berikutnya">»</button>`;
    pagination.innerHTML = html;
  }

  // --- Form helpers ---------------------------------------------------------
  function setError(name, message) {
    $(name + "Error").textContent = message;
    fields[name].classList.toggle("invalid", Boolean(message));
  }

  function clearErrors() {
    Object.keys(fields).forEach((n) => setError(n, ""));
  }

  function resetForm() {
    form.reset();
    editId.value = "";
    $("formTitle").textContent = "Form Student";
    fields.nim.readOnly = false;
    clearErrors();
  }

  function validate() {
    clearErrors();
    let ok = true;
    const v = {
      nim: fields.nim.value.trim(),
      nama: fields.nama.value.trim(),
      jurusan: fields.jurusan.value,
      email: fields.email.value.trim()
    };
    if (!/^\d{4,}$/.test(v.nim)) { setError("nim", "NIM harus berupa angka, minimal 4 digit."); ok = false; }
    else if (!editId.value && students.some((s) => s.nim === v.nim)) { setError("nim", "NIM sudah terdaftar."); ok = false; }
    if (!v.nama) { setError("nama", "Nama lengkap wajib diisi."); ok = false; }
    if (!v.jurusan) { setError("jurusan", "Pilih salah satu jurusan."); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { setError("email", "Format email belum benar, contoh: nama@mail.com."); ok = false; }
    return ok ? v : null;
  }

  // --- Events ---------------------------------------------------------------
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = validate();
    if (!v) return;

    if (editId.value) {
      students = students.map((s) => (s.nim === editId.value ? v : s));
    } else {
      students.push(v);
      page = Math.ceil(filtered().length / PER_PAGE); // jump to the new row
    }
    persist();
    resetForm();
    render();
  });

  $("btnCancel").addEventListener("click", resetForm);
  form.addEventListener("reset", () => setTimeout(resetForm, 0));

  body.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit]");
    const delBtn = e.target.closest("[data-delete]");

    if (editBtn) {
      const s = students.find((x) => x.nim === editBtn.dataset.edit);
      if (!s) return;
      clearErrors();
      fields.nim.value = s.nim;
      fields.nim.readOnly = true;
      fields.nama.value = s.nama;
      fields.jurusan.value = s.jurusan;
      fields.email.value = s.email;
      editId.value = s.nim;
      $("formTitle").textContent = "Edit Student";
      fields.nama.focus();
    }

    if (delBtn) {
      const s = students.find((x) => x.nim === delBtn.dataset.delete);
      if (s && confirm(`Hapus data ${s.nama}?`)) {
        students = students.filter((x) => x.nim !== s.nim);
        if (editId.value === s.nim) resetForm();
        persist();
        render();
      }
    }
  });

  pagination.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    page = Number(btn.dataset.page);
    render();
  });

  const runSearch = () => { query = search.value; page = 1; render(); };
  search.addEventListener("input", runSearch);
  $("btnSearch").addEventListener("click", runSearch);

  render();
})();