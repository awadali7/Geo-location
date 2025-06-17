// models/LocationHistory.ts
import { Schema, model, models } from "mongoose";

const LocationHistorySchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: "User", required: true },
	latitude: { type: Number, required: true },
	longitude: { type: Number, required: true },
	accuracy: { type: Number }, // if provided by GPS
	timestamp: { type: Date, required: true }, // time the location was recorded on client
	createdAt: { type: Date, default: Date.now },
});

export default models.LocationHistory ||
	model("LocationHistory", LocationHistorySchema);
