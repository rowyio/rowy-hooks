import { Request, Response } from "express";
import { DocumentSnapshot, Firestore } from "@google-cloud/firestore";
import { db } from "./firebaseConfig";
import { WEBHOOKS_DOC_PATH } from "./constants";
import { Logging } from "@google-cloud/logging";
import { getProjectId } from "./metadataService";
import { EventWebhook, EventWebhookHeader } from "@sendgrid/eventwebhook";

const crypto = require("crypto");
let endpoints: null | any[] = null;
const setEndpoints = async (snapshot: DocumentSnapshot) => {
  const docData = snapshot.data();
  if (!docData) {
    endpoints = [];
    return;
  }
  const values = Object.values(docData);
  if (values && values.length !== 0) {
    endpoints = eval(`[${values.join(",")}]`);
  } else endpoints = [];
};
db.doc(WEBHOOKS_DOC_PATH).onSnapshot(setEndpoints);

// functions to verify request signature
const verifiers = {
  typeform: function (request: Request, auth: any) {
    const signature = request.headers["typeform-signature"];
    const { secret } = auth;
    const hash = crypto
      .createHmac("sha256", secret)
      .update(request.body)
      .digest("base64");
    console.log(secret, signature, `sha256=${hash}`, request.body.toString());
    return signature === `sha256=${hash}`;
  },
  github: function (request: Request, auth: any) {
    const { secret } = auth;
    const signature = request.headers["x-hub-signature"];
    const hash = crypto
      .createHmac("sha1", secret)
      .update(JSON.stringify(request.body))
      .digest("hex");
    return signature === `sha1=${hash}`;
  },
  sendgrid: function (request: Request, auth: any) {
    const { secret } = auth;
    // The SendGrid EventWebhookHeader provides methods for getting
    // the necessary header names.
    // Remember to cast these header names to lowercase to access them correctly
    const signatureKey = EventWebhookHeader.SIGNATURE().toLowerCase();
    const timestampKey = EventWebhookHeader.TIMESTAMP().toLowerCase();
    // Retrieve SendGrid's headers so they can be used to validate
    // the request
    const signature = request.headers[signatureKey] as string;
    const timestamp = request.headers[timestampKey] as string;

    const ew = new EventWebhook();
    const key = ew.convertPublicKeyToECDSA(secret);
    const rawEvent = JSON.stringify(request.body).split('},{').join('},\r\n{')+ '\r\n';
    return ew.verifySignature(key, rawEvent, signature, timestamp);
  },
};

// See: https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
const severities = {
  "200": "INFO",
  "404": "WARNING",
  "401": "WARNING",
  "500": "ERROR",
};
type HttpCode = "200" | "404" | "401" | "500";
const logEvent = async (request: Request, code: HttpCode, error?: string) => {
  const { headers, url, params, body, query } = request;
  const projectId = await getProjectId();
  const logging = new Logging({ projectId });
  // Selects the log to write to
  const log = logging.log(`rowy-webhook-events`);
  // The data to write to the log
  // The metadata associated with the entry
  const metadata = {
    resource: {
      type: "global",
    },
    severity: severities[code],
  };
  // Prepares a log entry
  //JSON.stringify()
  const entry = log.entry(metadata, {
    headers,
    url,
    params,
    body,
    query,
    error,
  });
  return log.write(entry);
};

type Endpoint = {
  url: string;
  path: string;
  method: string;
  type: "typeform" | "github" | "sendgrid";
  tablePath: string;
  conditions: (arg: {
    req: Request;
    db: FirebaseFirestore.Firestore;
    ref: FirebaseFirestore.CollectionReference;
  }) => Promise<boolean>;
  parser: (arg: {
    req: Request;
    db: FirebaseFirestore.Firestore;
    ref: FirebaseFirestore.CollectionReference;
  }) => Promise<any>;
  auth: {
    secret: string;
    enabled: boolean;
  };
};

export const consumer = async (req: Request, res: Response) => {
  const { url } = req;
  try {
    if (!endpoints) {
      const snapshot = await db.doc(WEBHOOKS_DOC_PATH).get();
      await setEndpoints(snapshot);
    } else {
      const endpoint: Endpoint = endpoints.find(function (o) {
        return o.url === url;
      });
      if (!endpoint) throw Error("404");
      const ref = db.collection(endpoint.tablePath);
      if (endpoint.auth.enabled) {
        const verified = verifiers[endpoint.type](req, endpoint.auth);
        if (!verified) throw Error("401");
      }
      const condition = await endpoint.conditions({ req, db, ref });
      if (!condition) return res.sendStatus(412);
      const newRow = await endpoint.parser({ req, db, ref });
      if (newRow) await Promise.all([ref.add(newRow), logEvent(req, "200")]);
      else await logEvent(req, "200");
      return res.sendStatus(200);
    }
  } catch (error: any) {
    const errorCode = error.message.length === 3 ? error.message : "500";
    console.error(error.message);
    await logEvent(req, errorCode, error.message);
    return res.sendStatus(errorCode);
  }
};
