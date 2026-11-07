/* Dipasang sinkron di <head> sebelum cat pertama (tanpa kedip). localStorage selalu di try/catch. */
try { const t = localStorage.getItem("jm-tema"); if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; } catch (e) {}
