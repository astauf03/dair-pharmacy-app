"""
Derive public-data from v2 SAL dataset.

This module is the primary source for the stuff that the numbers, story text
and written report quote. It loads the v2 dataset, verifies numbers, and prints
a grep-friendly statistics report (one ``STAT <key> = <value>`` per line).

Writers called from ``main()`` overwrite committed public-data extracts.
``--no-write`` flag skips all writes.
"""

import argparse
import json
import sys
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
from shapely.geometry import mapping as shapely_mapping

ROOT = Path(__file__).resolve().parent.parent

# True data locations
DEFAULT_SOURCE = ROOT / "public" / "data" / "sal_combined_access.geojson"
PHARMACIES = ROOT / "public" / "data" / "pharmacies.geojson"
KWAMASHU = ROOT / "public" / "data" / "kwamashu.geojson"
OLIEVENHOUTBOSCH = ROOT / "public" / "data" / "olievenhoutbosch.geojson"
GAUTENG_POINTS = ROOT / "public" / "data" / "gauteng.geojson"
KZN_POINTS = ROOT / "public" / "data" / "kzn.geojson"
TILE_FIELDS = ROOT / "scripts" / "tile_fields.json"
TILE_UPLOAD = ROOT / "public" / "data" / "sal_tiles.geojson.ld"
RECIPE = ROOT / "public" / "data" / "recipe.json"
RECIPE_V2 = ROOT / "public" / "data" / "recipe.v2.json"

# Field names and display labels
POP = "pop2023est"

PROVINCES = ["Gauteng", "KwaZulu-Natal"]

POPULATION_GROUPS = {
    "Black_Afr": "Black African",
    "Coloured": "Coloured",
    "Ind_Asian": "Indian/Asian",
    "White": "White",
    "Other": "Other",
}
GROUP_COLUMNS = list(POPULATION_GROUPS)

# Display names are Title Case
# Source values ending in ``_*`` are SALs with no dwellings in 2011.
SETTLEMENT_MAP = {
    "Suburb": "Suburb",
    "Smallholdings": "Farms & Smallholdings",
    "Farms": "Farms & Smallholdings",
    "Township": "Township",
    "Informal residential": "Informal Settlement",
    "Traditional residential": "Traditional (Former Homeland)",
    "Collective living quarters": "Collective Living Quarters",
    "Commercial": "Non-Residential",
    "Industrial": "Non-Residential",
    "Parks and recreation": "Non-Residential",
    "Vacant": "Non-Residential",
}
NO_DWELLINGS = "No Dwellings (2011)"

SETTLEMENT_ORDER = [
    "Suburb",
    "Farms & Smallholdings",
    "Township",
    "Informal Settlement",
    "Traditional (Former Homeland)",
    "Collective Living Quarters",
    "Non-Residential",
    NO_DWELLINGS,
]

# Population group share by Settlement Type (2023) excludes empty SALs.
DESERT_SHARE_SETTLEMENTS = [
    "Suburb",
    "Township",
    "Informal Settlement",
    "Traditional (Former Homeland)",
]

# Opening-section (N2) chart labels. Long Settlement Type names wrap.
# ``\n`` is intentional and chart component splits on it.
CHART_LABEL_WRAP = {
    "Informal Settlement": "Informal\nSettlement",
    "Traditional (Former Homeland)": "Traditional\n(Former Homeland)",
    "Collective Living Quarters": "Collective Living\nQuarters",
    "Farms & Smallholdings": "Farms &\nSmallholdings",
}

# Density check taken from removed precompute_charts.py with printed warnings only.
EXPECTED_DENSITY_RANGES = {
    "Suburb": (500, 4000),
    "Farms &\nSmallholdings": (1, 200),
    "Township": (3000, 10000),
    "Informal\nSettlement": (3000, 9000),
    "Traditional\n(Former Homeland)": (100, 4000),
    "Collective Living\nQuarters": (50, 8000),
    "Non-Residential": (10, 2000),
}

# Columns the script must find in the source.
BASE_COLUMNS = [
    "EA_CODE",
    "PR_NAME",
    "EA_TYPE",
    "econ_stat",
    POP,
    "pop2011sum",
    "wlk_type",
    "drv_type",
    "wlk_ai",
    "drv_ai",
    "wlk_k1_km",
    "drv_k1_km",
    *GROUP_COLUMNS,
    "cent_lat",
    "cent_lng",
    "area_km2",
]

