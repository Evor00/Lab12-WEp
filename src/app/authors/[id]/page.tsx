'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Book {
  id: string
  title: string
  description?: string | null
  isbn?: string | null
  publishedYear?: number | null
  genre?: string | null
  pages?: number | null
  authorId: string
  createdAt: string
}

interface AuthorDetail {
  id: string
  name: string
  email?: string | null
  nationality?: string | null
  birthYear?: number | null
  bio?: string | null
  createdAt: string
  books: Book[]
}

interface Stats {
  totalBooks: number
  firstBook: { title: string; year: number } | null
  latestBook: { title: string; year: number } | null
  averagePages: number
  genres: string[]
  longestBook: { title: string; pages: number } | null
  shortestBook: { title: string; pages: number } | null
}

interface AuthorForm {
  name: string
  email: string
  nationality: string
  birthYear: string
  bio: string
}

interface BookForm {
  title: string
  description: string
  isbn: string
  publishedYear: string
  genre: string
  pages: string
}

const EMPTY_BOOK_FORM: BookForm = {
  title: '', description: '', isbn: '', publishedYear: '', genre: '', pages: '',
}

const GENRES = [
  'Ficción', 'No ficción', 'Ciencia ficción', 'Fantasía', 'Misterio',
  'Thriller', 'Romance', 'Terror', 'Historia', 'Biografía', 'Ciencia',
  'Poesía', 'Drama', 'Aventura', 'Otro',
]

