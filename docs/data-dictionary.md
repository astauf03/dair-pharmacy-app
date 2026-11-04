# Data Dictionary

This dataset has one row per SAL in Gauteng and KwaZulu-Natal (38,380 SALs). The canonical file is `sal_combined_access.geojson`. Field names fit the shapefile 10-character limit; the `full_name` column gives the long name for each field.

## Conventions

- 2023 population is modeled: Ward totals are apportioned to SALs.
- Population Group and age counts are 2011 Census.
- A null distance means no pharmacy is reachable within 50 km.
- The threshold flags are `false` for unreachable SALs, so the site recomputes "beyond threshold" from the distances.
- `EA_TYPE` values ending in `_*` are SALs with no dwellings in 2011.

## Identifier

| Field | Full Name | Type | Units | Description | Source |
| --- | --- | --- | --- | --- | --- |
| `EA_CODE` | EA_CODE | integer |  | Small Area Layer (SAL) identifier, 8-digit Stats SA code. Primary key. | Stats SA 2011 Census (SAL attributes) |

## Geography

| Field | Full Name | Type | Units | Description | Source |
| --- | --- | --- | --- | --- | --- |
| `PR_NAME` | PR_NAME | string |  | Province name: Gauteng or KwaZulu-Natal. | Stats SA 2011 Census (SAL attributes) |
| `WardID` | WardID | integer |  | 2020 ward (8-digit Stats SA code) the SAL is assigned to. | ArcGIS Pro spatial join; NB01 sal_w_ward_deduplication.ipynb |
| `SP_CODE` | SP_CODE | integer |  | Sub-place code. | Stats SA 2011 Census (SAL attributes) |
| `SP_NAME` | SP_NAME | string |  | Sub-place name. | Stats SA 2011 Census (SAL attributes) |
| `MP_CODE` | MP_CODE | integer |  | Main place code. | Stats SA 2011 Census (SAL attributes) |
| `MP_NAME` | MP_NAME | string |  | Main place name. | Stats SA 2011 Census (SAL attributes) |
| `MN_MDB_C` | MN_MDB_C | string |  | Municipal Demarcation Board code for the local or metropolitan municipality (e.g. KZN213, JHB). | Stats SA 2011 Census (SAL attributes) |
| `MN_CODE` | MN_CODE | integer |  | Stats SA numeric municipality code. | Stats SA 2011 Census (SAL attributes) |
| `MN_NAME` | MN_NAME | string |  | Municipality name. | Stats SA 2011 Census (SAL attributes) |
| `MN_TYPE` | MN_TYPE | string |  | Municipality category: METRO (Category A metropolitan) or CATB (Category B local municipality). | Stats SA 2011 Census (SAL attributes) |
| `DC_MDB_C` | DC_MDB_C | string |  | Municipal Demarcation Board code for the district municipality (e.g. DC21); metros carry their own metro code (e.g. ETH). | Stats SA 2011 Census (SAL attributes) |
| `DC_MN_C` | DC_MN_C | integer |  | Stats SA numeric district code. | Stats SA 2011 Census (SAL attributes) |
| `DC_NAME` | DC_NAME | string |  | District municipality (or metro) name. | Stats SA 2011 Census (SAL attributes) |

## Settlement

| Field | Full Name | Type | Units | Description | Source |
| --- | --- | --- | --- | --- | --- |
| `EA_GTYPE` | EA_GTYPE | string |  | Geographic type: Urban, Traditional, or Farms. | Stats SA 2011 Census (SAL attributes) |
| `EA_TYPE` | EA_TYPE | string |  | Neighborhood type (e.g. Suburb, Township, Traditional residential, Informal residential, Vacant). Unsuffixed values use DAIR's class names, which split Stats SA's 'Formal residential' into Suburb and Township. Values ending in '_*' (1,289 SALs) keep Stats SA's original 2011 type names (e.g. 'Formal residential_*', 'Small holdings_*' vs. DAIR's 'Smallholdings') and coincide with SALs that had no dwellings enumerated in 2011: all have num_houses = 0, they include all 1,270 zero-population SALs, and none has an econ_stat. The suffix is not defined in the dataset metadata; confirm its meaning with DAIR. | DAIR Legacy of Spatial Apartheid Dataset (Sefala 2024, doi:10.7910/DVN/JRYYNM) |
| `econ_stat` | econ_status | string |  | DAIR neighborhood grouping: Wealthy (suburb, smallholdings, farm); Non_Wealthy (township, informal area, collective living quarters, village); Non_Residential (industrial, commercial, parks and recreation, vacant). Null for the 1,289 SALs whose EA_TYPE ends in '_*'. | DAIR Legacy of Spatial Apartheid Dataset (Sefala 2024, doi:10.7910/DVN/JRYYNM) (F4_class); via NB02 tess_newpred_clean.ipynb |
| `area_km2` | area_km2 | float | km2 | SAL polygon area. | NB08 combine_access_score_network_threshold.ipynb |

