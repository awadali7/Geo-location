// models/Team.ts
import { Schema, model, models } from "mongoose";

const TeamSchema = new Schema({
	department: {
		type: Schema.Types.ObjectId,
		ref: "Department",
		required: true,
	},
	name: { type: String, required: true },
	lead: { type: Schema.Types.ObjectId, ref: "User" }, // Team Lead (User reference)
	createdAt: { type: Date, default: Date.now },
});

export default models.Team || model("Team", TeamSchema);
