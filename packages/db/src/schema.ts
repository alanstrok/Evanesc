import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["customer", "provider", "admin"]);

export const categoryEnum = pgEnum("category", [
  "restaurants",
  "hotels",
  "villas",
  "spas",
  "water_sports",
  "excursions",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  phone: text("phone"),
  role: roleEnum("role").notNull().default("customer"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  provider: one(providers, {
    fields: [users.id],
    references: [providers.userId],
  }),
  bookings: many(bookings),
  sessions: many(sessions),
  accounts: many(accounts),
}));

// ─── Better Auth: Sessions ───────────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// ─── Better Auth: Accounts ───────────────────────────────────────────────────

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// ─── Better Auth: Verifications ──────────────────────────────────────────────

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Providers ───────────────────────────────────────────────────────────────

export const providers = pgTable("providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: categoryEnum("category").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  address: text("address"),
  instagram: text("instagram"),
  website: text("website"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, {
    fields: [providers.userId],
    references: [users.id],
  }),
  offers: many(offers),
}));

// ─── Offers ──────────────────────────────────────────────────────────────────

export const offers = pgTable("offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  normalPrice: numeric("normal_price", { precision: 10, scale: 2 }).notNull(),
  dealPrice: numeric("deal_price", { precision: 10, scale: 2 }).notNull(),
  category: categoryEnum("category").notNull(),
  images: text("images").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  visibilityHours: integer("visibility_hours").notNull().default(48),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const offersRelations = relations(offers, ({ one, many }) => ({
  provider: one(providers, {
    fields: [offers.providerId],
    references: [providers.id],
  }),
  slots: many(offerSlots),
}));

// ─── Offer Slots ─────────────────────────────────────────────────────────────

export const offerSlots = pgTable("offer_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  offerId: uuid("offer_id")
    .notNull()
    .references(() => offers.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  time: text("time").notNull(),
  capacity: integer("capacity").notNull(),
  remainingSpots: integer("remaining_spots").notNull(),
  visibleFrom: timestamp("visible_from").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const offerSlotsRelations = relations(offerSlots, ({ one, many }) => ({
  offer: one(offers, {
    fields: [offerSlots.offerId],
    references: [offers.id],
  }),
  bookings: many(bookings),
}));

// ─── Bookings ────────────────────────────────────────────────────────────────

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  offerSlotId: uuid("offer_slot_id")
    .notNull()
    .references(() => offerSlots.id, { onDelete: "cascade" }),
  status: bookingStatusEnum("status").notNull().default("pending"),
  guestsCount: integer("guests_count").notNull().default(1),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  offerSlot: one(offerSlots, {
    fields: [bookings.offerSlotId],
    references: [offerSlots.id],
  }),
}));
