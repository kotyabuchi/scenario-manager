# Session Recruit Form Codebase Analysis

**Date**: 2026-02-18
**Purpose**: Plan review preparation - thorough codebase analysis

## 1. File Existence & Structure

### ✅ All Required Files Exist

#### Main Page Directory (`src/app/(main)/sessions/new/`)
- ✅ `page.tsx` - Server Component with auth check
- ✅ `schema.ts` - Zod validation schema (comprehensive)
- ✅ `adapter.ts` - DB operations (createSession, getSessionById)
- ✅ `actions.ts` - Server Actions (createSessionAction, createSessionAndRedirect)
- ✅ `styles.ts` - PandaCSS styles (page-level)
- ✅ `__tests__/schema.test.ts` - 37 comprehensive schema validation tests
- ✅ `__tests__/adapter.test.ts` - Integration tests (with .skipIf for CI)

#### Components Directory (`src/app/(main)/sessions/new/_components/`)
- ✅ `SessionForm.tsx` - Client Component with React Hook Form
- ✅ `SessionFormContainer.tsx` - Client Component wrapper (useTransition)
- ✅ `styles.ts` - Component-level PandaCSS styles
- ✅ `SessionForm.test.tsx` - Component tests (Storybook + RTL)
- ✅ `SessionForm.stories.tsx` - 7 story variations

### ✅ Required UI Components Exist
All components verified in `src/components/elements/`:
- ✅ `input/input.tsx`
- ✅ `textarea/textarea.tsx`
- ✅ `form-field/form-field.tsx`
- ✅ `number-input/number-input.tsx`
- ✅ `switch/switch.tsx`
- ✅ `radio-group/radio-group.tsx` (and `radio/radio.tsx`)
- ✅ `tabs/tabs.tsx`
- ✅ `modal/modal.tsx`
- ✅ `avatar/avatar.tsx`
- ✅ `system-badge/system-badge.tsx`
- ✅ `field-error/field-error.tsx`
- ✅ `button/button.tsx`
- ✅ `select/select.tsx`
- ✅ `checkbox/checkbox.tsx`

---

## 2. Key Implementation Patterns

### React Hook Form + Zod Pattern
**Status**: ✅ Fully implemented and correct

#### Schema Definition (`src/app/(main)/sessions/new/schema.ts`)
```typescript
// Single source of truth pattern
export const sessionFormSchema = z.object({
  sessionName: z.string().min(1).max(100),
  sessionDescription: z.string().min(1).max(500),
  scenarioId: z.string().regex(ulidPattern).nullish(),
  scheduledAt: z.string().refine(...).nullish(),
  recruitedPlayerCount: z.number().int().min(1).max(10).nullish(),
  tools: z.string().max(200).nullish(),
  isBeginnerFriendly: z.boolean().default(false),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS_ONLY']).default('PUBLIC'),
})

// Type derivation from schema
export type SessionFormInput = z.input<typeof sessionFormSchema>
export type SessionFormValues = z.infer<typeof sessionFormSchema>
export type CreateSessionInput = SessionFormValues
```

**Key Design Decisions**:
- Only `sessionName` and `sessionDescription` are required (true to "flexible recruitment")
- All optional fields use `.nullish()` (accepts null, undefined, or empty string)
- Boolean/enum fields have `.default()` values
- Uses `z.input<>` for form defaultValues (before default() applied)
- Uses `z.infer<>` for parsed output (after default() applied)

#### Form Component (`src/app/(main)/sessions/new/_components/SessionForm.tsx`)
**Pattern**: Client Component with React Hook Form + Zod resolver

```typescript
'use client'

const SessionForm = ({ onSubmit, defaultValues, isSubmitting, errors }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<SessionFormInput>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      // Manual spreading with ?? null to normalize empty strings
    }
  })

  const onFormSubmit = (data: SessionFormInput) => {
    // Manual normalization: data.scenarioId || null
    const normalizedData: SessionFormValues = { ... }
    onSubmit?.(normalizedData)
  }

  return <form onSubmit={handleSubmit(onFormSubmit)}>
}
```

**Important Details**:
1. Uses native HTML form elements (`input`, `textarea`, `select`)
2. Manual HTML validation (not Ark UI form components)
3. FieldError component for error display
4. Explicit normalization of null/empty values in onFormSubmit

#### Container Component (`src/app/(main)/sessions/new/_components/SessionFormContainer.tsx`)
**Pattern**: Client Component managing form submission with useTransition

