const path = require('path');
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const newAdmins = [
  {
    name: "Diwali Contest Admin 1",
    email: "admin1@chithiraicreations.com",
    password: "Admin123!",
    role: "admin",
    phone: "+917010240042",
  },
  {
    name: "Diwali Contest Admin 2",
    email: "admin2@chithiraicreations.com",
    password: "Admin123!",
    role: "admin",
    phone: "+917010240043",
  },
  {
    name: "Super Admin",
    email: "superadmin@chithiraicreations.com",
    password: "SuperAdmin123!",
    role: "super_admin",
    phone: "+919876543210",
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    for (const data of newAdmins) {
      let admin = await Admin.findOne({ email: data.email });
      if (!admin) {
        admin = new Admin(data);
        admin.generateTwoFASecret();
        await admin.save();
        console.log(`Created admin account: ${data.email}`);
      } else {
        admin.name = data.name;
        admin.password = data.password;
        admin.role = data.role;
        admin.isActive = true;
        if (!admin.twoFASecret) admin.generateTwoFASecret();
        await admin.save();
        console.log(`Updated admin account: ${data.email}`);
      }
    }

    console.log("\n✅ 2 Admin accounts ready:");
    console.log("1) Email: admin1@chithiraicreations.com | Password: Admin123! | 2FA: 123456");
    console.log("2) Email: admin2@chithiraicreations.com | Password: Admin123! | 2FA: 123456");
    console.log("3) Super Admin: superadmin@chithiraicreations.com | Password: SuperAdmin123! | 2FA: 123456");

    process.exit(0);
  } catch (err) {
    console.error("Error seeding admins:", err);
    process.exit(1);
  }
}

seed();
