CREATE TYPE "public"."handout_type" AS ENUM('NONE', 'PUBLIC', 'SECRET');--> statement-breakpoint
CREATE TYPE "public"."participant_status" AS ENUM('PENDING', 'CONFIRMED');--> statement-breakpoint
CREATE TYPE "public"."participant_type" AS ENUM('PLAYER', 'SPECTATOR');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('MODERATOR', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."schedule_phase" AS ENUM('ADJUSTING', 'CONFIRMED');--> statement-breakpoint
CREATE TYPE "public"."session_phase" AS ENUM('RECRUITING', 'PREPARATION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "game_schedules" (
	"session_id" varchar(26) PRIMARY KEY NOT NULL,
	"schedule_date" timestamp NOT NULL,
	"schedule_phase" "schedule_phase" DEFAULT 'ADJUSTING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"game_session_id" varchar(26) PRIMARY KEY NOT NULL,
	"scenario_id" varchar(26) NOT NULL,
	"session_phase" "session_phase" DEFAULT 'RECRUITING' NOT NULL,
	"keeper_id" varchar(26),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_systems" (
	"system_id" varchar(26) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scenario_systems_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "scenario_tags" (
	"scenario_id" varchar(26) NOT NULL,
	"tag_id" varchar(26) NOT NULL,
	CONSTRAINT "scenario_tags_scenario_id_tag_id_pk" PRIMARY KEY("scenario_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"scenario_id" varchar(26) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"author" text,
	"description" text,
	"scenario_image_url" text,
	"min_player" integer,
	"max_player" integer,
	"min_playtime" integer,
	"max_playtime" integer,
	"scenario_system_id" varchar(26) NOT NULL,
	"handout_type" "handout_type" DEFAULT 'NONE' NOT NULL,
	"distribute_url" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_participants" (
	"session_id" varchar(26) NOT NULL,
	"user_id" varchar(26) NOT NULL,
	"participant_type" "participant_type" DEFAULT 'PLAYER' NOT NULL,
	"participant_status" "participant_status" DEFAULT 'PENDING' NOT NULL,
	"character_sheet_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_participants_session_id_user_id_pk" PRIMARY KEY("session_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"tag_id" varchar(26) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_reviews" (
	"user_review_id" varchar(26) PRIMARY KEY NOT NULL,
	"user_id" varchar(26) NOT NULL,
	"scenario_id" varchar(26) NOT NULL,
	"session_id" varchar(26),
	"open_comment" text,
	"spoiler_comment" text,
	"rating" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_reviews_scenario_id_user_id_unique" UNIQUE("scenario_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "user_scenario_preferences" (
	"scenario_id" varchar(26) NOT NULL,
	"user_id" varchar(26) NOT NULL,
	"session_id" varchar(26),
	"is_played" boolean NOT NULL,
	"is_watched" boolean NOT NULL,
	"can_keeper" boolean NOT NULL,
	"had_scenario" boolean NOT NULL,
	"is_like" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_scenario_preferences_scenario_id_user_id_pk" PRIMARY KEY("scenario_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" varchar(26) PRIMARY KEY NOT NULL,
	"discord_id" text NOT NULL,
	"user_name" text NOT NULL,
	"nickname" text NOT NULL,
	"bio" text,
	"image" text,
	"role" "role" DEFAULT 'MEMBER' NOT NULL,
	"lastlogin_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id"),
	CONSTRAINT "users_user_name_unique" UNIQUE("user_name")
);
--> statement-breakpoint
CREATE TABLE "video_links" (
	"video_link_id" varchar(26) PRIMARY KEY NOT NULL,
	"scenario_id" varchar(26) NOT NULL,
	"session_id" varchar(26) NOT NULL,
	"video_url" text NOT NULL,
	"created_by_id" varchar(26) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "video_links_video_url_unique" UNIQUE("video_url")
);
--> statement-breakpoint
ALTER TABLE "game_schedules" ADD CONSTRAINT "game_schedules_session_id_game_sessions_game_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("game_session_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_scenario_id_scenarios_scenario_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("scenario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_keeper_id_users_user_id_fk" FOREIGN KEY ("keeper_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_tags" ADD CONSTRAINT "scenario_tags_scenario_id_scenarios_scenario_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("scenario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_tags" ADD CONSTRAINT "scenario_tags_tag_id_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("tag_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_scenario_system_id_scenario_systems_system_id_fk" FOREIGN KEY ("scenario_system_id") REFERENCES "public"."scenario_systems"("system_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_created_by_id_users_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_session_id_game_sessions_game_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("game_session_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_scenario_id_scenarios_scenario_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("scenario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_session_id_game_sessions_game_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("game_session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_scenario_preferences" ADD CONSTRAINT "user_scenario_preferences_scenario_id_scenarios_scenario_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("scenario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_scenario_preferences" ADD CONSTRAINT "user_scenario_preferences_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_scenario_preferences" ADD CONSTRAINT "user_scenario_preferences_session_id_game_sessions_game_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("game_session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_links" ADD CONSTRAINT "video_links_scenario_id_scenarios_scenario_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("scenario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_links" ADD CONSTRAINT "video_links_session_id_game_sessions_game_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("game_session_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_links" ADD CONSTRAINT "video_links_created_by_id_users_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "game_schedules_date_idx" ON "game_schedules" USING btree ("schedule_date");--> statement-breakpoint
CREATE INDEX "game_sessions_scenario_idx" ON "game_sessions" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "game_sessions_keeper_idx" ON "game_sessions" USING btree ("keeper_id");--> statement-breakpoint
CREATE INDEX "scenarios_name_idx" ON "scenarios" USING btree ("name");--> statement-breakpoint
CREATE INDEX "scenarios_system_idx" ON "scenarios" USING btree ("scenario_system_id");--> statement-breakpoint
CREATE INDEX "user_reviews_scenario_idx" ON "user_reviews" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "user_reviews_session_idx" ON "user_reviews" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "user_scenario_preferences_session_idx" ON "user_scenario_preferences" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "users_discord_idx" ON "users" USING btree ("discord_id");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("user_name");--> statement-breakpoint
CREATE INDEX "users_nickname_idx" ON "users" USING btree ("nickname");--> statement-breakpoint
CREATE INDEX "video_links_scenario_idx" ON "video_links" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "video_links_session_idx" ON "video_links" USING btree ("session_id");