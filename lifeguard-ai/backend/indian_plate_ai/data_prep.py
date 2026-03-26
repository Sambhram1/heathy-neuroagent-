"""
data_prep.py — IndianPlate AI seed dataset builder
Generates data/processed/indian_foods_master.csv with 80 Indian foods
and pre-computed suitability scores (diabetes, hypertension, cvd, mental).
"""

import os
import pandas as pd
import numpy as np
from pathlib import Path

# ── Output path ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
MASTER_CSV = PROCESSED_DIR / "indian_foods_master.csv"

# ── Seed dataset — 80 common Indian foods ────────────────────────────────────
# Columns: food_id, food_name, region, is_vegetarian, meal_type, food_group,
#   calories_per_100g, protein_g, carbs_g, sugar_g, fiber_g, fat_g,
#   saturated_fat_g, sodium_mg, potassium_mg, magnesium_mg,
#   glycemic_index, omega3_g, is_millet, is_fried, is_probiotic, tryptophan_rich

SEED_FOODS = [
    # ── Millets & Whole Grains ─────────────────────────────────────────────
    {
        "food_id": "F001", "food_name": "Ragi Dosa",
        "region": "south", "is_vegetarian": True,
        "meal_type": "breakfast", "food_group": "cereals",
        "calories_per_100g": 120, "protein_g": 3.5, "carbs_g": 22.0, "sugar_g": 0.5,
        "fiber_g": 2.7, "fat_g": 2.5, "saturated_fat_g": 0.5,
        "sodium_mg": 100, "potassium_mg": 150, "magnesium_mg": 137,
        "glycemic_index": 68, "omega3_g": 0.1,
        "is_millet": True, "is_fried": False, "is_probiotic": True, "tryptophan_rich": False,
    },
    {
        "food_id": "F002", "food_name": "Bajra Roti",
        "region": "north", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "cereals",
        "calories_per_100g": 210, "protein_g": 6.0, "carbs_g": 40.0, "sugar_g": 0.3,
        "fiber_g": 1.3, "fat_g": 5.0, "saturated_fat_g": 1.0,
        "sodium_mg": 2, "potassium_mg": 195, "magnesium_mg": 110,
        "glycemic_index": 54, "omega3_g": 0.3,
        "is_millet": True, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F003", "food_name": "Jowar Roti",
        "region": "west", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "cereals",
        "calories_per_100g": 195, "protein_g": 6.5, "carbs_g": 39.0, "sugar_g": 0.5,
        "fiber_g": 2.7, "fat_g": 2.0, "saturated_fat_g": 0.5,
        "sodium_mg": 2, "potassium_mg": 270, "magnesium_mg": 75,
        "glycemic_index": 62, "omega3_g": 0.1,
        "is_millet": True, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F004", "food_name": "Brown Rice (Cooked)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "cereals",
        "calories_per_100g": 216, "protein_g": 4.5, "carbs_g": 45.0, "sugar_g": 0.1,
        "fiber_g": 1.8, "fat_g": 2.0, "saturated_fat_g": 0.4,
        "sodium_mg": 2, "potassium_mg": 223, "magnesium_mg": 43,
        "glycemic_index": 55, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F005", "food_name": "White Rice (Cooked)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "cereals",
        "calories_per_100g": 204, "protein_g": 4.3, "carbs_g": 45.0, "sugar_g": 0.1,
        "fiber_g": 0.4, "fat_g": 0.5, "saturated_fat_g": 0.1,
        "sodium_mg": 1, "potassium_mg": 55, "magnesium_mg": 12,
        "glycemic_index": 72, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F006", "food_name": "Poha",
        "region": "west", "is_vegetarian": True,
        "meal_type": "breakfast", "food_group": "cereals",
        "calories_per_100g": 180, "protein_g": 3.5, "carbs_g": 35.0, "sugar_g": 1.0,
        "fiber_g": 1.5, "fat_g": 3.0, "saturated_fat_g": 0.5,
        "sodium_mg": 150, "potassium_mg": 120, "magnesium_mg": 20,
        "glycemic_index": 68, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F007", "food_name": "Upma",
        "region": "south", "is_vegetarian": True,
        "meal_type": "breakfast", "food_group": "cereals",
        "calories_per_100g": 170, "protein_g": 5.0, "carbs_g": 30.0, "sugar_g": 1.5,
        "fiber_g": 1.0, "fat_g": 5.0, "saturated_fat_g": 1.0,
        "sodium_mg": 200, "potassium_mg": 130, "magnesium_mg": 25,
        "glycemic_index": 60, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F008", "food_name": "Idli",
        "region": "south", "is_vegetarian": True,
        "meal_type": "breakfast", "food_group": "cereals",
        "calories_per_100g": 58, "protein_g": 2.0, "carbs_g": 12.0, "sugar_g": 0.3,
        "fiber_g": 0.5, "fat_g": 0.4, "saturated_fat_g": 0.1,
        "sodium_mg": 140, "potassium_mg": 80, "magnesium_mg": 10,
        "glycemic_index": 69, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": True, "tryptophan_rich": False,
    },
    {
        "food_id": "F009", "food_name": "Dosa (Plain)",
        "region": "south", "is_vegetarian": True,
        "meal_type": "breakfast", "food_group": "cereals",
        "calories_per_100g": 168, "protein_g": 4.0, "carbs_g": 27.0, "sugar_g": 0.5,
        "fiber_g": 1.0, "fat_g": 5.0, "saturated_fat_g": 1.0,
        "sodium_mg": 200, "potassium_mg": 90, "magnesium_mg": 15,
        "glycemic_index": 69, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": True, "tryptophan_rich": False,
    },
    {
        "food_id": "F010", "food_name": "Uttapam",
        "region": "south", "is_vegetarian": True,
        "meal_type": "breakfast", "food_group": "cereals",
        "calories_per_100g": 120, "protein_g": 4.0, "carbs_g": 20.0, "sugar_g": 0.5,
        "fiber_g": 1.2, "fat_g": 3.0, "saturated_fat_g": 0.5,
        "sodium_mg": 250, "potassium_mg": 100, "magnesium_mg": 15,
        "glycemic_index": 65, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": True, "tryptophan_rich": False,
    },
    {
        "food_id": "F011", "food_name": "Paratha (Plain, Whole Wheat)",
        "region": "north", "is_vegetarian": True,
        "meal_type": "breakfast/lunch", "food_group": "cereals",
        "calories_per_100g": 240, "protein_g": 6.0, "carbs_g": 38.0, "sugar_g": 0.5,
        "fiber_g": 2.0, "fat_g": 8.0, "saturated_fat_g": 2.0,
        "sodium_mg": 200, "potassium_mg": 110, "magnesium_mg": 25,
        "glycemic_index": 66, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F012", "food_name": "Oats (Cooked)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast", "food_group": "cereals",
        "calories_per_100g": 150, "protein_g": 5.5, "carbs_g": 27.0, "sugar_g": 0.5,
        "fiber_g": 2.5, "fat_g": 2.5, "saturated_fat_g": 0.4,
        "sodium_mg": 2, "potassium_mg": 166, "magnesium_mg": 50,
        "glycemic_index": 55, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F013", "food_name": "Daliya (Broken Wheat Porridge)",
        "region": "north", "is_vegetarian": True,
        "meal_type": "breakfast", "food_group": "cereals",
        "calories_per_100g": 140, "protein_g": 4.5, "carbs_g": 28.0, "sugar_g": 0.5,
        "fiber_g": 2.8, "fat_g": 1.0, "saturated_fat_g": 0.2,
        "sodium_mg": 3, "potassium_mg": 150, "magnesium_mg": 45,
        "glycemic_index": 41, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F014", "food_name": "Khichdi (Moong Dal + Rice)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "cereals",
        "calories_per_100g": 130, "protein_g": 5.0, "carbs_g": 22.0, "sugar_g": 1.0,
        "fiber_g": 2.0, "fat_g": 3.0, "saturated_fat_g": 0.7,
        "sodium_mg": 200, "potassium_mg": 180, "magnesium_mg": 25,
        "glycemic_index": 45, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F015", "food_name": "Curd Rice",
        "region": "south", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "cereals",
        "calories_per_100g": 150, "protein_g": 5.0, "carbs_g": 25.0, "sugar_g": 2.0,
        "fiber_g": 0.5, "fat_g": 3.0, "saturated_fat_g": 1.5,
        "sodium_mg": 50, "potassium_mg": 130, "magnesium_mg": 12,
        "glycemic_index": 56, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": True, "tryptophan_rich": False,
    },
    {
        "food_id": "F016", "food_name": "Litti Chokha",
        "region": "east", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "cereals",
        "calories_per_100g": 225, "protein_g": 8.0, "carbs_g": 38.0, "sugar_g": 1.0,
        "fiber_g": 3.0, "fat_g": 5.0, "saturated_fat_g": 1.0,
        "sodium_mg": 300, "potassium_mg": 200, "magnesium_mg": 35,
        "glycemic_index": 55, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F017", "food_name": "Tamarind Rice",
        "region": "south", "is_vegetarian": True,
        "meal_type": "lunch", "food_group": "cereals",
        "calories_per_100g": 155, "protein_g": 3.0, "carbs_g": 30.0, "sugar_g": 2.0,
        "fiber_g": 1.5, "fat_g": 3.0, "saturated_fat_g": 0.5,
        "sodium_mg": 400, "potassium_mg": 150, "magnesium_mg": 20,
        "glycemic_index": 65, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    # ── Pulses & Legumes ───────────────────────────────────────────────────
    {
        "food_id": "F018", "food_name": "Palak Dal",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "pulses",
        "calories_per_100g": 100, "protein_g": 7.0, "carbs_g": 14.0, "sugar_g": 1.0,
        "fiber_g": 4.0, "fat_g": 2.0, "saturated_fat_g": 0.3,
        "sodium_mg": 50, "potassium_mg": 400, "magnesium_mg": 55,
        "glycemic_index": 22, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F019", "food_name": "Rajma (Cooked)",
        "region": "north", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "pulses",
        "calories_per_100g": 127, "protein_g": 8.7, "carbs_g": 22.0, "sugar_g": 0.5,
        "fiber_g": 6.5, "fat_g": 0.5, "saturated_fat_g": 0.1,
        "sodium_mg": 2, "potassium_mg": 403, "magnesium_mg": 45,
        "glycemic_index": 28, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F020", "food_name": "Chana Masala",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "pulses",
        "calories_per_100g": 164, "protein_g": 8.9, "carbs_g": 27.0, "sugar_g": 1.5,
        "fiber_g": 7.6, "fat_g": 2.5, "saturated_fat_g": 0.3,
        "sodium_mg": 300, "potassium_mg": 291, "magnesium_mg": 48,
        "glycemic_index": 31, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F021", "food_name": "Moong Dal (Yellow)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "pulses",
        "calories_per_100g": 105, "protein_g": 7.5, "carbs_g": 18.0, "sugar_g": 1.0,
        "fiber_g": 4.0, "fat_g": 0.5, "saturated_fat_g": 0.1,
        "sodium_mg": 2, "potassium_mg": 270, "magnesium_mg": 48,
        "glycemic_index": 25, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F022", "food_name": "Arhar Dal (Toor)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "pulses",
        "calories_per_100g": 110, "protein_g": 7.2, "carbs_g": 19.0, "sugar_g": 1.5,
        "fiber_g": 3.5, "fat_g": 0.5, "saturated_fat_g": 0.1,
        "sodium_mg": 5, "potassium_mg": 303, "magnesium_mg": 43,
        "glycemic_index": 29, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F023", "food_name": "Urad Dal",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "pulses",
        "calories_per_100g": 116, "protein_g": 8.2, "carbs_g": 18.0, "sugar_g": 1.0,
        "fiber_g": 3.8, "fat_g": 1.5, "saturated_fat_g": 0.4,
        "sodium_mg": 2, "potassium_mg": 252, "magnesium_mg": 55,
        "glycemic_index": 30, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F024", "food_name": "Black Chana (Cooked)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/snack", "food_group": "pulses",
        "calories_per_100g": 164, "protein_g": 8.9, "carbs_g": 27.0, "sugar_g": 1.5,
        "fiber_g": 7.6, "fat_g": 2.5, "saturated_fat_g": 0.3,
        "sodium_mg": 24, "potassium_mg": 291, "magnesium_mg": 48,
        "glycemic_index": 28, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F025", "food_name": "Moong Sprouts",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/snack", "food_group": "pulses",
        "calories_per_100g": 30, "protein_g": 3.0, "carbs_g": 5.9, "sugar_g": 0.5,
        "fiber_g": 1.8, "fat_g": 0.2, "saturated_fat_g": 0.0,
        "sodium_mg": 6, "potassium_mg": 149, "magnesium_mg": 21,
        "glycemic_index": 25, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F026", "food_name": "Kala Chana Sprouts",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/snack", "food_group": "pulses",
        "calories_per_100g": 45, "protein_g": 3.5, "carbs_g": 8.0, "sugar_g": 1.0,
        "fiber_g": 3.0, "fat_g": 0.5, "saturated_fat_g": 0.0,
        "sodium_mg": 8, "potassium_mg": 200, "magnesium_mg": 40,
        "glycemic_index": 25, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F027", "food_name": "Sambar",
        "region": "south", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "pulses",
        "calories_per_100g": 80, "protein_g": 4.0, "carbs_g": 12.0, "sugar_g": 2.0,
        "fiber_g": 2.5, "fat_g": 2.0, "saturated_fat_g": 0.3,
        "sodium_mg": 300, "potassium_mg": 250, "magnesium_mg": 30,
        "glycemic_index": 35, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F028", "food_name": "Soya Chunks (Cooked)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "protein",
        "calories_per_100g": 160, "protein_g": 52.0, "carbs_g": 10.0, "sugar_g": 0.5,
        "fiber_g": 4.0, "fat_g": 0.5, "saturated_fat_g": 0.1,
        "sodium_mg": 20, "potassium_mg": 2540, "magnesium_mg": 260,
        "glycemic_index": 18, "omega3_g": 1.5,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": True,
    },
    # ── Dairy ──────────────────────────────────────────────────────────────
    {
        "food_id": "F029", "food_name": "Paneer (100g)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "dairy",
        "calories_per_100g": 265, "protein_g": 18.3, "carbs_g": 1.2, "sugar_g": 0.5,
        "fiber_g": 0.0, "fat_g": 20.0, "saturated_fat_g": 13.0,
        "sodium_mg": 32, "potassium_mg": 23, "magnesium_mg": 18,
        "glycemic_index": 27, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": True,
    },
    {
        "food_id": "F030", "food_name": "Dahi (Low Fat Curd)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/snack/dinner", "food_group": "dairy",
        "calories_per_100g": 61, "protein_g": 3.5, "carbs_g": 4.7, "sugar_g": 4.5,
        "fiber_g": 0.0, "fat_g": 1.5, "saturated_fat_g": 1.0,
        "sodium_mg": 46, "potassium_mg": 141, "magnesium_mg": 11,
        "glycemic_index": 36, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": True, "tryptophan_rich": False,
    },
    {
        "food_id": "F031", "food_name": "Chaas (Buttermilk)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/snack", "food_group": "dairy",
        "calories_per_100g": 40, "protein_g": 3.3, "carbs_g": 4.8, "sugar_g": 4.5,
        "fiber_g": 0.0, "fat_g": 1.0, "saturated_fat_g": 0.7,
        "sodium_mg": 180, "potassium_mg": 151, "magnesium_mg": 11,
        "glycemic_index": 32, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": True, "tryptophan_rich": False,
    },
    {
        "food_id": "F032", "food_name": "Milk Toned",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/snack/dinner", "food_group": "dairy",
        "calories_per_100g": 58, "protein_g": 3.2, "carbs_g": 4.7, "sugar_g": 4.5,
        "fiber_g": 0.0, "fat_g": 1.5, "saturated_fat_g": 1.0,
        "sodium_mg": 48, "potassium_mg": 150, "magnesium_mg": 11,
        "glycemic_index": 30, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": True,
    },
    {
        "food_id": "F033", "food_name": "Turmeric Milk (Haldi Doodh)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "dinner/snack", "food_group": "dairy",
        "calories_per_100g": 72, "protein_g": 3.5, "carbs_g": 7.0, "sugar_g": 5.0,
        "fiber_g": 0.0, "fat_g": 2.5, "saturated_fat_g": 1.5,
        "sodium_mg": 55, "potassium_mg": 175, "magnesium_mg": 15,
        "glycemic_index": 30, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": True,
    },
    {
        "food_id": "F034", "food_name": "Mishti Doi",
        "region": "east", "is_vegetarian": True,
        "meal_type": "snack", "food_group": "dairy",
        "calories_per_100g": 110, "protein_g": 4.0, "carbs_g": 18.0, "sugar_g": 16.0,
        "fiber_g": 0.0, "fat_g": 2.5, "saturated_fat_g": 1.5,
        "sodium_mg": 70, "potassium_mg": 180, "magnesium_mg": 15,
        "glycemic_index": 55, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": True, "tryptophan_rich": False,
    },
    # ── Protein (Non-veg) ──────────────────────────────────────────────────
    {
        "food_id": "F035", "food_name": "Egg Boiled",
        "region": "pan-india", "is_vegetarian": False,
        "meal_type": "breakfast/lunch/dinner", "food_group": "protein",
        "calories_per_100g": 155, "protein_g": 13.0, "carbs_g": 1.1, "sugar_g": 0.5,
        "fiber_g": 0.0, "fat_g": 10.6, "saturated_fat_g": 3.3,
        "sodium_mg": 124, "potassium_mg": 138, "magnesium_mg": 12,
        "glycemic_index": 0, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": True,
    },
    {
        "food_id": "F036", "food_name": "Chicken Breast (Grilled)",
        "region": "pan-india", "is_vegetarian": False,
        "meal_type": "lunch/dinner", "food_group": "protein",
        "calories_per_100g": 165, "protein_g": 31.0, "carbs_g": 0.0, "sugar_g": 0.0,
        "fiber_g": 0.0, "fat_g": 3.6, "saturated_fat_g": 1.0,
        "sodium_mg": 74, "potassium_mg": 256, "magnesium_mg": 29,
        "glycemic_index": 0, "omega3_g": 0.3,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": True,
    },
    {
        "food_id": "F037", "food_name": "Rohu Fish (Steamed)",
        "region": "east", "is_vegetarian": False,
        "meal_type": "lunch/dinner", "food_group": "protein",
        "calories_per_100g": 97, "protein_g": 16.7, "carbs_g": 0.0, "sugar_g": 0.0,
        "fiber_g": 0.0, "fat_g": 3.0, "saturated_fat_g": 1.0,
        "sodium_mg": 68, "potassium_mg": 310, "magnesium_mg": 25,
        "glycemic_index": 0, "omega3_g": 0.8,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": True,
    },
    {
        "food_id": "F038", "food_name": "Sardine (Fresh/Canned in Water)",
        "region": "pan-india", "is_vegetarian": False,
        "meal_type": "lunch/dinner", "food_group": "protein",
        "calories_per_100g": 208, "protein_g": 25.0, "carbs_g": 0.0, "sugar_g": 0.0,
        "fiber_g": 0.0, "fat_g": 11.0, "saturated_fat_g": 3.0,
        "sodium_mg": 505, "potassium_mg": 397, "magnesium_mg": 35,
        "glycemic_index": 0, "omega3_g": 2.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": True,
    },
    # ── Vegetables ─────────────────────────────────────────────────────────
    {
        "food_id": "F039", "food_name": "Lauki Sabzi (Bottle Gourd)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 17, "protein_g": 0.6, "carbs_g": 3.4, "sugar_g": 1.5,
        "fiber_g": 0.5, "fat_g": 0.0, "saturated_fat_g": 0.0,
        "sodium_mg": 2, "potassium_mg": 150, "magnesium_mg": 11,
        "glycemic_index": 15, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F040", "food_name": "Palak Sabzi (Spinach)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 23, "protein_g": 2.9, "carbs_g": 3.6, "sugar_g": 0.4,
        "fiber_g": 2.2, "fat_g": 0.4, "saturated_fat_g": 0.1,
        "sodium_mg": 79, "potassium_mg": 558, "magnesium_mg": 79,
        "glycemic_index": 15, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F041", "food_name": "Methi Sabzi (Fenugreek)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 49, "protein_g": 4.4, "carbs_g": 6.0, "sugar_g": 0.5,
        "fiber_g": 4.3, "fat_g": 0.7, "saturated_fat_g": 0.1,
        "sodium_mg": 67, "potassium_mg": 770, "magnesium_mg": 191,
        "glycemic_index": 25, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F042", "food_name": "Bhindi (Okra)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 33, "protein_g": 1.9, "carbs_g": 7.5, "sugar_g": 1.5,
        "fiber_g": 3.2, "fat_g": 0.2, "saturated_fat_g": 0.0,
        "sodium_mg": 7, "potassium_mg": 299, "magnesium_mg": 57,
        "glycemic_index": 20, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F043", "food_name": "Brinjal (Baingan)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 25, "protein_g": 1.0, "carbs_g": 6.0, "sugar_g": 2.0,
        "fiber_g": 3.0, "fat_g": 0.2, "saturated_fat_g": 0.0,
        "sodium_mg": 2, "potassium_mg": 229, "magnesium_mg": 14,
        "glycemic_index": 15, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F044", "food_name": "Tomato",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner/snack", "food_group": "vegetables",
        "calories_per_100g": 18, "protein_g": 0.9, "carbs_g": 3.9, "sugar_g": 2.6,
        "fiber_g": 1.2, "fat_g": 0.2, "saturated_fat_g": 0.0,
        "sodium_mg": 5, "potassium_mg": 237, "magnesium_mg": 11,
        "glycemic_index": 30, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F045", "food_name": "Onion",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 40, "protein_g": 1.1, "carbs_g": 9.3, "sugar_g": 4.2,
        "fiber_g": 1.7, "fat_g": 0.1, "saturated_fat_g": 0.0,
        "sodium_mg": 4, "potassium_mg": 146, "magnesium_mg": 10,
        "glycemic_index": 10, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F046", "food_name": "Karela (Bitter Gourd)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 17, "protein_g": 1.0, "carbs_g": 3.7, "sugar_g": 1.5,
        "fiber_g": 2.8, "fat_g": 0.2, "saturated_fat_g": 0.0,
        "sodium_mg": 5, "potassium_mg": 296, "magnesium_mg": 17,
        "glycemic_index": 15, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F047", "food_name": "Cucumber",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/snack", "food_group": "vegetables",
        "calories_per_100g": 16, "protein_g": 0.7, "carbs_g": 3.6, "sugar_g": 1.7,
        "fiber_g": 0.5, "fat_g": 0.1, "saturated_fat_g": 0.0,
        "sodium_mg": 2, "potassium_mg": 147, "magnesium_mg": 13,
        "glycemic_index": 15, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F048", "food_name": "Carrot",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/snack", "food_group": "vegetables",
        "calories_per_100g": 41, "protein_g": 0.9, "carbs_g": 10.0, "sugar_g": 4.7,
        "fiber_g": 2.8, "fat_g": 0.2, "saturated_fat_g": 0.0,
        "sodium_mg": 69, "potassium_mg": 320, "magnesium_mg": 12,
        "glycemic_index": 35, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F049", "food_name": "Beetroot",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/snack", "food_group": "vegetables",
        "calories_per_100g": 43, "protein_g": 1.6, "carbs_g": 10.0, "sugar_g": 7.0,
        "fiber_g": 2.8, "fat_g": 0.2, "saturated_fat_g": 0.0,
        "sodium_mg": 78, "potassium_mg": 325, "magnesium_mg": 23,
        "glycemic_index": 61, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F050", "food_name": "Cauliflower",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 25, "protein_g": 1.9, "carbs_g": 5.0, "sugar_g": 1.9,
        "fiber_g": 2.0, "fat_g": 0.3, "saturated_fat_g": 0.1,
        "sodium_mg": 30, "potassium_mg": 299, "magnesium_mg": 15,
        "glycemic_index": 15, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F051", "food_name": "Sarson ka Saag",
        "region": "north", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 55, "protein_g": 3.5, "carbs_g": 7.0, "sugar_g": 1.0,
        "fiber_g": 3.5, "fat_g": 2.0, "saturated_fat_g": 0.4,
        "sodium_mg": 80, "potassium_mg": 350, "magnesium_mg": 45,
        "glycemic_index": 20, "omega3_g": 0.3,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F052", "food_name": "Moringa Leaves (Drumstick)",
        "region": "south", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 37, "protein_g": 2.1, "carbs_g": 5.0, "sugar_g": 0.5,
        "fiber_g": 2.0, "fat_g": 0.2, "saturated_fat_g": 0.0,
        "sodium_mg": 20, "potassium_mg": 337, "magnesium_mg": 45,
        "glycemic_index": 15, "omega3_g": 0.2,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F053", "food_name": "Green Peas",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 81, "protein_g": 5.4, "carbs_g": 14.0, "sugar_g": 5.7,
        "fiber_g": 5.1, "fat_g": 0.4, "saturated_fat_g": 0.1,
        "sodium_mg": 5, "potassium_mg": 244, "magnesium_mg": 33,
        "glycemic_index": 48, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F054", "food_name": "Sweet Potato",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/snack", "food_group": "vegetables",
        "calories_per_100g": 86, "protein_g": 1.6, "carbs_g": 20.0, "sugar_g": 4.2,
        "fiber_g": 3.0, "fat_g": 0.1, "saturated_fat_g": 0.0,
        "sodium_mg": 55, "potassium_mg": 337, "magnesium_mg": 25,
        "glycemic_index": 61, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F055", "food_name": "Potato (Boiled)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 77, "protein_g": 2.0, "carbs_g": 17.0, "sugar_g": 0.8,
        "fiber_g": 2.2, "fat_g": 0.1, "saturated_fat_g": 0.0,
        "sodium_mg": 6, "potassium_mg": 425, "magnesium_mg": 23,
        "glycemic_index": 70, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F056", "food_name": "Rasam",
        "region": "south", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 25, "protein_g": 1.0, "carbs_g": 5.0, "sugar_g": 1.0,
        "fiber_g": 0.5, "fat_g": 0.5, "saturated_fat_g": 0.0,
        "sodium_mg": 200, "potassium_mg": 150, "magnesium_mg": 15,
        "glycemic_index": 20, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F057", "food_name": "Green Chutney",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/snack/dinner", "food_group": "vegetables",
        "calories_per_100g": 40, "protein_g": 1.5, "carbs_g": 6.0, "sugar_g": 1.0,
        "fiber_g": 2.0, "fat_g": 1.0, "saturated_fat_g": 0.0,
        "sodium_mg": 200, "potassium_mg": 150, "magnesium_mg": 20,
        "glycemic_index": 15, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    # ── Fruits ─────────────────────────────────────────────────────────────
    {
        "food_id": "F058", "food_name": "Banana",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/snack", "food_group": "fruits",
        "calories_per_100g": 89, "protein_g": 1.1, "carbs_g": 23.0, "sugar_g": 12.2,
        "fiber_g": 2.6, "fat_g": 0.3, "saturated_fat_g": 0.1,
        "sodium_mg": 1, "potassium_mg": 358, "magnesium_mg": 27,
        "glycemic_index": 51, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": True,
    },
    {
        "food_id": "F059", "food_name": "Guava",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "snack/breakfast", "food_group": "fruits",
        "calories_per_100g": 68, "protein_g": 2.6, "carbs_g": 14.0, "sugar_g": 9.0,
        "fiber_g": 5.4, "fat_g": 0.9, "saturated_fat_g": 0.3,
        "sodium_mg": 2, "potassium_mg": 417, "magnesium_mg": 22,
        "glycemic_index": 12, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F060", "food_name": "Papaya",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/snack", "food_group": "fruits",
        "calories_per_100g": 43, "protein_g": 0.5, "carbs_g": 11.0, "sugar_g": 7.8,
        "fiber_g": 1.7, "fat_g": 0.3, "saturated_fat_g": 0.1,
        "sodium_mg": 8, "potassium_mg": 182, "magnesium_mg": 21,
        "glycemic_index": 59, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F061", "food_name": "Apple",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "snack/breakfast", "food_group": "fruits",
        "calories_per_100g": 52, "protein_g": 0.3, "carbs_g": 14.0, "sugar_g": 10.4,
        "fiber_g": 2.4, "fat_g": 0.2, "saturated_fat_g": 0.0,
        "sodium_mg": 1, "potassium_mg": 107, "magnesium_mg": 5,
        "glycemic_index": 38, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F062", "food_name": "Orange",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "snack/breakfast", "food_group": "fruits",
        "calories_per_100g": 47, "protein_g": 0.9, "carbs_g": 12.0, "sugar_g": 9.4,
        "fiber_g": 2.4, "fat_g": 0.1, "saturated_fat_g": 0.0,
        "sodium_mg": 0, "potassium_mg": 181, "magnesium_mg": 10,
        "glycemic_index": 40, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F063", "food_name": "Pomegranate",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "snack/breakfast", "food_group": "fruits",
        "calories_per_100g": 83, "protein_g": 1.7, "carbs_g": 19.0, "sugar_g": 13.7,
        "fiber_g": 4.0, "fat_g": 1.2, "saturated_fat_g": 0.1,
        "sodium_mg": 3, "potassium_mg": 236, "magnesium_mg": 12,
        "glycemic_index": 35, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F064", "food_name": "Amla (Indian Gooseberry)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "snack/breakfast", "food_group": "fruits",
        "calories_per_100g": 44, "protein_g": 0.9, "carbs_g": 10.0, "sugar_g": 6.9,
        "fiber_g": 4.3, "fat_g": 0.6, "saturated_fat_g": 0.0,
        "sodium_mg": 1, "potassium_mg": 198, "magnesium_mg": 10,
        "glycemic_index": 25, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    # ── Nuts & Seeds ───────────────────────────────────────────────────────
    {
        "food_id": "F065", "food_name": "Akhrot (Walnuts)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "snack/breakfast", "food_group": "nuts",
        "calories_per_100g": 654, "protein_g": 15.2, "carbs_g": 14.0, "sugar_g": 2.6,
        "fiber_g": 6.7, "fat_g": 65.0, "saturated_fat_g": 6.0,
        "sodium_mg": 2, "potassium_mg": 441, "magnesium_mg": 158,
        "glycemic_index": 15, "omega3_g": 9.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F066", "food_name": "Badam (Almonds)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "snack/breakfast", "food_group": "nuts",
        "calories_per_100g": 579, "protein_g": 21.2, "carbs_g": 22.0, "sugar_g": 4.4,
        "fiber_g": 12.5, "fat_g": 49.9, "saturated_fat_g": 3.8,
        "sodium_mg": 1, "potassium_mg": 733, "magnesium_mg": 270,
        "glycemic_index": 15, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F067", "food_name": "Flaxseed (Alsi)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/snack/lunch/dinner", "food_group": "nuts",
        "calories_per_100g": 534, "protein_g": 18.3, "carbs_g": 29.0, "sugar_g": 1.6,
        "fiber_g": 27.3, "fat_g": 42.2, "saturated_fat_g": 3.6,
        "sodium_mg": 30, "potassium_mg": 813, "magnesium_mg": 392,
        "glycemic_index": 35, "omega3_g": 22.8,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F068", "food_name": "Chia Seeds",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/snack", "food_group": "nuts",
        "calories_per_100g": 486, "protein_g": 16.5, "carbs_g": 42.0, "sugar_g": 0.0,
        "fiber_g": 34.4, "fat_g": 30.7, "saturated_fat_g": 3.3,
        "sodium_mg": 16, "potassium_mg": 407, "magnesium_mg": 335,
        "glycemic_index": 1, "omega3_g": 17.8,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F069", "food_name": "Pumpkin Seeds",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "snack", "food_group": "nuts",
        "calories_per_100g": 559, "protein_g": 30.2, "carbs_g": 11.0, "sugar_g": 1.4,
        "fiber_g": 6.0, "fat_g": 49.1, "saturated_fat_g": 8.7,
        "sodium_mg": 7, "potassium_mg": 919, "magnesium_mg": 592,
        "glycemic_index": 25, "omega3_g": 0.1,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": True,
    },
    {
        "food_id": "F070", "food_name": "Til (Sesame Seeds)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "snack/breakfast", "food_group": "nuts",
        "calories_per_100g": 573, "protein_g": 17.7, "carbs_g": 23.0, "sugar_g": 0.3,
        "fiber_g": 11.8, "fat_g": 50.0, "saturated_fat_g": 7.0,
        "sodium_mg": 11, "potassium_mg": 468, "magnesium_mg": 351,
        "glycemic_index": 35, "omega3_g": 0.4,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F071", "food_name": "Makhana (Fox Nuts)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "snack", "food_group": "nuts",
        "calories_per_100g": 347, "protein_g": 9.7, "carbs_g": 74.7, "sugar_g": 0.0,
        "fiber_g": 0.5, "fat_g": 0.1, "saturated_fat_g": 0.0,
        "sodium_mg": 1, "potassium_mg": 500, "magnesium_mg": 67,
        "glycemic_index": 55, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F072", "food_name": "Coconut Chutney",
        "region": "south", "is_vegetarian": True,
        "meal_type": "breakfast/snack", "food_group": "fats",
        "calories_per_100g": 150, "protein_g": 2.0, "carbs_g": 8.0, "sugar_g": 3.0,
        "fiber_g": 3.0, "fat_g": 12.0, "saturated_fat_g": 10.0,
        "sodium_mg": 150, "potassium_mg": 200, "magnesium_mg": 30,
        "glycemic_index": 40, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    # ── Fats & Oils ────────────────────────────────────────────────────────
    {
        "food_id": "F073", "food_name": "Mustard Oil",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "fats",
        "calories_per_100g": 884, "protein_g": 0.0, "carbs_g": 0.0, "sugar_g": 0.0,
        "fiber_g": 0.0, "fat_g": 99.9, "saturated_fat_g": 11.6,
        "sodium_mg": 0, "potassium_mg": 0, "magnesium_mg": 0,
        "glycemic_index": 0, "omega3_g": 5.9,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F074", "food_name": "Coconut Oil",
        "region": "south", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "fats",
        "calories_per_100g": 862, "protein_g": 0.0, "carbs_g": 0.0, "sugar_g": 0.0,
        "fiber_g": 0.0, "fat_g": 100.0, "saturated_fat_g": 82.0,
        "sodium_mg": 0, "potassium_mg": 0, "magnesium_mg": 0,
        "glycemic_index": 0, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F075", "food_name": "Ghee",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "fats",
        "calories_per_100g": 900, "protein_g": 0.0, "carbs_g": 0.0, "sugar_g": 0.0,
        "fiber_g": 0.0, "fat_g": 99.5, "saturated_fat_g": 65.0,
        "sodium_mg": 0, "potassium_mg": 0, "magnesium_mg": 0,
        "glycemic_index": 0, "omega3_g": 0.5,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F076", "food_name": "Olive Oil",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "breakfast/lunch/dinner", "food_group": "fats",
        "calories_per_100g": 884, "protein_g": 0.0, "carbs_g": 0.0, "sugar_g": 0.0,
        "fiber_g": 0.0, "fat_g": 100.0, "saturated_fat_g": 14.0,
        "sodium_mg": 2, "potassium_mg": 1, "magnesium_mg": 0,
        "glycemic_index": 0, "omega3_g": 0.8,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F077", "food_name": "Jaggery (Gur)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "snack", "food_group": "fats",
        "calories_per_100g": 383, "protein_g": 0.4, "carbs_g": 98.0, "sugar_g": 70.0,
        "fiber_g": 0.0, "fat_g": 0.1, "saturated_fat_g": 0.0,
        "sodium_mg": 19, "potassium_mg": 1050, "magnesium_mg": 70,
        "glycemic_index": 84, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F078", "food_name": "Ragi (Finger Millet, Raw)",
        "region": "south", "is_vegetarian": True,
        "meal_type": "breakfast/snack", "food_group": "cereals",
        "calories_per_100g": 336, "protein_g": 7.3, "carbs_g": 72.0, "sugar_g": 1.5,
        "fiber_g": 3.6, "fat_g": 1.5, "saturated_fat_g": 0.3,
        "sodium_mg": 11, "potassium_mg": 408, "magnesium_mg": 137,
        "glycemic_index": 68, "omega3_g": 0.1,
        "is_millet": True, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F079", "food_name": "Cabbage (Stir-fried)",
        "region": "pan-india", "is_vegetarian": True,
        "meal_type": "lunch/dinner", "food_group": "vegetables",
        "calories_per_100g": 30, "protein_g": 1.5, "carbs_g": 6.5, "sugar_g": 2.5,
        "fiber_g": 2.5, "fat_g": 0.5, "saturated_fat_g": 0.1,
        "sodium_mg": 18, "potassium_mg": 170, "magnesium_mg": 12,
        "glycemic_index": 10, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
    {
        "food_id": "F080", "food_name": "Kokum",
        "region": "west", "is_vegetarian": True,
        "meal_type": "lunch/dinner/snack", "food_group": "fruits",
        "calories_per_100g": 50, "protein_g": 1.5, "carbs_g": 11.0, "sugar_g": 4.0,
        "fiber_g": 2.0, "fat_g": 0.8, "saturated_fat_g": 0.1,
        "sodium_mg": 5, "potassium_mg": 200, "magnesium_mg": 25,
        "glycemic_index": 30, "omega3_g": 0.0,
        "is_millet": False, "is_fried": False, "is_probiotic": False, "tryptophan_rich": False,
    },
]


def compute_suitability_scores(df: pd.DataFrame) -> pd.DataFrame:
    """Engineer 4 suitability scores (0-1) per ICMR risk guidelines."""

    def diabetes_score(row):
        score = 1.0
        gi = row["glycemic_index"]
        if gi > 70:
            score -= 0.4
        elif gi > 56:
            score -= 0.2
        fiber = row["fiber_g"]
        if fiber > 8:
            score += 0.3   # +0.2 base + +0.1 extra
        elif fiber > 5:
            score += 0.2
        if row["is_millet"]:
            score += 0.15
        if row.get("sugar_g", 0) > 5:
            score -= 0.3
        return round(float(np.clip(score, 0, 1)), 3)

    def hypertension_score(row):
        score = 1.0
        sodium = row["sodium_mg"]
        if sodium > 400:
            score -= 0.5
        elif sodium > 200:
            score -= 0.25
        if row["potassium_mg"] > 300:
            score += 0.2
        if row["magnesium_mg"] > 40:
            score += 0.15
        if row["food_group"] == "vegetables":
            score += 0.1
        return round(float(np.clip(score, 0, 1)), 3)

    def cvd_score(row):
        score = 1.0
        if row["saturated_fat_g"] > 5:
            score -= 0.4
        if row["omega3_g"] > 0.5:
            score += 0.3
        if row["fiber_g"] > 5:
            score += 0.2
        if row["food_group"] == "nuts":
            score += 0.1
        if row["is_fried"]:
            score -= 0.3
        return round(float(np.clip(score, 0, 1)), 3)

    def mental_score(row):
        score = 1.0
        if row["is_probiotic"]:
            score += 0.3
        if row["magnesium_mg"] > 40:
            score += 0.2
        if row["omega3_g"] > 0.3:
            score += 0.2
        if row["tryptophan_rich"]:
            score += 0.2
        return round(float(np.clip(score, 0, 1)), 3)

    df["diabetes_score"] = df.apply(diabetes_score, axis=1)
    df["hypertension_score"] = df.apply(hypertension_score, axis=1)
    df["cvd_score"] = df.apply(cvd_score, axis=1)
    df["mental_score"] = df.apply(mental_score, axis=1)
    return df


def build_master_csv(force: bool = False) -> pd.DataFrame:
    """Build or load the master foods CSV. Returns the DataFrame."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    if MASTER_CSV.exists() and not force:
        return pd.read_csv(MASTER_CSV)

    df = pd.DataFrame(SEED_FOODS)
    df = compute_suitability_scores(df)
    df.to_csv(MASTER_CSV, index=False)
    print(f"[IndianPlate AI] Master CSV written: {MASTER_CSV} ({len(df)} foods)")
    return df


def get_master_df() -> pd.DataFrame:
    return build_master_csv()


if __name__ == "__main__":
    df = build_master_csv(force=True)
    print(df[["food_name", "diabetes_score", "hypertension_score", "cvd_score", "mental_score"]].to_string())