```typescript
'use client'

export const SessionFormContainer = () => {
  const [isPending, startTransition] = useTransition()
  const { addMessage } = useSystemMessageActions()

  const handleSubmit = (data: SessionFormValues) => {
    startTransition(async () => {
      const result = await createSessionAction(data)
      // Error handling via system message
    })
  }

  return <SessionForm onSubmit={handleSubmit} isSubmitting={isPending} />
}
```

**Key Pattern**:
- Separates presentational form (SessionForm) from logic (SessionFormContainer)
- Uses useTransition for optimistic updates
- Uses system message hook for error/success feedback

#### Server Action (`src/app/(main)/sessions/new/actions.ts`)
```typescript
'use server'

export const createSessionAction = async (
  input: SessionFormValues
): Promise<Result<CreateSessionActionResult>> => {
  // 1. Auth check
  // 2. Zod validation (redundant safety check)
  // 3. Discord ID → User ID lookup
  // 4. Adapter call
  // 5. Cache revalidation
  // 6. Result return
}
```

**Pattern**: Full validation chain (client-side Zod + server-side Zod + DB checks)

#### Adapter (`src/app/(main)/sessions/new/adapter.ts`)
```typescript
export const createSession = async (
  input: CreateSessionInput,
  userId: string
): Promise<Result<CreateSessionResult>> => {
  // 1. User existence check (isNil)
  // 2. Generate ULID for sessionId
  // 3. Insert into game_sessions table
  // 4. Auto-add creator as KEEPER participant
  // 5. Return Result<>
}
```

**Key Details**:
- Uses `isNil()` from ramda for null/undefined checks
- Converts ISO string `scheduledAt` to Date then toISOString()
- Auto-adds creator with KEEPER type and CONFIRMED status
- All optional fields use `?? null` to normalize

---

## 3. Component & Style Patterns

### HTML Form Elements (NOT Ark UI Components)
The current implementation uses **raw HTML form elements**:
- `<input type="text">` (not Input component)
- `<textarea>` (not Textarea component)
- `<input type="checkbox">` (not Checkbox component)
- `<input type="radio">` (not RadioGroup component)
- `<select>` (not Select/Combobox component)
- `<input type="number">` (not NumberInput component)
- `<input type="datetime-local">` (not DatePicker component)

**Reason**: Custom styling with PandaCSS via className

### Styling Pattern
**File**: `src/app/(main)/sessions/new/_components/styles.ts`

Uses PandaCSS `css()` function with:
- camelCase naming: `editForm_field`, `editForm_label`
- Arbitrary values for theme colors: `'[bg.muted]'`, `'[text.default]'`
- Token-based spacing/sizing: `gap: '6'`, `px: '3'`, `py: '2.5'`
- Pseudo-class states: `_hover`, `_focus`, `_focusVisible`, `_placeholder`
- Complex nested styles for input states

**Potential Issues**:
- Uses arbitrary color values like `'[danger.text]'`, `'[primary.500]'`
- These must be defined in semantic tokens or theme

### FieldError Component
**Usage**: `<FieldError error={errors.sessionName ?? externalErrors?.sessionName} />`

Pattern: Accept error object from React Hook Form and display

---

## 4. Database & Enum Integration

### Enums (`src/db/enum.ts`)
✅ All required enums exist:

```typescript
SessionPhases = { RECRUITING, PREPARATION, IN_PROGRESS, COMPLETED, CANCELLED }
ParticipantTypes = { KEEPER, PLAYER, SPECTATOR }
ParticipantStatuses = { PENDING, CONFIRMED }
SessionVisibilities = { PUBLIC, FOLLOWERS_ONLY }
```

**Usage in adapter**:
```typescript
session_phase: SessionPhases.RECRUITING.value  // 'RECRUITING'
participant_type: ParticipantTypes.KEEPER.value  // 'KEEPER'
participant_status: ParticipantStatuses.CONFIRMED.value  // 'CONFIRMED'
visibility: input.visibility  // 'PUBLIC' or 'FOLLOWERS_ONLY'
```

### Database Adapter Pattern
```typescript
export const createSession = async (
  input: CreateSessionInput,
  userId: string
): Promise<Result<CreateSessionResult>>
```

**Key Function**: `camelCaseKeys()` for snake_case → camelCase transformation

**Result Type**: Custom type with all session properties

---

## 5. Testing Coverage