# Township extracts: Property order and numeric precision for the GeoJSON the
# N4 township deep dive reads. ``settlement`` is precomputed so the browser
# does not need the Settlement Type mapping.
TOWNSHIP_PROPERTY_ORDER = [
    "EA_CODE",
    "EA_TYPE",
    "PR_NAME",
    "SP_NAME",
    "MN_NAME",
    "area_km2",
    "pop2023est",
    "wlk_type",
    "wlk_k1_km",
    "Black_Afr",
    "Coloured",
    "Ind_Asian",
    "White",
    "Other",
    "settlement",
]

TOWNSHIP_ROUND_DIGITS = {
    "area_km2": 3,
    "pop2023est": 2,
    "wlk_k1_km": 3,
    "Black_Afr": 0,
    "Coloured": 0,
    "Ind_Asian": 0,
    "White": 0,
    "Other": 0,
}

TOWNSHIP_TARGETS = [
    ("Olievenhoutbosch", OLIEVENHOUTBOSCH, 82),
    ("KwaMashu", KWAMASHU, 253),
]

# Province point extracts: One point per SAL at its centroid. The story's
# settlement and density maps read these files. Property order is stable so a
# diff of two runs only changes when the source data changes.
PROVINCE_POINT_TARGETS = [
    ("Gauteng", GAUTENG_POINTS),
    ("KwaZulu-Natal", KZN_POINTS),
]

PROVINCE_POINT_PROPERTY_ORDER = [
    "EA_CODE",
    "EA_TYPE",
    "settlement",
    "PR_NAME",
    "area_km2",
    "pop2023est",
    "wlk_type",
    "wlk_k1_km",
]


def tile_fields():
    """Return the extra columns listed in ``scripts/tile_fields.json``, if any."""
    if not TILE_FIELDS.exists():
        return []
    with TILE_FIELDS.open(encoding="utf-8") as handle:
        return list(json.load(handle).get("fields", []))


def load(source):
    """Read the canonical dataset and verify its CRS and columns."""
    source = Path(source)
    if not source.exists():
        raise SystemExit(f"Source file not found: {source}")

    gdf = gpd.read_file(source)

    crs = str(gdf.crs).upper()
    if "4326" not in crs and "CRS84" not in crs and "WGS84" not in crs:
        raise SystemExit(
            f"Expected WGS84/CRS84 coordinates, got CRS {gdf.crs}. "
            f"Is this the canonical v2 GeoJSON?"
        )

    required = BASE_COLUMNS + tile_fields()
    missing = [col for col in required if col not in gdf.columns]
    if missing:
        raise SystemExit(
            f"Missing columns in {source.name} "
            f"(is this the renamed v2 GeoJSON?): {missing}"
        )

    return gdf


def add_derived(gdf):
    """Add the derived columns the statistics are computed from."""
    gdf = gdf.copy()

    gdf["settlement"] = np.where(
        gdf["EA_TYPE"].astype(str).str.endswith("_*"),
        NO_DWELLINGS,
        gdf["EA_TYPE"].map(SETTLEMENT_MAP),
    )

    # The typology values are already Title Case in v2; normalize just in case
    # an older export gets through.
    type_lookup = {
        "pharmacy desert": "Pharmacy Desert",
        "access gap": "Access Gap",
        "connectivity gap": "Connectivity Gap",
        "demand overcrowding": "Demand Overcrowding",
        "well-served": "Well-Served",
        "artifact zone": "Artifact Zone",
    }
    for col in ("wlk_type", "drv_type"):
        normalized = gdf[col].astype(str).str.lower().map(type_lookup)
        unknown = set(gdf.loc[normalized.isna() & gdf[col].notna(), col])
        if unknown:
            raise SystemExit(f"Unexpected {col} labels: {unknown}")
        gdf[col] = normalized

    gdf["walk_desert"] = gdf["wlk_type"].eq("Pharmacy Desert")
    gdf["drive_desert"] = gdf["drv_type"].eq("Pharmacy Desert")

    # Unreachable SALs (null network distance) count as beyond the threshold.
    gdf["walk_beyond"] = gdf["wlk_k1_km"].isna() | (gdf["wlk_k1_km"] > 3)
    gdf["drive_beyond"] = gdf["drv_k1_km"].isna() | (gdf["drv_k1_km"] > 10)

    group_total = gdf[GROUP_COLUMNS].sum(axis=1, min_count=1)
    has_groups = group_total.gt(0)
    gdf["group_total"] = group_total.where(has_groups)

    majority = gdf[GROUP_COLUMNS].fillna(-1).idxmax(axis=1).map(POPULATION_GROUPS)
    gdf["majority_group"] = majority.where(has_groups)

    return gdf


