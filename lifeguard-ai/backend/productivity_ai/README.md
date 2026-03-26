# Productivity Planner ML

This module trains a RandomForest model that scores task-slot assignment quality.
Lower score means better match for context-switch minimization.

Saved model path:
- backend/productivity_ai/data/models/planner_switch_model.joblib

Training is automatic on first request, or manually via `/api/productivity-train`.
