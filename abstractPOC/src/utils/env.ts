import { Schema } from "effect";

const envSchema = Schema.Struct({
	OPENAI_API_KEY: Schema.String,
});

const envDecoder = Schema.decodeUnknownSync(envSchema);

export const env = envDecoder(process.env);
