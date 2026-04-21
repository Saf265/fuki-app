import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  plan: text("plan"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const pendingSyncs = pgTable("pending_syncs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  domain: text("domain"),
  expiresAt: timestamp("expires_at").notNull(),
});

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(users, {
    fields: [session.userId],
    references: [users.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(users, {
    fields: [account.userId],
    references: [users.id],
  }),
}));

// ─── Connected marketplace accounts (Vinted / eBay) ──────────────────────────

export const connectedAccounts = pgTable(
  "connected_accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(), // "vinted" | "ebay"
    username: text("username"),
    platformUserId: text("platform_user_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ca_userId_idx").on(table.userId),
    index("ca_platform_idx").on(table.platform),
  ],
);

// ─── Vinted session data ──────────────────────────────────────────────────────

export const vintedSessions = pgTable(
  "vinted_sessions",
  {
    id: text("id").primaryKey(),
    connectedAccountId: text("connected_account_id")
      .notNull()
      .unique()
      .references(() => connectedAccounts.id, { onDelete: "cascade" }),

    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    csrfToken: text("csrf_token"),
    cookieHeader: text("cookie_header"),
    userAgent: text("user_agent"),
    anonId: text("anon_id"),
    gaClientId: text("ga_client_id"),
    domain: text("domain"),

    warmedUp: boolean("warmed_up").default(false).notNull(),
    warmedAt: timestamp("warmed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("vs_connectedAccountId_idx").on(table.connectedAccountId)],
);

// ─── eBay session data ────────────────────────────────────────────────────────

export const ebaySessions = pgTable(
  "ebay_sessions",
  {
    id: text("id").primaryKey(),
    connectedAccountId: text("connected_account_id")
      .notNull()
      .unique()
      .references(() => connectedAccounts.id, { onDelete: "cascade" }),

    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    userAgent: text("user_agent"),
    scope: text("scope"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("es_connectedAccountId_idx").on(table.connectedAccountId)],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const connectedAccountRelations = relations(
  connectedAccounts,
  ({ one }) => ({
    user: one(users, {
      fields: [connectedAccounts.userId],
      references: [users.id],
    }),
    vintedSession: one(vintedSessions, {
      fields: [connectedAccounts.id],
      references: [vintedSessions.connectedAccountId],
    }),
    ebaySession: one(ebaySessions, {
      fields: [connectedAccounts.id],
      references: [ebaySessions.connectedAccountId],
    }),
  }),
);

export const vintedSessionRelations = relations(vintedSessions, ({ one }) => ({
  connectedAccount: one(connectedAccounts, {
    fields: [vintedSessions.connectedAccountId],
    references: [connectedAccounts.id],
  }),
}));

export const ebaySessionRelations = relations(ebaySessions, ({ one }) => ({
  connectedAccount: one(connectedAccounts, {
    fields: [ebaySessions.connectedAccountId],
    references: [connectedAccounts.id],
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  connectedAccounts: many(connectedAccounts),
}));
