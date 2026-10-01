import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { novel } from "../content/web-novel/peta-langit-yang-retak.mjs";
import { validateSeed } from "./validate-web-novel-seed.mjs";

validateSeed(novel);
const payload = JSON.stringify(novel);
if (payload.includes("$novel_data$") || payload.includes("$novel_seed$")) throw new Error("SQL delimiter appears in content");

const sql = `-- Generated from content/web-novel/peta-langit-yang-retak.mjs. Run node scripts/build-web-novel-seed.mjs to regenerate.
-- Idempotent: an existing slug is left untouched, including reader progress and editorial changes.
do $novel_seed$
declare
  v_data jsonb := $novel_data$${payload}$novel_data$::jsonb;
  v_story uuid;
  v_graph jsonb;
  v_episodes jsonb;
  v_nodes jsonb;
  v_choices jsonb;
  v_ep1 uuid := gen_random_uuid();
  v_ep2 uuid := gen_random_uuid();
  v_ep3 uuid := gen_random_uuid();
  v_ep4 uuid := gen_random_uuid();
  v_ep5 uuid := gen_random_uuid();
begin
  if exists(select 1 from public.stories where slug=v_data->>'slug') then
    raise notice 'Web Novel seed already exists; left unchanged';
    return;
  end if;
  insert into public.stories(slug,title,tagline,description,default_format,status,visibility,published_at,genres,tags)
  values(v_data->>'slug',v_data->>'title',v_data->>'tagline',v_data->>'description','web_novel','published','public',now(),
    array['fantasi','petualangan'],array['isekai','dunia lain','pilihan bercabang'])
  returning id into v_story;

  insert into public.story_nodes(story_id,node_key,title,synopsis,node_type,is_start,status,sequence_hint,unlock_cost)
  select v_story,c->>'key',c->>'title',c->>'synopsis',
    case when jsonb_array_length(c->'choices')=0 then 'ending' else 'episode' end,
    (c->>'number')::integer=1,'published',(c->>'number')::integer,
    case when (c->>'number')::integer=1 then 0 else 5 end
  from jsonb_array_elements(v_data->'chapters') c order by (c->>'number')::integer;

  insert into public.story_node_prose_drafts(node_id,body)
  select n.id,c->>'body' from jsonb_array_elements(v_data->'chapters') c
  join public.story_nodes n on n.story_id=v_story and n.node_key=c->>'key';
  insert into public.story_node_prose_publications(node_id,body)
  select n.id,c->>'body' from jsonb_array_elements(v_data->'chapters') c
  join public.story_nodes n on n.story_id=v_story and n.node_key=c->>'key';

  insert into public.story_choices(story_id,node_id,next_node_id,label,sort_order)
  select v_story,source.id,target.id,choice.value->>1,choice.position::integer
  from jsonb_array_elements(v_data->'chapters') chapter
  join public.story_nodes source on source.story_id=v_story and source.node_key=chapter->>'key'
  cross join lateral jsonb_array_elements(chapter->'choices') with ordinality as choice(value,position)
  join public.story_nodes target on target.story_id=v_story and target.node_key=choice.value->>0;

  v_episodes := jsonb_build_array(
    jsonb_build_object('id',v_ep1,'title',v_data->'episodes'->>0,'sortOrder',1),
    jsonb_build_object('id',v_ep2,'title',v_data->'episodes'->>1,'sortOrder',2),
    jsonb_build_object('id',v_ep3,'title',v_data->'episodes'->>2,'sortOrder',3),
    jsonb_build_object('id',v_ep4,'title',v_data->'episodes'->>3,'sortOrder',4),
    jsonb_build_object('id',v_ep5,'title',v_data->'episodes'->>4,'sortOrder',5));
  select jsonb_agg(jsonb_build_object('id',n.id,'key',n.node_key,'title',n.title,
    'synopsis',coalesce(n.synopsis,''),'type',n.node_type,'start',n.is_start,
    'episodeId',case when n.sequence_hint<=6 then v_ep1 when n.sequence_hint<=12 then v_ep2
      when n.sequence_hint<=18 then v_ep3 when n.sequence_hint<=25 then v_ep4 else v_ep5 end,
    'x',null,'y',null,'tags','[]'::jsonb,'notes','') order by n.sequence_hint)
  into v_nodes from public.story_nodes n where n.story_id=v_story;
  select jsonb_agg(jsonb_build_object('id',c.id,'source',c.node_id,'target',c.next_node_id,
    'label',c.label,'description','','sortOrder',c.sort_order,'color','blue',
    'condition','{}'::jsonb) order by n.sequence_hint,c.sort_order)
  into v_choices from public.story_choices c join public.story_nodes n on n.id=c.node_id
  where c.story_id=v_story;
  v_graph := jsonb_build_object('episodes',v_episodes,'nodes',v_nodes,'choices',v_choices);
  insert into public.studio_graph_drafts(story_id,version,publication_version,graph)
  values(v_story,1,0,v_graph);
  update public.studio_graph_drafts set publication_version=1 where story_id=v_story;
  insert into public.studio_graph_publications(story_id,version,graph)
  values(v_story,1,v_graph);
end $novel_seed$;
`;

const output = fileURLToPath(new URL("../supabase/seeds/peta-langit-yang-retak.sql", import.meta.url));
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, sql, "utf8");
process.stdout.write(`Generated ${output}: ${novel.chapters.length} chapters, ${novel.chapters.reduce((sum, chapter) => sum + chapter.choices.length, 0)} choices.\n`);
