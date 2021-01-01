import {readFileSync} from "fs";
import {render} from "mustache";
import { DashboardView, UsersOverviewView, UsersAddUserView, LogsView, BackgroundJobsView, RoutesView, PostgresqlView } from "./types";

const partials = {
  header: readFileSync(`./resources/private/html/partials/header.mustache`, "utf-8"),
};
type ViewType = DashboardView | UsersOverviewView | UsersAddUserView | LogsView | BackgroundJobsView | RoutesView | PostgresqlView;

export function render_page(page: string, view: ViewType) {
  let file = readFileSync(`./resources/private/html/admin/${page}.html`, "utf-8")
  return render(file, view, 
    {
      'header': readFileSync(`./resources/private/html/partials/header.mustache`, "utf-8"),
      'navigation.tabs': readFileSync(`./resources/private/html/partials/navigation/tabs.mustache`, "utf-8"),
      'backend.dashboard': readFileSync(`./resources/private/html/partials/backend/dashboard.mustache`, "utf-8"),
      'backend.users.overview': readFileSync(`./resources/private/html/partials/backend/users/overview.mustache`, "utf-8"),
      'backend.users.add-user': readFileSync(`./resources/private/html/partials/backend/users/add-user.mustache`, "utf-8"),
      'backend.logs': readFileSync(`./resources/private/html/partials/backend/logs.mustache`, "utf-8"),
      'backend.postgresql': readFileSync(`./resources/private/html/partials/backend/postgresql.mustache`, "utf-8"),
      'backend.routes': readFileSync(`./resources/private/html/partials/backend/routes.mustache`, "utf-8"),
      'backend.background_jobs': readFileSync(`./resources/private/html/partials/backend/background_jobs.mustache`, "utf-8"),
      'sidebar.desktop': readFileSync(`./resources/private/html/partials/sidebar/desktop.mustache`, "utf-8"),
      'sidebar.mobile': readFileSync(`./resources/private/html/partials/sidebar/mobile.mustache`, "utf-8"),
      'sidebar.with_secondary_navigation': readFileSync(`./resources/private/html/partials/sidebar/with_secondary_navigation.mustache`, "utf-8"),
    }
    
    
    );
}