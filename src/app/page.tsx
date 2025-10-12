import Link from 'next/link'
import { FaMosque, FaUserGraduate, FaPrayingHands, FaUsers } from 'react-icons/fa'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaMosque className="text-4xl text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">CamiKasifi</h1>
                <p className="text-sm text-white/80">Cami Yönetim Sistemi</p>
              </div>
            </div>
            <Link 
              href="/login"
              className="bg-white text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Modern Cami Yönetim Çözümü
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Öğrenci takibi, ibadet yönetimi ve cami operasyonlarını tek platformda yönetin
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <FaUserGraduate className="text-4xl text-emerald-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Öğrenci Yönetimi</h3>
            <p className="text-gray-300 text-sm">
              Öğrenci kayıtları, devam takibi ve gelişim raporları
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <FaPrayingHands className="text-4xl text-emerald-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">İbadet Takibi</h3>
            <p className="text-gray-300 text-sm">
              Namaz vakitleri, katılım takibi ve ibadet istatistikleri
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <FaUsers className="text-4xl text-emerald-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Yönetici Paneli</h3>
            <p className="text-gray-300 text-sm">
              Kolay yönetim, raporlama ve analiz araçları
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <FaMosque className="text-4xl text-emerald-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Cami Operasyonları</h3>
            <p className="text-gray-300 text-sm">
              Etkinlik yönetimi ve duyuru sistemi
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Hemen Başlayın
          </h3>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            CamiKasifi ile cami yönetiminizi dijitalleştirin ve daha verimli bir sistem kurun
          </p>
          <Link 
            href="/login"
            className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-all"
          >
            Sisteme Giriş Yap
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-md border-t border-white/10 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-white/80">
          <p>&copy; 2025 CamiKasifi. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}

