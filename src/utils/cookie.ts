export function cookieToObject(cookie:string): {[key:string]:string} {
  return cookie.split(';')
          .map(x => x.split('=',2))
          .reduce((r,[k,v]) => {
            // @ts-ignore
            r[k.trim()] = v;
            return r;
          }, {}) || {};
};