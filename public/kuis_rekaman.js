/* kuis_rekaman.js (F65-205): kuis sebuah rekaman di /video/<id>. Tampil HANYA bila admin sudah mengisi bank soalnya; kunci jawaban baru dikirim server sesudah menjawab DAN lulus; sebelum lulus hanya benar atau salah per soal.
   Admin dan super mendapat penyunting soal sederhana (maks 10 soal, 2 sampai 4 pilihan). Nilai terbaik tercatat di akun. */
import { t, angka } from "/i18n.js";
import { esc, ikon, api, galatTeks } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";

if (!document.querySelector('link[href="/kiriman.css"]')) document.head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="/kiriman.css">');
const HURUF = ["A", "B", "C", "D", "E"];

export async function pasangKuisRekaman(el, id) {
  const rid = encodeURIComponent(id);
  let admin = false, soal = [], lulus = 60, sunting = null; // sunting = salinan soal ber-kunci saat penyunting dibuka
  try { admin = ["admin", "super"].includes((await api("/api/saya")).peran); } catch (e) { /* tamu tidak sampai ke halaman ini */ }

  const kuisHtml = () => `<form id="kqF" novalidate><ol class="kr-soal">${soal.map((s, i) => `<li><fieldset><legend>${i + 1}. ${esc(s.q)}</legend>${s.o.map((o, j) => `<label class="kr-op"><input type="radio" name="kq${i}" value="${j}"><span><b>${HURUF[j]}.</b> ${esc(o)}</span></label>`).join("")}</fieldset></li>`).join("")}</ol>
    <p id="kqP" class="kr-pesan" role="status" hidden></p><button type="submit" class="jm-tbl jm-tbl-utama kr-form">${ikon("centang", 16)}<span>${esc(t("kq.periksa"))}</span></button></form>`;
  const barisSunting = (s, i) => `<li class="kr-sunting" data-i="${i}"><label class="kr-f"><span>${esc(t("kq.ed.soal", { n: i + 1 }))}</span><input type="text" data-q maxlength="300" value="${esc(s.q)}"></label>
    ${[0, 1, 2, 3].map((j) => `<label class="kr-f"><span>${esc(t("kq.ed.pilihan", { h: HURUF[j] }))}</span><input type="text" data-o="${j}" maxlength="200" value="${esc(s.o[j] ?? "")}"></label>`).join("")}
    <fieldset class="kr-f"><legend class="sr">${esc(t("kq.ed.benar"))}</legend><span>${esc(t("kq.ed.benar"))}</span><div class="kr-baris-aksi">${[0, 1, 2, 3].map((j) => `<label class="kr-op"><input type="radio" name="kqb${i}" value="${j}"${s.a === j ? " checked" : ""}><span>${HURUF[j]}</span></label>`).join("")}</div></fieldset>
    <button type="button" class="jm-tbl jm-tbl-kecil" data-buang="${i}">${ikon("silang", 14)}<span>${esc(t("kq.ed.buang"))}</span></button></li>`;
  const suntingHtml = () => `<form id="kqEd" class="kr-form" novalidate><p class="kr-catatan">${ikon("info", 16)}<span>${esc(t("kq.ed.aturan"))}</span></p><ol class="kr-soal">${sunting.map(barisSunting).join("")}</ol>
    <p id="kqEdP" class="kr-pesan" role="status" hidden></p><div class="kr-baris-aksi"><button type="button" class="jm-tbl" data-tambah${sunting.length >= 10 ? " disabled" : ""}>${ikon("tambah", 16)}<span>${esc(t("kq.ed.tambah"))}</span></button>
    <button type="submit" class="jm-tbl jm-tbl-utama">${ikon("centang", 16)}<span>${esc(t("kq.ed.simpan"))}</span></button><button type="button" class="jm-tbl" data-batal>${esc(t("kq.ed.batal"))}</button></div></form>`;
  function gambar() {
    if (!soal.length && !admin) { el.innerHTML = ""; return; } // rekaman tanpa bank soal: tidak ada kuis
    const isi = sunting ? suntingHtml() : (soal.length ? kuisHtml() : `<p class="kr-kosong">${ikon("info", 20)}<span>${esc(t("kq.kosong_admin"))}</span></p>`)
      + (admin ? `<div class="kr-form"><button type="button" class="jm-tbl" data-kelola>${ikon("ubah", 16)}<span>${esc(t("kq.ed.buka"))}</span></button></div>` : "");
    el.innerHTML = exHtml({ id: "vid-kuis", ikon: "survei", topik: t("kq.ey"), judulHtml: esc(t("kq.j", { n: angka(soal.length) })), subHtml: esc(t("kq.sub", { n: lulus })), isiHtml: isi });
  }
  const bacaSunting = () => [...el.querySelectorAll(".kr-sunting")].map((li) => {
    const o = [...li.querySelectorAll("[data-o]")].map((x) => x.value.trim()), benar = li.querySelector('input[type=radio]:checked');
    return { q: li.querySelector("[data-q]").value.trim(), o, a: benar ? +benar.value : -1 };
  });
  async function muat() {
    try { const d = await api(`/api/kuis/${rid}`); soal = d.soal; lulus = d.lulus_persen; } catch (e) { soal = []; if (e.kode !== "fitur_belum_aktif" && !admin) { el.innerHTML = ""; return; } }
    gambar();
  }
  const tulis = (p, jenis, teks) => { p.hidden = false; p.className = "kr-pesan " + (jenis === "ok" ? "kr-pesan-ok" : "kr-pesan-bad"); p.textContent = teks; };

  el.addEventListener("click", async (e) => {
    if (e.target.closest("[data-kelola]")) { try { sunting = (await api(`/api/admin/kuis/${rid}`)).soal; } catch (x) { return alert(galatTeks(x.kode)); } if (!sunting.length) sunting = [{ q: "", o: [], a: -1 }]; return gambar(); }
    if (e.target.closest("[data-batal]")) { sunting = null; return gambar(); }
    if (e.target.closest("[data-tambah]")) { sunting = [...bacaSunting(), { q: "", o: [], a: -1 }]; return gambar(); }
    const b = e.target.closest("[data-buang]");
    if (b) { sunting = bacaSunting().filter((_, i) => i !== +b.dataset.buang); return gambar(); }
  });
  el.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tbl = e.target.querySelector("button[type=submit]");
    if (e.target.id === "kqEd") {
      const p = el.querySelector("#kqEdP");
      // pilihan kosong dibuang; jawaban benar harus menunjuk pilihan yang terisi
      const bersih = bacaSunting().filter((s) => s.q || s.o.some(Boolean)).map((s) => { const isi = s.o.map((x, j) => [x, j]).filter(([x]) => x); return { q: s.q, o: isi.map(([x]) => x), a: isi.findIndex(([, j]) => j === s.a) }; });
      if (bersih.some((s) => !s.q || s.o.length < 2 || s.a < 0)) return tulis(p, "bad", t("kq.ed.salah"));
      tbl.disabled = true;
      try { await api(`/api/admin/kuis/${rid}`, { metode: "PUT", badan: { soal: bersih } }); sunting = null; await muat(); } catch (x) { tbl.disabled = false; tulis(p, "bad", galatTeks(x.kode)); }
      return;
    }
    if (e.target.id !== "kqF") return;
    const p = el.querySelector("#kqP"), jawaban = soal.map((_, i) => { const c = e.target.querySelector(`input[name="kq${i}"]:checked`); return c ? +c.value : -1; });
    if (jawaban.includes(-1)) return tulis(p, "bad", t("kq.belum_lengkap"));
    tbl.disabled = true;
    try {
      const r = await api(`/api/kuis/${rid}`, { metode: "POST", badan: { jawaban } });
      soal.forEach((_, i) => e.target.querySelectorAll(`input[name="kq${i}"]`).forEach((inp) => {
        inp.disabled = true; const j = +inp.value, lab = inp.closest(".kr-op");
        // kunci hanya dikirim server bila lulus; bila belum, yang ditandai hanya jawaban sendiri (benar atau salah)
        const benar = r.kunci ? j === r.kunci[i] : j === jawaban[i] && r.hasil[i];
        if (benar) { lab.classList.add("kr-op-benar"); lab.insertAdjacentHTML("beforeend", ` ${ikon("centang", 16)}<span class="sr">${esc(t("kq.benar"))}</span>`); }
        else if (j === jawaban[i]) { lab.classList.add("kr-op-salah"); lab.insertAdjacentHTML("beforeend", ` ${ikon("silang", 16)}<span class="sr">${esc(t("kq.salah"))}</span>`); }
      }));
      tulis(p, r.lulus ? "ok" : "bad", t(r.lulus ? "kq.hasil_lulus" : "kq.hasil_belum", { a: r.benar, b: r.total, p: r.persen, n: lulus }));
      tbl.hidden = true;
      p.insertAdjacentHTML("afterend", `<div class="kr-form"><button type="button" class="jm-tbl" data-batal>${ikon("balik", 16)}<span>${esc(t("kq.ulang"))}</span></button></div>`);
    } catch (x) { tbl.disabled = false; tulis(p, "bad", galatTeks(x.kode)); }
  });
  document.addEventListener("jm:bahasa", gambar);
  await muat();
}
