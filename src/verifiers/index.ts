import typeform from "./typeform.js";
import github from "./github.js";
import sendgrid from "./sendgrid.js";
import webform from "./webform.js";
import stripe from "./stripe.js";
function basic(req: any, auth: any) {
  return true;
}
export default {
  basic,
  typeform,
  github,
  webform,
  sendgrid,
  stripe,
};
