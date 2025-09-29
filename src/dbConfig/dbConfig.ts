import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
	throw new Error(
		"Missing environment variable: MONGODB_URI. Set it in your environment to enable NextAuth's MongoDB adapter."
	);
}

interface GlobalWithMongo {
	_mongoClientPromise?: Promise<MongoClient>;
}

const globalWithMongo = globalThis as typeof globalThis & GlobalWithMongo;

const client = new MongoClient(uri);

const clientPromise = globalWithMongo._mongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
	globalWithMongo._mongoClientPromise = clientPromise;
}

export default clientPromise;
