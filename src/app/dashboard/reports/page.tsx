'use client'

import { FaChartLine, FaFileDownload, FaPrint, FaCalendarAlt } from 'react-icons/fa'
import DashboardLayout from '@/components/DashboardLayout'

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Raporlar ve Analizler</h1>
          <p className="text-gray-600 mt-1">Detaylı istatistikler ve raporlar</p>
        </div>

        {/* Report Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-4 rounded-lg">
                <FaChartLine className="text-3xl text-blue-600" />
              </div>
              <button className="text-blue-600 hover:text-blue-800">
                <FaFileDownload className="text-xl" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Öğrenci Devam Raporu</h3>
            <p className="text-gray-600 mb-4">Öğrencilerin devam durumu ve detaylı analizi</p>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all">
              Raporu Görüntüle
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-4 rounded-lg">
                <FaChartLine className="text-3xl text-green-600" />
              </div>
              <button className="text-green-600 hover:text-green-800">
                <FaFileDownload className="text-xl" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">İbadet İstatistikleri</h3>
            <p className="text-gray-600 mb-4">Namaz katılımları ve trend analizi</p>
            <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all">
              Raporu Görüntüle
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-4 rounded-lg">
                <FaCalendarAlt className="text-3xl text-purple-600" />
              </div>
              <button className="text-purple-600 hover:text-purple-800">
                <FaPrint className="text-xl" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Aylık Özet Raporu</h3>
            <p className="text-gray-600 mb-4">Tüm aktivitelerin aylık özeti</p>
            <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-all">
              Raporu Görüntüle
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-4 rounded-lg">
                <FaChartLine className="text-3xl text-orange-600" />
              </div>
              <button className="text-orange-600 hover:text-orange-800">
                <FaFileDownload className="text-xl" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Sınıf Performans Raporu</h3>
            <p className="text-gray-600 mb-4">Sınıfların genel performans analizi</p>
            <button className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-all">
              Raporu Görüntüle
            </button>
          </div>
        </div>

        {/* Placeholder for detailed report view */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Rapor Detayları</h2>
          <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <FaChartLine className="text-8xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Bir rapor seçerek detayları görüntüleyin</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

