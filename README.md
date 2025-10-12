# CamiKasifi - Cami Yönetim Sistemi

Modern, kullanıcı dostu cami öğrenci ve ibadet yönetim sistemi. Next.js, TypeScript ve Tailwind CSS ile geliştirilmiştir.

## 🌟 Özellikler

### ✅ Tamamlanan (v1.0)

- **🏠 Ana Sayfa ve Giriş Sistemi**
  - Modern, responsive tasarım
  - Güvenli yönetici girişi
  - Demo hesap desteği

- **📊 Dashboard (Ana Panel)**
  - İstatistik kartları
  - Son aktiviteler
  - Yaklaşan etkinlikler
  - Hızlı işlemler

- **👨‍🎓 Öğrenci Yönetimi**
  - Öğrenci ekleme, düzenleme, silme
  - Gelişmiş arama ve filtreleme
  - Sınıf bazlı gruplandırma
  - Detaylı öğrenci kayıtları (isim, yaş, telefon, veli bilgileri)

- **🕌 İbadet Yönetimi**
  - Namaz vakitleri görüntüleme
  - Cemaat katılım takibi
  - Tarih bazlı filtreleme
  - İstatistikler ve analizler

- **📈 Raporlar**
  - Öğrenci devam raporu
  - İbadet istatistikleri
  - Aylık özet raporlar
  - Sınıf performans raporları

- **⚙️ Ayarlar**
  - Profil yönetimi
  - Cami bilgileri
  - Bildirim ayarları
  - Güvenlik ayarları

## 🚀 Kurulum

### Gereksinimler

- Node.js 18.x veya üzeri
- npm veya yarn

### Adımlar

1. Projeyi klonlayın:
```bash
git clone https://github.com/CamiKasifi/CamiKasifi-fe-web.git
cd CamiKasifi-fe-web
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

4. Tarayıcınızda açın:
```
http://localhost:3000
```

## 🔐 Demo Giriş Bilgileri

```
Kullanıcı Adı: admin
Şifre: admin123
```

## 📁 Proje Yapısı

```
CamiKasifi-fe-web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Ana sayfa
│   │   ├── login/             # Giriş sayfası
│   │   ├── dashboard/         # Dashboard ve alt sayfalar
│   │   │   ├── page.tsx       # Ana dashboard
│   │   │   ├── students/      # Öğrenci yönetimi
│   │   │   ├── prayers/       # İbadet yönetimi
│   │   │   ├── reports/       # Raporlar
│   │   │   └── settings/      # Ayarlar
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global CSS
│   └── components/            # React bileşenleri
│       └── DashboardLayout.tsx # Dashboard layout
├── public/                    # Statik dosyalar
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🎨 Teknolojiler

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** React Icons
- **State Management:** React Hooks

## 📝 Issue'lar

Proje aşağıdaki GitHub issue'larına göre geliştirilmiştir:

1. ✅ [Issue #1: Proje Temelinin Atılması, Tema Seçimi Yapılması](https://github.com/CamiKasifi/CamiKasifi-fe-web/issues/1)
2. ✅ [Issue #2: Yöneticinin Giriş Yapabileceği Ekranların Oluşturulması](https://github.com/CamiKasifi/CamiKasifi-fe-web/issues/2)
3. ✅ [Issue #3: Giriş Sonrası Ekranın Tasarlanması](https://github.com/CamiKasifi/CamiKasifi-fe-web/issues/3)
4. ✅ [Issue #4: Öğrenci Formları ve Yönetim Ekranları](https://github.com/CamiKasifi/CamiKasifi-fe-web/issues/4)
5. ✅ [Issue #5: İbadetler Ekranlarının Tasarlanması](https://github.com/CamiKasifi/CamiKasifi-fe-web/issues/5)

## 🎯 Gelecek Özellikler

- [ ] Gerçek API entegrasyonu
- [ ] Gelişmiş grafik ve analitik
- [ ] PDF rapor indirme
- [ ] E-posta ve SMS bildirimleri
- [ ] Çoklu dil desteği
- [ ] Mobil uygulama
- [ ] Dark mode
- [ ] Gelişmiş kullanıcı yetkilendirmesi

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📄 Lisans

Bu proje Apache License 2.0 altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 İletişim

Proje Linki: [https://github.com/CamiKasifi/CamiKasifi-fe-web](https://github.com/CamiKasifi/CamiKasifi-fe-web)

## 🙏 Teşekkürler

Bu proje, camilerin dijital dönüşümüne katkıda bulunmak amacıyla geliştirilmiştir.
