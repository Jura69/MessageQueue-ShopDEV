import mongoose from 'mongoose';

const connectMongoDB = async (): Promise<void> => {
    const host = process.env.DEV_DB_HOST || 'localhost';
    const port = process.env.DEV_DB_PORT || '27017';
    const name = process.env.DEV_DB_NAME || 'shopDEV';
    const user = process.env.DEV_DB_USER || '';
    const pass = process.env.DEV_DB_PASSWORD || '';

    const uri = user
        ? `mongodb://${user}:${pass}@${host}:${port}/${name}?authSource=admin`
        : `mongodb://${host}:${port}/${name}`;

    await mongoose.connect(uri);
    console.log('[MongoDB] Connected successfully');
};

export default connectMongoDB;
