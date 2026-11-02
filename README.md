# FX Replay Kısayolları

[FX Replay](https://app.fxreplay.com) ile backtest yaparken tuş kısayolları ekleyen ve işlem görüntülerini otomatik kaydeden bir Chrome eklentisi.

*English summary below.*

## Ne yapar

**Kısayollar** (yalnız `app.fxreplay.com`'da, yazı alanındayken devre dışı):

| Tuş | FX Replay'deki karşılığı |
|---|---|
| `Shift+Z` | `Ctrl+Space` |
| `Shift+A` | `Alt+M` |
| `Shift+S` | `Alt+B` |

**İşlem görüntüleri:** iki işlem yuvası var (`1` ve `2`). Her yuvada `Shift+1` / `Shift+2` dört adımda ilerler ve her adımda ekranın görüntüsünü alır:

1. 5M giriş (işlem açılır)
2. 45M giriş
3. 4H giriş
4. Kapanış (işlem kapanır, yuva boşalır)

`Alt+1` / `Alt+2`: emir dolmadan fiyat hedefe gittiyse o yuvanın işlemini **front run** olarak kapatır (`frontrun_` görüntüsü).

Görüntüler `İndirilenler\backtest-goruntu\islem-001\` gibi işlem başına bir klasöre kaydedilir. Klasör numarası kalıcı bir sayaçtan gelir, eski işlemin üstüne yazılmaz. Ekranın altındaki küçük panel hangi adımların alındığını gösterir (mavi: alınmadı, yeşil: alındı); panel görüntülere girmez.

## Kurulum

1. Depoyu indir (**Code → Download ZIP**) ve klasörü aç.
2. Chrome'da `chrome://extensions` adresine git, sağ üstten **Geliştirici modu**nu aç.
3. **Paketlenmemiş öğe yükle** → bu klasörü seç.

Eklenti `downloads` (görüntü kaydı) ve `storage` (sayaç ve yuva durumu) izinlerini kullanır. Hiçbir veri dışarı gönderilmez.

## English

A Chrome extension for backtesting on [FX Replay](https://app.fxreplay.com): `Shift+Z/A/S` map to FX Replay's `Ctrl+Space`, `Alt+M`, `Alt+B`. `Shift+1` / `Shift+2` step two trade slots through four screenshots (5M entry, 45M entry, 4H entry, exit), saved to `Downloads/backtest-goruntu/islem-NNN/`; `Alt+1` / `Alt+2` close a slot as a front run. Install via `chrome://extensions` → Developer mode → Load unpacked. Interface text is Turkish.

## Lisans / License

MIT, bkz. [LICENSE](LICENSE).
