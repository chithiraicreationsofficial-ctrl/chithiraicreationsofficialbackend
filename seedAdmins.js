// scripts/seedAdmins.js
const mongoose = require("mongoose");
const Admin = require("./models/Admin");
require("dotenv").config();

const admins = [
  {
    name: "Super Admin",
    email: "superadmin@chithiraicreations.com",
    password: "SuperAdmin123!",
    role: "super_admin",
    phone: "+919876543210",
  },
  {
    name: "Event Manager 1",
    email: "manager1@chithiraicreations.com",
    password: "Manager1123!",
    role: "admin",
    phone: "+919876543211",
  },
  {
    name: "Event Manager 2",
    email: "manager2@chithiraicreations.com",
    password: "Manager2123!",
    role: "admin",
    phone: "+919876543212",
  },
  {
    name: "Ticket Counter 1",
    email: "counter1@chithiraicreations.com",
    password: "Counter1123!",
    role: "support",
    phone: "+919876543213",
  },
  {
    name: "Ticket Counter 2",
    email: "counter2@chithiraicreations.com",
    password: "Counter2123!",
    role: "support",
    phone: "+919876543214",
  },
];

async function seedAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    for (const adminData of admins) {
      const existingAdmin = await Admin.findOne({ email: adminData.email });
      if (existingAdmin) {
        console.log(`Admin ${adminData.email} already exists`);
        continue;
      }

      const admin = new Admin(adminData);
      admin.generateTwoFASecret();
      await admin.save();

      console.log(`Created admin: ${adminData.name} (${adminData.email})`);
      console.log(`2FA Secret: ${admin.twoFASecret}`);
      console.log("Use Google Authenticator to scan QR code with this secret");
      console.log("---");
    }

    console.log("Admin seeding completed");
    console.log("\nDefault admin credentials:");
    console.log(
      "1. Super Admin: superadmin@chithiraicreations.com / SuperAdmin123!"
    );
    console.log("2. Each admin needs to setup 2FA using the secret above");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admins:", error);
    process.exit(1);
  }
}

seedAdmins();
