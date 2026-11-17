import { liveConfig } from "./providers/live";

type Msg = { role: "system" | "user" | "assistant"; content: string };

/**
 * One OpenAI-compatible code path covers OpenAI, Gemini (compat endpoint),
 * Groq, OpenRouter, Together, Ollama — anything that speaks /chat/completions.
 * Anthropic is handled separately. Returns null when nothing is configured.
 */
export async function llmComplete(
  messages: Msg[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<string | null> {
  const cfg = liveConfig();
  if (!cfg.llm) return null;

  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  try {
    if (openaiKey || geminiKey || process.env.LLM_BASE_URL) {
      const base =
        process.env.LLM_BASE_URL ||
        (geminiKey && !openaiKey
          ? "https://generativelanguage.googleapis.com/v1beta/openai"
          : "https://api.openai.com/v1");
      const key = openaiKey || geminiKey || process.env.LLM_API_KEY || "";
      const model =
        process.env.LLM_MODEL ||
        (geminiKey && !openaiKey ? "gemini-2.0-flash" : "gpt-4o-mini");

      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens ?? 700,
        }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as any;
      return json.choices?.[0]?.message?.content?.trim() ?? null;
    }

    if (anthropicKey) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || "claude-3-5-sonnet-latest",
          max_tokens: opts.maxTokens ?? 700,
          temperature: opts.temperature ?? 0.7,
          system: messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n"),
          messages: messages.filter((m) => m.role !== "system"),
        }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as any;
      return json.content?.[0]?.text?.trim() ?? null;
    }
  } catch {
    return null;
  }
  return null;
}