### Schema Tests (`__tests__/schema.test.ts`)
✅ 37 comprehensive tests:
- sessionName: 4 tests (min/max/required)
- sessionDescription: 4 tests
- scenarioId: 4 tests (ULID format, null, undefined)
- scheduledAt: 3 tests (ISO8601, null, undefined)
- recruitedPlayerCount: 6 tests (1-10, null, undefined, float rejection)
- tools: 4 tests (max length, null)
- isBeginnerFriendly: 3 tests (default false)
- visibility: 4 tests (enum validation, default PUBLIC)
- Integration: 2 tests (all fields, minimal required)

**Test Pattern**: `sessionFormSchema.safeParse()`

### Component Tests (`_components/SessionForm.test.tsx`)
✅ Tests using Storybook + React Testing Library:
- US-S101: Scenario optional (2 tests)
- US-S102: Date optional (2 tests)
- US-S103: Player count optional (2 tests)
- FORM: UI interactions (7 tests)
- Integration: Full form submission (1 test)

**Storybook Stories** (7 variations):
1. Default - Empty form
2. WithScenario - With scenario preselected
3. Filled - All optional fields
4. MinimalRequired - Minimum fields
5. FollowersOnly - Visibility set
6. WithErrors - Error state
7. Submitting - Loading state

### Adapter Tests (`__tests__/adapter.test.ts`)
✅ Integration tests (CI-skipped):
- T-CS-001 to T-CS-008: createSession tests (scenario optional, date optional, player count optional, etc.)
- T-GS-001 to T-GS-004: getSessionById tests
- T-RT-001 to T-RT-002: Result type validation
- T-EM-001 to T-EM-004: Error message validation

**Skip Pattern**: `.skipIf(!isIntegrationTestEnabled)`

---

## 6. Design Mocks

### Current Status
**Mock Directories in `docs/designs/mocks/`**:
- ✅ `dashboard_pc/`
- ✅ `dashboard_sp/`
- ✅ `scenario_create_pc/`
- ✅ `フィードバック一覧ページ/`
- ✅ `フィードバック詳細ページ/`

**Missing**: No session recruit form mocks exist yet
- No `セッション募集フォーム/` directory
- No scenario modal/selection design mocks

---

## 7. Server Action & Adapter Flow

### Authorization & User Lookup
**Key Pattern** (from actions.ts):
```typescript
// 1. Auth check via Supabase Auth
const { data: { user: authUser } } = await supabase.auth.getUser()

// 2. Discord ID → User ID lookup
const userResult = await getUserByDiscordId(authUser.id)  // From scenarios/adapter.ts
const userId = userResult.data.userId

// 3. Pass userId to adapter
const createResult = await createSession(parsedData, userId)
```

**Import Note**: Uses `getUserByDiscordId` from `'../../scenarios/adapter'`

**Function Signature** (verified):
```typescript
export const getUserByDiscordId = async (
  discordId: string
): Promise<Result<{ userId: string; role: string } | null>>
```

### Error Handling Pattern
```typescript
// Result type usage
if (!result.success) {
  return err(new Error('...'))
}
if (isNil(value)) {
  return err(new Error('...'))
}
return ok(data)
```

---

## 8. Potential Issues & Assumptions Verification

### ✅ Verified Assumptions (Plan-Safe)

1. **React Hook Form + Zod**: Fully implemented, patterns correct
2. **Result type pattern**: Consistent use of Result<T, E> throughout
3. **isNil() from ramda**: Used correctly in adapter
4. **SessionFormInput vs SessionFormValues**: Properly distinguished
5. **Optional fields**: All handle null/undefined correctly
6. **Enum integration**: ParticipantTypes.KEEPER.value pattern works
7. **ULID generation**: `ulid()` library used in adapter
8. **Server Actions**: Proper 'use server' directive
9. **useTransition**: Pattern in SessionFormContainer is correct
10. **camelCaseKeys transformation**: Used for snake_case conversion

### ⚠️ Code-Level Concerns (Implementation)

1. **HTML Form Elements, Not Ark UI**:
   - Current: Raw `<input>`, `<textarea>`, `<select>`, `<input type="radio">`
   - Plan assumes: Ark UI Combobox, Input, Textarea, NumberInput components
   - **Impact**: Will require component replacement with Ark UI equivalents
   - **Risk Level**: Medium (styling & behavior changes)

2. **Arbitrary Color Values in Styles**:
   - Current: `'[danger.text]'`, `'[primary.500]'`, `'[text.default]'`
   - **Issue**: These arbitrary values may not exist in semantic tokens
   - **Recommendation**: Verify semantic token definitions before styling changes

