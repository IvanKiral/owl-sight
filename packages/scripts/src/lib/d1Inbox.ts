import { execa } from "execa";

const INBOX_DB = "cookmark-recipe-inbox";
const RECIPES_DB = "cookmark-recipes";

const escapeSqlString = (value: string): string => value.replace(/'/g, "''");

export type InboxStatus = "pending" | "review" | "done" | "failed";

export type InboxItem = {
  readonly id: number;
  readonly url: string;
};

type D1StatementResult = {
  readonly results?: ReadonlyArray<Record<string, unknown>>;
};

const runRemoteSql = async (
  database: string,
  command: string,
): Promise<ReadonlyArray<Record<string, unknown>>> => {
  const { stdout } = await execa("wrangler", [
    "d1",
    "execute",
    database,
    "--remote",
    "--json",
    "--command",
    command,
  ]);

  const parsed: unknown = JSON.parse(stdout);
  const statements = Array.isArray(parsed) ? parsed : [parsed];
  const first = statements[0] as D1StatementResult | undefined;
  return first?.results ?? [];
};

export const getPending = async (limit: number): Promise<ReadonlyArray<InboxItem>> => {
  const rows = await runRemoteSql(
    INBOX_DB,
    `SELECT id, url FROM recipe_inbox WHERE status = 'pending' ORDER BY created_at ASC LIMIT ${limit}`,
  );

  return rows.map((row) => ({ id: Number(row.id), url: String(row.url) }));
};

export const countPending = async (): Promise<number> => {
  const rows = await runRemoteSql(
    INBOX_DB,
    "SELECT COUNT(*) AS count FROM recipe_inbox WHERE status = 'pending'",
  );

  return rows.length > 0 ? Number(rows[0].count) : 0;
};

export const markStatus = async (id: number, status: InboxStatus): Promise<void> => {
  await runRemoteSql(INBOX_DB, `UPDATE recipe_inbox SET status = '${status}' WHERE id = ${id}`);
};

export const markDoneByUrl = async (url: string): Promise<void> => {
  await runRemoteSql(
    INBOX_DB,
    `UPDATE recipe_inbox SET status = 'done' WHERE url = '${escapeSqlString(url)}'`,
  );
};

export const insertRecipe = async (slug: string, data: string): Promise<void> => {
  await runRemoteSql(
    RECIPES_DB,
    `INSERT OR REPLACE INTO recipes (slug, data) VALUES ('${escapeSqlString(slug)}', '${escapeSqlString(data)}')`,
  );
};
