import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const book = await prisma.book.findUnique({
      where: { id },
      include: { author: true },
    })
    if (!book) {
      return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })
    }
    return NextResponse.json(book)
  } catch {
    return NextResponse.json({ error: "Error al obtener libro" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, isbn, publishedYear, genre, pages, authorId } = body

    const book = await prisma.book.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isbn !== undefined && { isbn: isbn?.trim() || null }),
        ...(publishedYear !== undefined && {
          publishedYear: publishedYear ? parseInt(String(publishedYear)) : null,
        }),
        ...(genre !== undefined && { genre: genre?.trim() || null }),
        ...(pages !== undefined && { pages: pages ? parseInt(String(pages)) : null }),
        ...(authorId !== undefined && { authorId }),
      },
      include: { author: true },
    })
    return NextResponse.json(book)
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError?.code === "P2025") {
      return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })
    }
    if (prismaError?.code === "P2002") {
      return NextResponse.json({ error: "El ISBN ya está en uso" }, { status: 409 })
    }
    return NextResponse.json({ error: "Error al actualizar libro" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.book.delete({ where: { id } })
    return NextResponse.json({ message: "Libro eliminado correctamente" })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError?.code === "P2025") {
      return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error al eliminar libro" }, { status: 500 })
  }
}