def verify_headline(gdf):
    """Refuse to continue unless the notebook's headline numbers reproduce."""
    rows = len(gdf)
    per_province = gdf.groupby("PR_NAME")["EA_CODE"].size()

    gauteng_rows = int(per_province.get("Gauteng", 0))
    kzn_rows = int(per_province.get("KwaZulu-Natal", 0))

    total_pop = float(gdf[POP].sum())
    walk_total = float(gdf.loc[gdf["walk_desert"], POP].sum())
    drive_total = float(gdf.loc[gdf["drive_desert"], POP].sum())

    problems = []
    if rows != 38_380:
        problems.append(f"expected 38,380 rows, got {rows:,}")
    if gauteng_rows != 20_850:
        problems.append(f"expected 20,850 Gauteng rows, got {gauteng_rows:,}")
    if kzn_rows != 17_530:
        problems.append(f"expected 17,530 KwaZulu-Natal rows, got {kzn_rows:,}")

    # round(x, 1) == 27.5 means 27.45 <= x < 27.55 (million).
    expected_total_m = 27.5
    expected_walk_m = 10.20
    expected_drive_m = 4.63

    if round(total_pop / 1e6, 1) != expected_total_m:
        problems.append(
            f"expected total population to round to {expected_total_m:.1f}M, "
            f"got {total_pop / 1e6:.2f}M"
        )
    if round(walk_total / 1e6, 2) != expected_walk_m:
        problems.append(
            f"expected walking-desert population to round to "
            f"{expected_walk_m:.2f}M, got {walk_total / 1e6:.2f}M"
        )
    if round(drive_total / 1e6, 2) != expected_drive_m:
        problems.append(
            f"expected driving-desert population to round to "
            f"{expected_drive_m:.2f}M, got {drive_total / 1e6:.2f}M"
        )

    if problems:
        raise SystemExit(
            "Headline verification failed; refusing to derive against a dataset "
            "that no longer reproduces the research notebook:\n"
            + "\n".join(f"  - {problem}" for problem in problems)
        )


def _pct(value, digits=0):
    if value is None or not np.isfinite(value):
        return "n/a"
    return f"{value * 100:.{digits}f}%"


def _fmt_num(value, digits=0):
    if value is None or not np.isfinite(value):
        return "n/a"
    return f"{value:,.{digits}f}"


