"""Multi-k clustering sweep over ALL events (except deprecated), with year-masking.

Reuses the notebook's logic (all-mpnet-base-v2, text="both", c-TF-IDF terms,
cosine dist-to-centroid) but:
  - loads every public/events/*.json except manifest.json + deprecated.json
  - masks years / era-words before embedding so clusters are thematic, not periods
  - sweeps k in {10, 12, 14, 16} and reports per-cluster year-spread

Run:  .venv/bin/python cluster_sweep.py
"""

import glob
import hashlib
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd

MODEL_NAME = "all-mpnet-base-v2"
K_VALUES = [10, 12, 14, 16, 18, 20, 24, 28, 32]
RANDOM_STATE = 42

EVENTS_DIR = Path("../../public/events").resolve()
OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

SKIP_FILES = {"manifest.json", "deprecated.json"}

# ---------------------------------------------------------------- 1. load events
rows = []
source_files = []
for path in sorted(glob.glob(str(EVENTS_DIR / "*.json"))):
    fname = Path(path).name
    if fname in SKIP_FILES:
        continue
    data = json.loads(Path(path).read_text())
    if not isinstance(data, list):
        continue
    source_files.append(fname)
    cat = Path(path).stem
    for ev in data:
        rows.append(
            {
                "name": ev["name"],
                "friendly_name": ev["friendly_name"],
                "description": ev["description"],
                "current_category": cat,
                "year": ev["year"],
            }
        )

df = pd.DataFrame(rows)
# de-dupe by event name (a few events appear in more than one file); keep first
before = len(df)
df = df.drop_duplicates(subset="name").reset_index(drop=True)
print(f"{len(df)} events across {len(source_files)} source files "
      f"({before - len(df)} duplicate names dropped)")
print("Source files:", ", ".join(source_files))

# ----------------------------------------------------------- 2. build + mask text
ERA_WORD_RE = re.compile(
    r"\b(?:BCE|BC|CE|AD|century|centuries|millennium|millennia|decade|decades)\b",
    re.IGNORECASE,
)
# 4-digit years, comma-grouped numbers, "1920s", ordinals like "19th"
NUM_RE = re.compile(r"\b\d{1,3}(?:,\d{3})+\b|\b\d{4}s?\b|\b\d{1,2}(?:st|nd|rd|th)\b")


def mask_years(text: str) -> str:
    text = ERA_WORD_RE.sub(" ", text)
    text = NUM_RE.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


df["display_text"] = df["friendly_name"] + ". " + df["description"]
df["text"] = df["display_text"].apply(mask_years)
print("\nMasking example:")
print("  before:", df["display_text"].iloc[0])
print("  after :", df["text"].iloc[0])

# ------------------------------------------------------------------- 3. embed
cache_key = hashlib.md5((MODEL_NAME + "masked\n" + "\n".join(df["text"])).encode()).hexdigest()[:12]
cache_file = OUTPUT_DIR / f"embeddings_{MODEL_NAME}_masked_{cache_key}.npy"

if cache_file.exists():
    embeddings = np.load(cache_file)
    print(f"\nLoaded cached embeddings from {cache_file}  shape={embeddings.shape}")
else:
    from sentence_transformers import SentenceTransformer

    print("\nEmbedding (first run downloads/loads model)...")
    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode(
        df["text"].tolist(), show_progress_bar=True, normalize_embeddings=True
    )
    np.save(cache_file, embeddings)
    print(f"Embedded and cached to {cache_file}  shape={embeddings.shape}")

# ------------------------------------------------------ c-TF-IDF term extraction
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer
from sklearn.metrics import silhouette_score

EXTRA_STOPWORDS = {
    "first", "world", "century", "began", "begins", "begun", "new", "known",
    "early", "later", "year", "years", "marking", "became", "history", "historic",
    # masked-out era words, kept out of terms too
    "bce", "bc", "ce", "ad", "centuries", "millennium", "decade", "decades",
}
STOP_WORDS = list(ENGLISH_STOP_WORDS | EXTRA_STOPWORDS)


def fmt_year(y: int) -> str:
    return f"{-y:,} BCE" if y < 0 else str(y)


