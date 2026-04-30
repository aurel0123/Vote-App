import { FedaPay, Transaction, WebhookSignature } from "fedapay";
import { env } from "./env.js";

FedaPay.setApiKey(env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(env.NODE_ENV === "production" ? "live" : "sandbox");

export { FedaPay, Transaction, WebhookSignature };
