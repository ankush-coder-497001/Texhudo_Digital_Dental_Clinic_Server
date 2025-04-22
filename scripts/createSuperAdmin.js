require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const SuperAdmin = require('../src/models/SuperAdmin.model');

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if super admin already exists
        const existingAdmin = await SuperAdmin.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
        if (existingAdmin) {
            console.log('Super admin already exists');
            process.exit(0);
        }

        // Create super admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, salt);

        const superAdmin = new SuperAdmin({
            name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
            email: process.env.SUPER_ADMIN_EMAIL,
            password: hashedPassword,
            phone: process.env.SUPER_ADMIN_PHONE || '1234567890'
        });

        await superAdmin.save();
        console.log('Super admin created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating super admin:', error);
        process.exit(1);
    }
};

createSuperAdmin();