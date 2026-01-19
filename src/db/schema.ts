import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

import {
  extractValues,
  HandoutTypes,
  ParticipantStatuses,
  ParticipantTypes,
  Roles,
  SchedulePhases,
  SessionPhases,
} from './enum';

const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

// ENUM型の定義
export const handoutTypeEnum = pgEnum(
  'handout_type',
  extractValues(HandoutTypes),
);
export const participantStatusEnum = pgEnum(
  'participant_status',
  extractValues(ParticipantStatuses),
);
export const participantTypeEnum = pgEnum(
  'participant_type',
  extractValues(ParticipantTypes),
);
export const roleEnum = pgEnum('role', extractValues(Roles));
export const schedulePhaseEnum = pgEnum(
  'schedule_phase',
  extractValues(SchedulePhases),
);
export const sessionPhaseEnum = pgEnum(
  'session_phase',
  extractValues(SessionPhases),
);

// テーブル定義
export const users = pgTable(
  'users',
  {
    userId: varchar('user_id', { length: 26 })
      .primaryKey()
      .$defaultFn(() => ulid()),
    discordId: text('discord_id').notNull().unique(),
    userName: text('user_name').notNull().unique(),
    nickname: text('nickname').notNull(),
    bio: text('bio'),
    image: text('image'),
    role: roleEnum('role').default(Roles.MEMBER.value).notNull(),
    lastloginAt: timestamp('lastlogin_at'),
    ...timestamps,
  },
  (table) => [
    index('users_discord_idx').on(table.discordId),
    index('users_username_idx').on(table.userName),
    index('users_nickname_idx').on(table.nickname),
  ],
);

export const scenarioSystems = pgTable('scenario_systems', {
  systemId: varchar('system_id', { length: 26 })
    .primaryKey()
    .$defaultFn(() => ulid()),
  name: text('name').notNull().unique(),
  ...timestamps,
});

export const scenarios = pgTable(
  'scenarios',
  {
    scenarioId: varchar('scenario_id', { length: 26 })
      .primaryKey()
      .$defaultFn(() => ulid()),
    name: text('name').notNull(),
    author: text('author'),
    description: text('description'),
    scenarioImageUrl: text('scenario_image_url'),
    minPlayer: integer('min_player'),
    maxPlayer: integer('max_player'),
    minPlaytime: integer('min_playtime'),
    maxPlaytime: integer('max_playtime'),
    scenarioSystemId: varchar('scenario_system_id', { length: 26 })
      .notNull()
      .references(() => scenarioSystems.systemId),
    handoutType: handoutTypeEnum('handout_type')
      .default(HandoutTypes.NONE.value)
      .notNull(),
    distributeUrl: text('distribute_url'),
    createdById: text('created_by_id').references(() => users.userId, {
      onDelete: 'set null',
    }),
    ...timestamps,
  },
  (table) => [
    index('scenarios_name_idx').on(table.name),
    index('scenarios_system_idx').on(table.scenarioSystemId),
  ],
);

export const tags = pgTable('tags', {
  tagId: varchar('tag_id', { length: 26 })
    .primaryKey()
    .$defaultFn(() => ulid()),
  name: text('name').notNull().unique(),
  color: text('color'),
  ...timestamps,
});

export const scenarioTags = pgTable(
  'scenario_tags',
  {
    scenarioId: varchar('scenario_id', { length: 26 })
      .notNull()
      .references(() => scenarios.scenarioId, { onDelete: 'cascade' }),
    tagId: varchar('tag_id', { length: 26 })
      .notNull()
      .references(() => tags.tagId, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.scenarioId, table.tagId] })],
);

export const gameSessions = pgTable(
  'game_sessions',
  {
    gameSessionId: varchar('game_session_id', { length: 26 })
      .primaryKey()
      .$defaultFn(() => ulid()),
    sessionName: text('session_name').notNull(),
    scenarioId: varchar('scenario_id', { length: 26 })
      .notNull()
      .references(() => scenarios.scenarioId, { onDelete: 'cascade' }),
    sessionPhase: sessionPhaseEnum('session_phase')
      .default(SessionPhases.RECRUITING.value)
      .notNull(),
    ...timestamps,
  },
  (table) => [index('game_sessions_scenario_idx').on(table.scenarioId)],
);

export const gameSchedules = pgTable(
  'game_schedules',
  {
    sessionId: varchar('session_id', { length: 26 })
      .primaryKey()
      .references(() => gameSessions.gameSessionId, { onDelete: 'cascade' }),
    scheduleDate: timestamp('schedule_date').notNull(),
    schedulePhase: schedulePhaseEnum('schedule_phase')
      .default(SchedulePhases.ADJUSTING.value)
      .notNull(),
    ...timestamps,
  },
  (table) => [index('game_schedules_date_idx').on(table.scheduleDate)],
);

export const sessionParticipants = pgTable(
  'session_participants',
  {
    sessionId: varchar('session_id', { length: 26 })
      .notNull()
      .references(() => gameSessions.gameSessionId, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.userId),
    participantType: participantTypeEnum('participant_type')
      .default(ParticipantTypes.PLAYER.value)
      .notNull(),
    participantStatus: participantStatusEnum('participant_status')
      .default(ParticipantStatuses.PENDING.value)
      .notNull(),
    characterSheetUrl: text('character_sheet_url'),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.sessionId, table.userId] })],
);