def top_terms(ctfidf, vocab, c, n=14):
    weights = ctfidf[c].toarray().ravel()
    return vocab[weights.argsort()[::-1][:n]].tolist()


def year_spread(sub):
    q = sub["year"].quantile([0.0, 0.25, 0.5, 0.75, 1.0])
    iqr = q[0.75] - q[0.25]
    span = q[1.0] - q[0.0]
    # heuristic flag: IQR under ~150 yrs AND span under ~600 yrs => era-bound
    era_bound = (iqr < 150) and (span < 600)
    return q, iqr, span, era_bound


sweep_scores = []

for K in K_VALUES:
    print(f"\n=== k={K} ===")
    kmeans = KMeans(n_clusters=K, n_init=10, random_state=RANDOM_STATE).fit(embeddings)
    labels = kmeans.labels_
    df["cluster"] = labels

    centroids = kmeans.cluster_centers_ / np.linalg.norm(
        kmeans.cluster_centers_, axis=1, keepdims=True
    )
    df["dist_to_centroid"] = 1 - np.einsum("ij,ij->i", embeddings, centroids[labels])

    sil = silhouette_score(embeddings, labels, metric="cosine")
    sweep_scores.append({"k": K, "silhouette": round(float(sil), 4)})
    print(f"silhouette={sil:.4f}")

    # c-TF-IDF
    cluster_docs = [" ".join(df.loc[df["cluster"] == c, "text"]) for c in range(K)]
    vectorizer = TfidfVectorizer(stop_words=STOP_WORDS, ngram_range=(1, 2), sublinear_tf=True)
    ctfidf = vectorizer.fit_transform(cluster_docs)
    vocab = np.array(vectorizer.get_feature_names_out())

    contingency = pd.crosstab(df["cluster"], df["current_category"])

    lines = [
        f"# Cluster summary — k={K}",
        f"Model: {MODEL_NAME} · text: masked(name+description) · {len(df)} events",
        f"Silhouette (cosine): {sil:.4f}",
        "",
        "## Contingency (cluster × source file/category)",
        contingency.to_markdown(),
    ]

    for c in range(K):
        sub = df[df["cluster"] == c]
        q, iqr, span, era_bound = year_spread(sub)
        flag = "  ⚠ ERA-BOUND" if era_bound else ""
        lines.append(f"\n## Cluster {c} — {len(sub)} events{flag}")
        lines.append(f"**Top terms:** {', '.join(top_terms(ctfidf, vocab, c))}")
        breakdown = sub["current_category"].value_counts()
        lines.append(
            "**Came from:** " + ", ".join(f"{cat} ({n})" for cat, n in breakdown.items())
        )
        lines.append(
            "**Year spread:** "
            f"min {fmt_year(int(q[0.0]))} · 25% {fmt_year(int(q[0.25]))} · "
            f"median {fmt_year(int(q[0.5]))} · 75% {fmt_year(int(q[0.75]))} · "
            f"max {fmt_year(int(q[1.0]))}  (IQR {int(iqr)} yrs, span {int(span)} yrs)"
        )
        lines.append("**Most central events:**")
        for ev in sub.nsmallest(15, "dist_to_centroid").itertuples():
            lines.append(f"- {ev.friendly_name} ({fmt_year(ev.year)}) — {ev.description}")

    (OUTPUT_DIR / f"cluster_summary_k{K}.md").write_text("\n".join(lines))
    df[["name", "friendly_name", "year", "current_category", "cluster", "dist_to_centroid"]].to_csv(
        OUTPUT_DIR / f"assignments_k{K}.csv", index=False
    )
    print(f"wrote output/cluster_summary_k{K}.md  +  output/assignments_k{K}.csv")

# --------------------------------------------------------------- sweep index
idx = ["# Sweep index", f"{len(df)} events · masked text · model {MODEL_NAME}", ""]
idx.append("| k | silhouette |")
idx.append("|---|-----------|")
for s in sweep_scores:
    idx.append(f"| {s['k']} | {s['silhouette']} |")
(OUTPUT_DIR / "sweep_index.md").write_text("\n".join(idx))
print("\nwrote output/sweep_index.md")
print("DONE")
