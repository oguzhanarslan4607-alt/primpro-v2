# Prim Hesaplama Kuralları

Bu belge eski `prim` uygulamasındaki hesaplama mantığının yeni projedeki kalıcı özetidir.

## Ortak Kural

Tüm prim hesaplarında KDV hariç tutar şu formülle bulunur:

```text
kdvHaric = tutar / 1.20
```

Prim:

```text
prim = kdvHaric * oran / 100
```

## Peşin Satış

Peşin satışta satış tutarının tamamı nakit kabul edilir.

Oranlar:

- `TR (1300564)`: `%21`
- `RO - Unique (1300035D)`: `%21`
- `RO - Unique M5 (1300035M5)`: `%21`
- `RO - Diamond (1300095)`: `%21`
- `RO - Platinum (1300334)`: `%13`
- `RO - Silver (1300534)`: `%13`
- `Klima` ürünleri: `%11`

## Taksitli / Senetli Satış

Satış tutarı fiyat listesinden alınır. Kullanıcının girdiği nakit/peşinat düşülür:

```text
senet = max(toplamSatis - nakit, 0)
```

Nakit ve senet için ayrı prim satırları hesaplanır.

Oranlar:

- `TR (1300564)`
  - Taksit sayısı `12` üstüyse: nakit `%21`, senet `%11`
  - Aksi halde: nakit `%21`, senet `%17`
- `RO - Unique`, `RO - Unique M5`, `RO - Diamond`
  - Taksit sayısı `7` üstüyse: nakit `%21`, senet `%11`
  - Aksi halde: nakit `%21`, senet `%17`
- `RO - Platinum`, `RO - Silver`
  - nakit `%13`, senet `%11`
- `Klima` ürünleri
  - nakit `%11`, senet `%9`

## Kredi Kartı

Kredi kartında prim, seçili fiyat listesindeki satış tutarından değil kullanıcının girdiği hesaba düşen tutardan hesaplanır.

Oranlar:

- `RO - Platinum`, `RO - Silver`: `%13`
- `Klima` ürünleri: `%11`
- Diğer ürünler: `%21`

## Fiyat Listesi Geçişi

Eski uygulamadaki tarih kontrolü korunmuştur:

```text
2026-06-02 00:00 öncesi: Mevcut Fiyat Listesi
2026-06-02 00:00 ve sonrası: Yeni Fiyat Listesi
```
