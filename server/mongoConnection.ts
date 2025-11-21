import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGO_URI || "YOUR_MONGODB_CONNECTION_STRING_HERE";

const client = new MongoClient(uri);

let db: Db;

export async function connectToMongo() {
  try {
    await client.connect();
    db = client.db("pocketbank"); // You can change this to your database name
    console.log("Successfully connected to MongoDB.");
    // Initialize collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    if (!collectionNames.includes('budget')) {
      await db.collection('budget').insertOne({
        id: 1,
        initialBudget: 2000,
        currentBalance: 2000,
        currency: '$'
      });
    }
    if (!collectionNames.includes('transactions')) {
      await db.createCollection('transactions');
    }
  } catch (e) {
    console.error('Could not connect to MongoDB', e);
    process.exit(1);
  }
}

export function getDb() {
  return db;
}
