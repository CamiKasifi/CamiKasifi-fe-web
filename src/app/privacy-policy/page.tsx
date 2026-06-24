import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası — Cami Kaşifi',
  description: 'Cami Kaşifi uygulamasının gizlilik politikası ve kişisel veri işleme bildirimi.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <article className="mx-auto max-w-2xl text-gray-800">
        <h1 className="mb-2 text-3xl font-bold text-[#0B4E41]">Gizlilik Politikası</h1>
        <p className="mb-8 text-sm text-gray-500">Son güncelleme: 24 Haziran 2026</p>

        <Section title="1. Uygulama Hakkında">
          <p>
            <strong>Cami Kaşifi</strong>, kullanıcıların günlük beş vakit namazı kayıtlı
            camilerde kılmasını teşvik eden, puan ve yarışma sistemiyle gamifiye edilmiş bir
            mobil uygulamadır. Uygulama; Android cihazlarda Google Play Store üzerinden
            dağıtılmaktadır.
          </p>
          <p className="mt-3">
            Bu gizlilik politikası, uygulamayı kullanırken hangi kişisel verilerin toplandığını,
            bu verilerin nasıl kullanıldığını ve haklarınızı açıklar.
          </p>
        </Section>

        <Section title="2. Toplanan Veriler">
          <SubSection title="2.1 Hesap ve Kimlik Bilgileri">
            <ul className="list-disc pl-5 space-y-1">
              <li>Ad ve soyad</li>
              <li>E-posta adresi</li>
              <li>Şifre (şifrelenmiş biçimde saklanır; düz metin olarak asla tutulmaz)</li>
            </ul>
          </SubSection>

          <SubSection title="2.2 Konum Bilgisi">
            <p>
              Uygulama, siz bir camiye "giriş" yaptığınızda cihazınızın o caminin yakınında
              olup olmadığını doğrulamak amacıyla <strong>anlık</strong> konum bilgisi alır.
              Konum; sürekli izlenmez, arka planda toplanmaz ve kalıcı olarak saklanmaz.
              Yalnızca giriş anındaki doğrulama işlemi sırasında kullanılır.
            </p>
          </SubSection>

          <SubSection title="2.3 Cihaz ve Bildirim Bilgileri">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>FCM cihaz token'ı</strong> — Firebase Cloud Messaging aracılığıyla
                size namaz vakti ve yarışma bildirimleri göndermek için kullanılır.
              </li>
              <li>
                <strong>Cihaz tanımlayıcısı</strong> — Hesap başına tek cihaz ilkesini
                uygulamak ve güvenliği sağlamak amacıyla kullanılır.
              </li>
            </ul>
          </SubSection>

          <SubSection title="2.4 Uygulama İçi Etkinlik">
            <ul className="list-disc pl-5 space-y-1">
              <li>Ziyaret edilen camiler ve giriş geçmişi</li>
              <li>Kazanılan puanlar ve katılınan yarışmalar</li>
              <li>İmam tarafından eklenen namaz kayıtları</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="3. Verilerin Kullanım Amacı">
          <ul className="list-disc pl-5 space-y-1">
            <li>Hesap oluşturma ve kimlik doğrulama</li>
            <li>Camiye yakınlığın doğrulanması ve giriş işleminin gerçekleştirilmesi</li>
            <li>Puan hesaplama ve yarışma liderlik tablosunun oluşturulması</li>
            <li>Namaz vakti, onay durumu ve yarışma bildirimlerinin iletilmesi</li>
            <li>Uygulama güvenliğinin ve bütünlüğünün korunması</li>
          </ul>
        </Section>

        <Section title="4. Üçüncü Taraf Hizmetler">
          <p className="mb-3">
            Uygulama, aşağıdaki üçüncü taraf hizmetlerden faydalanmaktadır. Bu hizmetlerin
            kendi gizlilik politikaları geçerlidir:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Supabase</strong> — Kimlik doğrulama ve veritabanı altyapısı.{' '}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0B4E41] underline"
              >
                supabase.com/privacy
              </a>
            </li>
            <li>
              <strong>Firebase (Google)</strong> — Anlık bildirimler (FCM).{' '}
              <a
                href="https://firebase.google.com/support/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0B4E41] underline"
              >
                firebase.google.com/support/privacy
              </a>
            </li>
          </ul>
        </Section>

        <Section title="5. Veri Güvenliği">
          <p>
            Verileriniz; SSL/TLS şifreli bağlantılar üzerinden iletilir ve endüstri
            standartlarına uygun güvenli sunucularda saklanır. Şifreler asla düz metin
            olarak tutulmaz. Yetkisiz erişimi önlemek için teknik ve idari tedbirler
            uygulanmaktadır; ancak hiçbir sistem %100 güvenli değildir.
          </p>
        </Section>

        <Section title="6. Veri Saklama Süresi">
          <p>
            Kişisel verileriniz, hesabınız aktif olduğu sürece veya hizmetlerin sunulması
            için gerekli olduğu müddetçe saklanır. Hesabınızı silmenizi talep etmeniz
            durumunda verileriniz makul süre içinde sistemden kaldırılır.
          </p>
        </Section>

        <Section title="7. Çocukların Gizliliği">
          <p>
            Uygulama, 13 yaşın altındaki çocuklara yönelik değildir ve bu yaş grubundan
            bilerek veri toplanmaz. 13 yaşın altında bir çocuğun uygulamamızı kullandığını
            fark ederseniz lütfen bizimle iletişime geçin.
          </p>
        </Section>

        <Section title="8. Haklarınız (KVKK)">
          <p className="mb-3">
            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklara
            sahipsiniz:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>Yanlış veya eksik verilerin düzeltilmesini isteme</li>
            <li>Yasal koşulların sağlanması halinde silinmesini talep etme</li>
            <li>İşlemenin kısıtlanmasını veya buna itiraz etme</li>
            <li>Veri taşınabilirliği talep etme</li>
          </ul>
          <p className="mt-3">
            Bu haklarınızı kullanmak için aşağıdaki iletişim bilgilerinden bize ulaşabilirsiniz.
          </p>
        </Section>

        <Section title="9. Politika Değişiklikleri">
          <p>
            Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler
            uygulama içi bildirim veya e-posta yoluyla duyurulacaktır. Güncel politikaya
            her zaman bu sayfadan ulaşabilirsiniz.
          </p>
        </Section>

        <Section title="10. İletişim">
          <p>
            Gizlilik ile ilgili soru ve talepleriniz için:{' '}
            <a
              href="mailto:camikasifi@gmail.com"
              className="text-[#0B4E41] underline"
            >
              camikasifi@gmail.com
            </a>
          </p>
        </Section>
      </article>
    </main>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold text-[#0B4E41]">{title}</h2>
      <div className="text-base leading-relaxed text-gray-700">{children}</div>
    </section>
  )
}

function SubSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 font-medium text-gray-800">{title}</h3>
      {children}
    </div>
  )
}