## Population

| Field | Full Name | Type | Units | Description | Source |
| --- | --- | --- | --- | --- | --- |
| `pop2023est` | sal2023_est | float | persons | Modeled 2023 SAL population: the SAL's share of its ward's 2011 population multiplied by the ward's 2022 Census total (the 2022 Census was published in 2023). Sums exactly to the ward totals. | NB02 tess_newpred_clean.ipynb |
| `pop2011` | sal2011_pop | float | persons | 2011 Census SAL total population; basis for the step-down model. | Stats SA 2011 Census (SAL attributes) |
| `growth_rt` | growth_rate | float | proportion per year | Compound annual growth rate, 2011-2023: (pop2023est / pop2011)^(1/12) - 1. Null where pop2011 = 0 (1,270 SALs). | NB02 tess_newpred_clean.ipynb |
| `pop2011sum` | pop_total_2011 | float | persons | 2011 total population calculated as the sum of the five population-group columns. Differs slightly from pop2011 in most SALs; null for 2,084 SALs with no population-group data. | NB08 combine_access_score_network_threshold.ipynb |
| `Black_Afr` | Black_African | float | persons | 2011 Census Black African population. Null for 2,084 SALs. | Stats SA 2011 Census (SAL attributes) |
| `White` | White | float | persons | 2011 Census White population. Null for 2,084 SALs. | Stats SA 2011 Census (SAL attributes) |
| `Coloured` | Coloured | float | persons | 2011 Census Coloured population. Null for 2,084 SALs. | Stats SA 2011 Census (SAL attributes) |
| `Ind_Asian` | Indian_Asian | float | persons | 2011 Census Indian or Asian population. Null for 2,084 SALs. | Stats SA 2011 Census (SAL attributes) |
| `Other` | Other | float | persons | 2011 Census Other population group. Null for 2,084 SALs. | Stats SA 2011 Census (SAL attributes) |
| `pop_0_14` | pop_0_14 | float | persons | 2011 population aged 0-14. Null for 2,084 SALs. | NB08 combine_access_score_network_threshold.ipynb (aggregated from Stats SA age columns) |
| `pop_15_34` | pop_15_34 | float | persons | 2011 population aged 15-34. Null for 2,084 SALs. | NB08 combine_access_score_network_threshold.ipynb (aggregated from Stats SA age columns) |
| `pop_35_49` | pop_35_49 | float | persons | 2011 population aged 35-49. Null for 2,084 SALs. | NB08 combine_access_score_network_threshold.ipynb (aggregated from Stats SA age columns) |
| `pop_50_64` | pop_50_64 | float | persons | 2011 population aged 50-64. Null for 2,084 SALs. | NB08 combine_access_score_network_threshold.ipynb (aggregated from Stats SA age columns) |
| `pop_65plus` | pop_65plus | float | persons | 2011 population aged 65 and over. Null for 2,084 SALs. | NB08 combine_access_score_network_threshold.ipynb (aggregated from Stats SA age columns) |
| `num_houses` | num_houses | float | count | Residential structures enumerated in the 2011 Census. | Stats SA 2011 Census (SAL attributes) |
| `num_build` | num_build | float | count | Count of building footprints within the SAL. Explored for dasymetric weighting but not used in the population model, because footprint detection is less reliable in rural areas. | Google Open Buildings v3 |

## 2SFCA

