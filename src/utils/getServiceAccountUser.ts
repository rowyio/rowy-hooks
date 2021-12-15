import { getServiceAccountEmail } from "../metadataService.js";

export const getServiceAccountUser = async () => {
  const serviceAccountEmail = await getServiceAccountEmail();
  return {
    email: serviceAccountEmail,
    emailVerified: true,
    displayName: "Rowy Hooks",
    photoURL: "https://github.com/rowyio/rowyrun/raw/main/icon.png",
    uid: `serviceAccount:` + serviceAccountEmail,
    timestamp: new Date().getTime(),
  };
};
