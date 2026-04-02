import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: false,
  apiVersion: "2023-10-16",
});
