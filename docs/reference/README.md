# Branching Comic / Motion Comic starter documents

Files:
- `plan.md`: product scope, architecture, production-agent design, operations and security.
- `schema.sql`: initial Supabase PostgreSQL schema, RLS policies, graph and production-job tables.
- `todo.md`: staged implementation checklist.

Important:
1. Apply `schema.sql` to a development Supabase project first. It is a starting migration, not a substitute for a security review.
2. Test RLS and storage policies as anonymous, reader, editor, and admin accounts before production.
3. Use OpenRouter API billing for unattended agent calls. ChatGPT Plus does not automatically include API credits.
4. Image, voice, music, and video generation may require separate providers and separate charges.
5. Keep human approval gates, budget caps, bounded retries, and a pause switch before running production jobs 24/7.
