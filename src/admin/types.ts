import Koa from "koa";
import {CustomParameterizedContext} from "../types";

interface AdminSession {
  refresh: () => any,
  isAdmin?: true
}

export type KoaAdminCtx = Koa.ParameterizedContext | CustomParameterizedContext & { session: AdminSession };

export interface TableRow {
  table_schema: string,
  table_name: string,
  column_name: string,
  ordinal_position: number,
  column_default: string,
  is_nullable: string,
  data_type: string,
  is_primary_key: boolean,
  is_foreign_key: boolean,
  is_unique: boolean,
  description?: string
};

export interface SchemaTables {
  table_schema: string,
  tables: [
    {
      table_name: string,
      table_rows: TableRow[]
    }
  ]
};