import { mulaiBahasa } from "/i18n.js";
import { terkaitHtml } from "/inti/komponen.js";
await mulaiBahasa();
const q = new URLSearchParams(location.search);
document.getElementById("m").innerHTML = await terkaitHtml(q.get("j"), q.get("id"));
document.body.dataset.siap = 1;
