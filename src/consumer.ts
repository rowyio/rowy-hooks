import { Request, Response } from "express";
import { DocumentSnapshot } from "@google-cloud/firestore";
import { db ,auth, storage} from "./firebaseConfig.js";
import { WEBHOOKS_DOC_PATH } from "./constants.js";
import { Logging } from "@google-cloud/logging";
import { getProjectId } from "./metadataService.js";
import verifiers from "./verifiers/index.js";
import rowy from "./utils/index.js";
import installDependenciesIfMissing from "./utils/installDependenciesIfMissing.js";
import { LoggingFactory, RowyLogging } from "./utils/LoggingFactory.js";
import { WebhookType } from "./types.js";
import { Auth } from "firebase-admin/auth";
import { Storage } from "firebase-admin/storage";

type Endpoint = {
  name: string;
  cacheEnabled: boolean;
  url: string;
  path: string;
  method: string;
  type: WebhookType;
  tablePath: string;
  conditions: (arg: {
    req: Request;
    db: FirebaseFirestore.Firestore;
    ref: FirebaseFirestore.CollectionReference;
    logging: RowyLogging;
    auth:Auth;
    storage: Storage
  }) => Promise<boolean>;
  parser: (arg: {
    req: Request;
    db: FirebaseFirestore.Firestore;
    ref: FirebaseFirestore.CollectionReference;
    res: { send: (v: any) => void; sendStatus: (v: number) => void };
    logging: RowyLogging;
    auth:Auth;
    storage: Storage
  }) => Promise<any>;
  auth: {
    secret: string;
    enabled: boolean;
  };
};

const { secrets } = rowy;

let endpoints: null | any[] = null;
const setEndpoints = async (snapshot: DocumentSnapshot) => {
  const docData = snapshot.data();
  if (!docData) {
    return;
  }
  const values = Object.values(docData);
  if (values && values.length !== 0) {
    endpoints = eval(`[${values.filter((v: string | null) => v).join(",")}]`);
  } else endpoints = [];
};
db.doc(WEBHOOKS_DOC_PATH).onSnapshot(setEndpoints);

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
  const bodySize = new TextEncoder().encode(JSON.stringify(body)).length;
  const entry = log.entry(metadata, {
    headers,
    url,
    params,
    body: bodySize > 250000 ? { v: "body too large" } : body,
    query,
    error,
  });
  return log.write(entry);
};

let cachedResponses: { endpoint: string; request: string; response: any }[] =
  [];

export const consumer = async (req: Request, res: Response) => {
  const { params } = req;
  try {
    if (!endpoints) {
      const snapshot = await db.doc(WEBHOOKS_DOC_PATH).get();
      await setEndpoints(snapshot);
    }
    const endpoint: Endpoint = endpoints?.find(function (o) {
      return o.endpoint === params.endpoint;
    });
    if (!endpoint) throw Error("404");
    const ref = db.collection(endpoint.tablePath);
    if (endpoint.auth?.enabled) {
      const verified = await verifiers[endpoint.type](req, endpoint.auth);
      if (!verified) throw Error("401");
    }
    await installDependenciesIfMissing(
      endpoint.conditions.toString(),
      `condition ${endpoint.tablePath} of ${endpoint.url}`
    );
    const loggingConditions = await LoggingFactory.createHooksLogging(
      endpoint.type,
      "conditions",
      endpoint.name,
      endpoint.url,
      endpoint.tablePath
    );
    const condition = await endpoint.conditions({
      req,
      db,
      ref,
      logging: loggingConditions,
      auth,
      storage
    });
    if (!condition) return res.sendStatus(412);
    let responseValue = undefined;
    const cachedResponse = cachedResponses.find(
      (v) =>
        v.endpoint === params.endpoint && v.request === JSON.stringify(req.body)
    );
    if (cachedResponse && endpoint.cacheEnabled) {
      return res.send(cachedResponse.response);
    }

    await installDependenciesIfMissing(
      endpoint.parser.toString(),
      `parser ${endpoint.tablePath} of ${endpoint.url}`
    );
    const loggingParser = await LoggingFactory.createHooksLogging(
      endpoint.type,
      "parser",
      endpoint.name,
      endpoint.url,
      endpoint.tablePath
    );
    const newRow = await endpoint.parser({
      req,
      db,
      ref,
      res: {
        send: (v) => {
          responseValue = v;
        },
        sendStatus: res.sendStatus,
      },
      logging: loggingParser,
      auth,storage
    });
    if (newRow) await Promise.all([ref.add(newRow), logEvent(req, "200")]);
    else await logEvent(req, "200");
    if (responseValue) {
      cachedResponses.push({
        endpoint: params.endpoint,
        request: JSON.stringify(req.body),
        response: responseValue,
      });
      res.send(responseValue);
    } else {
      res.sendStatus(200);
    }
  } catch (error: any) {
    const errorCode = error.message.length === 3 ? error.message : "500";
    await logEvent(req, errorCode, error.message);
    return res.sendStatus(errorCode);
  }
};
