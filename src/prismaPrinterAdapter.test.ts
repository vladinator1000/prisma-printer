import { describe, it, expect } from "vitest"
import { PrismaPrinter } from "./prismaPrinterAdapter"
import { PrismaClient } from "@prisma/client"

describe('prismaPrinterAdapter', () => {
  let adapter = new PrismaPrinter()
  let prisma = new PrismaClient({adapter})
  it('prints sql', async () => {
    await prisma.user.createMany({
      data: [
        { name: 'Luke' },
        { name: 'Leia' },
      ]
    })

    let sql = adapter.print()
    expect(sql).toEqual('INSERT...')
  })
})