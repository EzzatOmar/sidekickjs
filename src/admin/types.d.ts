import Koa from "koa";

interface AdminSession {
  refresh: () => any,
  isAdmin?: true
}

type KoaAdminCtx = Koa.ParameterizedContext & {session: AdminSession};