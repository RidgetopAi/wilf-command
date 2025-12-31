# Notes & Email System - Implementation Plan

> **Project**: Wilf Command  
> **Created**: 2025-12-30  
> **Status**: Planning Complete - Ready for Implementation

## Overview

A robust Notes & Attachments system for capturing dealer visit notes, follow-ups, and other interactions with future email automation capabilities via Microsoft 365.

---

## Database Schema

### Migration 007: Notes System

```sql
-- =============================================
-- NOTES SYSTEM MIGRATION
-- File: supabase/migrations/007_add_notes.sql
-- =============================================

-- Note types enum
CREATE TYPE note_type AS ENUM (
  'visit',
  'follow_up',
  'vp_opportunity',
  'issue',
  'quote',
  'order',
  'personal'
);

-- Email status enum (for Phase 2)
CREATE TYPE email_status AS ENUM (
  'pending',
  'sent',
  'failed'
);

-- =============================================
-- CORE TABLES
-- =============================================

-- Notes table
CREATE TABLE notes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id             uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  type                  note_type NOT NULL DEFAULT 'visit',
  title                 text,
  body                  text NOT NULL,
  visit_date            date NOT NULL DEFAULT CURRENT_DATE,
  follow_up_date        date,
  -- Email flags (Phase 2 ready)
  auto_send_email       boolean NOT NULL DEFAULT false,
  dealer_email_id       uuid REFERENCES dealer_emails(id),
  email_template_id     uuid REFERENCES email_templates(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notes_dealer_idx ON notes (dealer_id);
CREATE INDEX notes_dealer_date_idx ON notes (dealer_id, visit_date);
CREATE INDEX notes_type_idx ON notes (type);
CREATE INDEX notes_follow_up_date_idx ON notes (follow_up_date);

-- Note attachments
CREATE TABLE note_attachments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id       uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  file_name     text NOT NULL,
  mime_type     text,
  file_size     integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX note_attachments_note_idx ON note_attachments (note_id);

-- User-defined tags
CREATE TABLE tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  color      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Note-tag junction
CREATE TABLE note_tags (
  note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX note_tags_tag_idx ON note_tags (tag_id);
CREATE INDEX note_tags_note_idx ON note_tags (note_id);

-- =============================================
-- EMAIL TABLES (Phase 2 Ready)
-- =============================================

-- Multiple emails per dealer
CREATE TABLE dealer_emails (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id  uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  label      text,
  email      text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX dealer_emails_dealer_idx ON dealer_emails (dealer_id);

-- Email templates
CREATE TABLE email_templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  description       text,
  subject_template  text NOT NULL,
  body_template     text NOT NULL,
  default_for_type  note_type,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_templates_default_type_idx ON email_templates (default_for_type);

-- Email send log
CREATE TABLE note_emails (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id         uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  template_id     uuid REFERENCES email_templates(id),
  dealer_email_id uuid REFERENCES dealer_emails(id),
  to_addresses    text[] NOT NULL,
  subject         text NOT NULL,
  body            text NOT NULL,
  status          email_status NOT NULL DEFAULT 'pending',
  error_message   text,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX note_emails_note_idx ON note_emails (note_id);
CREATE INDEX note_emails_status_idx ON note_emails (status);
```

---

## Phase 1: Core Notes & Attachments (Priority 1)

**Estimated Time**: 2-4 days

### 1.1 Database Setup
- [ ] Create migration `007_add_notes.sql`
- [ ] Run migration in Supabase
- [ ] Create Supabase Storage bucket `note-attachments`
- [ ] Configure bucket RLS policies

### 1.2 TypeScript Types

