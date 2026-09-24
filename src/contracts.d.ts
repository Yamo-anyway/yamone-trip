/** Proposed transport DTOs; types only, no backend implementation. */
export type UiLocale = 'ko' | 'en';
export type LocalDate = string; // YYYY-MM-DD, validated as a real date
export type LocalTime = string; // HH:mm, 00:00–23:59
export type LocalizedText = Record<string, string>;
export interface Region { country: string; city: string; district: string }
export interface ExperiencePoint { id: string; text: LocalizedText }
export interface UnitVersion {
  id: string; versionId: string; version: number;
  sourceLocale: string; sourceType: 'first_hand' | 'ai_draft' | 'user_authored';
  growth: 'seed' | 'sprout'; author: string; region: Region;
  category: 'walk' | 'cafe' | 'sightseeing'; transport: 'walk';
  durationMinutes: number; cost: { amount: number; currency: string };
  title: LocalizedText; description: LocalizedText; place: LocalizedText; tip: LocalizedText;
  points: ExperiencePoint[]; // 1–5, unique stable IDs within a version
  derivedFrom?: DerivationReference | null; // exact immediate source for a derivative; translations never use this
}
export interface ScheduleItem {
  id: string; date: LocalDate; startTime: LocalTime; durationMinutes: number;
  movementMinutes?: number; breakMinutes?: number; // manual estimates AFTER activity; absent legacy fields mean 0
  unitId: string; unitVersionId: string; snapshot: UnitVersion;
}
export interface ScheduleItemPatch {
  date?: LocalDate; startTime?: LocalTime; durationMinutes?: number;
  movementMinutes?: number; breakMinutes?: number;
} // no snapshot/identity/record edits; revision is supplied separately
export interface Trip {
  id: string; name: string; startDate: LocalDate; endDate: LocalDate;
  region: Region; visibility: 'private'; items: ScheduleItem[];
}
export interface ExperienceRecord {
  scheduleItemId: string; unitVersionId: string; checkedIds: string[];
  note: string; status: 'planned' | 'partial' | 'complete' | 'skipped';
  verification: 'self_reported';
}
export interface Page<T> { items: T[]; nextCursor: string | null }
export interface ApiFailure { error: { code: string; message: string; requestId?: string } }
export interface RemoteMutationOptions {
  idempotencyKey: string; revision?: string; // revision required for PATCH/PUT/DELETE
}
export interface TripCreateRequest {
  name: string; startDate: LocalDate; endDate: LocalDate; region: Region;
} // no local visibility/account/record/translation fields
export interface ScheduleItemCreateRequest {
  date: LocalDate; startTime: LocalTime; unitId: string; unitVersionId: string;
} // server resolves authoritative snapshot; client snapshot is never uploaded
export interface ExperienceRecordPutRequest {
  checkedIds: string[]; note: string; skipped: boolean;
} // private owner endpoint proposal only; never sent by the disconnected client
export interface DerivationReference {
  unitId: string; versionId: string; version: number; sourceLocale: string; title: string;
}
export interface ImprovementProposal {
  id: string; visibility: 'private'; status: 'local_only';
  source: DerivationReference; suggestion: string;
}
export interface TranslationVariant {
  unitId: string; versionId: string; sourceLocale: string; locale: UiLocale;
  method: 'manual' | 'machine';
  reviewStatus: 'draft' | 'machine_unreviewed' | 'user_reviewed' | 'needs_review';
  title: string; description: string; place: string; tip: string;
  points: { id: string; text: string }[]; // exact source point IDs and order
}
