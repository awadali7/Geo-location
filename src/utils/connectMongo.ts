import mongoose from "mongoose";

const cached: {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
} = {
	conn: null,
	promise: null,
};

export default async function connectMongo() {
	if (cached.conn) {
		// If we already have a connection, reuse it
		return cached.conn;
	}

	if (!cached.promise) {
		const MONGODB_URI = process.env.MONGODB_URI;
		if (!MONGODB_URI) {
			throw new Error(
				"Please define the MONGODB_URI environment variable in .env.local"
			);
		}

		cached.promise = mongoose
			.connect(MONGODB_URI)
			.then((mongooseInstance) => {
				return mongooseInstance;
			})
			.catch((err) => {
				console.error("MongoDB connection error:", err);
				throw err;
			});
	}

	cached.conn = await cached.promise;
	return cached.conn;
}
