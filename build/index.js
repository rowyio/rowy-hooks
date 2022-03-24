import * as express from "express";
import cors from "cors";
import { hasAnyRole, requireAuth } from './middleware/auth.js';
import { configPublisher } from "./publisher.js";
import { consumer } from './consumer.js';
import rowyRedirect from "./rowyRedirect.js";
//import { metadataService } from './metadataService.js';
const app = express.default();
// json is the default content-type for POST requests
const rawBodySaver = (req, res, buf, encoding) => {
    if (req.headers["user-agent"] === "Typeform Webhooks" &&
        req.headers["typeform-signature"] &&
        buf &&
        buf.length) {
        req.rawBody = buf.toString(encoding || "utf8");
    }
};
const options = {
    verify: rawBodySaver,
    limit: '50mb',
    extended: false
};
app.use(express.json(options)); // support json encoded bodies
app.use(express.urlencoded({ extended: true })); // support encoded bodies
app.use(cors());
const functionWrapper = (fn) => async (req, res) => {
    try {
        const user = res.locals.user;
        const data = await fn(req, user);
        res.status(200).send(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};
// redirect /
app.get("/", rowyRedirect);
// Webhooks
app.post("/publish", requireAuth, hasAnyRole(["ADMIN"]), functionWrapper(configPublisher));
app.post("/wh/:tablePath/:endpoint", consumer);
// metadata service
//app.get("/metadata",metadataService)
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`RowyHooks: listening on port ${port}!`);
});
// Exports for testing purposes.
export { app };
