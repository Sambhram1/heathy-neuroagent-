from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import os
import tempfile

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor

def _resolve_model_path() -> Path:
    # Vercel serverless runtime is read-only except temporary directory.
    if os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV"):
        return Path(tempfile.gettempdir()) / "lifeguard_ai" / "planner_switch_model.joblib"
    return Path(__file__).parent / "data" / "models" / "planner_switch_model.joblib"


MODEL_PATH = _resolve_model_path()
MODEL_DIR = MODEL_PATH.parent


@dataclass
class Slot:
    start: datetime
    end: datetime
    energy: float


class ProductivityPlannerEngine:
    """
    Energy-aware planner with an ML scorer that prefers low context-switching schedules.

    The model is trained on synthetic supervision that rewards:
    - matching deep work to high-energy slots
    - grouping same-intensity tasks together
    - avoiding overloading any single day
    """

    def __init__(self) -> None:
        self.model: Optional[RandomForestRegressor] = None

    def load_or_train(self) -> "ProductivityPlannerEngine":
        try:
            MODEL_DIR.mkdir(parents=True, exist_ok=True)
        except Exception:
            # If directory creation fails, training can still proceed in-memory.
            pass
        if MODEL_PATH.exists():
            try:
                self.model = joblib.load(MODEL_PATH)
                return self
            except Exception:
                pass
        self.train_model()
        return self

    def train_model(self, n_samples: int = 5000) -> Dict[str, Any]:
        rng = np.random.default_rng(42)
        # Features: task_intensity, slot_energy, duration_norm, prev_same_intensity, day_load_norm
        X = np.zeros((n_samples, 5), dtype=float)
        y = np.zeros(n_samples, dtype=float)

        for i in range(n_samples):
            task_intensity = rng.integers(0, 2)  # 0 light, 1 deep
            slot_energy = rng.uniform(0, 1)
            duration_norm = rng.uniform(0.2, 1.0)
            prev_same = rng.integers(0, 2)
            day_load = rng.uniform(0, 1)

            # Lower score is better (less switching + better energy fit)
            mismatch = abs(task_intensity - (1 if slot_energy >= 0.6 else 0))
            switch_penalty = 0.0 if prev_same else 0.45
            overload_penalty = 0.3 * day_load
            duration_penalty = 0.15 * duration_norm * (1.0 if task_intensity == 1 and slot_energy < 0.6 else 0.5)

            score = mismatch + switch_penalty + overload_penalty + duration_penalty

            X[i] = [task_intensity, slot_energy, duration_norm, prev_same, day_load]
            y[i] = score

        self.model = RandomForestRegressor(
            n_estimators=180,
            max_depth=10,
            random_state=42,
            n_jobs=-1,
        )
        self.model.fit(X, y)
        try:
            MODEL_DIR.mkdir(parents=True, exist_ok=True)
            joblib.dump(self.model, MODEL_PATH)
            model_path = str(MODEL_PATH)
        except Exception:
            model_path = "in-memory"

        return {
            "status": "trained",
            "samples": int(n_samples),
            "model": "RandomForestRegressor",
            "objective": "minimize_context_switching",
            "path": model_path,
        }

    @staticmethod
    def _parse_time(ts: str) -> datetime:
        return datetime.fromisoformat(ts.replace("Z", "+00:00")) if "T" in ts else datetime.fromisoformat(ts)

    @staticmethod
    def _normalize_energy(raw: Any) -> float:
        if isinstance(raw, (int, float)):
            val = float(raw)
            if val > 1.0:
                return max(0.0, min(1.0, val / 100.0))
            return max(0.0, min(1.0, val))
        if isinstance(raw, str):
            key = raw.strip().lower()
            if key in ("low", "l"):
                return 0.25
            if key in ("medium", "med", "m"):
                return 0.55
            if key in ("high", "h"):
                return 0.85
        return 0.5

    def _build_slots(self, energy_levels: List[Dict[str, Any]], availability: List[Dict[str, Any]]) -> List[Slot]:
        slots: List[Slot] = []
        for block in availability:
            start = self._parse_time(block["start_time"])
            end = self._parse_time(block["end_time"])
            if end <= start:
                continue
            cursor = start
            while cursor < end:
                nxt = min(cursor + timedelta(minutes=30), end)
                # pick matching energy entry if overlaps
                e = 0.5
                for ev in energy_levels:
                    ev_start = self._parse_time(ev["start_time"])
                    ev_end = self._parse_time(ev["end_time"])
                    if cursor < ev_end and nxt > ev_start:
                        e = self._normalize_energy(ev.get("level", ev.get("energy", 0.5)))
                        break
                slots.append(Slot(start=cursor, end=nxt, energy=e))
                cursor = nxt
        slots.sort(key=lambda s: s.start)
        return slots

    @staticmethod
    def _task_intensity(task: Dict[str, Any]) -> int:
        manual = (task.get("intensity") or task.get("manual_intensity") or "").strip().lower()
        if manual in ("deep", "light"):
            return 1 if manual == "deep" else 0

        text = (task.get("task") or task.get("title") or "").lower()
        deep_keywords = [
            "design", "architecture", "research", "coding", "build", "model", "analysis",
            "write", "strategy", "debug", "plan", "implement",
        ]
        light_keywords = [
            "email", "meeting", "call", "review", "admin", "organize", "cleanup", "update",
            "follow up", "documentation",
        ]
        deep_score = sum(1 for k in deep_keywords if k in text)
        light_score = sum(1 for k in light_keywords if k in text)
        return 1 if deep_score >= light_score else 0

    @staticmethod
    def _duration_minutes(task: Dict[str, Any]) -> int:
        val = task.get("duration_minutes")
        if isinstance(val, (int, float)) and val > 0:
            return int(val)
        return 90 if ProductivityPlannerEngine._task_intensity(task) == 1 else 45

    @staticmethod
    def _safe_priority(task: Dict[str, Any]) -> float:
        raw = task.get("priority", 0.5)
        try:
            val = float(raw)
        except (TypeError, ValueError):
            return 0.5
        if np.isnan(val):
            return 0.5
        return max(0.0, min(1.0, val))

    def generate_schedule(
        self,
        tasks: List[Dict[str, Any]],
        energy_levels: List[Dict[str, Any]],
        availability: List[Dict[str, Any]],
        horizon: str = "day",
    ) -> Dict[str, Any]:
        if not self.model:
            self.load_or_train()

        slots = self._build_slots(energy_levels, availability)
        if not slots:
            return {
                "schedule": [],
                "meta": {
                    "horizon": horizon,
                    "ui_mode": "balanced",
                    "reason": "No available slots",
                },
            }

        task_queue = []
        for idx, t in enumerate(tasks):
            intensity = self._task_intensity(t)
            task_queue.append({
                "id": idx,
                "task": t.get("task") or t.get("title") or f"Task {idx + 1}",
                "intensity": intensity,
                "duration": self._duration_minutes(t),
                "remaining": self._duration_minutes(t),
                "priority": self._safe_priority(t),
            })

        day_load: Dict[str, int] = {}
        planned: List[Dict[str, Any]] = []
        prev_intensity: Optional[int] = None
        continuous_minutes = 0

        for slot in slots:
            if not task_queue:
                break

            # Intelligent breaks after prolonged continuous work.
            if continuous_minutes >= 120:
                planned.append({
                    "task": "Break",
                    "start_time": slot.start.isoformat(),
                    "end_time": slot.end.isoformat(),
                    "energy_level_used": "recovery",
                })
                continuous_minutes = 0
                prev_intensity = None
                continue

            slot_minutes = int((slot.end - slot.start).total_seconds() // 60)
            date_key = slot.start.date().isoformat()
            load_norm = min(1.0, day_load.get(date_key, 0) / 480.0)

            best_idx = None
            best_score = float("inf")
            for i, t in enumerate(task_queue):
                feat = np.array([[
                    t["intensity"],
                    slot.energy,
                    min(1.0, t["duration"] / 180.0),
                    1 if (prev_intensity is not None and prev_intensity == t["intensity"]) else 0,
                    load_norm,
                ]])
                pred = float(self.model.predict(feat)[0])
                # tiny priority bump for higher-priority tasks
                pred -= 0.08 * t["priority"]
                if pred < best_score:
                    best_score = pred
                    best_idx = i

            if best_idx is None:
                continue

            task = task_queue[best_idx]
            used = min(task["remaining"], slot_minutes)
            block_end = slot.start + timedelta(minutes=used)

            energy_label = "high" if slot.energy >= 0.67 else ("medium" if slot.energy >= 0.4 else "low")
            planned.append({
                "task": task["task"],
                "start_time": slot.start.isoformat(),
                "end_time": block_end.isoformat(),
                "energy_level_used": energy_label,
            })

            task["remaining"] -= used
            continuous_minutes += used
            prev_intensity = task["intensity"]
            day_load[date_key] = day_load.get(date_key, 0) + used

            if task["remaining"] <= 0:
                task_queue.pop(best_idx)

            # If slot had leftover time, use a micro-break block.
            if used < slot_minutes:
                planned.append({
                    "task": "Micro Break",
                    "start_time": block_end.isoformat(),
                    "end_time": slot.end.isoformat(),
                    "energy_level_used": "recovery",
                })
                continuous_minutes = 0
                prev_intensity = None

        avg_energy = float(np.mean([s.energy for s in slots])) if slots else 0.5
        load_ratio = min(1.0, sum(day_load.values()) / max(1, len({s.start.date() for s in slots}) * 480))
        stress_score = (1 - avg_energy) * 0.6 + load_ratio * 0.4
        if stress_score >= 0.67:
            ui_mode = "calm"
        elif stress_score <= 0.38:
            ui_mode = "focus"
        else:
            ui_mode = "balanced"

        return {
            "schedule": planned,
            "meta": {
                "horizon": horizon,
                "unplanned_tasks": [t["task"] for t in task_queue],
                "objective": "minimize_context_switching",
                "ui_mode": ui_mode,
                "stress_score": round(stress_score * 100, 1),
            },
        }
