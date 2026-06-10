import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const author = await prisma.author.findUnique({
      where: { id },
      include: { books: true },
    })

    if (!author) {
      return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 })
    }

    const books = author.books
    const totalBooks = books.length

    if (totalBooks === 0) {
      return NextResponse.json({
        totalBooks: 0,
        firstBook: null,
        latestBook: null,
        averagePages: 0,
        genres: [],
        longestBook: null,
        shortestBook: null,
      })
    }

    const booksWithYear = books.filter((b) => b.publishedYear !== null)
    const firstBook =
      booksWithYear.length > 0
        ? booksWithYear.reduce((a, b) => (a.publishedYear! < b.publishedYear! ? a : b))
        : null
    const latestBook =
      booksWithYear.length > 0
        ? booksWithYear.reduce((a, b) => (a.publishedYear! > b.publishedYear! ? a : b))
        : null

    const booksWithPages = books.filter((b) => b.pages !== null)
    const averagePages =
      booksWithPages.length > 0
        ? Math.round(
            booksWithPages.reduce((sum, b) => sum + b.pages!, 0) / booksWithPages.length
          )
        : 0

    const genres = [...new Set(books.filter((b) => b.genre).map((b) => b.genre!))]

    const longestBook =
      booksWithPages.length > 0
        ? booksWithPages.reduce((a, b) => (a.pages! > b.pages! ? a : b))
        : null
    const shortestBook =
      booksWithPages.length > 0
        ? booksWithPages.reduce((a, b) => (a.pages! < b.pages! ? a : b))
        : null

    return NextResponse.json({
      totalBooks,
      firstBook: firstBook
        ? { title: firstBook.title, year: firstBook.publishedYear }
        : null,
      latestBook: latestBook
        ? { title: latestBook.title, year: latestBook.publishedYear }
        : null,
      averagePages,
      genres,
      longestBook: longestBook
        ? { title: longestBook.title, pages: longestBook.pages }
        : null,
      shortestBook: shortestBook
        ? { title: shortestBook.title, pages: shortestBook.pages }
        : null,
    })
  } catch {
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}
