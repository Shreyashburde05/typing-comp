const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Organizer = require('../src/models/Organizer');
const User = require('../src/models/User');

dotenv.config();

const migrate = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('MONGODB_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const organizers = await Organizer.find({});
        console.log(`Found ${organizers.length} organizers to migrate.`);

        let migratedCount = 0;
        let errorCount = 0;

        for (const org of organizers) {
            try {
                const existingUser = await User.findOne({ email: org.email });
                if (existingUser) {
                    console.log(`Skipping ${org.email} (already exists)`);
                    continue;
                }

                // Create User from Organizer data
                // Note: Password is ALREADY hashed in Organizer. 
                // We need to bypass the pre-save hook that re-hashes it.
                // Or, better, we simply save it directly. 
                // User.create triggers middleware.
                // We can use insertMany or manually construct object to avoid double hashing if we are careful.
                // Actually, the pre-save hook says: if (!this.isModified('password')) return next();
                // So passing the already hashed password string *might* be treated as modified and re-hashed if we aren't careful.
                // However, standard mongoose 'create' treats all fields as modified.

                // Strategy: Use mongoose.connection.collection('users').insertOne() to bypass middleware entirely.
                // This is safest for data migration of raw hashed passwords.

                await mongoose.connection.collection('users').insertOne({
                    name: org.name,
                    email: org.email,
                    password: org.password, // Keep existing hash
                    role: 'organizer',
                    lastLogin: org.lastLogin,
                    createdAt: org.createdAt,
                    updatedAt: new Date(),
                    __v: 0
                });

                migratedCount++;
                console.log(`Migrated: ${org.email}`);
            } catch (err) {
                console.error(`Failed to migrate ${org.email}:`, err.message);
                errorCount++;
            }
        }

        console.log(`Migration complete. Success: ${migratedCount}, Errors: ${errorCount}`);
        process.exit(0);
    } catch (error) {
        console.error('Migration crashed:', error);
        process.exit(1);
    }
};

migrate();
