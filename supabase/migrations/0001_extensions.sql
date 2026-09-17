-- PrepSprint · 0001 · extensions
--
-- Apply the files in this folder in numeric order, either through the Supabase
-- SQL editor or `supabase db push`.

create extension if not exists "pgcrypto";
create extension if not exists "vector";
