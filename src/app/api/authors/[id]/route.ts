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
      include: { books: { orderBy: { createdAt: "desc" } } },
    })
    if (!author) {
      return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 })
    }
    return NextResponse.json(author)
  } catch {
    return NextResponse.json({ error: "Error al obtener autor" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, nationality, birthYear, bio } = body

    const author = await prisma.author.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(nationality !== undefined && { nationality: nationality?.trim() || null }),
        ...(birthYear !== undefined && {
          birthYear: birthYear ? parseInt(String(birthYear)) : null,
        }),
        ...(bio !== undefined && { bio: bio?.trim() || null }),
      },
    })
    return NextResponse.json(author)
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError?.code === "P2025") {
      return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 })
    }
    if (prismaError?.code === "P2002") {
      return NextResponse.json({ error: "El email ya está en uso" }, { status: 409 })
    }
    return NextResponse.json({ error: "Error al actualizar autor" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.author.delete({ where: { id } })
    return NextResponse.json({ message: "Autor eliminado correctamente" })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError?.code === "P2025") {
      return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error al eliminar autor" }, { status: 500 })
  }
}