3. **Manual Null Normalization**:
   - Current: `const normalizedData = { scenarioId: data.scenarioId || null, ... }`
   - **Better Pattern**: Could use Zod `.nullable()` or `.transform()` for cleaner code
   - **Risk Level**: Low (works but verbose)

4. **Scenario Selection Hardcoded Comment**:
   - Current: `{/* TODO: シナリオ一覧を動的に取得 */}`
   - **Impact**: Scenario dropdown not functional yet
   - **Risk Level**: Medium (plan assumes scenario search/selection modal)

5. **No Scenario Modal Implementation**:
   - Current: `<select>` with hardcoded option
   - Plan assumes: Modal with scenario search + dynamic selection
   - **Risk Level**: High (major feature missing)

6. **No DateTime-Local Format Handling**:
   - Current: `<input type="datetime-local">` with ISO8601 refine
   - Issue: Browser datetime-local format (YYYY-MM-DDTHH:mm) vs ISO8601
   - Current schema handles both, but client-side conversion may be needed

### ⚠️ Plan-Specific Issues

1. **Sheet API Integration Not Started**:
   - No SignupSheet or Scenario modal components in current form
   - Plan assumes these exist or will be created

2. **Participant System Not Visible**:
   - Current: Form doesn't show participants
   - Plan assumes: Display during/after form submission

3. **FormField Component Usage**:
   - Current: Manual label + input pattern
   - Plan assumes: FormField wrapper component (exists in src/components/elements/)
   - **Opportunity**: Could refactor to use FormField for DRY principle

---

## 9. File Structure Summary

```
src/app/(main)/sessions/new/
├── page.tsx                          # Server Component, auth check
├── schema.ts                         # Zod validation (CODEBASE SOURCE OF TRUTH)
├── adapter.ts                        # DB operations (createSession, getSessionById)
├── actions.ts                        # Server Actions
├── styles.ts                         # Page-level PandaCSS
├── __tests__/
│   ├── schema.test.ts               # 37 tests
│   └── adapter.test.ts              # Integration tests
└── _components/
    ├── SessionForm.tsx              # Client form component
    ├── SessionFormContainer.tsx     # Client container
    ├── SessionForm.test.tsx         # Component tests
    ├── SessionForm.stories.tsx      # 7 story variations
    └── styles.ts                    # Component-level PandaCSS
```

---

## 10. Key Exports & Types

### From schema.ts
```typescript
export type SessionFormInput = z.input<typeof sessionFormSchema>
export type SessionFormValues = z.infer<typeof sessionFormSchema>
export type CreateSessionInput = SessionFormValues
export const sessionFormSchema = z.object({ ... })
```

### From adapter.ts
```typescript
export type CreateSessionResult = { gameSessionId, sessionName, ... }
export type SessionWithRelations = { ... scenario, participants }
export const createSession = async (...) => Promise<Result<CreateSessionResult>>
export const getSessionById = async (...) => Promise<Result<SessionWithRelations | null>>
```

### From actions.ts
```typescript
export const createSessionAction = async (...) => Promise<Result<CreateSessionActionResult>>
export const createSessionAndRedirect = async (...) => Promise<void>
```

---

## 11. Semantic Tokens & Styling

**File**: Not yet checked - need to verify semantic token definitions
**Referenced in Styles**:
- `'[text.default]'`, `'[text.muted]'`
- `'[bg.muted]'`, `'[bg.emphasized]'`
- `'[border.default]'`, `'[border.emphasized]'`, `'[border.focus]'`
- `'[danger.text]'`, `'[primary.500]'`

**Status**: ⚠️ Needs verification in `src/styles/semanticTokens.ts`

---

## Summary for Plan Review

✅ **Safe to Build On**:
- Schema validation is comprehensive and correct
- Adapter pattern follows Result type conventions
- Server Action flow is proper
- Test coverage is good
- React Hook Form + Zod integration is solid
- ULID and enum usage is correct

⚠️ **Watch Out For**:
- HTML form elements will need Ark UI replacement (if using FormField)
- Scenario selection modal not yet implemented
- Semantic token definitions must exist before styling changes
- Manual null normalization could be cleaner

🎯 **Ready for Implementation**:
- Schema is the single source of truth
- Component structure supports the plan
- Existing tests can be extended
- Patterns are consistent across codebase
