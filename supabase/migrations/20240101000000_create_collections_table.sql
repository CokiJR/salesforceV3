-- Create collections table
create table "public"."collections" (
  "id" uuid not null default uuid_generate_v4(),
  "customer_id" uuid not null,
  "amount" numeric not null,
  "due_date" timestamp with time zone not null,
  "payment_date" timestamp with time zone,
  "status" text not null default 'pending',
  "notes" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  "bank_account" text,
  "transaction_id" uuid,
  "sync_status" text default 'pending',
  primary key ("id")
);

-- Add foreign key constraints
alter table "public"."collections"
  add constraint "collections_customer_id_fkey"
  foreign key ("customer_id")
  references "public"."customers" ("id")
  on delete cascade;

alter table "public"."collections"
  add constraint "collections_transaction_id_fkey"
  foreign key ("transaction_id")
  references "public"."transactions" ("id")
  on delete set null;

-- Add indexes for optimization
create index "collections_customer_id_idx" on "public"."collections" ("customer_id");
create index "collections_due_date_idx" on "public"."collections" ("due_date");
create index "collections_status_idx" on "public"."collections" ("status");

-- Add RLS policies
alter table "public"."collections" enable row level security;

create policy "Enable read access for authenticated users"
  on "public"."collections"
  for select
  to authenticated
  using (true);

create policy "Enable insert access for authenticated users"
  on "public"."collections"
  for insert
  to authenticated
  with check (true);

create policy "Enable update access for authenticated users"
  on "public"."collections"
  for update
  to authenticated
  using (true);

-- Create function to update status based on due date
create or replace function "public"."update_overdue_collections"()
returns trigger as $$
begin
  update "public"."collections"
  set "status" = 'overdue'
  where "due_date" < now()
  and "status" = 'pending'
  and "payment_date" is null;
  return null;
end;
$$ language plpgsql;

-- Create trigger to automatically update status
create trigger "update_overdue_collections_trigger"
after insert or update on "public"."collections"
for each statement
execute function "public"."update_overdue_collections"();

-- Add comment to table
comment on table "public"."collections" is 'Stores customer payment collection data';