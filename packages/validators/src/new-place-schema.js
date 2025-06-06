"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseFormSchema = void 0;
exports.createDynamicFormSchema = createDynamicFormSchema;
var zod_1 = require("zod");
// Base schema with required fields
exports.baseFormSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    address: zod_1.z.string().min(1, "Address is required"),
    longitude: zod_1.z.string().min(1, "Longitude is required"),
    latitude: zod_1.z.string().min(1, "Latitude is required"),
    website: zod_1.z.string().url("Must be a valid URL").optional().or(zod_1.z.literal("")),
    emoji: zod_1.z.string().emoji(),
});
// Helper function to create dynamic form schema based on database properties
function createDynamicFormSchema(properties) {
    // Use more specific Zod types for dynamic fields
    var dynamicFields = {};
    for (var _i = 0, _a = Object.entries(properties); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], prop = _b[1];
        if (prop.type === "multi_select") {
            dynamicFields[key.toLowerCase()] = zod_1.z.array(zod_1.z.string()).default([]);
        }
        else if (prop.type === "select") {
            dynamicFields[key.toLowerCase()] = zod_1.z.string().default("");
        }
        else if (prop.type === "number") {
            dynamicFields[key.toLowerCase()] = zod_1.z.coerce.number().default(0);
        }
    }
    // The return type will be a Zod schema with the correct field types
    return exports.baseFormSchema.extend(dynamicFields);
}
