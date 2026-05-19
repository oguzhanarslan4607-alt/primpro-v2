# PrimPro v2

PrimPro v2, eski `oguzhanarslan4607-alt/prim` reposundaki tek dosyalık prim hesaplama aracının sıfırdan hazırlanmış React + TypeScript sürümüdür.

Bu repo ilk aşamada yerel çalışan temiz kaynak proje olarak hazırlandı. GitHub'a gönderme adımını ayrıca birlikte yapacağız.

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

## Taşınan Eski Mantık

- Fiyat listeleri: `src/data/priceLists.ts`
- Prim hesaplama fonksiyonu: `src/lib/commissionCalculator.ts`
- Hesaplama testleri: `src/lib/commissionCalculator.test.ts`
- Eski sistem notları: `docs/eski-sistem-analizi.md`
- Prim kural dokümanı: `docs/prim-hesaplama-kurallari.md`

## İlk Sürüm Kapsamı

- Eski üç fiyat listesi korundu.
- Eski KDV oranı korundu: `1.20`.
- Nakit, senet ve kredi kartı prim hesabı ayrıldı.
- İşlem geçmişi tarayıcı `localStorage` alanında tutuluyor.
- CSV dışa aktarma eklendi.

## Sonraki Aşama

- Firebase Auth ile gerçek kullanıcı girişi
- Firestore ile merkezi işlem kaydı
- Admin panelinden fiyat listesi güncelleme
- PDF rapor çıktısı
- GitHub Actions ile otomatik build/test
