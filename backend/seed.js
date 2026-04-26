require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Bus = require('./models/Bus');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
        const admin = new User({
            name: 'Admin',
            phone: 'admin',
            email: 'admin@bustrack.com',
            password: 'admin123',
            role: 'admin',
            institution: 'default',
            isFirstLogin: false
        });
        await admin.save();
        console.log('✅ Admin created — login: admin / admin123');
    } else {
        console.log('ℹ️  Admin already exists');
    }

    // Create sample driver
    const existingDriver = await User.findOne({ role: 'driver', phone: 'driver1' });
    if (!existingDriver) {
        const driver = new User({
            name: 'John Driver',
            phone: 'driver1',
            registrationId: 'DRV001',
            password: 'driver123',
            role: 'driver',
            institution: 'default',
            isFirstLogin: true
        });
        await driver.save();

        // Create sample bus and assign driver
        const bus = new Bus({
            busNumber: 'BUS-001',
            driverId: driver._id,
            route: 'Main Gate → Library → Hostel Block A → Sports Ground',
            stops: [
                { name: 'Main Gate', latitude: 12.9716, longitude: 77.5946, order: 1 },
                { name: 'Library', latitude: 12.9726, longitude: 77.5956, order: 2 },
                { name: 'Hostel Block A', latitude: 12.9736, longitude: 77.5966, order: 3 },
                { name: 'Sports Ground', latitude: 12.9746, longitude: 77.5976, order: 4 }
            ],
            institution: 'default'
        });
        await bus.save();
        driver.assignedBusId = bus._id;
        await driver.save();
        console.log('✅ Driver created — login: driver1 / driver123');
        console.log('✅ Bus BUS-001 created and assigned to driver');

        // Create sample student
        const student = new User({
            name: 'Alice Student',
            phone: '9876543210',
            registrationId: 'STU001',
            password: 'student123',
            role: 'student',
            assignedBusId: bus._id,
            institution: 'default'
        });
        await student.save();
        bus.studentIds.push(student._id);
        await bus.save();
        console.log('✅ Student created — login: 9876543210 / student123');
    } else {
        console.log('ℹ️  Sample data already exists');
    }

    console.log('\n🎉 Seeding complete!');
    console.log('Login credentials:');
    console.log('  Admin:   phone=admin      password=admin123');
    console.log('  Driver:  phone=driver1    password=driver123');
    console.log('  Student: phone=9876543210 password=student123');
    await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
