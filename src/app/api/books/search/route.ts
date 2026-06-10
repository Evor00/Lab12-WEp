import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get("search") || ""
    const genre = searchParams.get("genre") || ""
    const authorName = searchParams.get("authorName") || ""
    const rawPage = parseInt(searchParams.get("page") || "1")
    const rawLimit = parseInt(searchParams.get("limit") || "10")
    const sortByParam = searchParams.get("sortBy") || "createdAt"
    const orderParam = searchParams.get("order") || "desc"

    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage)
    const limit = Math.min(50, Math.max(1, isNaN(rawLimit) ? 10 : rawLimit))

    const validSortFields = ["title", "publishedYear", "createdAt"]
    const sortBy = validSortFields.includes(sortByParam) ? sortByParam : "createdAt"
    const order = orderParam === "asc" ? "asc" : "desc"

    const where: Record<string, unknown> = {}
    if (search) where.title = { contains: search, mode: "insensitive" }
    if (genre) where.genre = genre
    if (authorName) where.author = { name: { contains: authorName, mode: "insensitive" } }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: { author: true },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.book.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch {
    return NextResponse.json({ error: "Error al buscar libros" }, { status: 500 })
  }
}
