import typeform from "./typeform.js";
import github from "./github.js";
import sendgrid from "./sendgrid.js"; 

function basic (req:any,auth:any){
    return true
}
export default {
    basic,
    typeform,
    github,
    sendgrid
};
