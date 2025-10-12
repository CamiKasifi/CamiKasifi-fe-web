'use client'

import { useState } from 'react'
import { FaSearch, FaPlus, FaEdit, FaTrash, FaEye, FaFilter } from 'react-icons/fa'
import DashboardLayout from '@/components/DashboardLayout'

interface Student {
  id: number
  name: string
  age: number
  phone: string
  class: string
  status: 'active' | 'inactive'
  joinDate: string
}

export default function StudentsPage() {
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')
  
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: 'Ahmet Yılmaz', age: 12, phone: '0532 123 4567', class: 'Temel Kuran', status: 'active', joinDate: '01.09.2025' },
    { id: 2, name: 'Mehmet Demir', age: 14, phone: '0533 234 5678', class: 'İleri Kuran', status: 'active', joinDate: '15.09.2025' },
    { id: 3, name: 'Ali Kaya', age: 10, phone: '0534 345 6789', class: 'Başlangıç', status: 'active', joinDate: '20.09.2025' },
    { id: 4, name: 'Ayşe Şahin', age: 13, phone: '0535 456 7890', class: 'Temel Kuran', status: 'inactive', joinDate: '05.09.2025' },
    { id: 5, name: 'Fatma Öz', age: 11, phone: '0536 567 8901', class: 'İleri Kuran', status: 'active', joinDate: '10.09.2025' },
  ])

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    class: '',
    parentName: '',
    parentPhone: '',
    address: ''
  })

  const classes = ['Başlangıç', 'Temel Kuran', 'İleri Kuran', 'Tecvid', 'Hafızlık']

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.phone.includes(searchTerm)
    const matchesClass = selectedClass === 'all' || student.class === selectedClass
    return matchesSearch && matchesClass
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newStudent: Student = {
      id: students.length + 1,
      name: formData.name,
      age: parseInt(formData.age),
      phone: formData.phone,
      class: formData.class,
      status: 'active',
      joinDate: new Date().toLocaleDateString('tr-TR')
    }
    setStudents([...students, newStudent])
    setShowModal(false)
    setFormData({
      name: '',
      age: '',
      phone: '',
      class: '',
      parentName: '',
      parentPhone: '',
      address: ''
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Öğrenci Yönetimi</h1>
            <p className="text-gray-600 mt-1">Toplam {students.length} öğrenci kayıtlı</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-islamic-green text-white px-6 py-3 rounded-lg hover:bg-islamic-green/90 transition-all"
          >
            <FaPlus />
            <span>Yeni Öğrenci Ekle</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="İsim veya telefon ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
              />
            </div>

            {/* Class Filter */}
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
              >
                <option value="all">Tüm Sınıflar</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ad Soyad</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Yaş</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Telefon</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Sınıf</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Durum</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Kayıt Tarihi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.age}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.class}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {student.status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.joinDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <FaEye />
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <FaEdit />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Yeni Öğrenci Ekle</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yaş *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sınıf *
                  </label>
                  <select
                    required
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Veli Adı
                  </label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Veli Telefonu
                  </label>
                  <input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres
                </label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-islamic-green text-white py-3 rounded-lg font-semibold hover:bg-islamic-green/90 transition-all"
                >
                  Öğrenciyi Kaydet
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

