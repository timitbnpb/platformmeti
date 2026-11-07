/* Pemilih cantik (ES module): <select> asli tetap sumber kebenaran (tersembunyi, event change), tampilannya tombol pil berikon + menu kartu.
   Menu posisi fixed supaya tidak terpotong kartu overflow:hidden. Dikecualikan dengan atribut data-asli.
   Ikon: data-ikon pada <select> (bawaan semua opsi) atau pada <option>. Nilai: "nama" sprite, "tek:kode", "st:kode", "prov:kode-BPS" (11, 12, ...; lambang di /img/provinsi). */
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { IKON_TEK, pilStatus } from "/inti/ikon_tek.js";

export const AMBANG_CARI = 12;
const SVG = /<svg[\s\S]*<\/svg>/;

/** Ikon sebuah spesifikasi menjadi HTML kecil (18px). Kosong bila tak dikenal. */
export function ikonHtml(spec) {
  if (!spec) return "";
  const [jenis, nilai] = spec.includes(":") ? spec.split(/:(.*)/s) : ["", spec];
  if (jenis === "tek") return IKON_TEK[nilai] || "";
  if (jenis === "st") return (SVG.exec(pilStatus(nilai)) || [""])[0];
  if (jenis === "prov") {
    const k = /^\d+$/.test(nilai) ? nilai : null;
    return k
      ? `<img class="pc-lb" src="/img/provinsi/${esc(k)}.png" width="18" height="18" alt="" loading="lazy" decoding="async">`
      : "";
  }
  return ikon(nilai, 18);
}

/** Model opsi dari <select> (atau objek tiruan {options:[{...}]} di uji): [{i, label, ikon, n, selected, disabled, grup}] */
export function modelOpsi(sel) {
  const dasar = sel.dataset?.ikon || "";
  return [...sel.options].map((o, i) => ({
    i,
    label: o.textContent,
    ikon: o.dataset?.ikon || dasar,
    n: o.dataset?.n ?? "",
    selected: o.selected,
    disabled: o.disabled,
    grup: o.parentElement?.tagName === "OPTGROUP" ? o.parentElement.label : "",
  }));
}

/** HTML isi menu (tanpa kolom cari). */
export function menuHtml(model) {
  let g = "";
  return model
    .map((o) => {
      const judul =
        o.grup && o.grup !== g
          ? `<div class="pc-grup" role="presentation">${esc(o.grup)}</div>`
          : "";
      g = o.grup;
      return `${judul}<button type="button" role="option" class="pc-opsi" data-i="${o.i}" aria-selected="${!!o.selected}"${o.disabled ? " disabled" : ""}><span class="pc-ik">${ikonHtml(o.ikon)}</span><span class="pc-lab">${esc(o.label)}</span>${o.n !== "" ? `<span class="pc-n">${esc(o.n)}</span>` : ""}<svg class="pc-cek" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg></button>`;
    })
    .join("");
}

const semua = (o) => o.value === "" || o.value === "semua";
const nilaiMulti = (sel) => [...sel.selectedOptions].filter((o) => !semua(o));
const potongKurung = (s) => s.replace(/\s*\(.*\)$/, "");

/** Teks dan ikon tombol sesuai pilihan sekarang. */
export function labelTombol(sel) {
  const dasar = sel.dataset.ikon || "";
  if (!sel.multiple) {
    const o = sel.selectedOptions[0];
    return { teks: o?.textContent || "", ikon: o?.dataset.ikon || dasar };
  }
  const P = nilaiMulti(sel),
    s = [...sel.options].find(semua);
  return {
    teks: !P.length
      ? potongKurung(s?.textContent || t("pilih.pilih"))
      : P.length === 1
        ? potongKurung(P[0].textContent)
        : t("pilih.n_dipilih", { n: P.length }),
    ikon: P.length === 1 ? P[0].dataset.ikon || dasar : dasar,
  };
}

