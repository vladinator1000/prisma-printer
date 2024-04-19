import { DriverAdapter } from '@prisma/client/runtime/library'

class PrinterQueryable {
  constructor() {}

  readonly provider = 'sqlite'
  readonly adapterName = 'printer'

  private statements: string[] = []

  public print() {
    let result = this.statements.join('\n')
    this.statements = []
    return result
  }

  async performIO(query: any) {
    query.args = query.args.map((arg: any) => cleanArg(arg))
    let paramCounter = 0
    // replace occurrences of "?" with params in order
    let statement = query.sql.replace(/\?/g, () => {
      let param = query.args[paramCounter]
      paramCounter++
      return param
    })
    this.statements.push(statement)
  }

  async queryRaw(query: any) {
    await this.performIO(query)
    return okEmptyResultSet as any
  }
  async executeRaw(query: any) {
    await this.performIO(query)
    return ok(0) as any
  }
}

export let okEmptyResultSet = ok({
  columnTypes: [],
  columnNames: [],
  rows: [],
})

type PrismaResult<T> = {
  // common methods
  map<U>(fn: (value: T) => U): PrismaResult<U>
  flatMap<U>(fn: (value: T) => PrismaResult<U>): PrismaResult<U>
} & (
  | {
      readonly ok: true
      readonly value: T
    }
  | {
      readonly ok: false
      readonly error: Error
    }
)

function ok<T>(value: T): PrismaResult<T> {
  return {
    ok: true,
    value,
    map(fn) {
      return ok(fn(value))
    },
    flatMap(fn) {
      return fn(value)
    },
  }
}

function cleanArg(arg: unknown): unknown {
  // * Hack for booleans, we must convert them to 0/1.
  // * ✘ [ERROR] Error in performIO: Error: D1_TYPE_ERROR: Type 'boolean' not supported for value 'true'
  if (arg === true) {
    return 1
  }

  if (arg === false) {
    return 0
  }

  if (arg instanceof Uint8Array) {
    return Array.from(arg)
  }

  if (typeof arg === 'bigint') {
    return String(arg)
  }

  return arg
}

class PrinterTransaction extends PrinterQueryable /* implements Transaction */ {
  constructor() {
    super()
  }
  async commit(): Promise<PrismaResult<void>> {
    return ok(undefined)
  }

  async rollback(): Promise<PrismaResult<void>> {
    return ok(undefined)
  }
}

export class PrismaPrinter extends PrinterQueryable implements DriverAdapter {
  constructor() {
    super()
  }
  async startTransaction() {
    return ok(new PrinterTransaction()) as any
  }
}
