import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { getProjectId } from "../metadataService.js";

const secrets = new SecretManagerServiceClient();

export const getSecret = async (name: string, v: string = "latest") => {
  const projectId = await getProjectId();
  const [version] = await secrets.accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/${v}`,
  });
  const payload = version.payload?.data?.toString();
  if (payload && payload[0] === "{") {
    return JSON.parse(payload);
  } else {
    return payload;
  }
};
