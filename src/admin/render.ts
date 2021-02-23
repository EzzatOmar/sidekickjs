import {readFileSync} from "fs";
import Handlebars from "handlebars";
import {getFileFromDir} from "../utils/files";
import {customPages} from "./customAdmin";

const AdminHandlebars = Handlebars.create();

function registerAdminPartials() {
  getFileFromDir('./resources/private/html/handlebars/partials', [], '.handlebars')
  .map((x:string):[string, string] => {
    let arr = x.split('/').splice(5);
    arr[arr.length - 1] = arr[arr.length - 1].slice(0, -11);
    let ret;
    if(arr[arr.length - 1] === 'index') {
      ret = arr.slice(0, -1).join('.');
    } else {
      ret = arr.join('.');
    }
    return [ret, './' + x];
  })
  .map( ([partial_name, path]) => {
    AdminHandlebars.registerPartial(partial_name, readFileSync(path, "utf-8"))
  })
}

registerAdminPartials();

function customAdminPartials () {
  // AdminHandlebars.registerHelper('customPartials', function(context, options) { 
  //   console.log('customAdminPartials', context, options);
  //   return 'backend.logs'; 
  // });
  let html = getFileFromDir('./custom/dist/admin', [], ".*\.html")
  .map((x:string):[string, string] => {
    let arr = x.split('/').splice(3);
    arr[arr.length - 1] = arr[arr.length - 1].slice(0, -5);
    let ret;
    if(arr[arr.length - 1] === 'index') {
      ret = arr.slice(0, -1).join('.');
    } else {
      ret = arr.join('.');
    }
    return [`custom.${ret.replace(/ /g, '-', ).toLocaleLowerCase()}`, './' + x];
  })
  .map( ([partial_name, path]) => {
    AdminHandlebars.registerPartial(partial_name, readFileSync(path, "utf-8"))
  });
}

function getCustomPages(){
  try {
    // let handlerDirs = getFileFromDir('./', [], "handler\.js");
    let handlerDirs = getFileFromDir('./custom/dist/admin', [], "handler\.js");
    let array = handlerDirs.map(path => {
      let [page] = path.split('/').splice(3);
      return page;
    })
    let pages = [...(new Set(array))];
    return pages.map(p => {return {label: p, href: `/admin/${p.replace(' ', '-').toLocaleLowerCase()}`}})
  } catch (err) {
    return [];
  }
}

export function render_page(page: string, view: any) {
  registerAdminPartials();
  let file = readFileSync(`./resources/private/html/${page}`, "utf-8")
  return AdminHandlebars.compile(file)(Object.assign(view, {customPages: getCustomPages()}));    
}

export function render_partial(path: string, view: any) {
  registerAdminPartials();
  let file = readFileSync(path, "utf-8")
  return AdminHandlebars.compile(file)(view);  
}

export function render_custom_tab(path: string, view = {}) {
  customAdminPartials();
  let [page, tab] = path.split('/').splice(-3);
  let customPage = customPages.find( c => c.name === page);
  // let file = readFileSync(path, "utf-8");
  let file = readFileSync(`./resources/private/html/admin/backend.html`, "utf-8");
  // return "OK"
  try {
    let customView = {
      customPages: getCustomPages(),
      navigation: {tabs: customPage?.tabs.map(t => {return {label: t.name, href: t.url, highlight: tab === t.name}})
       },
      sidebar: { title: "Sidekick.js" },
      header: { title: "Sidekick.js" },
      page: {
        customPage: {
          customPartial: `custom.${page.replace(/ /g, '-').toLocaleLowerCase()}.${tab.replace(/ /g, '-').toLocaleLowerCase()}`
        }
      }
    }
    return AdminHandlebars.compile(file)(Object.assign(view, customView));

  } catch (err) {
    console.log(err); return "ERROR"
  }

}