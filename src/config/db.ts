import mongoose from 'mongoose';
const connectionURL = process.env.MONGO_URI || 'mongodb://localhost:27017';

export const connectToMongoDB = async () => {
  console.log('before connection');
  console.log('connectionURL', connectionURL);
  try {
    await mongoose.connect(connectionURL);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.log('Error connecting to MongoDB:', error);
  }
};