| Field | Full Name | Type | Units | Description | Source |
| --- | --- | --- | --- | --- | --- |
| `wlk_ai` | Ai_walk | float | score | Enhanced 2SFCA walking accessibility score (decay beta = 0.0003; catchment 2 km in Gauteng, 3 km in KZN). 0 = no pharmacy reachable on the walk network within the catchment. Heavily zero-inflated and right-skewed. | NB04 tess_2sfca_clean.ipynb |
| `drv_ai` | Ai_drive | float | score | Enhanced 2SFCA driving accessibility score (decay beta = 0.0003; catchment 5 km in Gauteng, 10 km in KZN). 0 = no pharmacy reachable on the drive network within the catchment. | NB04 tess_2sfca_clean.ipynb |
| `wlk_ai_pct` | walk_rank | float | 0-1 | Percentile rank of wlk_ai among SALs with a nonzero score, within province. 0 where wlk_ai = 0. | Derived from Ai_walk |
| `drv_ai_pct` | drive_rank | float | 0-1 | Percentile rank of drv_ai among SALs with a nonzero score, within province. 0 where drv_ai = 0. | Derived from Ai_drive |
| `wlk_ai_log` | walk_log | float | ln(score) | Natural log of (1 + wlk_ai); compresses the skewed score for mapping. | Derived from Ai_walk |
| `drv_ai_log` | drive_log | float | ln(score) | Natural log of (1 + drv_ai); compresses the skewed score for mapping. | Derived from Ai_drive |

## Typology

| Field | Full Name | Type | Units | Description | Source |
| --- | --- | --- | --- | --- | --- |
| `wlk_type` | walk_typology | string |  | 6-category walking access typology. Crosses the wlk_ai tier (zero; bottom tercile of nonzero scores; above the bottom tercile, with terciles computed within province) with whether the nearest pharmacy is under 3 km on the walk network. Zero + near = Connectivity Gap; zero + far = Pharmacy Desert; bottom tercile + near = Demand Overcrowding; bottom tercile + far = Access Gap; above bottom tercile + near = Well-Served; above bottom tercile + far = Artifact Zone. SALs with no reachable pharmacy count as far. | NB08 combine_access_score_network_threshold.ipynb |
| `drv_type` | drive_typology | string |  | 6-category driving access typology, built the same way as wlk_type from drv_ai and a 10 km drive-distance threshold. Values: Pharmacy Desert; Connectivity Gap; Demand Overcrowding; Access Gap; Well-Served; Artifact Zone. | NB08 combine_access_score_network_threshold.ipynb |
| `wlk_type3` | walk_3_typology | string |  | 3-category walking access tier from wlk_ai alone, within province: Pharmacy Desert = wlk_ai is 0 or in the bottom tercile of nonzero scores; Moderate Access = middle tercile; Served = top tercile. Uses the same tercile cutoffs as wlk_type. Ignores distance, so it inherits the score's zero-inflation. | Tier rule from NB04 tess_2sfca_clean.ipynb; recomputed in this script |
| `drv_type3` | drive_3_typology | string |  | 3-category driving access tier from drv_ai alone, built the same way as wlk_type3. Values: Pharmacy Desert; Moderate Access; Served. | Tier rule from NB04 tess_2sfca_clean.ipynb; recomputed in this script |

## Distance

| Field | Full Name | Type | Units | Description | Source |
| --- | --- | --- | --- | --- | --- |
| `wlk_k1_km` | walk_dist_k1_km | float | km | Walk-network distance from the SAL centroid to the nearest pharmacy. Null if no pharmacy is reachable within the 50 km routing cutoff. | NB06 sal_pharmacy_distance_k3.ipynb |
| `wlk_k2_km` | walk_dist_k2_km | float | km | Walk-network distance from the SAL centroid to the 2nd-nearest pharmacy. Null if no pharmacy is reachable within the 50 km routing cutoff. | NB06 sal_pharmacy_distance_k3.ipynb |
| `wlk_k3_km` | walk_dist_k3_km | float | km | Walk-network distance from the SAL centroid to the 3rd-nearest pharmacy. Null if no pharmacy is reachable within the 50 km routing cutoff. | NB06 sal_pharmacy_distance_k3.ipynb |
| `drv_k1_km` | drive_dist_k1_km | float | km | Drive-network distance from the SAL centroid to the nearest pharmacy. Null if no pharmacy is reachable within the 50 km routing cutoff. | NB06 sal_pharmacy_distance_k3.ipynb |
| `drv_k2_km` | drive_dist_k2_km | float | km | Drive-network distance from the SAL centroid to the 2nd-nearest pharmacy. Null if no pharmacy is reachable within the 50 km routing cutoff. | NB06 sal_pharmacy_distance_k3.ipynb |
| `drv_k3_km` | drive_dist_k3_km | float | km | Drive-network distance from the SAL centroid to the 3rd-nearest pharmacy. Null if no pharmacy is reachable within the 50 km routing cutoff. | NB06 sal_pharmacy_distance_k3.ipynb |
| `euc_k1_km` | euclidean_dist_k1_km | float | km | Straight-line (Euclidean) distance from the SAL centroid to the nearest pharmacy. | NB06 sal_pharmacy_distance_k3.ipynb |
| `euc_k2_km` | euclidean_dist_k2_km | float | km | Straight-line (Euclidean) distance from the SAL centroid to the 2nd-nearest pharmacy. | NB06 sal_pharmacy_distance_k3.ipynb |
| `euc_k3_km` | euclidean_dist_k3_km | float | km | Straight-line (Euclidean) distance from the SAL centroid to the 3rd-nearest pharmacy. | NB06 sal_pharmacy_distance_k3.ipynb |
| `wlk_circ` | walk_circuity_k1 | float | ratio | Walk-network distance / straight-line distance to the nearest pharmacy. 1.2-1.5 is typical for urban grids; above 3 suggests network gaps or physical barriers. Null where wlk_k1_km is null. | NB06 sal_pharmacy_distance_k3.ipynb |
| `drv_circ` | drive_circuity_k1 | float | ratio | Drive-network distance / straight-line distance to the nearest pharmacy. Null where drv_k1_km is null. | NB06 sal_pharmacy_distance_k3.ipynb |

