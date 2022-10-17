import { Request } from "express";
import crypto from "crypto";

function github(request: Request, auth: any) {
  const { secret } = auth;
  const signature = request.headers["x-hub-signature"];
  const hash = crypto
    .createHmac("sha1", secret)
    .update(JSON.stringify(request.body))
    .digest("hex");
  return signature === `sha1=${hash}`;
}

export default github;
