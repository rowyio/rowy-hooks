import { Stripe } from "stripe";
import rowy from "../utils/index.js";

async function stripe(request: any, auth: any) {
  const { secretKey, signingSecret } = auth;
  const signature = request.headers["stripe-signature"];

  let stripeSecretKey;
  try {
    stripeSecretKey = await rowy.secrets.get(secretKey);
    if (!stripeSecretKey) {
      console.error(`Stripe secret key is empty: ${secretKey}`);
      return false;
    }
    console.log(`Stripe secret key ${secretKey} retrieved`);
  } catch (err) {
    console.error(`Stripe secret key ${secretKey} cannot be retrieved: ${err}`);
    return false;
  }

  const stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: "2022-08-01",
  });

  if (!signature) {
    console.log(`Stripe request missing signature`);
    return false;
  }

  try {
    const event = stripeInstance.webhooks.constructEvent(
      request.rawBody.toString(),
      signature,
      signingSecret
    );
    console.log("Stripe webhook verified", JSON.stringify(event));
    return true;
  } catch (err) {
    console.error(`Stripe verification error: ${err}`);
    return false;
  }
}

export default stripe;