```typescript
// src/types/index.ts additions

export type NoteType = 
  | 'visit' 
  | 'follow_up' 
  | 'vp_opportunity' 
  | 'issue' 
  | 'quote' 
  | 'order' 
  | 'personal';

export interface Note {
  id: string;
  dealer_id: string;
  type: NoteType;
  title: string | null;
  body: string;
  visit_date: string;
  follow_up_date: string | null;
  auto_send_email: boolean;
  dealer_email_id: string | null;
  email_template_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  tags?: Tag[];
  attachments?: NoteAttachment[];
  dealer?: Dealer;
}

export interface NoteAttachment {
  id: string;
  note_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface DealerEmail {
  id: string;
  dealer_id: string;
  label: string | null;
  email: string;
  is_primary: boolean;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  subject_template: string;
  body_template: string;
  default_for_type: NoteType | null;
  created_at: string;
  updated_at: string;
}

export interface NoteEmail {
  id: string;
  note_id: string;
  template_id: string | null;
  dealer_email_id: string | null;
  to_addresses: string[];
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

// Filter types
export interface NotesFilter {
  dealerId?: string;
  type?: NoteType;
  tagIds?: string[];
  startDate?: string;
  endDate?: string;
  search?: string;
}
```

### 1.3 API Layer

#### Files to Create:
- `src/lib/api/notes.ts` - Note CRUD operations
- `src/lib/api/tags.ts` - Tag CRUD operations
- `src/lib/api/attachments.ts` - Attachment operations
- `src/lib/hooks/useNotes.ts` - React Query hooks

#### API Functions:

```typescript
// src/lib/api/notes.ts

// Core CRUD
getNotes(filter: NotesFilter, page?: number, pageSize?: number)
getNote(id: string)
createNote(data: CreateNoteInput)
updateNote(id: string, data: UpdateNoteInput)
deleteNote(id: string)

// Search
searchNotes(query: string, dealerId?: string)

// Export
exportNotes(filter: NotesFilter, format: 'pdf' | 'txt')
```

```typescript
// src/lib/api/tags.ts
getTags()
createTag(name: string, color?: string)
deleteTag(id: string)
```

### 1.4 Server Actions

```typescript
// src/app/(dashboard)/dealers/[id]/notes/actions.ts

'use server'

export async function createNote(dealerId: string, data: FormData)
export async function updateNote(noteId: string, data: FormData)
export async function deleteNote(noteId: string)
export async function addNoteAttachment(noteId: string, data: FormData)
export async function removeNoteAttachment(attachmentId: string)
export async function updateNoteTags(noteId: string, tagIds: string[])
```

### 1.5 Components

#### New Components:
```
src/components/notes/
├── NoteForm.tsx          # Create/edit note form (mobile-first)
├── NoteCard.tsx          # Note list item
├── NoteList.tsx          # Paginated note list
├── NoteDetailDrawer.tsx  # Slide-up detail view (mobile)
├── NotesFilterBar.tsx    # Filter controls
├── AttachmentUploader.tsx # File/image upload
├── AttachmentPreview.tsx  # Display attachments
├── TagPicker.tsx          # Tag selection + inline create
├── TagChip.tsx            # Individual tag display
├── NoteTypeSelector.tsx   # Type pill buttons
└── AddNoteFab.tsx         # Floating action button
```

#### Component Details:

**NoteForm.tsx** (Mobile-First, Single Screen)
- Type selector (pill buttons, default "Visit")
- Visit date (default today)
- Follow-up date (optional)
- Title (optional)
- Body textarea (autofocus)
- Tag picker
- Attachment uploader
- Auto-send email toggle (Phase 2 stub)

**NotesFilterBar.tsx**
- Type dropdown
- Date range (7d, 30d, custom)
- Tag multi-select
- Search input
- Syncs with URL params

**AttachmentUploader.tsx**
- Multiple file support
- Camera capture on mobile: `accept="image/*" capture="environment"`
- Upload progress indicator
- Thumbnail previews
- Direct Supabase Storage upload

### 1.6 Pages

```
src/app/(dashboard)/dealers/[id]/notes/
├── page.tsx              # Notes list for dealer
└── [noteId]/
    └── page.tsx          # Note detail (desktop)
```

