import {Stripe} from "stripe";

function stripe(request: any, auth: any) {
    const {secretKey, signingSecret} = auth;
    const signature = request.headers["stripe-signature"];

    const stripeInstance = new Stripe(secretKey, {
        apiVersion: "2022-08-01",
    });

    if (!signature) {
        console.log(`Stripe request missing signature`)
        return false;
    }

    try {
        const event = stripeInstance.webhooks.constructEvent(request.rawBody.toString(), signature, signingSecret);
        console.log("Stripe webhook verified", JSON.stringify(event))
        return true
    } catch (err) {
        console.error(`Stripe verification error: ${err}`);
        return false;
    }
}

export default stripe;