def print_statistics(gdf):
    """Print every statistic the story and report quote, as ``STAT`` lines."""
    print()

    total_pop = float(gdf[POP].sum())
    walk_total = float(gdf.loc[gdf["walk_desert"], POP].sum())
    drive_total = float(gdf.loc[gdf["drive_desert"], POP].sum())
    walk_share = walk_total / total_pop if total_pop else np.nan
    drive_share = drive_total / total_pop if total_pop else np.nan

    # Headline numbers, formatted exactly as the notebook's G section.
    print(f"STAT Residents, both provinces (2023 est.) = {total_pop / 1e6:.1f}M")
    print(
        f"STAT Walking pharmacy desert = {walk_total / 1e6:.2f}M "
        f"({walk_share:.0%})"
    )
    print(
        f"STAT Driving pharmacy desert = {drive_total / 1e6:.2f}M "
        f"({drive_share:.0%})"
    )

    # Per province and both: totals, deserts, and beyond-threshold shares.
    for province in [*PROVINCES, "Both provinces"]:
        if province == "Both provinces":
            subset = gdf
        else:
            subset = gdf[gdf["PR_NAME"].eq(province)]
        if subset.empty:
            continue

        pop = float(subset[POP].sum())
        walk = float(subset.loc[subset["walk_desert"], POP].sum())
        drive = float(subset.loc[subset["drive_desert"], POP].sum())
        beyond_walk = float(subset.loc[subset["walk_beyond"], POP].sum())
        beyond_drive = float(subset.loc[subset["drive_beyond"], POP].sum())

        print(f"STAT total_sals {province} = {len(subset):,}")
        print(f"STAT total_pop {province} = {pop / 1e6:.2f}M")
        print(f"STAT walk_desert_pop {province} = {walk / 1e6:.2f}M")
        print(f"STAT walk_desert_share {province} = {_pct(walk / pop if pop else np.nan)}")
        print(f"STAT drive_desert_pop {province} = {drive / 1e6:.2f}M")
        print(f"STAT drive_desert_share {province} = {_pct(drive / pop if pop else np.nan)}")
        print(
            f"STAT beyond_walk_share {province} = "
            f"{_pct(beyond_walk / pop if pop else np.nan)}"
        )
        print(
            f"STAT beyond_drive_share {province} = "
            f"{_pct(beyond_drive / pop if pop else np.nan)}"
        )

    # Population-weighted desert share by Settlement Type (2023).
    for province in PROVINCES:
        subset = gdf[gdf["PR_NAME"].eq(province)]
        for settlement in DESERT_SHARE_SETTLEMENTS:
            in_settlement = subset["settlement"].eq(settlement)
            den = float(subset.loc[in_settlement, POP].sum())
            num = float(
                subset.loc[in_settlement & subset["walk_desert"], POP].sum()
            )
            walk_share = num / den if den else np.nan
            print(
                f"STAT settlement_walk_desert_share {province} {settlement} = "
                f"{_pct(walk_share)}"
            )

    # Desert share by Population Group (2011 counts on both sides, matching D1).
    for province in PROVINCES:
        subset = gdf[gdf["PR_NAME"].eq(province)]
        for col, group in POPULATION_GROUPS.items():
            people = subset[col].fillna(0)
            den = float(people.sum())
            for mode, flag in (("walk", "walk_desert"), ("drive", "drive_desert")):
                num = float(people[subset[flag]].sum())
                share = num / den if den else np.nan
                print(
                    f"STAT pg_{mode}_desert_share {province} {group} = "
                    f"{_pct(share)}"
                )

    # Pharmacy counts and people-per-pharmacy, from the pharmacy point set.
    pharmacies = gpd.read_file(PHARMACIES)
    pharmacies["province_key"] = pharmacies["PROVINCE"].map(normalize_province)
    province_pop = {
        "gauteng": float(gdf.loc[gdf["PR_NAME"].eq("Gauteng"), POP].sum()),
        "kzn": float(
            gdf.loc[gdf["PR_NAME"].eq("KwaZulu-Natal"), POP].sum()
        ),
    }
    for key, label in (("gauteng", "Gauteng"), ("kzn", "KwaZulu-Natal")):
        count = int((pharmacies["province_key"] == key).sum())
        pop = province_pop[key]
        people_per = pop / count if count else np.nan
        print(f"STAT pharmacy_count {label} = {count:,}")
        print(
            f"STAT people_per_pharmacy {label} = "
            f"{people_per:,.1f}" if np.isfinite(people_per) else
            f"STAT people_per_pharmacy {label} = n/a"
        )

    print_access_share(gdf)

    print_township_stats(gdf)


def normalize_province(value):
    """Map a pharmacy ``PROVINCE`` value to ``gauteng`` or ``kzn``.

    Mirrors ``normalizeProvince`` in ``src/components/N5.jsx``: lowercase and
    strip every non-letter character, so ``Kwazulu Natal`` and
    ``KwaZulu-Natal`` both map to ``kzn``.
    """
    if not isinstance(value, str):
        return None
    normalized = "".join(char for char in value.lower() if char.isalpha())
    if normalized == "gauteng":
        return "gauteng"
    if normalized == "kwazulunatal":
        return "kzn"
    return None


