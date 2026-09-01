export type BusinessStatus =
  | "lead"
  | "contacting"
  | "applied"
  | "live"
  | "paused"
  | "lost";

export type MemberStatus = "waitlist" | "active" | "cancelled";
export type MemberPlanId = "monthly" | "six_month" | "annual";
export type CampaignChannel = "email" | "sms";
export type CampaignAudience =
  | "members_opted_in"
  | "waitlist"
  | "all_members"
  | "businesses";
export type CampaignStatus = "draft" | "queued" | "sent" | "failed";

export interface BusinessNote {
  id: string;
  business_id: string;
  body: string;
  created_at: string;
}

export interface BusinessAccount {
  id: string;
  name: string;
  status: BusinessStatus;
  city: string | null;
  neighborhood: string | null;
  cuisine: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  address: string | null;
  source: string | null;
  next_follow_up: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  business_notes?: BusinessNote[];
}

export interface MemberRecord {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  plan_id: MemberPlanId | null;
  is_member: boolean;
  status: MemberStatus;
  email_opt_in: boolean;
  sms_opt_in: boolean;
  birthday: string | null;
  home_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignRecord {
  id: string;
  name: string;
  channel: CampaignChannel;
  audience: CampaignAudience;
  status: CampaignStatus;
  subject: string | null;
  body: string;
  recipient_count: number;
  created_at: string;
  sent_at: string | null;
}

export type OpsPermission =
  | "can_crm"
  | "can_members"
  | "can_campaigns"
  | "can_applications"
  | "can_content"
  | "can_restaurants"
  | "can_feed"
  | "can_manage_admins";

export interface OpsAdminPublic {
  id: string;
  email: string;
  name: string;
  is_owner: boolean;
  active: boolean;
  can_crm: boolean;
  can_members: boolean;
  can_campaigns: boolean;
  can_applications: boolean;
  can_content: boolean;
  can_restaurants: boolean;
  can_feed: boolean;
  can_manage_admins: boolean;
  created_at: string;
}

export interface OpsStatus {
  supabase: boolean;
  r2: boolean;
  hasOpsSecret: boolean;
  unlocked: boolean;
  needsAdminTable: boolean;
  hasOwner: boolean;
  me: OpsAdminPublic | null;
}
