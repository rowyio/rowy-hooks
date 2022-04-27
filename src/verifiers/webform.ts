import fetch from "node-fetch";
async function webform(req: any, auth: any) {
  const { secret, minimumScore } = auth;
  const recaptchaResponse = req.body["g-recaptcha-response"];
  if(!recaptchaResponse) return false
  // req.connection.remoteAddress will provide IP address of connected user.
  var verificationUrl =
    "https://www.google.com/recaptcha/api/siteverify?secret=" +
    secret +
    "&response=" +
    req.body["g-recaptcha-response"] +
    "&remoteip=" +
    req.connection.remoteAddress;
    console.log({verificationUrl})
  const response = await fetch(verificationUrl);
  const body: any = await response.json();
  console.log("webform",{body})
  return body.success && body.score > minimumScore;
}
export default webform;
