import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const authors = await prisma.author.findMany({
      include: {
        _count: { select: { books: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(authors)
  } catch {
    return NextResponse.json({ error: "Error al obtener autores" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, nationality, birthYear, bio } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const author = await prisma.author.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        nationality: nationality?.trim() || null,
        birthYear: birthYear ? parseInt(String(birthYear)) : null,
        bio: bio?.trim() || null,
      },
    })
    return NextResponse.json(author, { status: 201 })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError?.code === "P2002") {
      return NextResponse.json({ error: "El email ya está en uso" }, { status: 409 })
    }
    return NextResponse.json({ error: "Error al crear autor" }, { status: 500 })
  }
}
