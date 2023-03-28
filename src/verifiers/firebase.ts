import { Request ,Response} from "express";
import {auth as _auth} from '../firebaseConfig.js'
async function firebaseAuth(request: Request,response: Response,auth:any) {
  const authHeader = request.get("Authorization");
  if (!authHeader) return response.status(401).send("Unauthorized");
  const authToken = authHeader.split(" ")[1];
  try {
    const decodedToken = await _auth.verifyIdToken(authToken);
    response.locals.user = decodedToken;
    return true
    }catch (err) {
    console.error(err);
    return response.status(401).send("Unauthorized");
    }
}

export default firebaseAuth;
