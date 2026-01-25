import z from "zod";

export const LANGUAGES = ["c++", "javascript", "typescript", "python"];
export type TYPE_LANGUAGES = z.infer<typeof LANGUAGES>;
