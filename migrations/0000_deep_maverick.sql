CREATE TABLE "bots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" varchar NOT NULL,
	"runtime" text NOT NULL,
	"start_command" text NOT NULL,
	"env_variables" jsonb DEFAULT '{}'::jsonb,
	"is_public" boolean DEFAULT false,
	"status" text DEFAULT 'stopped' NOT NULL,
	"file_path" text NOT NULL,
	"category" text,
	"process_id" integer,
	"cpu_usage" integer DEFAULT 0,
	"memory_usage" integer DEFAULT 0,
	"uptime" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;