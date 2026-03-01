import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { providers, users, accounts, sessions } from "@evanesc/db";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";

const categoryEnum = z.enum([
  "restaurants",
  "hotels",
  "villas",
  "spas",
  "water_sports",
  "excursions",
]);

export const providersRouter = router({
  // Public: list verified providers
  list: publicProcedure
    .input(
      z
        .object({
          category: categoryEnum.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (input?.category) {
        return ctx.db.query.providers.findMany({
          where: eq(providers.category, input.category),
          orderBy: [desc(providers.createdAt)],
        });
      }

      return ctx.db.query.providers.findMany({
        where: eq(providers.isVerified, true),
        orderBy: [desc(providers.createdAt)],
      });
    }),

  // Public: get single provider
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.providers.findFirst({
        where: eq(providers.id, input.id),
        with: {
          offers: {
            with: { slots: true },
          },
        },
      });
    }),

  // Authenticated: get my provider profile
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.providers.findFirst({
      where: eq(providers.userId, ctx.session.user.id),
    });
  }),

  // Authenticated: create or update provider profile
  upsertProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: categoryEnum,
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        instagram: z.string().optional(),
        website: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.providers.findFirst({
        where: eq(providers.userId, ctx.session.user.id),
      });

      if (existing) {
        const [updated] = await ctx.db
          .update(providers)
          .set(input)
          .where(eq(providers.id, existing.id))
          .returning();
        return updated;
      }

      await ctx.db
        .update(users)
        .set({ role: "provider" })
        .where(eq(users.id, ctx.session.user.id));

      const [provider] = await ctx.db
        .insert(providers)
        .values({
          userId: ctx.session.user.id,
          ...input,
        })
        .returning();

      return provider;
    }),

  // Admin: list all providers (including unverified)
  adminList: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.providers.findMany({
      with: { user: true, offers: true },
      orderBy: [desc(providers.createdAt)],
    });
  }),

  // Admin: verify/unverify a provider
  setVerified: adminProcedure
    .input(
      z.object({
        providerId: z.string().uuid(),
        isVerified: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(providers)
        .set({ isVerified: input.isVerified })
        .where(eq(providers.id, input.providerId))
        .returning();
      return updated;
    }),

  // Admin: update any provider
  adminUpdate: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        category: categoryEnum.optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        instagram: z.string().optional(),
        website: z.string().optional(),
        isVerified: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(providers)
        .set(data)
        .where(eq(providers.id, id))
        .returning();
      return updated;
    }),

  // Admin: delete provider (and linked user account)
  adminDelete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.db.query.providers.findFirst({
        where: eq(providers.id, input.id),
      });
      if (provider) {
        // Cascade: deleting the user removes accounts, sessions, provider, offers
        await ctx.db.delete(users).where(eq(users.id, provider.userId));
      }
      return { success: true };
    }),

  // Admin: create a partner (user account + provider profile)
  adminCreate: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        partnerName: z.string().min(1),
        contactName: z.string().min(1),
        category: categoryEnum,
        description: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        contactEmail: z.string().optional(),
        instagram: z.string().optional(),
        website: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if email is already taken
      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });
      if (existing) {
        throw new Error("Un compte existe déjà avec cet email");
      }

      const userId = randomUUID();
      const hashedPassword = await hashPassword(input.password);

      // Create user with provider role
      await ctx.db.insert(users).values({
        id: userId,
        name: input.contactName,
        email: input.email,
        emailVerified: true,
        role: "provider",
      });

      // Create credential account (better-auth format)
      await ctx.db.insert(accounts).values({
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: "credential",
        password: hashedPassword,
      });

      // Create provider profile
      const [provider] = await ctx.db
        .insert(providers)
        .values({
          userId,
          name: input.partnerName,
          category: input.category,
          description: input.description,
          address: input.address,
          phone: input.phone,
          email: input.contactEmail,
          instagram: input.instagram,
          website: input.website,
          isVerified: true,
        })
        .returning();

      return provider;
    }),

  // Admin: reset a partner's password
  adminResetPassword: adminProcedure
    .input(
      z.object({
        providerId: z.string().uuid(),
        newPassword: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.db.query.providers.findFirst({
        where: eq(providers.id, input.providerId),
      });
      if (!provider) throw new Error("Partenaire introuvable");

      const hashedPassword = await hashPassword(input.newPassword);

      // Update the credential account password
      const account = await ctx.db.query.accounts.findFirst({
        where: eq(accounts.userId, provider.userId),
      });
      if (account) {
        await ctx.db
          .update(accounts)
          .set({ password: hashedPassword })
          .where(eq(accounts.id, account.id));
      }

      // Invalidate all active sessions
      await ctx.db.delete(sessions).where(eq(sessions.userId, provider.userId));

      return { success: true };
    }),

  // Admin: update a partner's login email
  adminUpdateEmail: adminProcedure
    .input(
      z.object({
        providerId: z.string().uuid(),
        newEmail: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.db.query.providers.findFirst({
        where: eq(providers.id, input.providerId),
      });
      if (!provider) throw new Error("Partenaire introuvable");

      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.newEmail),
      });
      if (existing && existing.id !== provider.userId) {
        throw new Error("Cet email est déjà utilisé");
      }

      await ctx.db
        .update(users)
        .set({ email: input.newEmail })
        .where(eq(users.id, provider.userId));

      return { success: true };
    }),

  // Admin: disable/enable a partner's account
  adminSetDisabled: adminProcedure
    .input(
      z.object({
        providerId: z.string().uuid(),
        disabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.db.query.providers.findFirst({
        where: eq(providers.id, input.providerId),
      });
      if (!provider) throw new Error("Partenaire introuvable");

      // Downgrade to customer to lock out, restore to provider
      const newRole = input.disabled ? "customer" : "provider";
      await ctx.db
        .update(users)
        .set({ role: newRole })
        .where(eq(users.id, provider.userId));

      if (input.disabled) {
        await ctx.db.delete(sessions).where(eq(sessions.userId, provider.userId));
      }

      return { success: true };
    }),
});
