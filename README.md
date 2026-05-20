# PrimPro v2

PrimPro v2, eski `oguzhanarslan4607-alt/prim` reposundaki prim hesaplama mantığının sıfırdan hazırlanmış React + TypeScript sürümüdür.

Canlı adres: https://oguzhanarslan4607-alt.github.io/primpro-v2/

## Çalıştırma

```bash
npm install
npm run dev
```

Yerel adres:

```text
http://127.0.0.1:5173/
```

## Komutlar

```bash
npm run test
npm run build
npm run preview
```

## Kapsam

- Eski üç fiyat listesi korundu.
- Yeni fiyat listesi 2 Haziran 2026 saat 00:00'dan önce kullanıcıya gösterilmez.
- Eski KDV oranı korundu: `1.20`.
- Nakit, senet ve kredi kartı prim hesabı ayrı hesaplanır.
- İşlem geçmişi cihazda `localStorage` içinde tutulur.
- Yerel PIN girişi vardır; PIN sıfırlanınca kayıtlar silinmez.
- Rapor ekranında arama, tarih, ürün filtresi, CSV ve PDF/yazdırma çıktısı bulunur.
- Admin ekranında fiyatlar yerel olarak düzenlenebilir, resmi değerlere döndürülebilir ve JSON yedek alınabilir.
- GitHub Pages üzerinde PWA/offline cache desteği vardır.

## Firebase

Firebase zorunlu değildir. `.env.example` dosyasını `.env.local` olarak kopyalayıp değerleri doldurursan e-posta/şifre ile Firebase Auth ve Firestore kayıt senkronizasyonu devreye girer.

Gerekli koleksiyon:

```text
calculations
```

Her kayıt şu yapıda saklanır:

```ts
{
  userId: string;
  calculation: SavedCalculation;
  updatedAt: string;
}
```

## Kod Haritası

- Fiyat listeleri: `src/data/priceLists.ts`
- Prim hesaplama fonksiyonu: `src/lib/commissionCalculator.ts`
- Yerel PIN: `src/lib/auth.ts`
- Yerel fiyat listesi yönetimi: `src/lib/customPriceLists.ts`
- Firebase bağlantısı: `src/lib/firebaseRepository.ts`
- Hesaplama testleri: `src/lib/commissionCalculator.test.ts`
- Eski sistem notları: `docs/eski-sistem-analizi.md`
- Prim kural dokümanı: `docs/prim-hesaplama-kurallari.md`
