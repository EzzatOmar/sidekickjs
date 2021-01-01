import Koa from "koa";

interface AdminSession {
  refresh: () => any,
  isAdmin?: true
}

export type KoaAdminCtx = Koa.ParameterizedContext | Koa.ParameterizedContext & {session: AdminSession};

export interface DashboardView {

}