import { readFileSync, ReadStream } from "fs";
import Handlebars from "handlebars";
import {getFileFromDir} from "./utils/files";
import {ParameterizedContext, Next} from "koa";

const CustomHandlebars = Handlebars.create();

function registerCustomPartials() {
  return getFileFromDir('./custom/resources/public/web/partials/handlebars', [], '.handlebars')
  .map((x:string):[string, string] => {
    console.log(x)
    let arr = x.split('/').splice(6);
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
    CustomHandlebars.registerPartial(partial_name, readFileSync(path, "utf-8"))
  })
}

registerCustomPartials();

function readStream(stream:ReadStream, encoding:BufferEncoding = "utf8"):Promise<string> {
  stream.setEncoding(encoding);
  return new Promise((resolve, reject) => {
      let data = "";
      stream.on("data", chunk => data += chunk);
      stream.on("end", () => resolve(data));
      stream.on("error", error => reject(error));
  });
}

export async function mw_render_html(ctx: ParameterizedContext, next: Next) {
  await next();
  let ct = ctx.response.headers['content-type'] as string;
  if(!!ct && ctx.response.body && ct.includes('text/html')){
    let html = await readStream(ctx.response.body);
    ctx.response.body = CustomHandlebars.compile(html)({});
  }
}