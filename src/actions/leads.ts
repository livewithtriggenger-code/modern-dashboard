import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { CreateLeadSchema, UpdateLeadSchema, UUIDSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit";

export async function getLeads(workspaceId: string, page = 1, pageSize = 20, search = "", statusFilter = "all") {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*, lead_intelligence(*)", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("full_name", `%${search}%`);
  }

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return { leads: data, total: count ?? 0 };
}

export async function getLeadById(workspaceId: string, leadId: string) {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  UUIDSchema.parse(leadId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*, lead_intelligence(*)")
    .eq("id", leadId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createLead(workspaceId: string, rawPayload: unknown) {
  const user = await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  const payload = CreateLeadSchema.parse(rawPayload);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      workspace_id: workspaceId,
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      source: payload.source,
      business_type: payload.business_type,
      status: payload.status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Initialize lead intelligence
  await supabase.from("lead_intelligence").insert({
    lead_id: data.id,
    workspace_id: workspaceId,
    priority: "medium",
  });

  await logAuditAction(workspaceId, user.id, "CREATE", "lead", data.id);

  revalidatePath("/leads");
  return data;
}

export async function updateLead(workspaceId: string, leadId: string, rawPayload: unknown) {
  const user = await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  UUIDSchema.parse(leadId);
  const payload = UpdateLeadSchema.parse(rawPayload);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", leadId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  revalidatePath("/leads");
  return data;
}

export async function deleteLead(workspaceId: string, leadId: string) {
  const user = await getAuthenticatedUser();
  await requireRole(workspaceId, "admin"); // Need admin to delete
  UUIDSchema.parse(workspaceId);
  UUIDSchema.parse(leadId);
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);
  
  revalidatePath("/leads");
  return { success: true };
}