def print_access_share(gdf):
    """Print each group's share of the province's access index total.

    A group's access share is ``sum(ai * pop2023est) / sum(pop2023est)`` over
    the province, so it is comparable to the group's share of residents. The
    breakdown by majority Population Group excludes SALs with no group data.
    """
    print("\n# Access share: sum(ai * pop2023est) / province pop2023est")

    for province in PROVINCES:
        subset = gdf[gdf["PR_NAME"].eq(province)]
        total_pop = float(subset[POP].sum())
        if not total_pop:
            continue

        for mode, ai_col in (("walk", "wlk_ai"), ("drive", "drv_ai")):
            ai_total = float((subset[ai_col] * subset[POP]).sum())

            for settlement in SETTLEMENT_ORDER:
                group = subset[subset["settlement"].eq(settlement)]
                if group.empty:
                    continue
                group_pop = float(group[POP].sum())
                group_ai = float((group[ai_col] * group[POP]).sum())
                print(
                    f"STAT access_share {mode} {province} {settlement} = "
                    f"{_pct(group_ai / ai_total if ai_total else np.nan, 1)} "
                    f"(pop share {_pct(group_pop / total_pop, 1)})"
                )

            # Population Group breakdown over SALs with group data only.
            with_groups = subset[subset["majority_group"].notna()]
            ai_total_groups = float(
                (with_groups[ai_col] * with_groups[POP]).sum()
            )
            pop_total_groups = float(with_groups[POP].sum())

            for group in POPULATION_GROUPS.values():
                rows = with_groups[with_groups["majority_group"].eq(group)]
                if rows.empty:
                    continue
                group_pop = float(rows[POP].sum())
                group_ai = float((rows[ai_col] * rows[POP]).sum())
                print(
                    f"STAT access_share {mode} {province} {group} = "
                    f"{_pct(group_ai / ai_total_groups if ai_total_groups else np.nan, 1)} "
                    f"(pop share {_pct(group_pop / pop_total_groups if pop_total_groups else np.nan, 1)})"
                )


def _clean_value(value):
    """Return a JSON-safe scalar, or ``None`` for missing/non-finite values."""
    if value is None or pd.isna(value):
        return None
    if isinstance(value, (np.integer, np.floating, np.bool_)):
        value = value.item()
    if isinstance(value, float) and not np.isfinite(value):
        return None
    return value


def _rounded_value(value, digits):
    """Round a numeric value to ``digits`` decimals, or return ``None``."""
    if value is None or pd.isna(value):
        return None
    if isinstance(value, (np.integer, np.floating)):
        value = value.item()
    if isinstance(value, float) and not np.isfinite(value):
        return None
    rounded = round(float(value), digits)
    return int(rounded) if digits == 0 else rounded


def _round_coordinates(value):
    """Round every coordinate in a nested GeoJSON coordinate structure."""
    if isinstance(value, (list, tuple)):
        return [_round_coordinates(item) for item in value]
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return round(float(value), 6)
    return value


def _township_feature(row):
    """Build one GeoJSON feature with ordered, rounded v2 properties."""
    properties = {}
    for column in TOWNSHIP_PROPERTY_ORDER:
        if column == "EA_CODE":
            value = str(row["EA_CODE"])
        elif column in TOWNSHIP_ROUND_DIGITS:
            value = _rounded_value(row[column], TOWNSHIP_ROUND_DIGITS[column])
        else:
            value = _clean_value(row[column])
        properties[column] = value

    geometry = shapely_mapping(row.geometry)
    return {
        "type": "Feature",
        "properties": properties,
        "geometry": {
            "type": geometry["type"],
            "coordinates": _round_coordinates(geometry["coordinates"]),
        },
    }


def _write_feature_collection(path, features):
    """Write a compact (no-indentation) GeoJSON FeatureCollection."""
    payload = {"type": "FeatureCollection", "features": features}
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, separators=(",", ":"))


def write_townships(gdf):
    """Rewrite the two township polygon extracts from the v2 dataset.

    The SAL membership is read from the currently committed extracts before
    anything overwrites them, so the deep dive keeps its scope.
    """
    gdf = gdf[gdf.geometry.notna()].copy()
    gdf["_ea_code"] = gdf["EA_CODE"].astype(str)

    for name, path, expected in TOWNSHIP_TARGETS:
        codes = _township_codes(path)
        if len(codes) != expected:
            raise SystemExit(
                f"{name}: expected {expected} unique SAL codes in "
                f"{path.relative_to(ROOT)}, got {len(codes)}"
            )

        polygon = gdf.geometry.geom_type.isin(["Polygon", "MultiPolygon"])
        subset = gdf[gdf["_ea_code"].isin(codes) & polygon]
        by_code = {row["_ea_code"]: row for _, row in subset.iterrows()}

        missing = [code for code in codes if code not in by_code]
        if missing:
            preview = ", ".join(missing[:10])
            raise SystemExit(
                f"{name}: {len(missing)} SAL codes missing from the v2 source "
                f"(first few: {preview})"
            )

        features = [_township_feature(by_code[code]) for code in codes]
        _write_feature_collection(path, features)
        print(
            f"STAT wrote_township {name} = {len(features)} SALs "
            f"({path.relative_to(ROOT)})"
        )


