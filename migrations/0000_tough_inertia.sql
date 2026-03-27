CREATE TABLE "banner_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"banner_image_url" text,
	"banner_image_data" text,
	"banner_height" integer DEFAULT 120,
	"is_active" boolean DEFAULT true,
	"created_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "display_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"orientation" text DEFAULT 'horizontal',
	"background_color" text DEFAULT '#FFF8E1',
	"text_color" text DEFAULT '#212529',
	"rate_number_font_size" text DEFAULT 'text-4xl',
	"show_media" boolean DEFAULT true,
	"rates_display_duration_seconds" integer DEFAULT 15,
	"refresh_interval" integer DEFAULT 30,
	"created_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gold_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"gold_24k_sale" real NOT NULL,
	"gold_24k_purchase" real NOT NULL,
	"gold_22k_sale" real NOT NULL,
	"gold_22k_purchase" real NOT NULL,
	"gold_18k_sale" real NOT NULL,
	"gold_18k_purchase" real NOT NULL,
	"silver_per_kg_sale" real NOT NULL,
	"silver_per_kg_purchase" real NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"file_url" text,
	"file_data" text,
	"media_type" text NOT NULL,
	"duration_seconds" integer DEFAULT 30,
	"order_index" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"file_size" integer,
	"mime_type" text,
	"created_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promo_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"image_data" text,
	"duration_seconds" integer DEFAULT 5,
	"transition_effect" text DEFAULT 'fade',
	"order_index" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"file_size" integer,
	"created_date" timestamp DEFAULT now()
);
