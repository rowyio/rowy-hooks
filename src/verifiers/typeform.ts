import crypto from "crypto";
import { Response } from "express";

function typeform(request: any,response: Response, auth: any) {
  const signature = request.headers["typeform-signature"];
  const { secret } = auth;
  const rawBody = request.rawBody.toString();
  const hash = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");
  return signature === `sha256=${hash}`;
}

export default typeform;
