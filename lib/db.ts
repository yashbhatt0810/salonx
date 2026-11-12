import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __salonxSql: ReturnType<typeof postgres> | undefined;
}

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return postgres(url, {
    max: 10,
    onnotice: () => {},
    types: {
      // numeric -> JS number, date -> 'YYYY-MM-DD' string
      numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
      date: { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    },
  });
}

export function db() {
  if (!global.__salonxSql) global.__salonxSql = create();
  return global.__salonxSql;
}

export const hasDb = () => Boolean(process.env.DATABASE_URL);