def _province_point_feature(row):
    """Build one Point feature for a province SAL at its centroid."""
    properties = {}
    for column in PROVINCE_POINT_PROPERTY_ORDER:
        value = _clean_value(row[column])
        if column == "EA_CODE":
            value = str(row["EA_CODE"])
        properties[column] = value

    lat = _rounded_value(row["cent_lat"], 6)
    lng = _rounded_value(row["cent_lng"], 6)
    if lat is None or lng is None:
        raise SystemExit(
            f"Missing centroid for SAL {row['EA_CODE']} in {row['PR_NAME']}"
        )

    return {
        "type": "Feature",
        "properties": properties,
        "geometry": {"type": "Point", "coordinates": [lng, lat]},
    }


def write_province_points(gdf):
    """Rewrite the Gauteng and KwaZulu-Natal province point extracts.

    Each extract is a FeatureCollection of Point features, one per SAL, at the
    dataset's centroid coordinates. The two story sections that load these
    files switch to v2 field names in the same change, so the files must be
    rewritten together with the components.
    """
    gdf = gdf.copy()
    gdf["_ea_code"] = gdf["EA_CODE"].astype(str)

    for province_name, path in PROVINCE_POINT_TARGETS:
        subset = gdf[gdf["PR_NAME"].eq(province_name)].copy()
        if subset.empty:
            raise SystemExit(
                f"No {province_name} SALs found in the source dataset."
            )

        duplicate_count = int(subset["_ea_code"].duplicated().sum())
        if duplicate_count:
            raise SystemExit(
                f"{province_name}: {duplicate_count} duplicate EA_CODE values "
                f"cannot be written to {path.relative_to(ROOT)}."
            )

        features = [_province_point_feature(row) for _, row in subset.iterrows()]
        _write_feature_collection(path, features)
        print(
            f"STAT wrote_province_points {province_name} = {len(features)} SALs "
            f"({path.relative_to(ROOT)})"
        )


def _township_codes(path):
    """Read the unique ``EA_CODE`` values from a committed township extract."""
    gdf = gpd.read_file(path)
    if "EA_CODE" not in gdf.columns:
        raise SystemExit(f"Missing EA_CODE in {path.name}")
    return sorted(gdf["EA_CODE"].dropna().astype(str).unique())


def print_township_stats(gdf):
    """Print statistics for the two township SAL sets.

    The SAL membership is read from the currently committed extracts before
    any later ticket overwrites them, so the deep dive keeps its scope.
    """
    townships = {
        "Olievenhoutbosch": _township_codes(OLIEVENHOUTBOSCH),
        "KwaMashu": _township_codes(KWAMASHU),
    }

    pharmacies = gpd.read_file(PHARMACIES)

    for name, codes in townships.items():
        rows = gdf[gdf["EA_CODE"].astype(str).isin(codes)]
        found = set(rows["EA_CODE"].astype(str))
        missing = [code for code in codes if code not in found]
        if missing:
            print(
                f"WARNING: {name}: {len(missing)} SAL codes from the committed "
                f"extract are missing from the source dataset."
            )

        pop = float(rows[POP].sum())
        group_total = float(rows["group_total"].sum())

        print(f"\n# Township: {name}")
        print(f"STAT township_sal_count {name} = {len(codes):,}")
        print(f"STAT township_pop {name} = {pop / 1e6:.4f}M")

        for typology in ("Pharmacy Desert", "Connectivity Gap", "Demand Overcrowding", "Well-Served"):
            subset = rows[rows["wlk_type"].eq(typology)]
            count = len(subset)
            subset_pop = float(subset[POP].sum())
            print(
                f"STAT township_wlk_type {name} {typology} = count {count:,}, "
                f"population {_fmt_num(subset_pop)} "
                f"({_pct(subset_pop / pop if pop else np.nan, 1)})"
            )

        beyond = rows[rows["walk_beyond"]]
        print(f"STAT township_beyond_3km_walk_count {name} = {len(beyond):,}")
        print(
            f"STAT township_beyond_3km_walk_share {name} = "
            f"{_pct(len(beyond) / len(rows) if len(rows) else np.nan, 1)}"
        )

        for col, group in POPULATION_GROUPS.items():
            people = rows[col].fillna(0)
            people_sum = float(people.sum())
            share = people_sum / group_total if group_total else np.nan
            print(
                f"STAT township_pg {name} {group} = {_pct(share, 1)} "
                f"({_fmt_num(people_sum)} people, 2011)"
            )

        # Township-specific numbers the story copy quotes.
        walk_km = rows["wlk_k1_km"]
        max_walk = float(walk_km.max()) if walk_km.notna().any() else np.nan
        print(f"STAT township_max_walk_km {name} = {_fmt_num(max_walk, 1)}")

        for settlement in SETTLEMENT_ORDER:
            subset = rows[rows["settlement"].eq(settlement)]
            if subset.empty:
                continue
            settlement_pop = float(subset[POP].sum())
            settlement_area = float(subset["area_km2"].sum())
            density = (
                int(round(settlement_pop / settlement_area))
                if settlement_area
                else 0
            )
            print(
                f"STAT township_settlement_density {name} {settlement} = "
                f"{density:,}"
            )

        boundary = rows.geometry.union_all()
        pharmacy_count = int(pharmacies.geometry.within(boundary).sum())
        print(f"STAT township_pharmacy_count {name} = {pharmacy_count:,}")


