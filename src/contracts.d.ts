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
export interface DerivationReference { unitId: string; versionId: string; attribution: string }
export interface TranslationVariant {
  unitId: string; versionId: string; locale: UiLocale;
  method: 'human' | 'machine'; reviewed: boolean;
  title: string; description: string; tip: string; points: { id: string; text: string }[];
}
