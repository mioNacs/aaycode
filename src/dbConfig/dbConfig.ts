import { MongoClient } from "mongodb";

import { env } from "@/config";

const uri = env.mongodb.uri;

interface GlobalWithMongo {
	_mongoClientPromise?: Promise<MongoClient>;
}

const globalWithMongo = globalThis as typeof globalThis & GlobalWithMongo;

const client = new MongoClient(uri);

const clientPromise = globalWithMongo._mongoClientPromise ?? client.connect();

if (env.nodeEnv !== "production") {
	globalWithMongo._mongoClientPromise = clientPromise;
}

export default clientPromise;