export const userReviews = pgTable(
  'user_reviews',
  {
    userReviewId: varchar('user_review_id', { length: 26 })
      .primaryKey()
      .$defaultFn(() => ulid()),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.userId),
    scenarioId: varchar('scenario_id', { length: 26 })
      .notNull()
      .references(() => scenarios.scenarioId, { onDelete: 'cascade' }),
    sessionId: varchar('session_id', { length: 26 }).references(
      () => gameSessions.gameSessionId,
    ),
    openComment: text('open_comment'),
    spoilerComment: text('spoiler_comment'),
    rating: integer('rating'),
    ...timestamps,
  },
  (table) => [
    unique().on(table.scenarioId, table.userId),
    index('user_reviews_scenario_idx').on(table.scenarioId),
    index('user_reviews_session_idx').on(table.sessionId),
  ],
);

export const userScenarioPreferences = pgTable(
  'user_scenario_preferences',
  {
    scenarioId: varchar('scenario_id', { length: 26 })
      .notNull()
      .references(() => scenarios.scenarioId, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    sessionId: varchar('session_id', { length: 26 }).references(
      () => gameSessions.gameSessionId,
    ),
    isPlayed: boolean('is_played').notNull(),
    isWatched: boolean('is_watched').notNull(),
    canKeeper: boolean('can_keeper').notNull(),
    hadScenario: boolean('had_scenario').notNull(),
    isLike: boolean('is_like').notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.scenarioId, table.userId] }),
    index('user_scenario_preferences_session_idx').on(table.sessionId),
  ],
);

export const videoLinks = pgTable(
  'video_links',
  {
    videoLinkId: varchar('video_link_id', { length: 26 })
      .primaryKey()
      .$defaultFn(() => ulid()),
    scenarioId: varchar('scenario_id', { length: 26 })
      .notNull()
      .references(() => scenarios.scenarioId, { onDelete: 'cascade' }),
    sessionId: varchar('session_id', { length: 26 })
      .notNull()
      .references(() => gameSessions.gameSessionId, { onDelete: 'cascade' }),
    videoUrl: text('video_url').notNull().unique(),
    spoiler: boolean('spoiler').notNull().default(false),
    createdById: varchar('created_by_id', { length: 26 })
      .notNull()
      .references(() => users.userId),
    ...timestamps,
  },
  (table) => [
    index('video_links_scenario_idx').on(table.scenarioId),
    index('video_links_session_idx').on(table.sessionId),
  ],
);

// リレーション定義
export const userRelations = relations(users, ({ many }) => ({
  participatedSessions: many(sessionParticipants),
  keptSessions: many(gameSessions, { relationName: 'keeper' }),
  reviews: many(userReviews),
  videoLinks: many(videoLinks),
  scenarioPreferences: many(userScenarioPreferences),
}));

export const scenarioSystemRelations = relations(
  scenarioSystems,
  ({ many }) => ({
    scenarios: many(scenarios),
  }),
);

export const scenarioRelations = relations(scenarios, ({ many, one }) => ({
  system: one(scenarioSystems, {
    fields: [scenarios.scenarioSystemId],
    references: [scenarioSystems.systemId],
  }),
  sessions: many(gameSessions),
  scenarioTags: many(scenarioTags),
  reviews: many(userReviews),
  preferences: many(userScenarioPreferences),
  videoLinks: many(videoLinks),
}));

export const scenarioTagRelations = relations(scenarioTags, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [scenarioTags.scenarioId],
    references: [scenarios.scenarioId],
  }),
  tag: one(tags, {
    fields: [scenarioTags.tagId],
    references: [tags.tagId],
  }),
}));

export const tagRelations = relations(tags, ({ many }) => ({
  scenarioTags: many(scenarioTags),
}));

export const gameSessionRelations = relations(
  gameSessions,
  ({ one, many }) => ({
    scenario: one(scenarios, {
      fields: [gameSessions.scenarioId],
      references: [scenarios.scenarioId],
    }),
    schedule: one(gameSchedules),
    participants: many(sessionParticipants),
    reviews: many(userReviews),
    preferences: many(userScenarioPreferences),
    videoLinks: many(videoLinks),
  }),
);

export const gameScheduleRelations = relations(gameSchedules, ({ one }) => ({
  session: one(gameSessions, {
    fields: [gameSchedules.sessionId],
    references: [gameSessions.gameSessionId],
  }),
}));

export const sessionParticipantRelations = relations(
  sessionParticipants,
  ({ one }) => ({
    user: one(users, {
      fields: [sessionParticipants.userId],
      references: [users.userId],
    }),
    session: one(gameSessions, {
      fields: [sessionParticipants.sessionId],
      references: [gameSessions.gameSessionId],
    }),
  }),
);

export const videoLinkRelations = relations(videoLinks, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [videoLinks.scenarioId],
    references: [scenarios.scenarioId],
  }),
  session: one(gameSessions, {
    fields: [videoLinks.sessionId],
    references: [gameSessions.gameSessionId],
  }),
  user: one(users, {
    fields: [videoLinks.createdById],
    references: [users.userId],
  }),
}));

export const userReviewRelations = relations(userReviews, ({ one }) => ({
  user: one(users, {
    fields: [userReviews.userId],
    references: [users.userId],
  }),
  scenario: one(scenarios, {
    fields: [userReviews.scenarioId],
    references: [scenarios.scenarioId],
  }),
  session: one(gameSessions, {
    fields: [userReviews.sessionId],
    references: [gameSessions.gameSessionId],
  }),
}));

export const userScenarioPreferenceRelations = relations(
  userScenarioPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userScenarioPreferences.userId],
      references: [users.userId],
    }),
    scenario: one(scenarios, {
      fields: [userScenarioPreferences.scenarioId],
      references: [scenarios.scenarioId],
    }),
    session: one(gameSessions, {
      fields: [userScenarioPreferences.sessionId],
      references: [gameSessions.gameSessionId],
    }),
  }),
);
