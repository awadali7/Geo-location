import { Schema, model, models } from "mongoose";

const SiteSchema = new Schema({
	organization: {
		type: Schema.Types.ObjectId,
		ref: "Organization",
		required: true,
	},
	name: { type: String, required: true }, // e.g. “Kerala Office” or “NYC HQ”
	address: { type: String },
	latitude: { type: Number }, // Default/center coords (optional)
	longitude: { type: Number },
	createdAt: { type: Date, default: Date.now },
});

export default models.Site || model("Site", SiteSchema);
