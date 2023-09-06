import { db } from "../firebaseConfig.js";

export const ROWY_SETTINGS = "_rowy_/settings";
export const TABLE_SCHEMAS = "_rowy_/settings/schema";

export const getTableSchema = (tablePath: string) => () =>
  db
    .doc(
      [
        TABLE_SCHEMAS,
        tablePath
          .split("/")
          .map((segment, i) => (i % 2 === 0 ? segment : "subTables"))
          .join("/"),
      ].join("/")
    )
    .get()
    .then((snapshot) => snapshot.data());
