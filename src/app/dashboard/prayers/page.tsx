'use client'

import { useState } from 'react'
import { FaClock, FaPlus, FaCalendarAlt, FaChartBar, FaMosque } from 'react-icons/fa'
import DashboardLayout from '@/components/DashboardLayout'

interface PrayerTime {
  name: string
  time: string
  icon: string
}

interface PrayerAttendance {
  id: number
  date: string
  prayer: string
  attendees: number
  notes?: string
}

export default function PrayersPage() {
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  const prayerTimes: PrayerTime[] = [
    { name: 'İmsak', time: '05:30', icon: '🌙' },
    { name: 'Güneş', time: '07:05', icon: '🌅' },
    { name: 'Öğle', time: '12:45', icon: '☀️' },
    { name: 'İkindi', time: '15:30', icon: '🌤️' },
    { name: 'Akşam', time: '18:15', icon: '🌆' },
    { name: 'Yatsı', time: '19:45', icon: '🌃' },
  ]

  const [attendances, setAttendances] = useState<PrayerAttendance[]>([
    { id: 1, date: '2025-10-12', prayer: 'Sabah', attendees: 45, notes: 'Normal devam' },
    { id: 2, date: '2025-10-12', prayer: 'Öğle', attendees: 38, notes: '' },
    { id: 3, date: '2025-10-12', prayer: 'İkindi', attendees: 42, notes: '' },
    { id: 4, date: '2025-10-11', prayer: 'Sabah', attendees: 48, notes: 'Yüksek katılım' },
    { id: 5, date: '2025-10-11', prayer: 'Öğle', attendees: 35, notes: '' },
  ])

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    prayer: '',
    attendees: '',
    notes: ''
  })

  const prayers = ['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'Cuma']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newAttendance: PrayerAttendance = {
      id: attendances.length + 1,
      date: formData.date,
      prayer: formData.prayer,
      attendees: parseInt(formData.attendees),
      notes: formData.notes
    }
    setAttendances([newAttendance, ...attendances])
    setShowModal(false)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      prayer: '',
      attendees: '',
      notes: ''
    })
  }

  const filteredAttendances = attendances.filter(att => att.date === selectedDate)

  // İstatistikler
  const todayTotal = filteredAttendances.reduce((sum, att) => sum + att.attendees, 0)
  const weekTotal = attendances
    .filter(att => {
      const attDate = new Date(att.date)
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      return attDate >= weekAgo
    })
    .reduce((sum, att) => sum + att.attendees, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">İbadet Yönetimi</h1>
            <p className="text-gray-600 mt-1">Namaz vakitleri ve katılım takibi</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-islamic-green text-white px-6 py-3 rounded-lg hover:bg-islamic-green/90 transition-all"
          >
            <FaPlus />
            <span>Katılım Kaydet</span>
          </button>
        </div>

        {/* İstatistikler */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FaMosque className="text-4xl" />
              <span className="text-3xl font-bold">{todayTotal}</span>
            </div>
            <h3 className="text-lg font-semibold">Bugün Toplam Cemaat</h3>
            <p className="text-blue-100 text-sm mt-1">{filteredAttendances.length} vakit namaz</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FaChartBar className="text-4xl" />
              <span className="text-3xl font-bold">{weekTotal}</span>
            </div>
            <h3 className="text-lg font-semibold">Bu Hafta Toplam</h3>
            <p className="text-green-100 text-sm mt-1">Son 7 gün</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FaCalendarAlt className="text-4xl" />
              <span className="text-3xl font-bold">{Math.round(weekTotal / 7)}</span>
            </div>
            <h3 className="text-lg font-semibold">Günlük Ortalama</h3>
            <p className="text-purple-100 text-sm mt-1">Haftalık ortalama</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Namaz Vakitleri */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-6">
              <FaClock className="text-2xl text-islamic-green" />
              <h2 className="text-xl font-bold text-gray-800">Bugünün Vakitleri</h2>
            </div>
            <div className="space-y-3">
              {prayerTimes.map((prayer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{prayer.icon}</span>
                    <span className="font-semibold text-gray-800">{prayer.name}</span>
                  </div>
                  <span className="text-lg font-bold text-islamic-green">{prayer.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-islamic-green/10 border border-islamic-green/20 rounded-lg">
              <p className="text-sm text-gray-700 text-center">
                <strong>Sıradaki Namaz:</strong> Öğle
              </p>
              <p className="text-xs text-gray-600 text-center mt-1">
                Kalan süre: 2 saat 15 dakika
              </p>
            </div>
          </div>

          {/* Katılım Kayıtları */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Katılım Kayıtları</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
              />
            </div>

            {filteredAttendances.length > 0 ? (
              <div className="space-y-4">
                {filteredAttendances.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{attendance.prayer} Namazı</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(attendance.date).toLocaleDateString('tr-TR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                      {attendance.notes && (
                        <p className="text-sm text-gray-500 mt-1 italic">{attendance.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-islamic-green">{attendance.attendees}</div>
                      <div className="text-sm text-gray-600">kişi</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Seçili tarih için kayıt bulunamadı</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 text-islamic-green hover:text-islamic-green/80 font-semibold"
                >
                  İlk kaydı oluştur
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Haftalık Grafik Bölümü (Placeholder) */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Haftalık Katılım Trendi</h2>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <FaChartBar className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Grafik görünümü yakında eklenecek</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Katılım Kaydet</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarih *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Namaz Vakti *
                </label>
                <select
                  required
                  value={formData.prayer}
                  onChange={(e) => setFormData({ ...formData, prayer: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  {prayers.map(prayer => (
                    <option key={prayer} value={prayer}>{prayer}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Katılımcı Sayısı *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Not
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                  placeholder="İsteğe bağlı notlar..."
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-islamic-green text-white py-3 rounded-lg font-semibold hover:bg-islamic-green/90 transition-all"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

