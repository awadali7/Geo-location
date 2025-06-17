// models/Organization.ts
import { Schema, model, models } from "mongoose";

const OrganizationSchema = new Schema({
	name: { type: String, required: true, unique: true },
	description: { type: String },
	createdAt: { type: Date, default: Date.now },
	// (Optional) default settings, time zones, etc.
});

export default models.Organization || model("Organization", OrganizationSchema);
