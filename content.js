// Shift + fiziksel tuş → FX Replay'in beklediği kısayol
const ESLEME = {
  KeyZ: { key: " ", code: "Space", keyCode: 32, ctrlKey: true }, // Ctrl+Space
  KeyA: { key: "m", code: "KeyM", keyCode: 77, altKey: true },   // Alt+M
  KeyS: { key: "b", code: "KeyB", keyCode: 66, altKey: true },   // Alt+B
};

// Yazı alanındayken kısayol devreye girmesin, büyük harf yazılsın
function yaziAlaniMi(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
}

const ISLEM_TUSLARI = { Digit1: "1", Digit2: "2" };
const ARAYUZ_STILI = "position:fixed;z-index:2147483647;pointer-events:none;background:#000;color:#fff;font:13px sans-serif;border-radius:4px;";

// Panel ve bildirim yalnız üst çerçevede; grafik kendi çerçevesinde olsa da tek kopya görünsün
if (window === window.top) {
  const panel = document.createElement("div");
  panel.style.cssText = ARAYUZ_STILI + "bottom:14px;left:400px;padding:6px 10px;white-space:nowrap;";
  let bildirimler = [];

  // Alttaki Buy/Sell şeridinde durur, grafiği kapatmaz
  // Mavi: görüntüsü alınmadı · yeşil: alındı. İşlem kapanınca yuva silinir, hepsi maviye döner
  function panelCiz({ yuvalar }) {
    panel.replaceChildren();
    for (const yuva of Object.values(ISLEM_TUSLARI)) {
      const adim = yuvalar[yuva] ? yuvalar[yuva].adim : 0;
      [`${yuva}. işlem`, "45M", "4H"].forEach((etiket, i) => {
        const parca = document.createElement("span");
        parca.textContent = etiket;
        parca.style.cssText = `margin-right:${i === 2 ? 22 : 8}px;color:${adim > i ? "#4ade80" : "#60a5fa"};`;
        panel.appendChild(parca);
      });
    }
  }

  const panelYenile = () => chrome.storage.local.get({ yuvalar: {} }).then(panelCiz);
  document.documentElement.appendChild(panel);
  panelYenile();
  chrome.storage.onChanged.addListener(panelYenile);

  function bildir(metin) {
    const kutu = document.createElement("div");
    kutu.textContent = metin;
    kutu.style.cssText = ARAYUZ_STILI + "top:12px;left:50%;transform:translateX(-50%);padding:6px 12px;";
    document.documentElement.appendChild(kutu);
    bildirimler.push(kutu);
    setTimeout(() => {
      kutu.remove();
      bildirimler = bildirimler.filter((k) => k !== kutu);
    }, 1500);
  }

  chrome.runtime.onMessage.addListener((mesaj, gonderen, cevapla) => {
    if (mesaj.tur === "bildir") {
      bildir(mesaj.metin);
    } else if (mesaj.tur === "arayuz-goster") {
      panel.style.visibility = "visible";
    } else if (mesaj.tur === "arayuz-gizle") {
      panel.style.visibility = "hidden";
      bildirimler.forEach((k) => k.remove());
      // Ekrana yansıdıktan sonra çekilsin
      requestAnimationFrame(() => requestAnimationFrame(() => cevapla({})));
      return true;
    }
  });
}

window.addEventListener(
  "keydown",
  (e) => {
    // Shift+1 / Shift+2: imleç ve tarih kutucuğuyla birlikte görüntü alır, o yuvanın döngüsünde bir adım ilerler · Alt+1 / Alt+2: front run, o yuvanın işlemini kapatır
    const yuva = ISLEM_TUSLARI[e.code];
    if (yuva && e.shiftKey !== e.altKey && !e.ctrlKey && !e.metaKey && !yaziAlaniMi(e.target)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat) return;
      chrome.runtime.sendMessage({ tur: e.altKey ? "front-run" : "islem-tusu", yuva });
      return;
    }

    const hedef = ESLEME[e.code];
    if (!hedef || !e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    if (yaziAlaniMi(e.target)) return;

    // Asıl Shift+harf basışını sayfaya ulaştırma
    e.preventDefault();
    e.stopImmediatePropagation();

    // Yerine kısayolun basılıp bırakılmasını gönder
    for (const tur of ["keydown", "keyup"]) {
      e.target.dispatchEvent(
        new KeyboardEvent(tur, {
          ...hedef,
          which: hedef.keyCode,
          bubbles: true,
          cancelable: true,
          composed: true,
        })
      );
    }
  },
  true // capture: sayfanın kendi dinleyicilerinden önce yakala
);
