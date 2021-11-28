
import firebase from "firebase-admin";
import express,{Request,Response,} from 'express'
import cors from "cors";
import { hasAnyRole, requireAuth } from "./middleware/auth";
import { configPublisher } from "./publisher";
import {consumer} from './consumer'
import rowyRedirect from "./rowyRedirect";

const app = express();
// json is the default content-type for POST requests
const rawBodySaver = (req:any, res:Response, buf:Buffer, encoding:BufferEncoding) => {
  if (
    req.headers["user-agent"] === "Typeform Webhooks" &&
    req.headers["typeform-signature"] &&
    buf &&
    buf.length
  ) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

const options = {
  verify: rawBodySaver
};

app.use(express.json(options));

app.use(cors());

const functionWrapper = (fn:(req:Request,user:any)=>Promise<any>) => async (req:Request, res:Response) => {
    try {
      const user: firebase.auth.UserRecord = res.locals.user;
      const data = await fn(req, user);
      res.status(200).send(data);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  };

// redirect /
app.get("/", rowyRedirect)

// Webhooks
app.post(
    "/publish",
    requireAuth,
    hasAnyRole(["ADMIN"]),
    functionWrapper(configPublisher)
  );
  app.post("/wh/:tablePath/:endpoint", consumer);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`RowyHooks: listening on port ${port}!`);
});

// Exports for testing purposes.
module.exports = app;
