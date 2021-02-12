import JWT from "jsonwebtoken";

/**
 * Returns a JWT based on the the JWT_SECRET in .evn
 * 
 * @param user_uuid string
 * @param role most likely sidekick_user
 * @param exp integer seconds from epoch, defaults to 15 min from now
 */
export function genJWT(
  user_uuid: string,
  role: string,
  exp?: number,
  payload?: any
  ): string {
    return JWT.sign(
      Object.assign(
        { user_uuid: user_uuid,
          role: role,
          exp: exp || new Date().getTime()/1000 + 60 * 15,
          aud: "postgraphile" },
          payload || {}
      )
      , process.env.JWT_SECRET as string);
};
