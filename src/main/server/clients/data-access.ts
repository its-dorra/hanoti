import { eq, like, sql, and, or, lt, desc } from 'drizzle-orm'
import type { AppDb, AppTransaction } from '../../db/client'
import { clients } from '../../db/schema'
import type {
  CreateClientInput,
  UpdateClientInput,
  ClientCursor
} from '../../../shared/schemas/client.schema'

const CLIENT_COLUMNS = {
  id: clients.id,
  name: clients.name,
  phone: clients.phone,
  notes: clients.notes,
  debt: clients.debt,
  createdAt: clients.createdAt,
  updatedAt: clients.updatedAt
}

export class ClientsDataAccess {
  constructor(private readonly db: AppDb) {}

  async findAll(query: string, cursor?: ClientCursor | null, limit?: number) {
    const queryLimit = limit ?? 20

    const q = this.db
      .select(CLIENT_COLUMNS)
      .from(clients)
      .where(
        and(
          query ? like(clients.name, `%${query}%`) : undefined,
          cursor
            ? or(
                lt(clients.createdAt, cursor.createdAt),
                and(eq(clients.createdAt, cursor.createdAt), lt(clients.id, cursor.id))
              )
            : undefined
        )
      )
      .orderBy(desc(clients.createdAt), desc(clients.id))
      .limit(queryLimit + 1)

    return q
  }

  async findById(id: number) {
    const [row] = await this.db.select(CLIENT_COLUMNS).from(clients).where(eq(clients.id, id))
    return row ?? null
  }

  async create(input: CreateClientInput) {
    const [row] = await this.db
      .insert(clients)
      .values({
        name: input.name,
        phone: input.phone ?? null,

        notes: input.notes ?? null
      })
      .returning(CLIENT_COLUMNS)
    return row
  }

  async update(input: UpdateClientInput) {
    const { id, ...rest } = input
    const [row] = await this.db
      .update(clients)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning(CLIENT_COLUMNS)
    return row ?? null
  }

  async delete(id: number) {
    const [row] = await this.db.delete(clients).where(eq(clients.id, id)).returning(CLIENT_COLUMNS)
    return row ?? null
  }

  async adjustDebt(tx: AppTransaction, clientId: number, delta: number) {
    const [row] = await tx
      .update(clients)
      .set({ debt: sql`${clients.debt} + ${delta}`, updatedAt: new Date() })
      .where(eq(clients.id, clientId))
      .returning(CLIENT_COLUMNS)
    return row ?? null
  }
}