const Pilih = {
  buka: null,
  label(sel) {
    const w = sel.closest(".pc"),
      b = w?.querySelector(".pc-btn");
    if (!b) return;
    const l = labelTombol(sel);
    b.querySelector(".pc-t").textContent = l.teks;
    b.querySelector(".pc-i").innerHTML = ikonHtml(l.ikon);
    b.title = l.teks;
  },
  hias(sel) {
    if (sel.dataset.cantik || sel.hasAttribute("data-asli")) return;
    sel.dataset.cantik = 1;
    let w = sel.parentElement;
    if (w.matches("label.jm-pil-pilih")) {
      w.classList.add("pc", "pc-pil");
      w.querySelector(":scope>.jm-ik")?.remove();
    } else {
      w = document.createElement("div");
      w.className = "pc";
      sel.before(w);
      w.append(sel);
    }
    if (sel.multiple) w.classList.add("pc-multi");
    sel.tabIndex = -1;
    sel.setAttribute("aria-hidden", "true");
    const nama =
      sel.getAttribute("aria-label") ||
      sel.closest("label")?.querySelector(".sr")?.textContent ||
      sel.title ||
      t("pilih.pilih");
    w.insertAdjacentHTML(
      "beforeend",
      `<button type="button" class="pc-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(nama)}"><span class="pc-i"></span><span class="pc-t"></span><i class="pc-chev"></i></button>`,
    );
    this.label(sel);
    new MutationObserver(() => this.label(sel)).observe(sel, {
      childList: true,
      subtree: true,
    });
  },
  tutup() {
    this.buka?.remove();
    this.buka = null;
    document.querySelectorAll(".pc.on").forEach((x) => {
      x.classList.remove("on");
      x.querySelector(".pc-btn")?.setAttribute("aria-expanded", "false");
    });
  },
  bukaMenu(w) {
    this.tutup();
    const sel = w.querySelector("select"),
      r = w.getBoundingClientRect();
    w.classList.add("on");
    w.querySelector(".pc-btn").setAttribute("aria-expanded", "true");
    const m = document.createElement("div");
    m.className = "pc-menu" + (sel.multiple ? " multi" : "");
    m.setAttribute("role", "listbox");
    m.setAttribute(
      "aria-label",
      w.querySelector(".pc-btn").getAttribute("aria-label"),
    );
    if (sel.multiple) m.setAttribute("aria-multiselectable", "true");
    const model = modelOpsi(sel);
    m.innerHTML = menuHtml(model);
    if (model.length > AMBANG_CARI) {
      const q = document.createElement("input");
      q.type = "search";
      q.className = "pc-cari";
      q.placeholder = t("pilih.cari");
      q.setAttribute("aria-label", t("pilih.cari"));
      q.autocomplete = "off";
      q.addEventListener("input", () => {
        const k = q.value.trim().toLowerCase();
        m.querySelectorAll("[data-i]").forEach((b) => {
          b.hidden = !!k && !b.textContent.toLowerCase().includes(k);
        });
      });
      m.prepend(q);
    }
    (document.querySelector("dialog[open]") || document.body).append(m);
    const bawah = innerHeight - r.bottom,
      tinggi = Math.min(340, m.scrollHeight);
    Object.assign(m.style, {
      left:
        Math.max(8, Math.min(r.left, innerWidth - Math.max(r.width, 240) - 8)) +
        "px",
      minWidth: r.width + "px",
      top:
        (bawah < tinggi + 12 && r.top > bawah
          ? r.top - tinggi - 6
          : r.bottom + 6) + "px",
    });
    m.querySelector('[aria-selected="true"]')?.scrollIntoView({
      block: "nearest",
    });
    (
      m.querySelector(".pc-cari") ||
      m.querySelector('[aria-selected="true"], [data-i]:not([disabled])')
    )?.focus({ preventScroll: true });
    m.addEventListener("click", (e) => {
      const o = e.target.closest("[data-i]");
      if (!o) return;
      const ops = [...sel.options],
        op = ops[+o.dataset.i];
      if (sel.multiple) {
        if (semua(op))
          ops.forEach((x) => {
            x.selected = semua(x);
          });
        else {
          op.selected = !op.selected;
          ops.filter(semua).forEach((x) => {
            x.selected = false;
          });
          if (!nilaiMulti(sel).length)
            ops.filter(semua).forEach((x) => {
              x.selected = true;
            });
        }
        ops.forEach((x, i) =>
          m
            .querySelector(`[data-i="${i}"]`)
            ?.setAttribute("aria-selected", x.selected),
        );
      } else sel.selectedIndex = +o.dataset.i;
      this.label(sel);
      if (!sel.multiple) {
        this.tutup();
        w.querySelector(".pc-btn").focus();
      }
      sel.dispatchEvent(new Event("input", { bubbles: true }));
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    });
    m.addEventListener("keydown", (e) => {
      const bs = [
          ...m.querySelectorAll("[data-i]:not([disabled]):not([hidden])"),
        ],
        i = bs.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        bs[Math.min(bs.length - 1, i + 1)]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (i <= 0 && m.querySelector(".pc-cari"))
          m.querySelector(".pc-cari").focus();
        else bs[Math.max(0, i - 1)]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        bs[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        bs.at(-1)?.focus();
      } else if (e.key === "Escape") {
        e.stopPropagation();
        this.tutup();
        w.querySelector(".pc-btn").focus();
      } else if (e.key === "Tab") this.tutup();
    });
    this.buka = m;
  },
  pasang() {
    if (this._dipasang) return;
    this._dipasang = 1;
    let tunggu = 0;
    const hiasSemua = () => {
      tunggu = 0;
      document
        .querySelectorAll("select:not([data-cantik]):not([data-asli])")
        .forEach((x) => this.hias(x));
    };
    const jadwal = () => {
      if (!tunggu) tunggu = requestAnimationFrame(hiasSemua);
    };
    hiasSemua();
    new MutationObserver(jadwal).observe(document.body, {
      childList: true,
      subtree: true,
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest(".pc-btn");
      if (b) {
        const w = b.closest(".pc");
        return w.classList.contains("on") ? this.tutup() : this.bukaMenu(w);
      }
      if (!e.target.closest(".pc-menu")) this.tutup();
    });
    document.addEventListener("keydown", (e) => {
      if (e.target.matches?.(".pc-btn") && e.key === "ArrowDown") {
        e.preventDefault();
        this.bukaMenu(e.target.closest(".pc"));
      }
    });
    addEventListener(
      "scroll",
      (e) => {
        if (!e.target.closest?.(".pc-menu")) this.tutup();
      },
      true,
    );
    addEventListener("resize", () => this.tutup());
    /* nilai yang diubah kode (sel.value = ...) ikut memperbarui tombol */
    const d = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    );
    Object.defineProperty(HTMLSelectElement.prototype, "value", {
      get() {
        return d.get.call(this);
      },
      set(v) {
        d.set.call(this, v);
        if (this.dataset.cantik) Pilih.label(this);
      },
      configurable: true,
    });
  },
};
export const pasangPilih = () => Pilih.pasang();
