"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, ensureReady, uid, nowIso } from "../db";
import { requireUser } from "../auth";
import { getTrip } from "../queries";

const expenseSchema = z.object({
  trip_id: z.string().min(3),
  label: z.string().min(1, "What was it for?"),
  amount: z.coerce.number().min(0),
  category: z.enum(["transport", "stay", "food", "activity", "shopping", "other"]),
  spent_on: z.string().min(8),
  kind: z.enum(["planned", "actual"]).default("actual"),
});

export async function addExpenseAction(_prev: any, formData: FormData) {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const trip = await getTrip(parsed.data.trip_id, user.id);
  if (!trip) return { error: "Trip not found" };
  await ensureReady();
  const id = uid("exp");
  getDb()
    .prepare(
      `INSERT INTO expenses (id, trip_id, user_id, category, label, amount, currency, spent_on, kind, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      id,
      trip.id,
      user.id,
      parsed.data.category,
      parsed.data.label,
      parsed.data.amount,
      trip.currency,
      parsed.data.spent_on,
      parsed.data.kind,
      nowIso()
    );
  revalidatePath(`/trips/${trip.id}`);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { ok: true, id };
}

export async function updateExpenseAction(input: {
  id: string;
  label?: string;
  amount?: number;
  category?: string;
  spent_on?: string;
  kind?: string;
}) {
  const user = await requireUser();
  await ensureReady();
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM expenses WHERE id = ? AND user_id = ?")
    .get(input.id, user.id) as any;
  if (!row) return { error: "Expense not found" };
  const fields: string[] = [];
  const values: any[] = [];
  for (const k of ["label", "amount", "category", "spent_on", "kind"] as const) {
    if (input[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(input[k]);
    }
  }
  if (!fields.length) return { ok: true };
  values.push(input.id);
  db.prepare(`UPDATE expenses SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  revalidatePath(`/trips/${row.trip_id}`);
  revalidatePath("/budget");
  return { ok: true };
}

export async function deleteExpenseAction(id: string) {
  const user = await requireUser();
  await ensureReady();
  const db = getDb();
  const row = db.prepare("SELECT trip_id FROM expenses WHERE id = ? AND user_id = ?").get(id, user.id) as any;
  db.prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?").run(id, user.id);
  if (row) {
    revalidatePath(`/trips/${row.trip_id}`);
    revalidatePath("/budget");
  }
  return { ok: true };
}
