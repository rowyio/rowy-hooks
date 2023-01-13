import meta from "../../package.json" assert { type: "json" };

export const version = async () => ({ version: meta.version });
