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

export function render_page(page: string, view: any) {
  registerAdminPartials();
  let file = readFileSync(`./resources/private/html/${page}`, "utf-8")
  return AdminHandlebars.compile(file)(view);    
}

export function render_partial(path: string, view: any) {
  registerAdminPartials();
  let file = readFileSync(path, "utf-8")
  return AdminHandlebars.compile(file)(view);  
}