# Theme list: building more themes (interactive)

Run this **with Edward**, in his own `when` checkout or a fresh worktree, not in the factory
clone and not from a scheduled task. It skips the factory preamble. It's due when list health
reports fewer than 30 queued themes, about a month before the factory runs dry.

The whole method is section 3 of `docs/curated-themes/factory.md`, and the rules are its
**rubric, version 2**. Read both first. In short:

1. **Seed with what exists.** Every theme in `docs/curated-themes/backlog.json`, done or
   queued, is the boundary new ones are drawn around. Pass names and scope rules only, never
   events or catalogue counts.
2. **Generate against the coverage grid**, 21 categories × 8 eras × the macro-regions in
   `src/data/regions.json`, filling the thin cells. Several parallel Sonnet agents each take a
   slice and propose 40-60 themes.
3. **Overlap pass.** One fresh agent clusters all candidates, checks each cluster pair by pair,
   and writes every survivor a `boundary` line naming its neighbours and what belongs to them.
   Near-duplicates are merged or cut, too-broad themes split.
4. **Gate each survivor** against the rubric:
   - one plain idea, written "Yes if …";
   - easy to fill: 60+ famous candidates;
   - not a seeded day;
   - exactly 30 cards in different years;
   - chosen blind;
   - at most about 4 famous events shared with any other theme;
   - a name of 20 characters or fewer;
   - honest appeal;
   - tasteful;
   - no individuals;
   - no sports.

   Sketch 10 example beats each.

5. **Order the new block** after the existing queue. No two neighbours share a category, lead
   era or lead region, and the appeal-3 themes are spread out.
6. **Edward reviews** the additions as a PR to `backlog.json`: `docs(themes): add <n> themes to
the backlog`. `CI=true npm test -- --watchAll=false backlogSchema` must pass.

Record the session in factory.md's "How the list was built" and in `backlog-clusters.md`.
