'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Author {
  id: string
  name: string
}

interface Book {
  id: string
  title: string
  description?: string | null
  isbn?: string | null
  publishedYear?: number | null
  genre?: string | null
  pages?: number | null
  authorId: string
  author: Author
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface BookForm {
  title: string
  description: string
  isbn: string
  publishedYear: string
  genre: string
  pages: string
  authorId: string
}

interface QueryState {
  search: string
  genre: string
  authorName: string
  sortBy: string
  order: string
  page: number
}

const EMPTY_FORM: BookForm = {
  title: '', description: '', isbn: '', publishedYear: '', genre: '', pages: '', authorId: '',
}

const GENRES = [
  'Ficción', 'No ficción', 'Ciencia ficción', 'Fantasía', 'Misterio',
  'Thriller', 'Romance', 'Terror', 'Historia', 'Biografía', 'Ciencia',
  'Poesía', 'Drama', 'Aventura', 'Otro',
]

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BookForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Displayed text input values (update immediately)
  const [searchInput, setSearchInput] = useState('')
  const [authorInput, setAuthorInput] = useState('')

  // Query state that drives the actual fetch
  const [query, setQuery] = useState<QueryState>({
    search: '', genre: '', authorName: '', sortBy: 'createdAt', order: 'desc', page: 1,
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Debounce text input changes
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setQuery((q) => ({ ...q, search: searchInput, authorName: authorInput, page: 1 }))
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [searchInput, authorInput])

  async function fetchBooks(q: QueryState) {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (q.search) params.set('search', q.search)
      if (q.genre) params.set('genre', q.genre)
      if (q.authorName) params.set('authorName', q.authorName)
      params.set('sortBy', q.sortBy)
      params.set('order', q.order)
      params.set('page', q.page.toString())
      params.set('limit', '10')

      const res = await fetch(`/api/books/search?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBooks(data.data)
      setPagination(data.pagination)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar libros')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAuthors() {
    try {
      const res = await fetch('/api/authors')
      const data = await res.json()
      if (res.ok) setAuthors(data)
    } catch { /* silent */ }
  }

  useEffect(() => { fetchAuthors() }, [])
  useEffect(() => { fetchBooks(query) }, [query])

  function handleEdit(book: Book) {
    setEditingId(book.id)
    setForm({
      title: book.title,
      description: book.description || '',
      isbn: book.isbn || '',
      publishedYear: book.publishedYear?.toString() || '',
      genre: book.genre || '',
      pages: book.pages?.toString() || '',
      authorId: book.authorId,
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
    if (!form.title.trim()) { setError('El título es requerido'); return }
    if (!form.authorId) { setError('El autor es requerido'); return }
    setSubmitting(true)
    setError(null)
    try {
      const url = editingId ? `/api/books/${editingId}` : '/api/books'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(editingId ? 'Libro actualizado correctamente' : 'Libro creado correctamente')
      resetForm()
      setQuery((q) => ({ ...q })) // trigger refetch
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar libro')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este libro?')) return
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Libro eliminado correctamente')
      setQuery((q) => ({ ...q })) // trigger refetch
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar libro')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Libros</h1>
            <p className="text-sm text-gray-500">Catálogo de la biblioteca</p>
          </div>
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            ← Autores
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {editingId ? 'Editar Libro' : 'Nuevo Libro'}
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
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Título del libro"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Autor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.authorId}
                    onChange={(e) => setForm({ ...form, authorId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Seleccionar autor...</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descripción del libro..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                    <input
                      type="text"
                      value={form.isbn}
                      onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                      placeholder="ISBN"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                    <input
                      type="number"
                      value={form.publishedYear}
                      onChange={(e) => setForm({ ...form, publishedYear: e.target.value })}
                      placeholder="2024"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                    <select
                      value={form.genre}
                      onChange={(e) => setForm({ ...form, genre: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="">Sin género</option>
                      {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Páginas</label>
                    <input
                      type="number"
                      value={form.pages}
                      onChange={(e) => setForm({ ...form, pages: e.target.value })}
                      placeholder="300"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Libro'}
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

          {/* Books list + filters */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Buscar por título..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <select
                  value={query.genre}
                  onChange={(e) => setQuery((q) => ({ ...q, genre: e.target.value, page: 1 }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Todos los géneros</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <input
                  type="text"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  placeholder="Filtrar por autor..."
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <select
                  value={query.sortBy}
                  onChange={(e) => setQuery((q) => ({ ...q, sortBy: e.target.value, page: 1 }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="createdAt">Ordenar: Fecha registro</option>
                  <option value="title">Ordenar: Título</option>
                  <option value="publishedYear">Ordenar: Año publicación</option>
                </select>
                <select
                  value={query.order}
                  onChange={(e) => setQuery((q) => ({ ...q, order: e.target.value, page: 1 }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <p className="text-sm text-gray-500">
                  {loading ? 'Buscando...' : `${pagination.total} resultado${pagination.total !== 1 ? 's' : ''}`}
                </p>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-sm text-gray-500">Cargando libros...</p>
                </div>
              ) : books.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No se encontraron libros con los filtros actuales
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {books.map((book) => (
                    <div key={book.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{book.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{book.author.name}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {book.genre && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                {book.genre}
                              </span>
                            )}
                            {book.publishedYear && (
                              <span className="text-xs text-gray-400">{book.publishedYear}</span>
                            )}
                            {book.pages && (
                              <span className="text-xs text-gray-400">{book.pages} págs.</span>
                            )}
                            {book.isbn && (
                              <span className="text-xs text-gray-400">ISBN: {book.isbn}</span>
                            )}
                          </div>
                          {book.description && (
                            <p className="mt-1 text-xs text-gray-400 line-clamp-1">{book.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(book)}
                            className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(book.id)}
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    ← Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
