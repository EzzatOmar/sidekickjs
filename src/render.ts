import { readFileSync, ReadStream, existsSync } from "fs";
import Handlebars_ from "handlebars";
// import Hbs from "handlebars";
import {getFileFromDir} from "./utils/files";
import {ParameterizedContext, Next} from "koa";
import { syncQueryReadOnly } from "./database/sidekick_api";
// var promisedHandlebars = require('promised-handlebars')
// const Handlebars = promisedHandlebars(Handlebars_)
// var CustomHandlebars = promisedHandlebars(require('handlebars'));

const CustomHandlebars = Handlebars_.create();

function getPartialDirectory(){
  if(existsSync("./custom/resources/public/web/partials/handlebars")) {
    return [6, "./custom/resources/public/web/partials/handlebars"];
  }
  else if(existsSync("./custom/dist/pages")) {
    return [3, "./custom/dist/pages"];
  }
  else {
    return null;
  }
}

export function registerCustomPartials() {
  let partialDir = getPartialDirectory();
  if(partialDir) {
    // @ts-ignore
    getFileFromDir(partialDir[1], [], '\.(handlebars|html|htm)')
    .map((x:string):[string, string] => {
       // @ts-ignore
      let arr = x.split('/').splice(partialDir[0]);
      arr[arr.length - 1] = arr[arr.length - 1].split('.')[0];
      let ret;
      if(arr[arr.length - 1] === 'index') {
        ret = arr.slice(0, -1).join('.');
      } else {
        ret = arr.join('.');
      }
      return [ret, './' + x];
    })
    .map( ([partial_name, path]) => {
      CustomHandlebars.registerPartial(partial_name, readFileSync(path, "utf-8"))
    });
  }
}

registerCustomPartials();

export function registerCustomHelpers() {
  CustomHandlebars.registerHelper('sql', function (stmt, options) {
    let jwt = options.data.root.jwt;
    try {
      let ret = "";
      let r = syncQueryReadOnly(jwt, stmt, [])
      for(const context of r)
        ret = ret + options.fn(context);
      return ret;
    } catch (err) {
      console.log(stmt, err);
      return "BAD";
    }

})
}
registerCustomHelpers();


function readStream(stream:ReadStream, encoding:BufferEncoding = "utf8"):Promise<string> {
  stream.setEncoding(encoding);
  return new Promise((resolve, reject) => {
      let data = "";
      stream.on("data", chunk => data += chunk);
      stream.on("end", () => resolve(data));
      stream.on("error", error => reject(error));
  });
}

export function compile_handlebars(html:string, view: any){
  return CustomHandlebars.compile(html)(view);
}

export function render_html(path: string, view: any):string{
  return compile_handlebars(readFileSync(path, "utf-8"), view);
}

export async function mw_render_html(ctx: ParameterizedContext, next: Next) {
  await next();
  let ct = ctx.response.headers['content-type'] as string;
  let is_html = (!!ct && ctx.response.body && ct.includes('text/html'));
  let is_handlebars = ctx.url.endsWith(".handlebars");
  let no_redirect = ctx.status < 300 || 399 < ctx.status;
  if( no_redirect && (is_html || is_handlebars) ){
    let html = await readStream(ctx.response.body);
    // NOTE: handlebars vars are resolved here
    let rendered = compile_handlebars(html, {
      jwt: ctx.user || ctx.jwt,
      prod: (process.env.ENVIRONMENT as string).toLowerCase() === 'prod',
      staging: (process.env.ENVIRONMENT as string).toLowerCase() === 'staging',
      local: (process.env.ENVIRONMENT as string).toLowerCase() === 'local'
    });
    ctx.response.body = rendered;
    if(ctx.url.endsWith(".handlebars")) ctx.response.set('Content-Type', 'text/plain');

  }
}