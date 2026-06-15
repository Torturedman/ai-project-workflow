declare module "better-sqlite3" {
  interface Statement<TBind = unknown, TResult = unknown> {
    run(...params: TBind[]): TResult;
    get(...params: TBind[]): TResult | undefined;
    all(...params: TBind[]): TResult[];
    pluck(): Statement<TBind, TResult>;
  }

  interface Database {
    prepare<TBind = unknown, TResult = unknown>(sql: string): Statement<TBind, TResult>;
    exec(sql: string): void;
    pragma(source: string): unknown;
    close(): void;
  }

  interface DatabaseConstructor {
    new (filename: string): Database;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
