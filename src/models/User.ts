// models/User.ts
import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
	ldapUid: { type: String, required: true, unique: true },
	// Unique identifier from LDAP (e.g. sAMAccountName or uid)
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	department: { type: Schema.Types.ObjectId, ref: "Department" }, // optional until LDAP group‐mapping is done
	team: { type: Schema.Types.ObjectId, ref: "Team" },
	roles: [
		{
			type: String,
			enum: ["DepartmentHead", "TeamLead", "Employee"],
			required: true,
		},
	],
	// Current/latest location (embedded doc):
	latestLocation: {
		latitude: Number,
		longitude: Number,
		updatedAt: Date,
	},
	// Optionally store user preferences (e.g. auto‐tracking on/off)
	preferences: {
		autoTrack: { type: Boolean, default: false },
		trackIntervalSec: { type: Number, default: 60 },
	},
	createdAt: { type: Date, default: Date.now },
});

export default models.User || model("User", UserSchema);