#### Notes Page Layout:
```tsx
// Mobile: FAB + List + Drawer
// Desktop: Split view (list left, detail right)

<PageHeader 
  title="Notes" 
  subtitle={dealer.name}
  actions={<ExportButton />}
/>
<NotesFilterBar />
<NoteList dealerId={dealerId} />
<AddNoteFab onClick={openNoteForm} />
<NoteDetailDrawer /> {/* Mobile slide-up */}
```

### 1.7 File Upload Strategy

**Supabase Storage Structure:**
```
note-attachments/
└── {dealer_id}/
    └── {note_id}/
        └── {uuid}.{ext}
```

**Upload Flow:**
1. User creates note → Note saved first
2. User adds attachments → Upload to Supabase Storage
3. On success → Create `note_attachments` record
4. Display thumbnails/previews with signed URLs

### 1.8 Export Implementation

**Text Export:**
```
==============================================
NOTES EXPORT - {Dealer Name}
Generated: {Date}
Filters: {Applied Filters}
==============================================

--- NOTE ---
Type: Visit
Date: 2025-12-30
Follow-up: 2026-01-05
Tags: important, quarterly-review

{Note body content here}

Attachments:
- photo1.jpg
- document.pdf

-------------------------------------------
```

**PDF Export:**
- Use `@react-pdf/renderer` or `jspdf`
- Clean, professional layout
- Include dealer header, note metadata, body
- List attachment names (not embedded)

---

## Phase 1.5: Dealer Emails UI

**Add to Attributes Page**

### 1.5.1 Components
```
src/components/dealers/
└── DealerEmailsSection.tsx  # Email list with add/edit/delete
```

### 1.5.2 Features
- List dealer emails with labels
- Add new email with label
- Mark primary email
- Delete email
- Inline editing

---

## Phase 2: Email Integration (Future)

**Estimated Time**: 3-5 days

### 2.1 Microsoft 365 Integration

#### Authentication Options:
1. **User-level OAuth** - Each user connects their Outlook
2. **App-level auth** - Single service account (simpler but less personal)

#### Tables Needed:
```sql
CREATE TABLE user_email_integrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL UNIQUE,
  provider      text NOT NULL DEFAULT 'microsoft',
  access_token  text NOT NULL,
  refresh_token text,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

### 2.2 Email Send Flow

```
User creates note with "Auto-send email" = true
         ↓
Note saved to database
         ↓
note_emails row created (status: 'pending')
         ↓
Background worker picks up pending emails
         ↓
Render template with placeholders:
  - {{dealer_name}}
  - {{note_body}}
  - {{user_name}}
  - {{visit_date}}
         ↓
Call Microsoft Graph API: POST /me/sendMail
         ↓
Update note_emails (status: 'sent', sent_at: now())
```

### 2.3 Template Placeholders

| Placeholder | Value |
|-------------|-------|
| `{{dealer_name}}` | Dealer's name |
| `{{dealer_contact}}` | Contact name from dealer |
| `{{user_name}}` | Current user's name |
| `{{note_body}}` | Note content |
| `{{note_title}}` | Note title |
| `{{visit_date}}` | Formatted visit date |
| `{{follow_up_date}}` | Formatted follow-up date |

### 2.4 Default Template Example

**Subject:** `Follow-up: Visit on {{visit_date}}`

**Body:**
```
Hi {{dealer_contact}},

Thank you for meeting with me on {{visit_date}}.

{{note_body}}

Please let me know if you have any questions.

Best regards,
{{user_name}}
Elias Wilf
```

### 2.5 UI Additions for Phase 2

**NoteForm additions:**
- "Send follow-up email" toggle
- Dealer email selector (from dealer_emails)
- Template selector (optional)
- Email preview button

**Note detail additions:**
- Email status indicator (Sent ✓ / Failed ✗ / Pending...)
- Resend button for failed

**Settings page:**
- Connect Microsoft 365 account
- Manage email templates
- Default template per note type

---

## Phase 3: Advanced Features (Future)

### 3.1 Full-Text Search
```sql
ALTER TABLE notes ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || body)
  ) STORED;

