"""
precompute_charts.py
Generates chart JSON files under public/data/ from source GeoJSON/polygon files.
Run from the project root:
    python scripts/precompute_charts.py

Requires: geopandas, shapely
Output files:
    public/data/chart_n2_gauteng.json
    public/data/chart_n2_kzn.json
    public/data/chart_n4_ohb.json
    public/data/chart_n4_kwamashu.json
    public/data/chart_n5_access_pop.json
"""

import json
import geopandas as gpd
from pathlib import Path

ROOT       = Path(__file__).resolve().parent.parent
PUBLIC     = ROOT / "public" / "data"

# Source files (large — not committed to repo)
GAUTENG_POLYGONS = ROOT / "public" / "data" / "gauteng_polygons.geojson"
KZN_POINTS       = ROOT / "public" / "data" / "kzn.geojson"

EA_TYPE_ORDER = [
    "Township", "Informal residential", "Suburb",
    "Traditional residential", "Smallholdings", "Farms",
    "Commercial", "Industrial",
]

EA_TYPE_LABELS = {
    "Township":                "Township",
    "Informal residential":    "Informal\nresidential",
    "Suburb":                  "Suburb",
    "Traditional residential": "Traditional\nresidential",
    "Smallholdings":           "Small\nholdings",
    "Farms":                   "Farms",
    "Commercial":              "Commercial",
    "Industrial":              "Industrial",
}

CHART_EA_TYPES = set(EA_TYPE_ORDER)

ACCESS_TIERS = [
    "Well-served",
    "Overcrowded",
    "Fragile",
    "Underserved",
    "Pharmacy desert",
    "Data-uncertain",
]

# Bounding boxes [minLng, minLat, maxLng, maxLat]
OHB_BBOX      = (27.94, -26.12, 28.24, -25.82)
KWAMASHU_BBOX = (30.81, -29.93, 31.11, -29.63)


def build_chart_data(gdf, bbox=None):
    """Aggregate EA_TYPE racial composition and density from a GeoDataFrame."""
    if bbox:
        minLng, minLat, maxLng, maxLat = bbox
        cx = gdf.geometry.centroid
        gdf = gdf[
            (cx.x >= minLng) & (cx.x <= maxLng) &
            (cx.y >= minLat) & (cx.y <= maxLat)
        ]

    gdf = gdf[gdf["EA_TYPE"].isin(CHART_EA_TYPES)].copy()

    # Normalise truncated field names
    for full, trunc in [("sal2023_est", "sal2023_es"), ("Black_African", "Black_Afri"), ("Indian_Asian", "Indian_Asi")]:
        if full not in gdf.columns and trunc in gdf.columns:
            gdf[full] = gdf[trunc]

    groups = gdf.groupby("EA_TYPE").agg(
        sal2023_est   = ("sal2023_est",   "sum"),
        area_km2      = ("area_km2",      "sum"),
        Black_African = ("Black_African", "sum"),
        Coloured      = ("Coloured",      "sum"),
        Indian_Asian  = ("Indian_Asian",  "sum"),
        White         = ("White",         "sum"),
        Other         = ("Other",         "sum"),
    ).reset_index()

    results = []
    for ea_type in EA_TYPE_ORDER:
        row = groups[groups["EA_TYPE"] == ea_type]
        if row.empty:
            continue
        r = row.iloc[0]
        total = r["sal2023_est"] or 1
        density = round(r["sal2023_est"] / r["area_km2"]) if r["area_km2"] > 0 else 0
        results.append({
            "type":          EA_TYPE_LABELS.get(ea_type, ea_type),
            "density":       density,
            "Black African": round((r["Black_African"] / total) * 100),
            "Coloured":      round((r["Coloured"]      / total) * 100),
            "Indian/Asian":  round((r["Indian_Asian"]  / total) * 100),
            "White":         round((r["White"]         / total) * 100),
            "Other":         round((r["Other"]         / total) * 100),
        })

    # Density sanity check — confirmed canonical formula: round(sal2023_est / area_km2)
    print("\nDensity sanity check:")
    for r in results:
        print(f"  {r['type']:30s}  density={r['density']:>6}  ppl/km²")

    # Expected ranges (hardcoded reference — confirmed from gauteng data)
    EXPECTED_DENSITY_RANGES = {
        "Township":                (3000, 10000),
        "Informal\nresidential":   (3000, 9000),
        "Suburb":                  (500,  4000),
        "Traditional\nresidential":(100,  4000),
        "Small\nholdings":         (10,   200),
        "Farms":                   (1,    50),
        "Commercial":              (100,  2000),
        "Industrial":              (10,   500),
    }
    print("\nDensity range validation:")
    for r in results:
        expected = EXPECTED_DENSITY_RANGES.get(r["type"])
        if expected:
            lo, hi = expected
            status = "ok" if lo <= r["density"] <= hi else f"!! OUTSIDE EXPECTED {lo}–{hi}"
            print(f"  {r['type']:30s}  {r['density']:>6}  {status}")

    return results


def build_access_pop_data(gdf):
    """Aggregate population by walk_typology tier for the province-level bar chart."""
    if "sal2023_est" not in gdf.columns and "sal2023_es" in gdf.columns:
        gdf = gdf.copy()
        gdf["sal2023_est"] = gdf["sal2023_es"]

    total = gdf["sal2023_est"].sum()
    results = []
    for tier in ACCESS_TIERS:
        subset = gdf[gdf["walk_typology"] == tier]
        pop = int(subset["sal2023_est"].sum())
        pct = round((pop / total) * 100, 1) if total > 0 else 0
        results.append({"name": tier, "population": pop, "percent": pct})
    return results


def main():
    print("Loading source data …")
    gp = gpd.read_file(GAUTENG_POLYGONS)
    kzn = gpd.read_file(KZN_POINTS)

    print("\n── N2: province-level EA_TYPE charts ──")
    print("Gauteng:")
    gauteng_chart = build_chart_data(gp)
    print("\nKZN:")
    kzn_chart = build_chart_data(kzn)

    print("\n── N4: township bbox EA_TYPE charts ──")
    print("Olievenhoutbosch (Gauteng):")
    ohb_chart = build_chart_data(gp, OHB_BBOX)
    print("\nKwaMashu (KZN):")
    kwamashu_chart = build_chart_data(kzn, KWAMASHU_BBOX)

    print("\n── N5: province-scale access population ──")
    access_pop = build_access_pop_data(gpd.pd.concat([
        gp[["sal2023_est", "walk_typology"]],
        kzn[["sal2023_est", "walk_typology"]],
    ], ignore_index=True))

    outputs = {
        "chart_n2_gauteng.json": gauteng_chart,
        "chart_n2_kzn.json":     kzn_chart,
        "chart_n4_ohb.json":     ohb_chart,
        "chart_n4_kwamashu.json":kwamashu_chart,
        "chart_n5_access_pop.json": access_pop,
    }

    for fname, data in outputs.items():
        path = PUBLIC / fname
        path.write_text(json.dumps(data, indent=2))
        print(f"Wrote {path}")

    print("\nDone.")


if __name__ == "__main__":
    main()