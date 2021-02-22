import {readFileSync} from "fs";
import Handlebars from "handlebars";
import {getFileFromDir} from "../utils/files";

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

function getCustomPages(){
  try {
    // let handlerDirs = getFileFromDir('./', [], "handler\.js");
    let handlerDirs = getFileFromDir('./custom/dist/admin', [], "handler\.js");
    console.log(handlerDirs)
    let distinct:string[] = []
    let array = handlerDirs.map(path => {
      let [page] = path.split('/').splice(3);
      return page;
    })
    let pages = [...(new Set(array))];
    return pages.map(p => {return {label: p, href: `/admin/${p.replace(' ', '-').toLocaleLowerCase()}`}})
  } catch (err) {
    return null;
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