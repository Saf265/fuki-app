import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/drizzle/index";
import * as schema from "../db/drizzle/schema";
import { stripe } from "./stripe";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const stripeCustomer = await stripe.customers.create({
            email: user.email,
            name: user.name,
          });

          const stripeCustomerId = stripeCustomer.id;

          if (!stripeCustomerId) {
            throw new Error("Failed to create Stripe customer");
          }

          await db
            .update(schema.users)
            .set({ stripeCustomerId })
            .where({ id: user.id });
        },
      },
    },
  },
});