## Data quality

| Field | Full Name | Type | Units | Description | Source |
| --- | --- | --- | --- | --- | --- |
| `wlk_snap_m` | walk_snap_dist_m | float | m | Straight-line distance from the SAL centroid to the walk-network node it snaps to. Larger values mean routing starts from a displaced origin. | NB05 snap_distance_append.ipynb |
| `drv_snap_m` | drive_snap_dist_m | float | m | Straight-line distance from the SAL centroid to the drive-network node it snaps to. | NB05 snap_distance_append.ipynb |
| `wlk_snapfl` | walk_snap_flag | boolean |  | True if wlk_snap_m > 500 m: walk results carry high measurement uncertainty. | NB08 combine_access_score_network_threshold.ipynb |
| `drv_snapfl` | drive_snap_flag | boolean |  | True if drv_snap_m > 500 m: drive results carry high measurement uncertainty. | NB08 combine_access_score_network_threshold.ipynb |

## Threshold flag

| Field | Full Name | Type | Units | Description | Source |
| --- | --- | --- | --- | --- | --- |
| `wk1_gt1km` | exceeds_walk_k1_1km | boolean |  | True if the nearest pharmacy is more than 1 km away (walk-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `wk1_gt2km` | exceeds_walk_k1_2km | boolean |  | True if the nearest pharmacy is more than 2 km away (walk-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `wk1_gt3km` | exceeds_walk_k1_3km | boolean |  | True if the nearest pharmacy is more than 3 km away (walk-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `wk1_gt5km` | exceeds_walk_k1_5km | boolean |  | True if the nearest pharmacy is more than 5 km away (walk-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `dk1_gt5km` | exceeds_drive_k1_5km | boolean |  | True if the nearest pharmacy is more than 5 km away (drive-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `dk1_gt10km` | exceeds_drive_k1_10km | boolean |  | True if the nearest pharmacy is more than 10 km away (drive-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `dk1_gt15km` | exceeds_drive_k1_15km | boolean |  | True if the nearest pharmacy is more than 15 km away (drive-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `dk1_gt20km` | exceeds_drive_k1_20km | boolean |  | True if the nearest pharmacy is more than 20 km away (drive-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `ek1_gt1km` | exceeds_euclidean_k1_1km | boolean |  | True if the nearest pharmacy is more than 1 km away (straight-line (euclidean) distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `ek1_gt3km` | exceeds_euclidean_k1_3km | boolean |  | True if the nearest pharmacy is more than 3 km away (straight-line (euclidean) distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `ek1_gt5km` | exceeds_euclidean_k1_5km | boolean |  | True if the nearest pharmacy is more than 5 km away (straight-line (euclidean) distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `ek1_gt10km` | exceeds_euclidean_k1_10km | boolean |  | True if the nearest pharmacy is more than 10 km away (straight-line (euclidean) distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `wk2_gt1km` | exceeds_walk_k2_1km | boolean |  | True if the 2nd-nearest pharmacy is more than 1 km away (walk-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `wk2_gt2km` | exceeds_walk_k2_2km | boolean |  | True if the 2nd-nearest pharmacy is more than 2 km away (walk-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `wk2_gt3km` | exceeds_walk_k2_3km | boolean |  | True if the 2nd-nearest pharmacy is more than 3 km away (walk-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `wk2_gt5km` | exceeds_walk_k2_5km | boolean |  | True if the 2nd-nearest pharmacy is more than 5 km away (walk-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `dk2_gt5km` | exceeds_drive_k2_5km | boolean |  | True if the 2nd-nearest pharmacy is more than 5 km away (drive-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `dk2_gt10km` | exceeds_drive_k2_10km | boolean |  | True if the 2nd-nearest pharmacy is more than 10 km away (drive-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `dk2_gt15km` | exceeds_drive_k2_15km | boolean |  | True if the 2nd-nearest pharmacy is more than 15 km away (drive-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `dk2_gt20km` | exceeds_drive_k2_20km | boolean |  | True if the 2nd-nearest pharmacy is more than 20 km away (drive-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `ek2_gt1km` | exceeds_euclidean_k2_1km | boolean |  | True if the 2nd-nearest pharmacy is more than 1 km away (straight-line (euclidean) distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `ek2_gt3km` | exceeds_euclidean_k2_3km | boolean |  | True if the 2nd-nearest pharmacy is more than 3 km away (straight-line (euclidean) distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `ek2_gt5km` | exceeds_euclidean_k2_5km | boolean |  | True if the 2nd-nearest pharmacy is more than 5 km away (straight-line (euclidean) distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `ek2_gt10km` | exceeds_euclidean_k2_10km | boolean |  | True if the 2nd-nearest pharmacy is more than 10 km away (straight-line (euclidean) distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `wk3_gt1km` | exceeds_walk_k3_1km | boolean |  | True if the 3rd-nearest pharmacy is more than 1 km away (walk-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `wk3_gt2km` | exceeds_walk_k3_2km | boolean |  | True if the 3rd-nearest pharmacy is more than 2 km away (walk-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `wk3_gt3km` | exceeds_walk_k3_3km | boolean |  | True if the 3rd-nearest pharmacy is more than 3 km away (walk-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `wk3_gt5km` | exceeds_walk_k3_5km | boolean |  | True if the 3rd-nearest pharmacy is more than 5 km away (walk-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `dk3_gt5km` | exceeds_drive_k3_5km | boolean |  | True if the 3rd-nearest pharmacy is more than 5 km away (drive-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `dk3_gt10km` | exceeds_drive_k3_10km | boolean |  | True if the 3rd-nearest pharmacy is more than 10 km away (drive-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `dk3_gt15km` | exceeds_drive_k3_15km | boolean |  | True if the 3rd-nearest pharmacy is more than 15 km away (drive-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `dk3_gt20km` | exceeds_drive_k3_20km | boolean |  | True if the 3rd-nearest pharmacy is more than 20 km away (drive-network distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `ek3_gt1km` | exceeds_euclidean_k3_1km | boolean |  | True if the 3rd-nearest pharmacy is more than 1 km away (straight-line (euclidean) distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `ek3_gt3km` | exceeds_euclidean_k3_3km | boolean |  | True if the 3rd-nearest pharmacy is more than 3 km away (straight-line (euclidean) distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `ek3_gt5km` | exceeds_euclidean_k3_5km | boolean |  | True if the 3rd-nearest pharmacy is more than 5 km away (straight-line (euclidean) distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |
| `ek3_gt10km` | exceeds_euclidean_k3_10km | boolean |  | True if the 3rd-nearest pharmacy is more than 10 km away (straight-line (euclidean) distance). False where that distance is null (no pharmacy reachable within 50 km), so unreachable SALs are NOT counted as exceeding, despite the README's stated NaN rule. | NB07 network_threshold.ipynb |

## Location

| Field | Full Name | Type | Units | Description | Source |
| --- | --- | --- | --- | --- | --- |
| `cent_lat` | centroid_lat | float | decimal degrees | Latitude of the SAL geometric centroid (WGS84; computed in EPSG:32735). | NB06 sal_pharmacy_distance_k3.ipynb |
| `cent_lng` | centroid_lng | float | decimal degrees | Longitude of the SAL geometric centroid (WGS84; computed in EPSG:32735). | NB06 sal_pharmacy_distance_k3.ipynb |