CREATE INDEX notes_search_idx ON notes USING GIN (search_vector);
```

### 3.2 Note Threads
```sql
ALTER TABLE notes ADD COLUMN parent_note_id uuid REFERENCES notes(id);
```
Link follow-up notes to original visit notes.

### 3.3 Saved Filter Presets
```sql
CREATE TABLE note_filter_presets (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  filters   jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## Navigation Updates

### Add to Mobile Tab Bar
Add "Notes" tab or make accessible from Dealer detail.

### Dealer Page Header
Add "Notes" button next to "Attributes" button.

### Notes Access Points:
1. `/dealers/[id]/notes` - Notes for specific dealer
2. `/notes` - All notes (future, optional)
3. Quick add from dealer page header

---

## File Structure Summary

```
src/
├── app/(dashboard)/
│   └── dealers/[id]/
│       └── notes/
│           ├── page.tsx
│           ├── actions.ts
│           └── [noteId]/
│               └── page.tsx
├── components/
│   ├── notes/
│   │   ├── NoteForm.tsx
│   │   ├── NoteCard.tsx
│   │   ├── NoteList.tsx
│   │   ├── NoteDetailDrawer.tsx
│   │   ├── NotesFilterBar.tsx
│   │   ├── AttachmentUploader.tsx
│   │   ├── AttachmentPreview.tsx
│   │   ├── TagPicker.tsx
│   │   ├── TagChip.tsx
│   │   ├── NoteTypeSelector.tsx
│   │   └── AddNoteFab.tsx
│   └── dealers/
│       └── DealerEmailsSection.tsx
├── lib/
│   ├── api/
│   │   ├── notes.ts
│   │   ├── tags.ts
│   │   └── attachments.ts
│   └── hooks/
│       └── useNotes.ts
└── types/
    └── index.ts (additions)

supabase/
└── migrations/
    └── 007_add_notes.sql
```

---

## Implementation Checklist

### Phase 1 - Core Notes
- [ ] Create migration 007_add_notes.sql
- [ ] Run migration in Supabase
- [ ] Create Supabase Storage bucket
- [ ] Add TypeScript types
- [ ] Create notes API functions
- [ ] Create tags API functions
- [ ] Create server actions
- [ ] Build NoteForm component
- [ ] Build NoteCard component
- [ ] Build NoteList component
- [ ] Build NotesFilterBar component
- [ ] Build TagPicker component
- [ ] Build AttachmentUploader component
- [ ] Build notes page
- [ ] Add Notes button to dealer header
- [ ] Implement text export
- [ ] Implement PDF export
- [ ] Test mobile workflow

### Phase 1.5 - Dealer Emails
- [ ] Build DealerEmailsSection component
- [ ] Add to Attributes page
- [ ] Test CRUD operations

### Phase 2 - Email Integration
- [ ] Research Microsoft Graph API
- [ ] Implement OAuth flow
- [ ] Build email template management
- [ ] Implement send workflow
- [ ] Add email status UI
- [ ] Test end-to-end

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Poor connectivity during upload | Save note first, attachments async with retry |
| Large file uploads | Set size limits (10MB per file), compress images |
| Email deliverability | Start with "preview" mode before auto-send |
| Search performance | Use indexes, add full-text search if needed |

---

## Success Criteria

### Phase 1 Complete When:
1. ✅ Can create/edit/delete notes for any dealer
2. ✅ Can attach files and images
3. ✅ Can add/manage custom tags
4. ✅ Can filter by type, date, tags, search
5. ✅ Can export filtered notes as PDF or text
6. ✅ Mobile workflow is fast (<30 seconds to capture note)

### Phase 2 Complete When:
1. ✅ Can connect Microsoft 365 account
2. ✅ Can manage email templates
3. ✅ Auto-send email works on note save
4. ✅ Email status visible on notes
5. ✅ Failed emails can be retried
