import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get("genre")

    const books = await prisma.book.findMany({
      where: genre ? { genre } : undefined,
      include: { author: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(books)
  } catch {
    return NextResponse.json({ error: "Error al obtener libros" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, isbn, publishedYear, genre, pages, authorId } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "El título es requerido" }, { status: 400 })
    }
    if (!authorId) {
      return NextResponse.json({ error: "El autor es requerido" }, { status: 400 })
    }

    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        isbn: isbn?.trim() || null,
        publishedYear: publishedYear ? parseInt(String(publishedYear)) : null,
        genre: genre?.trim() || null,
        pages: pages ? parseInt(String(pages)) : null,
        authorId,
      },
      include: { author: true },
    })
    return NextResponse.json(book, { status: 201 })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError?.code === "P2002") {
      return NextResponse.json({ error: "El ISBN ya está en uso" }, { status: 409 })
    }
    if (prismaError?.code === "P2003") {
      return NextResponse.json({ error: "El autor especificado no existe" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error al crear libro" }, { status: 500 })
  }
}
