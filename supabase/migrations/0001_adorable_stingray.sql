CREATE TYPE "public"."feedback_category" AS ENUM('BUG', 'FEATURE', 'UI_UX', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."feedback_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('NEW', 'TRIAGED', 'PLANNED', 'IN_PROGRESS', 'DONE', 'WONT_FIX', 'DUPLICATE');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('FEEDBACK_STATUS_CHANGED', 'FEEDBACK_COMMENT', 'FEEDBACK_MERGED');--> statement-breakpoint
ALTER TYPE "public"."participant_type" ADD VALUE 'KEEPER' BEFORE 'PLAYER';--> statement-breakpoint
CREATE TABLE "feedback_comments" (
	"comment_id" varchar(26) PRIMARY KEY NOT NULL,
	"feedback_id" varchar(26) NOT NULL,
	"user_id" varchar(26) NOT NULL,
	"content" text NOT NULL,
	"is_official" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_votes" (
	"feedback_id" varchar(26) NOT NULL,
	"user_id" varchar(26) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_votes_feedback_id_user_id_pk" PRIMARY KEY("feedback_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"feedback_id" varchar(26) PRIMARY KEY NOT NULL,
	"user_id" varchar(26) NOT NULL,
	"category" "feedback_category" DEFAULT 'OTHER' NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"page_url" text,
	"screenshot_url" text,
	"browser_info" text,
	"status" "feedback_status" DEFAULT 'NEW' NOT NULL,
	"priority" "feedback_priority",
	"vote_count" integer DEFAULT 0 NOT NULL,
	"merged_into_id" varchar(26),
	"admin_note" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"notification_id" varchar(26) PRIMARY KEY NOT NULL,
	"user_id" varchar(26) NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"link_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_sessions" DROP CONSTRAINT "game_sessions_keeper_id_users_user_id_fk";
--> statement-breakpoint
DROP INDEX "game_sessions_keeper_idx";--> statement-breakpoint
ALTER TABLE "game_sessions" ADD COLUMN "session_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "video_links" ADD COLUMN "spoiler" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback_comments" ADD CONSTRAINT "feedback_comments_feedback_id_feedbacks_feedback_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("feedback_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_comments" ADD CONSTRAINT "feedback_comments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_votes" ADD CONSTRAINT "feedback_votes_feedback_id_feedbacks_feedback_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("feedback_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_votes" ADD CONSTRAINT "feedback_votes_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_comments_feedback_idx" ON "feedback_comments" USING btree ("feedback_id");--> statement-breakpoint
CREATE INDEX "feedbacks_user_idx" ON "feedbacks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedbacks_status_idx" ON "feedbacks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedbacks_category_idx" ON "feedbacks" USING btree ("category");--> statement-breakpoint
CREATE INDEX "feedbacks_vote_count_idx" ON "feedbacks" USING btree ("vote_count");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
ALTER TABLE "game_sessions" DROP COLUMN "keeper_id";