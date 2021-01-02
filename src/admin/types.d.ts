import Koa from "koa";

interface AdminSession {
  refresh: () => any,
  isAdmin?: true
}

export type KoaAdminCtx = Koa.ParameterizedContext | Koa.ParameterizedContext & {session: AdminSession};

interface SidebarView {
  title: string
}

interface HeaderView {
  title: string
}

interface NavigationView {
  tabs: {label: string, href: string, highlight?: boolean}[]
}

interface BackendView {
  sidebar: SidebarView,
  header: HeaderView,
  navigation?: NavigationView
}

export interface DashboardView extends BackendView{
  page: {
    dashboard: {

    }
  }
}

export interface UsersOverviewView extends BackendView{
  page: {
    'users.overview': {

    }
  }
}

export interface UsersAddUserView extends BackendView{
  page: {
    'users.add-user': {

    }
  }
}

export interface LogsView extends BackendView{
  page: {
    logs: {

    }
  }
}

export interface BackgroundJobsView extends BackendView{
  page: {
    background_jobs: {

    }
  }
}

export interface PostgresqlView extends BackendView{
  page: {
    postgresql: {
      overview?: { },
      tables?: { },
      types?: { },
      functions?: { },
    }
  }
}

export interface RoutesView extends BackendView{
  page: {
    routes: {

    }
  }
}

export interface GraphQlView extends BackendView{
  page: {
    graphql: {

    }
  }
}
export interface ExtensionsView extends BackendView{
  page: {
    extensions: {

    }
  }
}
