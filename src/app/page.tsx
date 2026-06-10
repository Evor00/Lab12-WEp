'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Author {
  id: string
  name: string
  email?: string | null
  nationality?: string | null
  birthYear?: number | null
  bio?: string | null
  createdAt: string
  _count: { books: number }
}

interface AuthorForm {
  name: string
  email: string
  nationality: string
  birthYear: string
  bio: string
}

const EMPTY_FORM: AuthorForm = { name: '', email: '', nationality: '', birthYear: '', bio: '' }

export default function HomePage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AuthorForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const totalBooks = authors.reduce((sum, a) => sum + a._count.books, 0)

  async function fetchAuthors() {
    try {
      setLoading(true)
      const res = await fetch('/api/authors')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAuthors(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar autores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAuthors() }, [])

  function handleEdit(author: Author) {
    setEditingId(author.id)
    setForm({
      name: author.name,
      email: author.email || '',
      nationality: author.nationality || '',
      birthYear: author.birthYear?.toString() || '',
      bio: author.bio || '',
    })
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError('El nombre es requerido'); return }
    setSubmitting(true)
    setError(null)
    try {
      const url = editingId ? `/api/authors/${editingId}` : '/api/authors'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(editingId ? 'Autor actualizado correctamente' : 'Autor creado correctamente')
      resetForm()
      fetchAuthors()
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar autor')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este autor? Se eliminarán todos sus libros.')) return
    try {
      const res = await fetch(`/api/authors/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Autor eliminado correctamente')
      fetchAuthors()
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar autor')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Biblioteca</h1>
            <p className="text-sm text-gray-500">Gestión de autores y libros</p>
          </div>
          <Link
            href="/books"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Ver Libros →
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Total Autores</p>
            <p className="text-4xl font-bold text-blue-600 mt-1">{authors.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Total Libros</p>
            <p className="text-4xl font-bold text-green-600 mt-1">{totalBooks}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {editingId ? 'Editar Autor' : 'Nuevo Autor'}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nombre del autor"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@ejemplo.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
                  <input
                    type="text"
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    placeholder="Ej: Colombiano"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año de nacimiento</label>
                  <input
                    type="number"
                    value={form.birthYear}
                    onChange={(e) => setForm({ ...form, birthYear: e.target.value })}
                    placeholder="1927"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Breve biografía..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Autor'}
                  </button>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Authors list */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Autores registrados</h2>
              </div>
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-sm text-gray-500">Cargando autores...</p>
                </div>
              ) : authors.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No hay autores registrados. ¡Crea el primero!
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {authors.map((author) => (
                    <div key={author.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-gray-900">{author.name}</h3>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
                              {author._count.books} libro{author._count.books !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                            {author.email && <span>{author.email}</span>}
                            {author.nationality && <span>{author.nationality}</span>}
                            {author.birthYear && <span>Nacido en {author.birthYear}</span>}
                          </div>
                          {author.bio && (
                            <p className="mt-1 text-xs text-gray-400 line-clamp-1">{author.bio}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Link
                            href={`/authors/${author.id}`}
                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            Ver
                          </Link>
                          <button
                            onClick={() => handleEdit(author)}
                            className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(author.id)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
