"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./middleware/auth");
const publisher_1 = require("./publisher");
const consumer_1 = require("./consumer");
const app = express_1.default();
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
    verify: rawBodySaver
};
app.use(express_1.default.json(options));
app.use(cors_1.default());
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
// Webhooks
app.post("/publish", auth_1.requireAuth, auth_1.hasAnyRole(["ADMIN"]), functionWrapper(publisher_1.configPublisher));
app.post("/wh/:tablePath/:endpoint", consumer_1.consumer);
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`RowyHooks: listening on port ${port}!`);
});
// Exports for testing purposes.
module.exports = app;
