// Shift+1 / Shift+2 dört adımlı döngü: 5M giriş (işlem açılır) → 45M giriş → 4H giriş → kapanış (işlem kapanır, yuva boşalır)
// Alt+1 / Alt+2 front run: emir dolmadan fiyat hedefe gitti; o yuvanın işlemi `frontrun_` görüntüsüyle kapanır
// Klasör numarası kalıcı sayaçtan gelir: eski işlemin üstüne yazılmaz
const VARSAYILAN = { sayac: 0, yuvalar: {} };
const GIRISLER = [
  { ad: "giris_5m", etiket: "5M" },
  { ad: "giris_45m", etiket: "45M" },
  { ad: "giris_4h", etiket: "4H" },
];
const DUZEN = 6;
const SAYACI_KORU = false; // false iken DUZEN artırılınca numaralar 1'den başlar (temizlik)
const CIFT_BASIS_MS = 1000;

const sonBasis = {};
let sira = Promise.resolve();

// Yeni düzene geçişte eski anahtarlar ve açık yuvalar bir kez silinir
chrome.runtime.onInstalled.addListener(async () => {
  const { duzen, sayac = 0 } = await chrome.storage.local.get(["duzen", "sayac"]);
  if (duzen === DUZEN) return;
  await chrome.storage.local.clear();
  await chrome.storage.local.set({ duzen: DUZEN, sayac: SAYACI_KORU ? sayac : 0 });
});

function zamanDamgasi() {
  const t = new Date();
  const iki = (n) => String(n).padStart(2, "0");
  const tarih = `${t.getFullYear()}-${iki(t.getMonth() + 1)}-${iki(t.getDate())}`;
  const saat = `${iki(t.getHours())}-${iki(t.getMinutes())}-${iki(t.getSeconds())}`;
  return `${tarih}_${saat}`;
}

// Panel ve bildirim yalnız üst çerçevede durur; tuş grafik çerçevesinde basılsa da oraya gider
function ustCerceveye(tabId, mesaj) {
  return chrome.tabs.sendMessage(tabId, mesaj, { frameId: 0 }).catch(() => {});
}

async function goruntuKaydet(tab, no, ad) {
  // Panel ve bildirim görüntüye girmesin
  await ustCerceveye(tab.id, { tur: "arayuz-gizle" });
  let url;
  try {
    url = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  } finally {
    await ustCerceveye(tab.id, { tur: "arayuz-goster" });
  }
  await chrome.downloads.download({
    url,
    filename: `backtest-goruntu/islem-${String(no).padStart(3, "0")}/${ad}_${zamanDamgasi()}.png`,
    saveAs: false,
  });
}

// Durum yalnız görüntü kaydedildikten sonra değişir: görüntüsüz adım oluşmaz
async function islemTusu(yuva, tab) {
  const d = await chrome.storage.local.get(VARSAYILAN);
  const y = d.yuvalar[yuva];
  const no = y ? y.no : d.sayac + 1;
  const adim = y ? y.adim : 0;

  if (adim === GIRISLER.length) {
    await goruntuKaydet(tab, no, "kapanis");
    delete d.yuvalar[yuva];
    await chrome.storage.local.set(d);
    return `İşlem ${no} kapandı, kapanış görüntüsü kaydedildi`;
  }

  const giris = GIRISLER[adim];
  await goruntuKaydet(tab, no, giris.ad);
  d.sayac = Math.max(d.sayac, no);
  d.yuvalar[yuva] = { no, adim: adim + 1 };
  await chrome.storage.local.set(d);
  return (adim === 0 ? `İşlem ${no} açıldı, ` : `İşlem ${no} `) + `${giris.etiket} giriş görüntüsü kaydedildi`;
}

// Giriş adımları tamamlanmamış olsa da kapanır
async function frontRun(yuva, tab) {
  const d = await chrome.storage.local.get(VARSAYILAN);
  const y = d.yuvalar[yuva];
  if (!y) return `${yuva}. işlem boş, front run yok`;
  const { no } = y;
  await goruntuKaydet(tab, no, "frontrun");
  delete d.yuvalar[yuva];
  await chrome.storage.local.set(d);
  return `İşlem ${no} front run olarak kapandı, görüntü kaydedildi`;
}

chrome.runtime.onMessage.addListener((mesaj, gonderen, cevapla) => {
  const isler = { "islem-tusu": islemTusu, "front-run": frontRun };
  const is = isler[mesaj.tur];
  if (!is) return;

  const tus = `${mesaj.tur}-${mesaj.yuva}`;
  const simdi = Date.now();
  if (simdi - (sonBasis[tus] || 0) < CIFT_BASIS_MS) {
    cevapla({});
    return;
  }
  sonBasis[tus] = simdi;

  // İki yuvaya art arda basılınca aynı numarayı almasınlar diye sırayla işlenir
  sira = sira
    .then(() => is(mesaj.yuva, gonderen.tab))
    .catch((hata) => "Olmadı, işlem değişmedi: " + hata.message)
    .then((metin) => ustCerceveye(gonderen.tab.id, { tur: "bildir", metin }))
    .then(() => cevapla({}));
  return true; // cevap sonradan gelecek
});