export default function AuthorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [author, setAuthor] = useState<AuthorDetail | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingBook, setIsAddingBook] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [authorForm, setAuthorForm] = useState<AuthorForm>({
    name: '', email: '', nationality: '', birthYear: '', bio: '',
  })
  const [bookForm, setBookForm] = useState<BookForm>(EMPTY_BOOK_FORM)

  async function fetchAuthor() {
    try {
      setLoading(true)
      const res = await fetch(`/api/authors/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAuthor(data)
      setAuthorForm({
        name: data.name,
        email: data.email || '',
        nationality: data.nationality || '',
        birthYear: data.birthYear?.toString() || '',
        bio: data.bio || '',
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar autor')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch(`/api/authors/${id}/stats`)
      const data = await res.json()
      if (res.ok) setStats(data)
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchAuthor()
    fetchStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleUpdateAuthor() {
    if (!authorForm.name.trim()) { setError('El nombre es requerido'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authorForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Autor actualizado correctamente')
      setIsEditing(false)
      fetchAuthor()
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al actualizar autor')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddBook() {
    if (!bookForm.title.trim()) { setError('El título es requerido'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bookForm, authorId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Libro agregado correctamente')
      setBookForm(EMPTY_BOOK_FORM)
      setIsAddingBook(false)
      fetchAuthor()
      fetchStats()
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al agregar libro')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteBook(bookId: string) {
    if (!confirm('¿Eliminar este libro?')) return
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Libro eliminado')
      fetchAuthor()
      fetchStats()
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar libro')
    }
  }

  async function handleDeleteAuthor() {
    if (!confirm(`¿Eliminar a ${author?.name}? Se eliminarán todos sus libros.`)) return
    try {
      const res = await fetch(`/api/authors/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      router.push('/')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar autor')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Autor no encontrado</p>
          <Link href="/" className="text-blue-600 hover:underline text-sm">← Volver al inicio</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-700">Inicio</Link>
              <span>/</span>
              <span className="text-gray-800 font-medium">{author.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{author.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/books" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Ver Libros
            </Link>
            <button
              onClick={handleDeleteAuthor}
              className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm transition-colors"
            >
              Eliminar Autor
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold ml-4">×</button>
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: info + forms */}
          <div className="space-y-4">
            {/* Author info / edit */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Información</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isEditing ? 'Cancelar' : 'Editar'}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={authorForm.name}
                      onChange={(e) => setAuthorForm({ ...authorForm, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={authorForm.email}
                      onChange={(e) => setAuthorForm({ ...authorForm, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nacionalidad</label>
                    <input
                      type="text"
                      value={authorForm.nationality}
                      onChange={(e) => setAuthorForm({ ...authorForm, nationality: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Año de nacimiento</label>
                    <input
                      type="number"
                      value={authorForm.birthYear}
                      onChange={(e) => setAuthorForm({ ...authorForm, birthYear: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Biografía</label>
                    <textarea
                      value={authorForm.bio}
                      onChange={(e) => setAuthorForm({ ...authorForm, bio: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleUpdateAuthor}
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    {submitting ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {author.email && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 shrink-0">Email:</span>
                      <span className="text-gray-700">{author.email}</span>
                    </div>
                  )}
                  {author.nationality && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 shrink-0">Nacionalidad:</span>
                      <span className="text-gray-700">{author.nationality}</span>
                    </div>
                  )}
                  {author.birthYear && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 shrink-0">Nacimiento:</span>
                      <span className="text-gray-700">{author.birthYear}</span>
                    </div>
                  )}
                  {author.bio && (
                    <div className="pt-1">
                      <p className="text-gray-400 mb-1 text-xs">Biografía:</p>
                      <p className="text-gray-600 text-xs leading-relaxed">{author.bio}</p>
                    </div>
                  )}
                  {!author.email && !author.nationality && !author.birthYear && !author.bio && (
                    <p className="text-gray-400 text-xs">Sin información adicional</p>
                  )}
                  <p className="text-xs text-gray-400 pt-1">
                    Registrado: {new Date(author.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
            </div>

            {/* Add Book form */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Agregar Libro</h2>
                <button
                  onClick={() => setIsAddingBook(!isAddingBook)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isAddingBook ? 'Cancelar' : '+ Nuevo'}
                </button>
              </div>

              {isAddingBook && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                    <input
                      type="text"
                      value={bookForm.title}
                      onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                      placeholder="Título del libro"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                    <textarea
                      value={bookForm.description}
                      onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">ISBN</label>
                      <input
                        type="text"
                        value={bookForm.isbn}
                        onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Año</label>
                      <input
                        type="number"
                        value={bookForm.publishedYear}
                        onChange={(e) => setBookForm({ ...bookForm, publishedYear: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Género</label>
                      <select
                        value={bookForm.genre}
                        onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="">Sin género</option>
                        {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Páginas</label>
                      <input
                        type="number"
                        value={bookForm.pages}
                        onChange={(e) => setBookForm({ ...bookForm, pages: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddBook}
                    disabled={submitting}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    {submitting ? 'Guardando...' : 'Agregar Libro'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right column: stats + books list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            {stats && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{stats.totalBooks}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Libros</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">
                      {stats.averagePages > 0 ? stats.averagePages : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Págs. promedio</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{stats.genres.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Géneros</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.firstBook?.year ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Primer libro</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.firstBook && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-400">Primer libro</p>
                      <p className="font-medium text-gray-700 text-sm truncate">{stats.firstBook.title}</p>
                      <p className="text-xs text-gray-500">{stats.firstBook.year}</p>
                    </div>
                  )}
                  {stats.latestBook && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-400">Último libro</p>
                      <p className="font-medium text-gray-700 text-sm truncate">{stats.latestBook.title}</p>
                      <p className="text-xs text-gray-500">{stats.latestBook.year}</p>
                    </div>
                  )}
                  {stats.longestBook && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-400">Libro más largo</p>
                      <p className="font-medium text-gray-700 text-sm truncate">{stats.longestBook.title}</p>
                      <p className="text-xs text-gray-500">{stats.longestBook.pages} páginas</p>
                    </div>
                  )}
                  {stats.shortestBook && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-400">Libro más corto</p>
                      <p className="font-medium text-gray-700 text-sm truncate">{stats.shortestBook.title}</p>
                      <p className="text-xs text-gray-500">{stats.shortestBook.pages} páginas</p>
                    </div>
                  )}
                </div>

                {stats.genres.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-2">Géneros escritos:</p>
                    <div className="flex flex-wrap gap-1">
                      {stats.genres.map((g) => (
                        <span key={g} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Books list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">
                  Libros ({author.books.length})
                </h2>
              </div>
              {author.books.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Este autor no tiene libros registrados.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {author.books.map((book) => (
                    <div key={book.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{book.title}</h3>
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
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                        >
                          Eliminar
                        </button>
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
