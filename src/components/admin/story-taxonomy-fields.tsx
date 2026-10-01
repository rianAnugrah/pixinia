import { STORY_GENRES } from "@/lib/story-taxonomy";

export default function StoryTaxonomyFields({ genres = [], tags = [] }: { genres?: string[]; tags?: string[] }) {
  return <>
    <fieldset className="story-taxonomy-fieldset"><legend>Genre <small>pilih hingga 3</small></legend><div className="story-taxonomy-options">{STORY_GENRES.map(genre => <label key={genre.slug}><input type="checkbox" name="genres" value={genre.slug} defaultChecked={genres.includes(genre.slug)} /> {genre.label}</label>)}</div></fieldset>
    <label className="field"><span>Tag <small>pisahkan dengan koma, hingga 12</small></span><input name="tags" defaultValue={tags.join(", ")} maxLength={395} placeholder="isekai, dunia lain, pilihan bercabang" /></label>
  </>;
}
