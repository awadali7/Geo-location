// models/Department.ts
import { Schema, model, models } from "mongoose";

const DepartmentSchema = new Schema({
	organization: {
		type: Schema.Types.ObjectId,
		ref: "Organization",
		required: true,
	},
	site: { type: Schema.Types.ObjectId, ref: "Site", required: true }, // One department belongs to one site (for simplicity)
	name: { type: String, required: true },
	head: { type: Schema.Types.ObjectId, ref: "User" }, // Dept Head (User reference)
	createdAt: { type: Date, default: Date.now },
});

export default models.Department || model("Department", DepartmentSchema);
