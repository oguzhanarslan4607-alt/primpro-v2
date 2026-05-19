# Eski Sistem Analizi

Kaynak repo: `https://github.com/oguzhanarslan4607-alt/prim`

Eski uygulama tek dosyalık statik bir PWA olarak yayınlanmıştı:

- `index.html`: arayüz, fiyat listeleri, giriş kontrolü, hesaplama, geçmiş ve PDF çıktısı aynı dosyada
- `manifest.json`: mobil kurulum bilgileri
- `sw.js`: çevrimdışı cache
- `icon-192.png`, `icon-512.png`: uygulama ikonları

## Korunan Davranışlar

- Üç fiyat listesi korunur:
  - Önceki Liste
  - Mevcut Fiyat Listesi
  - Yeni Fiyat Listesi
- 2 Haziran 2026 öncesinde varsayılan liste `Mevcut Fiyat Listesi` olur.
- 2 Haziran 2026 ve sonrasında varsayılan liste `Yeni Fiyat Listesi` olur.
- KDV dahil tutarlar `1.20` oranıyla KDV hariç tutara çevrilir.
- Kredi kartı priminde kullanıcının girdiği `Hesaba düşen tutar` esas alınır.
- Normal satışta peşinat/nakit ve senet tutarı ayrı oranlarla hesaplanır.

## Düzeltilmesi Gereken Eski Riskler

- Giriş bilgisi eski HTML içinde açıktaydı: `ihlas / 1234`.
- Fiyat listeleri ve prim oranları arayüz koduna gömülüydü.
- Geçmiş sadece cihazdaki `localStorage` içinde tutuluyordu.
- Tablo satırları `innerHTML` ile üretildiği için müşteri adı gibi alanlarda gereksiz güvenlik riski vardı.
- Test olmadığı için fiyat veya oran değişikliği sessizce hatalı hesap üretebilirdi.

## Yeni Yaklaşım

Yeni projede fiyat listeleri, hesaplama fonksiyonu ve arayüz birbirinden ayrıldı. Böylece:

- Hesaplama kuralları test edilebilir.
- Fiyat listesi güncellemesi tek dosyada yapılır.
- Arayüz değişse bile prim hesabı bozulmaz.
- GitHub'a gönderildiğinde kaynak proje olarak büyütülebilir.
