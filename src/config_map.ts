export interface ConfigMap {
  type: string,
  namespace: string,
  doc?: string
}

export interface DBConfig extends ConfigMap {
  table_name: string,
  depends_on: string[],
  create_stmt: string,
  trigger_stmt: string[],
  description?: {
    table?: string,
    columns?: {
      [key: string]: string;
    }
  }
}