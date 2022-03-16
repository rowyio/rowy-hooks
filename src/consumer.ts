import { Request, Response } from "express";
import { DocumentSnapshot } from "@google-cloud/firestore";
import { db } from "./firebaseConfig.js";
import { WEBHOOKS_DOC_PATH } from "./constants.js";
import { Logging } from "@google-cloud/logging";
import { getProjectId } from "./metadataService.js";
import verifiers from "./verifiers/index.js";
import fetch from "node-fetch";

import rowy from "./utils/index.js";


type Endpoint = {
  url: string;
  path: string;
  method: string;
  type: "typeform" | "github" | "sendgrid" | "basic";
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
    res: {send:(v:any)=>void
    sendStatus:(v:number)=>void};
  }) => Promise<any>;
  auth: {
    secret: string;
    enabled: boolean;
  };
};

const { secrets } = rowy;
const _fetch = fetch;

let endpoints: null | any[] = null;
const setEndpoints = async (snapshot: DocumentSnapshot) => {
  const docData = snapshot.data();
  if (!docData) {
    endpoints = [];
    return;
  }
  const values = Object.values(docData);
  if (values && values.length !== 0) {
    endpoints = eval(`[${values.filter((v:string|null) => v).join(",")}]`)
      ;
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
      const verified = verifiers[endpoint.type](req, endpoint.auth);
      if (!verified) throw Error("401");
    }
    const condition = await endpoint.conditions({ req, db, ref });
    if (!condition) return res.sendStatus(412);
    let responseValue = undefined
    const newRow = await endpoint.parser({ req, db, ref,res:{send:(v)=>{responseValue=v},sendStatus:res.sendStatus} });
    if (newRow) await Promise.all([ref.add(newRow), logEvent(req, "200")]);
    else await logEvent(req, "200");
    return responseValue? res.send(responseValue):res.sendStatus(200);
  } catch (error: any) {
    const errorCode = error.message.length === 3 ? error.message : "500";
    await logEvent(req, errorCode, error.message);
    return res.sendStatus(errorCode);
  }
};
