// scripts/seedStore.js
import prisma from "../lib/prisma.js";

async function main() {
  // Fixed IDs (use the store id you chose)
  const adminId = "admin-user-1";
  const STORE_ID = "cmfzege0100012aicbzl6kvf8";

  // 1. Upsert user (admin)
  const user = await prisma.user.upsert({
    where: { id: adminId },
    update: {},
    create: {
      id: adminId,
      name: "Admin User",
      email: "mooiprofessional7@gmail.com",
      image: "https://placehold.co/100x100",
      // adapt if cart has a different required shape
      cart: {}
    },
  });

  console.log("User ready:", user.id);

  // 2. Upsert store using fixed STORE_ID and unique username
  const store = await prisma.store.upsert({
    where: { username: "mooiprof" }, // keep this unique constraint
    update: { status: "approved", isActive: true, userId: user.id },
    create: {
      id: STORE_ID, // <--- set the exact id you want
      userId: user.id,
      name: "Mooi Prof Store",
      description: "Main ecommerce store",
      username: "mooiprof",
      address: "123 Main Street",
      logo: "https://placehold.co/200x200",
      email: "store@example.com",
      contact: "+91-9876543210",
      status: "approved",
      isActive: true
      // add other required fields if your schema has them
    },
  });

  console.log("Store ready with id:", store.id);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit());
