/**
 * Setup checker: `npm run check:setup`
 *
 * Confirms the things that have to be true outside the code — the API key
 * works, the schema is applied, the bucket exists, the search function exists.
 *
 * Note on HEAD requests: a PostgREST HEAD carries no response body, so a
 * missing table comes back as error: null. Every probe here therefore issues a
 * real GET, which is the difference between "no rows" and "no table".
 */
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const TABLES = [
  "profiles", "preparations", "documents", "document_chunks",
  "preparation_topics", "quiz_questions", "quiz_answers",
  "interview_sessions", "interview_messages", "user_progress",
];

const pass = (m) => console.log(`  ok    ${m}`);
const fail = (m, fix) => {
  console.log(`  FAIL  ${m}`);
  if (fix) console.log(`        → ${fix}`);
  failures.push(m);
};
const failures = [];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

console.log("\nEnvironment");
for (const [name, value] of [
  ["GEMINI_API_KEY", geminiKey],
  ["NEXT_PUBLIC_SUPABASE_URL", url],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", anon],
  ["SUPABASE_SERVICE_ROLE_KEY", service],
]) {
  value ? pass(name) : fail(`${name} is not set`, "add it to .env.local");
}

if (geminiKey) {
  console.log("\nGemini");
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const { GENERATION_MODEL, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } = {
    GENERATION_MODEL: "gemini-3.6-flash",
    EMBEDDING_MODEL: "gemini-embedding-001",
    EMBEDDING_DIMENSIONS: 768,
  };
  try {
    const r = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: "Reply with exactly: ok",
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { reply: { type: Type.STRING } }, required: ["reply"] },
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    JSON.parse(r.text);
    pass(`${GENERATION_MODEL} answers, and returns valid JSON`);
  } catch (e) {
    const msg = String(e?.message).slice(0, 120);
    fail(`${GENERATION_MODEL}: ${msg}`,
      /503/.test(msg) ? "transient capacity error — run again"
                      : "check GEMINI_API_KEY, or pick another model in lib/ai/gemini.ts");
  }
  try {
    const r = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: ["check"],
      config: { taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: EMBEDDING_DIMENSIONS },
    });
    const dims = r.embeddings?.[0]?.values?.length;
    dims === EMBEDDING_DIMENSIONS
      ? pass(`${EMBEDDING_MODEL} returns ${dims} dimensions`)
      : fail(`embeddings came back with ${dims}, expected ${EMBEDDING_DIMENSIONS}`,
             "the vector(n) column in the migrations must match");
  } catch (e) {
    fail(`embeddings: ${String(e?.message).slice(0, 110)}`);
  }
}

if (url && service) {
  const admin = createClient(url, service, { auth: { persistSession: false } });

  console.log("\nDatabase");
  const missing = [];
  for (const table of TABLES) {
    const { error } = await admin.from(table).select("id").limit(1);
    if (error) missing.push(table);
  }
  missing.length === 0
    ? pass(`all ${TABLES.length} tables present`)
    : fail(`${missing.length} of ${TABLES.length} tables missing (${missing.slice(0, 3).join(", ")}${missing.length > 3 ? ", …" : ""})`,
           "paste supabase/apply-all.sql into the Supabase SQL Editor and run it");

  const { error: rpcError } = await admin.rpc("match_document_chunks", {
    query_embedding: Array(768).fill(0.1),
    p_preparation_id: "00000000-0000-0000-0000-000000000000",
    match_count: 1,
    p_document_ids: null,
  });
  rpcError
    ? fail("match_document_chunks() is missing — retrieval cannot work",
           "run supabase/apply-all.sql (migration 0006)")
    : pass("match_document_chunks() exists");

  console.log("\nStorage");
  const { data: buckets, error: bucketError } = await admin.storage.listBuckets();
  if (bucketError) {
    fail(`could not list buckets: ${bucketError.message}`);
  } else {
    const bucket = (buckets ?? []).find((b) => b.name === "documents");
    if (!bucket) {
      fail("the 'documents' bucket is missing — uploads cannot work",
           "run supabase/apply-all.sql (migration 0005)");
    } else if (bucket.public) {
      fail("the 'documents' bucket is PUBLIC", "it must be private");
    } else {
      pass("private 'documents' bucket exists");
    }
  }
}

console.log(
  failures.length === 0
    ? "\nEverything is set up.\n"
    : `\n${failures.length} thing${failures.length === 1 ? "" : "s"} still to fix.\n`,
);
process.exit(failures.length === 0 ? 0 : 1);
