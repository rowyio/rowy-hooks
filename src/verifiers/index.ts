import typeform from "./typeform";
import github from "./github";
import sendgrid from "./sendgrid"; 

function basic (req:any,auth:any){
    return true
}
export default {
    basic,
    typeform,
    github,
    sendgrid
};
