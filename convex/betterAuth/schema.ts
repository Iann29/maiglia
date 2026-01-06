import { defineSchema } from "convex/server";
import { tables } from "./generatedSchema";

const schema = defineSchema({
  ...tables,
  // Add custom indexes here (won't be overwritten when schema is regenerated)
  // Example: user: tables.user.index("custom_index", ["field1", "field2"]),
});

export default schema;
