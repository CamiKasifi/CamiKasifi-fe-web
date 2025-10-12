'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaUserGraduate, FaPrayingHands, FaChartLine, FaCalendarAlt, FaBell, FaUsers } from 'react-icons/fa'
import DashboardLayout from '@/components/DashboardLayout'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ username: string } | null>(null)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    const userData = localStorage.getItem('user')
    
    if (!isAuthenticated || !userData) {
      router.push('/login')
    } else {
      setUser(JSON.parse(userData))
    }
  }, [router])

  if (!user) return null

  const stats = [
    {
      title: 'Toplam Öğrenci',
      value: '156',
      icon: FaUserGraduate,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Bu Hafta İbadet',
      value: '432',
      icon: FaPrayingHands,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Aktif Sınıf',
      value: '8',
      icon: FaUsers,
      color: 'bg-purple-500',
      change: '+2'
    },
    {
      title: 'Yaklaşan Etkinlik',
      value: '5',
      icon: FaCalendarAlt,
      color: 'bg-orange-500',
      change: '3 yeni'
    }
  ]

  const recentActivities = [
    { id: 1, text: 'Ahmet Yılmaz yeni öğrenci olarak kaydedildi', time: '5 dk önce', type: 'student' },
    { id: 2, text: 'Sabah namazı katılımı kaydedildi (45 kişi)', time: '2 saat önce', type: 'prayer' },
    { id: 3, text: 'Haftalık Kuran dersi etkinliği oluşturuldu', time: '5 saat önce', type: 'event' },
    { id: 4, text: 'Mehmet Demir devamsızlık bildirimi gönderildi', time: '1 gün önce', type: 'alert' },
  ]

  const upcomingEvents = [
    { id: 1, title: 'Kuran-ı Kerim Dersi', date: '15 Ekim 2025', time: '14:00' },
    { id: 2, title: 'Gençlik Semineri', date: '18 Ekim 2025', time: '16:00' },
    { id: 3, title: 'Haftalık Sohbet', date: '20 Ekim 2025', time: '20:00' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hoş Geldin Mesajı */}
        <div className="bg-gradient-to-r from-islamic-green to-teal-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Hoş Geldin, {user.username}!</h1>
          <p className="text-white/90">CamiKasifi Yönetim Paneline hoş geldiniz. Bugünün özetine göz atın.</p>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="text-2xl text-white" />
                </div>
                <span className="text-sm text-green-600 font-semibold">{stat.change}</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Son Aktiviteler */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Son Aktiviteler</h2>
              <FaBell className="text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-all">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${activity.type === 'student' ? 'bg-blue-100 text-blue-600' : ''}
                    ${activity.type === 'prayer' ? 'bg-green-100 text-green-600' : ''}
                    ${activity.type === 'event' ? 'bg-purple-100 text-purple-600' : ''}
                    ${activity.type === 'alert' ? 'bg-orange-100 text-orange-600' : ''}
                  `}>
                    {activity.type === 'student' && <FaUserGraduate />}
                    {activity.type === 'prayer' && <FaPrayingHands />}
                    {activity.type === 'event' && <FaCalendarAlt />}
                    {activity.type === 'alert' && <FaBell />}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800">{activity.text}</p>
                    <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Yaklaşan Etkinlikler */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Yaklaşan Etkinlikler</h2>
              <FaCalendarAlt className="text-gray-400" />
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-4 border-l-4 border-islamic-green bg-gray-50 rounded">
                  <h3 className="font-semibold text-gray-800 mb-1">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.date}</p>
                  <p className="text-sm text-islamic-green font-semibold">{event.time}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-islamic-green text-white py-2 rounded-lg hover:bg-islamic-green/90 transition-all">
              Tüm Etkinlikleri Gör
            </button>
          </div>
        </div>

        {/* Hızlı İşlemler */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-islamic-green hover:bg-islamic-green/5 transition-all text-center">
              <FaUserGraduate className="text-3xl text-islamic-green mx-auto mb-2" />
              <span className="text-sm font-semibold text-gray-700">Yeni Öğrenci</span>
            </button>
            <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-islamic-green hover:bg-islamic-green/5 transition-all text-center">
              <FaPrayingHands className="text-3xl text-islamic-green mx-auto mb-2" />
              <span className="text-sm font-semibold text-gray-700">İbadet Kaydet</span>
            </button>
            <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-islamic-green hover:bg-islamic-green/5 transition-all text-center">
              <FaCalendarAlt className="text-3xl text-islamic-green mx-auto mb-2" />
              <span className="text-sm font-semibold text-gray-700">Etkinlik Oluştur</span>
            </button>
            <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-islamic-green hover:bg-islamic-green/5 transition-all text-center">
              <FaChartLine className="text-3xl text-islamic-green mx-auto mb-2" />
              <span className="text-sm font-semibold text-gray-700">Rapor Görüntüle</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

