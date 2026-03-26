"""
ML Layer — MLFoodRecommender
Trains two scikit-learn models on the 80-food nutrient feature matrix:

  1. StandardScaler  — normalises 16 nutrient + suitability features
  2. NearestNeighbors (cosine, brute) — finds foods closest to an ideal
     nutrient vector derived from the user's risk profile
  3. KMeans (k=5) — clusters foods into health archetypes; used for
     cluster-level explainability

Training happens once on startup (or loads from disk if saved).
FoodRecommender calls get_ml_scores() and blends the result with its
own rule-based composite score.
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity

# ── Paths ─────────────────────────────────────────────────────────────────────
SAVED_DIR  = Path(__file__).parent.parent / "data" / "models"
SCALER_PATH = SAVED_DIR / "scaler.joblib"
KNN_PATH    = SAVED_DIR / "knn_model.joblib"
KMEANS_PATH = SAVED_DIR / "kmeans_model.joblib"

# ── Feature matrix columns (16 features) ─────────────────────────────────────
FEATURE_COLS = [
    "calories_per_100g",
    "protein_g",
    "carbs_g",
    "sugar_g",
    "fiber_g",
    "fat_g",
    "saturated_fat_g",
    "sodium_mg",
    "potassium_mg",
    "magnesium_mg",
    "glycemic_index",
    "omega3_g",
    "diabetes_score",
    "hypertension_score",
    "cvd_score",
    "mental_score",
]

N_CLUSTERS = 5

# Cluster labels derived from centroid analysis (assigned after fit)
_CLUSTER_LABELS: dict[int, str] = {}


def _label_clusters(kmeans: KMeans, scaler: StandardScaler) -> dict[int, str]:
    """
    Derive a human-readable name for each cluster by inspecting
    which nutrient features are most dominant in each centroid.
    """
    idx = {col: i for i, col in enumerate(FEATURE_COLS)}
    # Inverse-transform centroids back to raw feature space
    centroids_raw = scaler.inverse_transform(kmeans.cluster_centers_)

    names = {}
    for c in range(N_CLUSTERS):
        cv = centroids_raw[c]
        # Pick the most descriptive feature of this cluster
        if cv[idx["omega3_g"]] > 2.0 or cv[idx["fat_g"]] > 40:
            names[c] = "Nuts & Seeds (Healthy Fats)"
        elif cv[idx["protein_g"]] > 15:
            names[c] = "High-Protein Foods"
        elif cv[idx["fiber_g"]] > 5 and cv[idx["glycemic_index"]] < 35:
            names[c] = "High-Fiber Low-GI Foods"
        elif cv[idx["magnesium_mg"]] > 80 or cv[idx["potassium_mg"]] > 400:
            names[c] = "Mineral-Rich Vegetables & Greens"
        elif cv[idx["diabetes_score"]] > 0.9 and cv[idx["calories_per_100g"]] < 120:
            names[c] = "Light Whole Grains & Millets"
        else:
            # Fallback: describe by top macro
            if cv[idx["carbs_g"]] > 30:
                names[c] = "Whole Grains & Cereals"
            elif cv[idx["fat_g"]] > 5:
                names[c] = "Dairy & Fats"
            else:
                names[c] = "Balanced Mixed Foods"
    return names


def _build_ideal_vector_raw(risk_scores: dict, df: pd.DataFrame) -> np.ndarray:
    """
    Construct the 'ideal food' nutrient profile (in raw feature space)
    for a given risk score combination.

    Logic: start from population median, then push each nutrient target
    in the direction that is most beneficial for the elevated conditions.
    """
    target = df[FEATURE_COLS].median().values.copy()
    idx = {col: i for i, col in enumerate(FEATURE_COLS)}

    d = risk_scores.get("diabetes",     0) / 100
    h = risk_scores.get("hypertension", 0) / 100
    c = risk_scores.get("cvd",          0) / 100
    m = risk_scores.get("mental",       0) / 100

    # ── Diabetes targets ────────────────────────────────────────────────────
    if d > 0:
        target[idx["glycemic_index"]]  = max(10, target[idx["glycemic_index"]]  - 30 * d)
        target[idx["fiber_g"]]         = min(30, target[idx["fiber_g"]]         + 6  * d)
        target[idx["sugar_g"]]         = max(0,  target[idx["sugar_g"]]         - 3  * d)
        target[idx["diabetes_score"]]  = min(1.0, 0.7 + 0.3 * d)

    # ── Hypertension targets ────────────────────────────────────────────────
    if h > 0:
        target[idx["sodium_mg"]]           = max(5,   target[idx["sodium_mg"]]       - 180 * h)
        target[idx["potassium_mg"]]        = min(900, target[idx["potassium_mg"]]    + 350 * h)
        target[idx["magnesium_mg"]]        = min(400, target[idx["magnesium_mg"]]    + 80  * h)
        target[idx["hypertension_score"]]  = min(1.0, 0.7 + 0.3 * h)

    # ── CVD targets ─────────────────────────────────────────────────────────
    if c > 0:
        target[idx["saturated_fat_g"]]  = max(0, target[idx["saturated_fat_g"]] - 4 * c)
        target[idx["omega3_g"]]         = min(10, target[idx["omega3_g"]]       + 3 * c)
        target[idx["fiber_g"]]          = min(30, target[idx["fiber_g"]]        + 4 * c)
        target[idx["cvd_score"]]        = min(1.0, 0.7 + 0.3 * c)

    # ── Mental health targets ────────────────────────────────────────────────
    if m > 0:
        target[idx["magnesium_mg"]]  = min(400, target[idx["magnesium_mg"]] + 100 * m)
        target[idx["omega3_g"]]      = min(10,  target[idx["omega3_g"]]     + 1.5 * m)
        target[idx["mental_score"]]  = min(1.0, 0.7 + 0.3 * m)

    return target


class MLFoodRecommender:
    """
    Trained scikit-learn recommendation engine.

    Attributes
    ----------
    scaler   : StandardScaler  — fitted on 16-feature nutrient matrix
    knn      : NearestNeighbors — cosine, brute-force, fitted on scaled matrix
    kmeans   : KMeans(k=5)      — cluster assignments for explainability
    """

    def __init__(self):
        self.scaler: StandardScaler        = None
        self.knn:    NearestNeighbors      = None
        self.kmeans: KMeans                = None
        self._df:    pd.DataFrame          = None
        self._X_scaled: np.ndarray         = None
        self._cluster_labels: dict         = {}
        self.is_trained: bool              = False

    # ── Training ─────────────────────────────────────────────────────────────
    def train(self, df: pd.DataFrame) -> "MLFoodRecommender":
        """
        Fit all ML models on the food feature matrix.
        Saves trained artefacts to data/models/ for fast reloads.
        """
        self._df = df.reset_index(drop=True).copy()
        X = self._df[FEATURE_COLS].fillna(0).values  # shape: (80, 16)

        # 1. StandardScaler — zero mean, unit variance
        self.scaler = StandardScaler()
        self._X_scaled = self.scaler.fit_transform(X)   # fit + transform

        # 2. NearestNeighbors — cosine similarity, brute force (80 foods → fast)
        self.knn = NearestNeighbors(
            n_neighbors=min(15, len(df)),
            metric="cosine",
            algorithm="brute",
        )
        self.knn.fit(self._X_scaled)                    # fit

        # 3. KMeans — health archetype clustering
        self.kmeans = KMeans(
            n_clusters=N_CLUSTERS,
            random_state=42,
            n_init=20,
            max_iter=300,
        )
        self.kmeans.fit(self._X_scaled)                 # fit
        self._df["cluster"]      = self.kmeans.labels_
        self._df["cluster_name"] = [
            _label_clusters(self.kmeans, self.scaler)[c]
            for c in self.kmeans.labels_
        ]
        self._cluster_labels = _label_clusters(self.kmeans, self.scaler)

        self.is_trained = True

        # Persist artefacts
        SAVED_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.scaler,  SCALER_PATH)
        joblib.dump(self.knn,     KNN_PATH)
        joblib.dump(self.kmeans,  KMEANS_PATH)

        print(
            f"[MLFoodRecommender] Trained — "
            f"{len(df)} foods | 16 features | "
            f"KNN cosine | KMeans k={N_CLUSTERS}"
        )
        print(f"[MLFoodRecommender] Clusters: {self._cluster_labels}")
        return self

    def load(self, df: pd.DataFrame) -> "MLFoodRecommender":
        """Load pre-trained artefacts from disk (skips re-training)."""
        self._df = df.reset_index(drop=True).copy()
        self.scaler  = joblib.load(SCALER_PATH)
        self.knn     = joblib.load(KNN_PATH)
        self.kmeans  = joblib.load(KMEANS_PATH)

        X = self._df[FEATURE_COLS].fillna(0).values
        self._X_scaled = self.scaler.transform(X)
        self._df["cluster"]      = self.kmeans.labels_
        self._cluster_labels     = _label_clusters(self.kmeans, self.scaler)
        self._df["cluster_name"] = [
            self._cluster_labels[c] for c in self.kmeans.labels_
        ]
        self.is_trained = True
        print("[MLFoodRecommender] Models loaded from disk.")
        return self

    def load_or_train(self, df: pd.DataFrame) -> "MLFoodRecommender":
        """Load saved models if available, otherwise train fresh."""
        if SCALER_PATH.exists() and KNN_PATH.exists() and KMEANS_PATH.exists():
            try:
                return self.load(df)
            except Exception as e:
                print(f"[MLFoodRecommender] Load failed ({e}), retraining...")
        return self.train(df)

    # ── Scoring ───────────────────────────────────────────────────────────────
    def get_ml_scores(
        self,
        risk_scores: dict,
        candidate_food_ids: list,
    ) -> dict[str, float]:
        """
        Return a dict of {food_id: ml_score (0-1)} for the candidate foods.
        Scores are cosine similarities between each food and the ideal vector.
        """
        if not self.is_trained:
            return {fid: 0.5 for fid in candidate_food_ids}

        # Build ideal vector in raw space → scale
        ideal_raw = _build_ideal_vector_raw(risk_scores, self._df)
        ideal_scaled = self.scaler.transform(ideal_raw.reshape(1, -1))  # (1, 16)

        # Get scaled vectors for candidates
        mask = self._df["food_id"].isin(candidate_food_ids)
        cand_df = self._df[mask]
        if cand_df.empty:
            return {}

        cand_scaled = self._X_scaled[cand_df.index]         # (n_candidates, 16)
        sims = cosine_similarity(ideal_scaled, cand_scaled)[0]  # (n_candidates,)

        # Normalise to [0, 1]
        sim_min, sim_max = sims.min(), sims.max()
        if sim_max > sim_min:
            sims_norm = (sims - sim_min) / (sim_max - sim_min)
        else:
            sims_norm = np.ones_like(sims) * 0.5

        return dict(zip(cand_df["food_id"].tolist(), sims_norm.tolist()))

    # ── Explainability ────────────────────────────────────────────────────────
    def explain_food(self, food_id: str) -> dict:
        """
        Return cluster assignment + nearest-neighbor foods for a given food.
        Used by the /api/food-explain endpoint.
        """
        if not self.is_trained:
            return {"error": "Model not trained"}

        row_mask = self._df["food_id"] == food_id
        if not row_mask.any():
            return {"error": f"Food {food_id} not found"}

        row_idx  = self._df[row_mask].index[0]
        row      = self._df.loc[row_idx]
        food_vec = self._X_scaled[row_idx].reshape(1, -1)

        # KNN neighbours
        distances, indices = self.knn.kneighbors(food_vec, n_neighbors=6)
        neighbor_names = self._df.iloc[indices[0][1:]]["food_name"].tolist()

        # Top contributing features (absolute scaled deviation from mean)
        feature_vals_raw = dict(zip(
            FEATURE_COLS,
            self._df.loc[row_idx, FEATURE_COLS].values
        ))
        mean_vals = dict(zip(FEATURE_COLS, self.scaler.mean_))
        contributions = {
            col: round(float(feature_vals_raw[col]), 2)
            for col in ["fiber_g", "glycemic_index", "omega3_g",
                        "sodium_mg", "potassium_mg", "magnesium_mg",
                        "saturated_fat_g", "protein_g"]
        }

        cluster_id = int(row.get("cluster", -1))
        return {
            "food":           row["food_name"],
            "food_id":        food_id,
            "cluster_id":     cluster_id,
            "cluster_name":   self._cluster_labels.get(cluster_id, "Unknown"),
            "nearest_foods":  neighbor_names,
            "cosine_distance_to_nearest": round(float(distances[0][1]), 4),
            "key_nutrients":  contributions,
            "suitability_scores": {
                "diabetes":     round(float(row["diabetes_score"]),     3),
                "hypertension": round(float(row["hypertension_score"]), 3),
                "cvd":          round(float(row["cvd_score"]),          3),
                "mental":       round(float(row["mental_score"]),       3),
            },
        }

    def get_cluster_summary(self) -> list:
        """Return all 5 cluster summaries with representative foods."""
        if not self.is_trained:
            return []
        summary = []
        for cid, cname in self._cluster_labels.items():
            foods_in_cluster = self._df[self._df["cluster"] == cid]["food_name"].tolist()
            summary.append({
                "cluster_id":   cid,
                "cluster_name": cname,
                "food_count":   len(foods_in_cluster),
                "example_foods": foods_in_cluster[:5],
            })
        return summary

    def get_df_with_clusters(self) -> pd.DataFrame:
        """Return the food DataFrame with cluster columns attached."""
        return self._df.copy()
