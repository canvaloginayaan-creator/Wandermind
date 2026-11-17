"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cx, money } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Feedback";
import { clearChatAction } from "@/lib/actions/chat";
import type { Message, Trip } from "@/lib/types";

type Bubble = { id: string; role: "user" | "assistant"; content: string; streaming?: boolean };

const STARTERS = [
  "Is this budget realistic?",
  "Make it cheaper",
  "What should I book first?",
  "Where should I eat?",
  "What's the weather risk?",
];

export function AssistantChat({
  trip,
  initialMessages,
  opening,
  plannedSpend,
  days,
  llmOn,
}: {
  trip: Trip;
  initialMessages: Message[];
  opening: string;
  plannedSpend: number;
  days: number;
  llmOn: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Bubble[]>(
    initialMessages.length
      ? initialMessages.map((m) => ({ id: m.id, role: m.role, content: m.content }))
      : [{ id: "opening", role: "assistant", content: opening }]
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(STARTERS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    setInput("");
    setBusy(true);
    setSuggestions([]);

    const uidLocal = "u" + Math.random().toString(36).slice(2);
    const aid = "a" + Math.random().toString(36).slice(2);
    setMessages((prev) => [
      ...prev,
      { id: uidLocal, role: "user", content },
      { id: aid, role: "assistant", content: "", streaming: true },
    ]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: trip.id, content }),
        signal: abortRef.current.signal,
      });
      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let headerDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });

        if (!headerDone) {
          const nl = text.indexOf("\n");
          if (nl === -1) continue; // wait until the metadata line is complete
          if (text.startsWith("[[meta]]")) text = text.slice(nl + 1);
          else text = text; // no metadata, keep everything
          headerDone = true;
          if (!text) continue;
        }

        setMessages((prev) => prev.map((m) => (m.id === aid ? { ...m, content: text } : m)));
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === aid ? { ...m, content: text, streaming: false } : m))
      );
      setSuggestions(nextSuggestions(content));
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aid
            ? {
                ...m,
                streaming: false,
                content:
                  "I lost the connection mid-thought. Ask me again — nothing in your trip was changed.",
              }
            : m
        )
      );
    } finally {
      setBusy(false);
      router.refresh();
    }
  };

  const remaining = trip.budget_total - plannedSpend;

  return (
    <div className="mx-auto flex h-[calc(100dvh-260px)] min-h-[520px] max-w-3xl flex-col px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border hairline surface-2 px-3 py-2 text-[11px]">
        <span className={cx("badge", llmOn ? "bg-sea-500/15 text-sea-300" : "bg-ember-500/12 text-ember-300")}>
          <span className={cx("h-1.5 w-1.5 rounded-full", llmOn ? "bg-sea-300" : "bg-ember-400")} />
          {llmOn ? "Live model" : "Reasoning mode"}
        </span>
        <span className="fg-muted">
          {days} days · {money(plannedSpend, trip.currency)} planned ·{" "}
          <span className={remaining < 0 ? "text-red-300" : "text-sea-300"}>
            {money(Math.abs(remaining), trip.currency)} {remaining < 0 ? "over" : "left"}
          </span>
        </span>
        <button
          onClick={async () => {
            await clearChatAction(trip.id);
            setMessages([{ id: "opening", role: "assistant", content: opening }]);
            setSuggestions(STARTERS);
            router.refresh();
          }}
          className="ml-auto flex items-center gap-1 fg-muted transition hover:text-red-300"
        >
          <Icon name="trash" size={12} /> Clear
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3.5 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div key={m.id} className={cx("flex gap-2.5", m.role === "user" && "justify-end")}>
            {m.role === "assistant" && (
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ember-500 text-ink-950">
                <Icon name="compass" size={14} strokeWidth={2} />
              </span>
            )}
            <div
              className={cx(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                m.role === "user"
                  ? "rounded-br-md bg-sea-600/90 text-white"
                  : "rounded-bl-md border hairline surface-2"
              )}
            >
              {m.content}
              {m.streaming && (
                <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-ember-400 align-middle" />
              )}
            </div>
            {m.role === "user" && (
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">
                You
              </span>
            )}
          </div>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={busy} className="chip px-2.5 py-1.5 text-[11px]">
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-2.5 flex items-end gap-2 rounded-2xl border hairline surface-2 p-1.5 focus-within:border-sea-400/50"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ask about the plan, the budget, the food, the weather…"
          className="max-h-32 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm outline-none placeholder:fg-muted"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="btn-primary h-9 w-9 shrink-0 rounded-xl p-0"
          aria-label="Send"
        >
          {busy ? <Spinner /> : <Icon name="send" size={15} />}
        </button>
      </form>
      <p className="mt-1.5 text-center text-[10px] fg-muted">
        It won't book anything for you — every link goes straight to the operator.
      </p>
    </div>
  );
}

function nextSuggestions(last: string): string[] {
  const l = last.toLowerCase();
  if (l.includes("cheap") || l.includes("budget")) return ["Cut a night instead", "Show cheaper food", "Switch transport", "Rebuild the trip"];
  if (l.includes("transport") || l.includes("train") || l.includes("flight")) return ["Cheapest option?", "Most comfortable?", "What if the flight cancels?"];
  if (l.includes("eat") || l.includes("food")) return ["Anywhere I must avoid?", "Vegetarian options", "What's open late?"];
  return ["Is this realistic?", "Make it cheaper", "What should I book first?", "Rebuild day 2"];
}
