alter table public.stories
  add column genres text[] not null default '{}',
  add column tags text[] not null default '{}';

alter table public.stories
  add constraint stories_genres_valid check (
    cardinality(genres) <= 3
    and genres <@ array['fantasi','romansa','petualangan','drama','misteri','horor','fiksi-ilmiah','slice-of-life','aksi','komedi']::text[]
    and array_position(genres, null) is null
  ),
  add constraint stories_tags_valid check (
    cardinality(tags) <= 12
    and array_position(tags, null) is null
    and length(array_to_string(tags, ',')) <= 395
  );

create index stories_genres_gin_idx on public.stories using gin(genres);
create index stories_tags_gin_idx on public.stories using gin(tags);

update public.stories set genres = array['fantasi','misteri'], tags = array['perjalanan waktu','pilihan bercabang','kota misterius'] where slug = 'arsip-senja';
update public.stories set genres = array['fantasi','petualangan'], tags = array['isekai','dunia lain','pilihan bercabang'] where slug = 'peta-langit-yang-retak';