def wrap_chart_label(settlement):
    """Return the chart label for a Settlement Type, wrapped if it is long."""
    return CHART_LABEL_WRAP.get(settlement, settlement)


def write_n2_charts(gdf):
    """Write the opening-section stacked bar charts for both provinces.

    Each record holds the Settlement Type label, a rounded population density,
    and five Population Group percentages. Percentages divide 2011 group counts
    by the 2011 group total, using only SALs that have group data.
    """
    targets = [
        ("Gauteng", ROOT / "public" / "data" / "chart_n2_gauteng.json"),
        ("KwaZulu-Natal", ROOT / "public" / "data" / "chart_n2_kzn.json"),
    ]

    for province, path in targets:
        province_rows = gdf[gdf["PR_NAME"].eq(province)]
        records = []

        for settlement in SETTLEMENT_ORDER:
            if settlement == NO_DWELLINGS:
                continue

            type_rows = province_rows[province_rows["settlement"].eq(settlement)]
            population = float(type_rows[POP].sum())
            if population <= 0:
                continue

            area = float(type_rows["area_km2"].sum())
            density = int(round(population / area)) if area > 0 else 0

            with_groups = type_rows[type_rows["group_total"].notna()]
            group_total = float(with_groups["group_total"].sum())
            if group_total <= 0:
                print(
                    f"WARNING: {province} {settlement}: {population:,.0f} "
                    f"residents but no Population Group data; bar skipped"
                )
                continue

            record = {
                "type": wrap_chart_label(settlement),
                "density": density,
            }
            for column, group in POPULATION_GROUPS.items():
                record[group] = int(
                    round(100 * float(with_groups[column].sum()) / group_total)
                )

            records.append(record)

        with path.open("w", encoding="utf-8") as handle:
            json.dump(records, handle, indent=2)

        print(
            f"STAT wrote_n2_chart {province} = {len(records)} bars "
            f"({path.relative_to(ROOT)})"
        )
        _print_density_warnings(province, records)


def _print_density_warnings(province, records):
    """Print the density sanity check as warnings, never as failures."""
    print(f"\nDensity sanity check ({province}):")
    for record in records:
        expected = EXPECTED_DENSITY_RANGES.get(record["type"])
        if not expected:
            continue
        lo, hi = expected
        status = (
            "ok"
            if lo <= record["density"] <= hi
            else f"!! OUTSIDE EXPECTED {lo}-{hi}"
        )
        print(f"  {record['type']:28s}  {record['density']:>6}  {status}")


def _tile_feature(row, fields):
    """Build one newline-delimited GeoJSON Feature for the tileset upload.

    Properties are limited to the allowlist, in allowlist order. Booleans stay
    booleans and nulls stay null; only coordinates are rounded.
    """
    properties = {}
    for column in fields:
        if column == "EA_CODE":
            properties[column] = str(row["EA_CODE"])
        else:
            properties[column] = _clean_value(row[column])

    geometry = shapely_mapping(row.geometry)
    return {
        "type": "Feature",
        "properties": properties,
        "geometry": {
            "type": geometry["type"],
            "coordinates": _round_coordinates(geometry["coordinates"]),
        },
    }


