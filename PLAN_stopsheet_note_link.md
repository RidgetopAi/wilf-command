# Implementation Plan: Link Notes to StopSheet Items

## Overview
Add ability to link notes (with attachments like promo PDFs) to stopsheet checklist items. When executing a stopsheet, items with linked notes show an icon to open the note and access attached files.

---

## Changes Summary

| Area | Files | Effort |
|------|-------|--------|
| Database | 1 new migration | Small |
| Types | `src/types/index.ts` | Small |
| Server Actions | `src/app/(dashboard)/stopsheet/actions.ts` | Small |
| UI - StopSheetItem | `src/components/stopsheet/StopSheetItem.tsx` | Medium |
| UI - Note Selector | New `src/components/stopsheet/NoteLinkModal.tsx` | Medium |

---

## Phase 1: Database Migration

**File:** `supabase/migrations/XXX_stopsheet_item_note_link.sql`

```sql
-- Add 'promotion' to note_type enum
ALTER TYPE note_type ADD VALUE 'promotion';

-- Add note_id to stopsheet_items
ALTER TABLE stopsheet_items
ADD COLUMN note_id UUID REFERENCES notes(id) ON DELETE SET NULL;

-- Index for efficient lookups
CREATE INDEX idx_stopsheet_items_note ON stopsheet_items(note_id);
```

---

## Phase 2: Type Updates

**File:** `src/types/index.ts`

1. Add `'promotion'` to `NoteType` union (line ~173)
2. Add `promotion: 'Promotion'` to `NOTE_TYPE_LABELS` (line ~184)
3. Add to `StopSheetItem` interface (line ~418):
   - `note_id: string | null`
   - `linked_note?: Note` (for joined data)

---

## Phase 3: Server Actions

**File:** `src/app/(dashboard)/stopsheet/actions.ts`

### 3.1 Update `getStopSheet` query
Join linked note with attachments when fetching stopsheet items:
```typescript
items:stopsheet_items(
  *,
  linked_note:notes(
    id, title, type, body, visit_date,
    attachments:note_attachments(*)
  )
)
```

### 3.2 Add new actions

```typescript
// Link a note to a stopsheet item
export async function linkNoteToStopSheetItem(
  itemId: string,
  noteId: string
): Promise<{ success: boolean; error?: string }>

// Unlink note from stopsheet item
export async function unlinkNoteFromStopSheetItem(
  itemId: string
): Promise<{ success: boolean; error?: string }>

// Get notes for linking (filtered by dealer, optionally by type)
export async function getNotesForLinking(
  dealerId: string,
  typeFilter?: NoteType,
  search?: string
): Promise<Note[]>
```

---

## Phase 4: UI Components

### 4.1 Update StopSheetItem Component

**File:** `src/components/stopsheet/StopSheetItem.tsx`

**Current UI:**
```
[checkbox] Label text                    [expand icon]
```

**New UI:**
```
[checkbox] Label text           [note icon] [expand icon]
```

Changes:
- Add `linked_note` to props type
- Add `onLinkNote` and `onViewNote` callback props
- Show `FileText` icon (green) when note linked, click opens note viewer
- In expanded state, show "Link Note" button if no note linked

### 4.2 Create NoteLinkModal Component

**File:** `src/components/stopsheet/NoteLinkModal.tsx`

Modal/drawer to select a note to link:
- Filter dropdown: Note type (default to 'promotion')
- Search input: Filter by title/body
- List of matching notes with:
  - Type badge, title, date
  - Attachment count indicator
  - Click to select
- "Create New Note" button (opens NoteForm)

### 4.3 Integrate NoteDetailDrawer

Reuse existing `NoteDetailDrawer` component for viewing linked notes.
- Pass `readOnly` mode (no edit/delete)
- Shows attachments with preview/download

---

## Phase 5: StopSheet Page Integration

**File:** `src/app/(dashboard)/stopsheet/[id]/page.tsx`

- Pass `dealerId` to StopSheetItem for note filtering
- Add state for selected note viewing
- Add state for note link modal
- Wire up link/unlink callbacks

---

## Implementation Order

1. **Migration** - Add enum value + column
2. **Types** - Update interfaces
3. **Server actions** - Update query + add new actions
4. **StopSheetItem** - Add note indicator and callbacks
5. **NoteLinkModal** - Build selector component
6. **Page integration** - Wire everything together
7. **Testing** - End-to-end verification

---

## Critical Files to Modify

| File | Purpose |
|------|---------|
| `supabase/migrations/XXX_stopsheet_item_note_link.sql` | New migration |
| `src/types/index.ts` | Type definitions |
| `src/app/(dashboard)/stopsheet/actions.ts` | Server actions |
| `src/components/stopsheet/StopSheetItem.tsx` | Item component |
| `src/components/stopsheet/NoteLinkModal.tsx` | New - note selector |
| `src/app/(dashboard)/stopsheet/[id]/page.tsx` | Page integration |

---

## Verification Plan

1. **Database**: Run migration, verify column exists
2. **Create test data**: Create a note with type 'promotion' and attach a PDF
3. **Link flow**:
   - Open stopsheet for a dealer
   - Click "Link Note" on an item
   - Filter by promotion type
   - Select the test note
   - Verify link saved
4. **View flow**:
   - See note icon on linked item
   - Click icon to open note drawer
   - Verify attachments visible and downloadable
5. **Unlink flow**:
   - Unlink the note
   - Verify icon disappears

---

## Notes

- Note linking is per stopsheet item instance (not template)
- Templates don't have linked notes - only active stopsheet items
- Notes are filtered by dealer to keep context relevant
- Existing inline notes field remains (for quick item-specific notes)
