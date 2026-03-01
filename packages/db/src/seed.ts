import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { randomUUID } from "crypto";
import {
  users,
  providers,
  offers,
  offerSlots,
  accounts,
} from "./schema";

const connectionString =
  process.env.DATABASE_URL || "postgresql://evanesc:evanesc@localhost:5432/evanesc";

const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log("🌱 Seeding database...");

  // ─── Provider Users ──────────────────────────────────────────────────────

  const providerUsers = [
    {
      id: randomUUID(),
      name: "Jean-Pierre Dupont",
      email: "jp@bonito-stbarth.com",
      emailVerified: true,
      role: "provider" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      name: "Marie Laurent",
      email: "marie@villaciel.com",
      emailVerified: true,
      role: "provider" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      name: "Pierre Martin",
      email: "pierre@siesta-spa.com",
      emailVerified: true,
      role: "provider" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      name: "Sophie Blanc",
      email: "sophie@bluewave.com",
      emailVerified: true,
      role: "provider" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      name: "Lucas Bernard",
      email: "lucas@islandtours.com",
      emailVerified: true,
      role: "provider" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Admin user
  const adminUser = {
    id: randomUUID(),
    name: "Admin Evanesc",
    email: "admin@evanesc.com",
    emailVerified: true,
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Customer user
  const customerUser = {
    id: randomUUID(),
    name: "Client Test",
    email: "client@test.com",
    emailVerified: true,
    role: "customer" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(users).values([...providerUsers, adminUser, customerUser]);

  // Create password accounts for seeded users (password: "password123")
  // In production Better Auth hashes passwords; for seed we store a placeholder
  const allUsers = [...providerUsers, adminUser, customerUser];
  await db.insert(accounts).values(
    allUsers.map((u) => ({
      id: randomUUID(),
      userId: u.id,
      accountId: u.id,
      providerId: "credential",
      password: "password123",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  );

  console.log("  ✓ Users created");

  // ─── Providers ─────────────────────────────────────────────────────────

  const providerRecords = [
    {
      id: randomUUID(),
      userId: providerUsers[0].id,
      name: "Bonito St Barth",
      category: "restaurants" as const,
      description:
        "Cuisine fusion méditerranéenne avec vue sur la baie de Gustavia. Ambiance chic et décontractée, produits frais de la mer.",
      logoUrl: "https://picsum.photos/seed/bonito/200",
      address: "Rue de la République, Gustavia, 97133 Saint-Barthélemy",
      phone: "+590 590 27 96 96",
      email: "reservations@bonito-stbarth.com",
      latitude: "17.8963",
      longitude: "-62.8498",
      instagram: "@bonitorestaurant",
      website: "https://bonito-stbarth.com",
      isVerified: true,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      userId: providerUsers[1].id,
      name: "Villa Ciel",
      category: "villas" as const,
      description:
        "Villa de luxe 5 chambres perchée sur les hauteurs de Colombier avec piscine à débordement et vue panoramique sur l'océan.",
      logoUrl: "https://picsum.photos/seed/villaciel/200",
      address: "Colombier, 97133 Saint-Barthélemy",
      phone: "+590 690 12 34 56",
      email: "booking@villaciel.com",
      latitude: "17.9120",
      longitude: "-62.8710",
      instagram: "@villaciel",
      website: "https://villaciel.com",
      isVerified: true,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      userId: providerUsers[2].id,
      name: "Siesta Spa & Wellness",
      category: "spas" as const,
      description:
        "Spa haut de gamme proposant massages balinais, soins du visage et rituel détox dans un cadre tropical apaisant.",
      logoUrl: "https://picsum.photos/seed/siesta/200",
      address: "Grand Cul-de-Sac, 97133 Saint-Barthélemy",
      phone: "+590 590 29 83 00",
      email: "spa@siesta-wellness.com",
      latitude: "17.9050",
      longitude: "-62.8280",
      instagram: "@siestaspa",
      website: "https://siesta-spa.com",
      isVerified: true,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      userId: providerUsers[3].id,
      name: "Blue Wave Adventures",
      category: "water_sports" as const,
      description:
        "Location de jet-ski, paddle, plongée sous-marine et excursions en catamaran autour de l'île.",
      logoUrl: "https://picsum.photos/seed/bluewave/200",
      address: "Saint-Jean Beach, 97133 Saint-Barthélemy",
      phone: "+590 690 55 66 77",
      email: "info@bluewave-stbarth.com",
      latitude: "17.9020",
      longitude: "-62.8430",
      instagram: "@bluewaveadventures",
      website: "https://bluewave-stbarth.com",
      isVerified: true,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      userId: providerUsers[4].id,
      name: "Island Discovery Tours",
      category: "excursions" as const,
      description:
        "Excursions privées en bateau vers les îles voisines, snorkeling à la Réserve Naturelle et sunset cruise.",
      logoUrl: "https://picsum.photos/seed/islandtours/200",
      address: "Port de Gustavia, 97133 Saint-Barthélemy",
      phone: "+590 690 88 99 00",
      email: "tours@islandtours-stbarth.com",
      latitude: "17.8960",
      longitude: "-62.8500",
      instagram: "@islanddiscovery",
      website: "https://islandtours-stbarth.com",
      isVerified: false,
      createdAt: new Date(),
    },
  ];

  await db.insert(providers).values(providerRecords);
  console.log("  ✓ Providers created");

  // ─── Offers ────────────────────────────────────────────────────────────

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const offerRecords = [
    {
      id: randomUUID(),
      providerId: providerRecords[0].id,
      title: "Dîner Sunset Menu Dégustation",
      description:
        "Menu 5 services avec accord mets-vins face au coucher de soleil. Homard, thon rouge et dessert signature.",
      normalPrice: "180.00",
      dealPrice: "120.00",
      category: "restaurants" as const,
      categories: [],
      totalSpots: 8,
      images: [
        "https://picsum.photos/seed/bonito1/800/600",
        "https://picsum.photos/seed/bonito2/800/600",
        "https://picsum.photos/seed/bonito3/800/600",
      ],
      isActive: true,
      visibilityHours: 48,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      providerId: providerRecords[0].id,
      title: "Brunch du Dimanche",
      description:
        "Brunch gastronomique avec vue mer : viennoiseries maison, oeufs Bénédicte, fruits exotiques et cocktails à volonté.",
      normalPrice: "95.00",
      dealPrice: "65.00",
      category: "restaurants" as const,
      categories: [],
      totalSpots: 12,
      images: [
        "https://picsum.photos/seed/brunch1/800/600",
        "https://picsum.photos/seed/brunch2/800/600",
      ],
      isActive: true,
      visibilityHours: 24,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      providerId: providerRecords[1].id,
      title: "Weekend Villa Privée - Tarif Flash",
      description:
        "2 nuits en villa 5 chambres avec piscine privée, service de conciergerie et petit-déjeuner inclus.",
      normalPrice: "4500.00",
      dealPrice: "2900.00",
      category: "villas" as const,
      categories: [],
      totalSpots: 1,
      images: [
        "https://picsum.photos/seed/villa1/800/600",
        "https://picsum.photos/seed/villa2/800/600",
      ],
      isActive: true,
      visibilityHours: 72,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      providerId: providerRecords[2].id,
      title: "Rituel Detox Duo - 2h",
      description:
        "Massage aux pierres chaudes 60min + soin du visage 30min + accès hammam. Pour 2 personnes.",
      normalPrice: "350.00",
      dealPrice: "220.00",
      category: "spas" as const,
      categories: [],
      totalSpots: 3,
      images: [
        "https://picsum.photos/seed/spa1/800/600",
        "https://picsum.photos/seed/spa2/800/600",
      ],
      isActive: true,
      visibilityHours: 24,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      providerId: providerRecords[3].id,
      title: "Jet Ski Tour - Île Fourchue",
      description:
        "Excursion jet-ski guidée de 2h autour de l'île Fourchue avec pause snorkeling et boissons fraîches.",
      normalPrice: "250.00",
      dealPrice: "175.00",
      category: "water_sports" as const,
      categories: ["excursions"],
      totalSpots: 4,
      images: [
        "https://picsum.photos/seed/jetski1/800/600",
        "https://picsum.photos/seed/jetski2/800/600",
      ],
      isActive: true,
      visibilityHours: 48,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      providerId: providerRecords[4].id,
      title: "Sunset Catamaran Cruise",
      description:
        "Croisière privée en catamaran 3h avec champagne, plateau de fruits de mer et musique live.",
      normalPrice: "600.00",
      dealPrice: "399.00",
      category: "excursions" as const,
      categories: ["water_sports"],
      totalSpots: 12,
      images: [
        "https://picsum.photos/seed/catamaran1/800/600",
        "https://picsum.photos/seed/catamaran2/800/600",
        "https://picsum.photos/seed/catamaran3/800/600",
      ],
      isActive: true,
      visibilityHours: 48,
      createdAt: new Date(),
    },
    // Package offers (multi-category)
    {
      id: randomUUID(),
      providerId: providerRecords[1].id,
      title: "Package Villa & Spa Escapade",
      description:
        "3 nuits en villa de luxe + 2 soins spa au Siesta + transfert privé. L'escapade parfaite à Saint-Barth.",
      normalPrice: "6800.00",
      dealPrice: "4500.00",
      category: "villas" as const,
      categories: ["spas"],
      totalSpots: 2,
      images: [
        "https://picsum.photos/seed/package1/800/600",
        "https://picsum.photos/seed/package2/800/600",
      ],
      isActive: true,
      visibilityHours: 72,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      providerId: providerRecords[3].id,
      title: "Journée Aventure Complète",
      description:
        "Matinée jet-ski + snorkeling à la Réserve + déjeuner sur la plage + paddle au coucher de soleil.",
      normalPrice: "450.00",
      dealPrice: "295.00",
      category: "water_sports" as const,
      categories: ["excursions", "restaurants"],
      totalSpots: 6,
      images: [
        "https://picsum.photos/seed/adventure1/800/600",
        "https://picsum.photos/seed/adventure2/800/600",
      ],
      isActive: true,
      visibilityHours: 48,
      createdAt: new Date(),
    },
  ];

  await db.insert(offers).values(offerRecords);
  console.log("  ✓ Offers created");

  // ─── Offer Slots ───────────────────────────────────────────────────────

  const slotRecords = [
    // Bonito restaurant - multiple dinner slots
    {
      id: randomUUID(),
      offerId: offerRecords[0].id,
      date: tomorrow.toISOString().split("T")[0],
      time: "19:00",
      capacity: 8,
      remainingSpots: 6,
      visibleFrom: new Date(tomorrow.getTime() - 48 * 60 * 60 * 1000),
      expiresAt: new Date(tomorrow.getTime() + 19 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      offerId: offerRecords[0].id,
      date: tomorrow.toISOString().split("T")[0],
      time: "21:00",
      capacity: 6,
      remainingSpots: 6,
      visibleFrom: new Date(tomorrow.getTime() - 48 * 60 * 60 * 1000),
      expiresAt: new Date(tomorrow.getTime() + 21 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
    // Villa Ciel
    {
      id: randomUUID(),
      offerId: offerRecords[1].id,
      date: dayAfter.toISOString().split("T")[0],
      time: "14:00",
      capacity: 1,
      remainingSpots: 1,
      visibleFrom: new Date(dayAfter.getTime() - 72 * 60 * 60 * 1000),
      expiresAt: dayAfter,
      createdAt: new Date(),
    },
    // Spa
    {
      id: randomUUID(),
      offerId: offerRecords[2].id,
      date: tomorrow.toISOString().split("T")[0],
      time: "10:00",
      capacity: 3,
      remainingSpots: 2,
      visibleFrom: new Date(tomorrow.getTime() - 24 * 60 * 60 * 1000),
      expiresAt: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      offerId: offerRecords[2].id,
      date: tomorrow.toISOString().split("T")[0],
      time: "14:00",
      capacity: 3,
      remainingSpots: 3,
      visibleFrom: new Date(tomorrow.getTime() - 24 * 60 * 60 * 1000),
      expiresAt: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
    // Jet ski
    {
      id: randomUUID(),
      offerId: offerRecords[3].id,
      date: tomorrow.toISOString().split("T")[0],
      time: "09:00",
      capacity: 4,
      remainingSpots: 3,
      visibleFrom: new Date(tomorrow.getTime() - 48 * 60 * 60 * 1000),
      expiresAt: new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
    // Catamaran
    {
      id: randomUUID(),
      offerId: offerRecords[5].id,
      date: dayAfter.toISOString().split("T")[0],
      time: "17:00",
      capacity: 12,
      remainingSpots: 8,
      visibleFrom: new Date(dayAfter.getTime() - 48 * 60 * 60 * 1000),
      expiresAt: new Date(dayAfter.getTime() + 17 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
    // Brunch
    {
      id: randomUUID(),
      offerId: offerRecords[1].id,
      date: dayAfter.toISOString().split("T")[0],
      time: "11:00",
      capacity: 12,
      remainingSpots: 10,
      visibleFrom: new Date(dayAfter.getTime() - 24 * 60 * 60 * 1000),
      expiresAt: new Date(dayAfter.getTime() + 11 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
    // Package Villa & Spa
    {
      id: randomUUID(),
      offerId: offerRecords[6].id,
      date: dayAfter.toISOString().split("T")[0],
      time: "14:00",
      capacity: 2,
      remainingSpots: 2,
      visibleFrom: new Date(dayAfter.getTime() - 72 * 60 * 60 * 1000),
      expiresAt: dayAfter,
      createdAt: new Date(),
    },
    // Journée Aventure
    {
      id: randomUUID(),
      offerId: offerRecords[7].id,
      date: tomorrow.toISOString().split("T")[0],
      time: "08:30",
      capacity: 6,
      remainingSpots: 4,
      visibleFrom: new Date(tomorrow.getTime() - 48 * 60 * 60 * 1000),
      expiresAt: new Date(tomorrow.getTime() + 8.5 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
  ];

  await db.insert(offerSlots).values(slotRecords);
  console.log("  ✓ Offer slots created");

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