def write_tile_source(gdf):
    """Write the tileset upload file and the v2 recipe, and print upload commands.

    The upload file is newline-delimited GeoJSON with one polygon Feature per
    SAL and only the properties the ``/map`` page reads. The v2 recipe reuses
    the live recipe with the new source id, but keeps the literal ``USERNAME``
    placeholder for the account owner to substitute.
    """
    manifest = json.loads(TILE_FIELDS.read_text(encoding="utf-8"))
    source_layer = manifest.get("source_layer")
    fields = list(manifest.get("fields", []))
    if source_layer != "dair_sal":
        raise SystemExit(
            f"Unexpected source layer {source_layer!r} in {TILE_FIELDS.name}; "
            f"expected 'dair_sal'."
        )

    missing = [column for column in fields if column not in gdf.columns]
    if missing:
        raise SystemExit(
            f"Tile allowlist references fields missing from the source: {missing}"
        )

    features = []
    for _, row in gdf.iterrows():
        if row.geometry is None or pd.isna(row.geometry):
            raise SystemExit(f"Missing polygon geometry for SAL {row['EA_CODE']}")
        features.append(_tile_feature(row, fields))

    if len(features) != 38_380:
        raise SystemExit(
            f"Expected 38,380 tile features, got {len(features):,}."
        )

    with TILE_UPLOAD.open("w", encoding="utf-8") as handle:
        for feature in features:
            handle.write(json.dumps(feature, separators=(",", ":")) + "\n")

    size = TILE_UPLOAD.stat().st_size
    print(
        f"STAT wrote_tile_source = {len(features):,} features "
        f"({TILE_UPLOAD.relative_to(ROOT)}, {size:,} bytes)"
    )

    _write_recipe_v2(source_layer)
    _print_upload_commands()


def _write_recipe_v2(source_layer):
    """Write ``recipe.v2.json`` from ``recipe.json`` with the new source id."""
    recipe = json.loads(RECIPE.read_text(encoding="utf-8"))
    layers = recipe.get("layers")
    if not isinstance(layers, dict) or source_layer not in layers:
        raise SystemExit(
            f"Layer {source_layer!r} not found in {RECIPE.relative_to(ROOT)}."
        )

    layer = dict(layers[source_layer])
    layer["source"] = "mapbox://tileset-source/USERNAME/dair-sal-v2"
    layer["tiles"] = {"layer_size": 2000}
    layers[source_layer] = layer

    with RECIPE_V2.open("w", encoding="utf-8") as handle:
        json.dump(recipe, handle, indent=2)
        handle.write("\n")

    print(
        f"STAT wrote_recipe_v2 = {RECIPE_V2.relative_to(ROOT)} "
        f"(layer {source_layer}, minzoom {layer.get('minzoom')}, "
        f"maxzoom {layer.get('maxzoom')})"
    )


def _print_upload_commands():
    """Print the copy-pasteable Mapbox Tilesets CLI commands (never run them)."""
    print()
    print("Mapbox Tilesets CLI commands (replace <username> and <tileset>;")
    print("<tileset> defaults to pharm_access_v2). Run in PowerShell:")
    print()
    print(
        '  $env:MAPBOX_ACCESS_TOKEN = "<your sk. token with tilesets:write>"'
        "   # shell only, never in a file"
    )
    print("  tilesets upload-source <username> dair-sal-v2 "
          "public/data/sal_tiles.geojson.ld")
    print('  tilesets create <username>.<tileset> --recipe '
          'public/data/recipe.v2.json --name "Pharmacy Access v2"')
    print("  tilesets publish <username>.<tileset>")
    print("  tilesets status <username>.<tileset>")
    print()
    print(
        "Substitute the recipe username (writes the gitignored recipe.local.json):"
    )
    print(
        "  (Get-Content public/data/recipe.v2.json) "
        "-replace 'USERNAME','<username>' | Set-Content recipe.local.json"
    )


def main(argv=None):
    parser = argparse.ArgumentParser(
        description=(
            "Load the canonical v2 SAL dataset, verify the notebook's headline "
            "numbers, print every statistic the story and report quote, and "
            "rewrite the derived public-data extracts."
        )
    )
    parser.add_argument(
        "--source",
        default=str(DEFAULT_SOURCE),
        help="Path to the canonical dataset "
             "(default: public/data/sal_combined_access.geojson)",
    )
    parser.add_argument(
        "--no-write",
        action="store_true",
        help="Do not write derived files.",
    )
    args = parser.parse_args(argv)

    gdf = load(args.source)
    gdf = add_derived(gdf)
    verify_headline(gdf)
    print_statistics(gdf)

    if not args.no_write:
        write_n2_charts(gdf)
        write_province_points(gdf)
        write_townships(gdf)
        write_tile_source(gdf)


if __name__ == "__main__":
    main(sys.argv[1:])
