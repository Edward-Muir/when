# Category Clustering Experiment

Can we find better event category names by letting the data speak? This notebook
embeds every event's text (`friendly_name` + `description`) with a sentence-embedding
model, clusters the embeddings with K-means, and shows what the natural groupings
look like — compared against the current hand-made categories.

## Setup

```bash
cd experiments/category-clustering
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Run

```bash
.venv/bin/jupyter lab category_clustering.ipynb
```

(or open the notebook in VS Code and pick `.venv/bin/python` as the kernel)

The first run downloads the embedding model (~420 MB) and embeds all events
(about a minute). Embeddings are cached in `output/`, so later runs are fast.

Tweakables at the top of the notebook: `TEXT_SOURCE` (`both` / `name` /
`description`), `MODEL_NAME`, `K`.

## Outputs (in `output/`, gitignored)

- `cluster_summary.md` — per-cluster top terms, most-central example events, and
  the contingency table vs. current categories. **Share this file with Claude to
  get proposed names for each cluster.**
- `assignments.csv` — every event with its cluster and distance to centroid;
  sort by distance to find events that don't fit anywhere.
- `cluster_map.html` — interactive UMAP map of all events; dropdown toggles
  coloring by new cluster vs. current category.

## How to read the results

- The **silhouette sweep** chart shows whether the data prefers more or fewer
  than 6 groups.
- In `cluster_summary.md`, the **top terms** and **central events** of each
  cluster are the raw material for naming it.
- The **contingency table** shows which current categories survive intact and
  which get split or merged.
