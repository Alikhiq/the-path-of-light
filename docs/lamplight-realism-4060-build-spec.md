# Bayt al-Nūr / "The Path of Light" — UE5.8 Build Specification
## Lamplight Realism (T5 ceiling), RTX 4060 Laptop, baked/mixed lighting

*This is the single authoritative build spec. All six dimension verdicts are folded into the FINAL numbers below — where a fragment and its verdict disagreed, the corrected value is what appears here. Constraint reminders and reconciled conflicts are flagged inline. Hand this straight to the editor-driving agent; Ali's manual jobs are batched in §5.*

---

## 1. The Look & The Hard Budget

**Look.** Abbasid Baghdad at night: heavy, height-graded atmospheric fog; warm 2200 K oil-lamp gold pools (#D9A84E / #F0C46B) as small islands in an ocean of moon-navy shadow (#0B1B3A / #060B18), with teal (#2B7A78) glazed tile and ochre (#7A5C3E) mudbrick. Real, ordinary human faces lit by the two-light doctrine (2200 K gold lamps vs 7000 K navy moon), grounded by contact/capsule shadows and baked AO, graded to a split-tone LUT (warm highlights, teal-navy shadows). The 14 Maʿṣūmīn / Allah / angels are **never given a face and never cast a shadow** — they are enforced as light only (blown-out emissive over bloom, a mashrabiya Kufic light-pool, or off-frame threshold glow), structurally incapable of showing a face because the emitter has no head geometry and `Cast Shadow = OFF`.

**Hard budget.** Locked **30 fps (33.3 ms; target ≤30 ms GPU, ~3 ms safety)** at **1080p output rendered from ~1280×720 internal (r.ScreenPercentage ≈ 66.6) upscaled by TSR** (DLSS is an optional human-installed upgrade, not the baseline). **8 GB VRAM — budget against ~6.5 GB usable** after Win11/DWM/compositor overhead; the "8 GB is comfortable" framing is retired. **No runtime ray tracing, no Nanite, no Lumen, no Virtual Shadow Maps, no Mesh Distance Fields** in the shipped frame.

**The one load-bearing correction that governs everything below:** GPU Lightmass — the entire baked-GI scheme — is built on the hardware-ray-tracing path and is *greyed out* unless **Support Hardware Ray Tracing = TRUE**. So RT support is **ON in the editor you bake in**, while every *runtime* RT feature stays off and the shipped/packaged build forces `r.RayTracing=0` via a device profile. "No RT" is a **runtime** constraint, satisfied by baking with RT cores and shipping a pure-raster frame. (Alternative only if RT support must stay off: legacy CPU Lightmass — bakes go from minutes to hours; choose one path, you cannot have RT-support-off *and* GPU-Lightmass-in-minutes.)

---

## 2. Dimension Specs (final settings)

### 2.1 Lighting & GI

The scheme: baked GI via **GPU Lightmass**, carried onto moving characters by the **Volumetric Lightmap**, with the entire dynamic-shadow budget spent on **2–4 STATIONARY hero lamps**; everything else is STATIC (baked, free) or non-shadow aura light. Night + heavy Exponential Height Fog + Volumetric Fog gives the gold god-ray shafts; light-function spots project the Kufic/mashrabiya pools.

| Setting | FINAL value | Notes |
|---|---|---|
| **Support Hardware Ray Tracing** | **TRUE** (+ Support Compute Skin Cache TRUE, DX12/SM6) | **Corrected from FALSE.** Required for GPU Lightmass to exist. All *runtime* RT features stay off; ship with `r.RayTracing=0` device profile. |
| Allow Static Lighting | TRUE (`r.AllowStaticLighting=1`) | Single master switch; if off, all lightmaps silently do nothing. Verify before every bake. |
| Dynamic GI Method | None (`r.DynamicGlobalIlluminationMethod=0`) + `r.Lumen.DiffuseIndirect.Allow=0`, `r.Lumen.Reflections.Allow=0` | No Lumen. GI = baked lightmaps + volumetric lightmap. |
| Reflection Method | Screen Space (`r.ReflectionMethod=2`) | SSR for on-screen; **Reflection Captures for off-screen fallback (see below)**. |
| Nanite | Off (`r.Nanite.ProjectEnabled=False`) | Mid-poly + hand LODs. |
| Shadow Map Method | Shadow Maps, **not** Virtual (`r.Shadow.Virtual.Enable=0`) | VSM is Nanite/Lumen-paired, heavy on 8 GB. Verify via SearchCVars (defaults ON in newer UE). |
| Mesh Distance Fields | **Off** (`r.GenerateMeshDistanceFields=False`) | **Added.** DFAO/DF-shadows all unused → reclaims 200–500 MB VRAM (≈ the entire claimed headroom). Contact + capsule shadows do not use DF. |
| Substrate | Off (verify via SearchCVars) | If project was created with Substrate on, disabling needs a full reshader + restart; VRAM/ms numbers assume OFF. |
| **GPU Lightmass — bake** | Enable plugin. Iterate at **GI Samples = 128 (Preview)**; final **512** either off-machine or **per-sublevel** to stay under 8 GB | **Corrected.** Bake-time VRAM (not runtime) is the real 8 GB chokepoint; 512 hero-courtyard bakes run ~10–40 min and can OOM. |
| World Settings Lightmass | Indirect Bounces 4, Sky Bounces 2, Indirect Quality 2 (4 hero courtyards), Smoothness 0.9, Use AO TRUE (Direct 0.3 / Indirect 1.0 / Exp 1.2 / MaxDist 150), Environment Color ≈ #060B18, Environment Intensity 0.4, Compress Lightmaps TRUE | Warm gold wraps off mudbrick, dies into navy; navy floor never dead-black. |
| **Volumetric Lightmap** | Detail Cell Size 100 global; **≥50** inside tight Lightmass Importance Volumes (raise hero to **75** first if bake OOMs). Static Lighting Level Scale 1.0 (0.6 hero, restore to 1.0 before cutting content if OOM) | **THE character-GI setting.** Below 50 explodes bake memory. A Lightmass Importance Volume is mandatory or movable NPCs read black in shadow. |
| Lightmap res per mesh | Hero walls 128–256, floor/carpet 128, arches 128, hero props 64, background 32–64; **hero ≤256, background ≤64–128**; target ~200–400 MB/courtyard | **Corrected up** from 120–180 MB. Lightmaps + shadow atlas — not streamed textures — are the real 8 GB pressure. |
| **Moon — Directional Light** | **Mobility STATIONARY** (not Static), 7000 K, ~0.15 lux, Volumetric Scattering 1.0 | **Corrected.** Only Stationary/Movable lights inject into the volumetric-fog froxel grid; a Static moon produces **zero** god-ray shafts. Near-zero runtime shadow cost at night in fog. |
| Sky Light | Stationary, Specified Cubemap (navy star cubemap), Intensity 0.05, Lower Hemisphere Solid TRUE, Cast Shadows FALSE, recapture after final placement | Dim cool ambient fill so navy shadows hold shape. |
| **Hero lamps (gold pools)** | 2–4, **Stationary**, Point/Spot, Candelas + Inverse-Square, ~40 cd, 2200 K → #D9A84E, Attenuation 350–500 cm, Source Radius 4 cm, **Cast Shadows TRUE**, Contact Shadow 0.06, Volumetric Scattering 1.5 | Spend the ENTIRE dynamic-shadow budget. **≤2 of these cast dynamic shadows onto characters** (see Geometry). |
| Decorative lamps | Unlimited, **Static**, same look, Cast Shadows OFF (baked), 250–400 cm | "Many gold pools in an ocean of navy" at zero runtime cost. |
| Brazier | Stationary, 2000 K, Source Radius 12 cm, ~60 cd, Volumetric Scattering 2.0, Cast Shadows TRUE, flicker ±8 % at 4–7 Hz via BP timeline / light-function noise | Warmest, softest source. |
| Kufic / lattice pools | Spot, Stationary (Presence spot Movable), Light-Function material sampling Kufic BC4 alpha, Outer Cone ~35°, Volumetric Scattering 2–3, 2400 K. Keep to **1–2 per scene** | Light functions only apply to Stationary/Movable (Static ignores them). |
| **Reflection Captures** | **NEW — 1 Sphere per courtyard + 1 per hero alcove, Static, recapture after final placement** | **Added.** SSR alone leaves off-screen/edge/grazing pixels reflecting only the dim navy sky cubemap; captures deliver the glazed-tile/wet-stone brief. ~20–60 MB, ~0 ms runtime, MCP-spawnable. |
| Stationary Overlap | ≤4 overlapping stationary lights per pixel; verify green in Stationary Light Overlap viewmode before every bake | The 5th silently demotes to fully-dynamic unshadowed — perf cliff + look bug. |
| **Exponential Height Fog** | 1/level. Density 0.035, Height Falloff 0.18, Inscattering #0B1B3A, Start 200, Directional Inscattering moon-hued Exp 4. Second fog layer Density 0.02 / Falloff 0.3 (**non-volumetric — no shafts in the ground skirt**) | Cheap height fog does the sightline-kill/culling. |
| **Volumetric Fog** | On the height fog. Scattering Distribution 0.2, Albedo white, Extinction 1.5, View Distance 6000. **Ship default `r.VolumetricFog.GridPixelSize=16`, `GridSizeZ=64`.** Reserve **8/128 for locked cinematics only** | **Corrected.** 8/128 with several volumetric lamps through dual fog is the single heaviest per-frame cost and the most likely sub-30 spike. |
| Night sky | Unlit emissive star-dome mesh behind fog (matte-painting card). No runtime SkyAtmosphere/volumetric clouds | Fog hides the card edges. |
| Auto-exposure | **Manual (locked EV100) for hero/cinematic; free-roam Histogram, Comp −0.75, Min EV100 −1.5, Max EV100 2.0.** Lock per space *before* tuning any rim/emissive value | Unclamped eye-adaptation daylights the navy and blows the gold; also the prerequisite for aura/Presence legibility. |
| Local Exposure | Highlight Contrast 0.8, Shadow Contrast 0.8, Detail 1.0 | Holds gold flame and navy detail in the same frame. |
| Tonemapper + grade | Filmic/ACES + project split-tone LUT. Shadows→navy/teal, Highlights→gold, Global Sat 0.95, Shadows Gamma slightly raised | The two-light doctrine baked into every pixel, including fully-baked areas. |
| Bloom | Standard, **Intensity ~0.6, Threshold ~1.0** | Only flames + Presence (8–24× emissive) blow out; aura rims (≤1.5) stay crisp. Convolution bloom reserved for pre-rendered hero shots. |
| SSAO + grain + vignette | GTAO (HIGH), AO 0.5 / R 50, Film Grain 0.15, Vignette 0.35, Motion Blur 0.15, CA 0.1 | Dynamic contact darkening (no DFAO); grain dithers navy banding. |
| Character grounding | Capsule Indirect Shadow ON (all), Capsule Direct Shadow ON hero only, dynamic per-lamp character shadow on **one** key light | Cheap contact with DF off. |

---

### 2.2 Geometry & LOD

**Reframed:** geometry is **not** the frame governor — a 4060 rasterizes 2.5 M tris in well under 1 ms. The 33.3 ms is spent on volumetric fog, shadow-depth re-skin, SSS, SSR, translucency and TSR. Geometry has headroom; the caps below exist to protect the *draw-call*, *skinning* and *VRAM* budgets, not triangle throughput.

| Setting | FINAL value | Notes |
|---|---|---|
| Per-frame tris | 2.5 M avg / 4.0 M peak | Huge headroom; not the constraint. |
| Resident tris/cell | ≤1.5 M authored | Precomputed visibility + solid-wall occlusion removes 35–50 %. |
| Hero teaching NPC | 30–35 k (head 8–12 k, hair 4–6 k, robe 10–14 k) | Real face is non-negotiable; only 1–3 on screen. |
| Named/secondary NPC | 15–20 k, one 2K set | LOD1 when not dialogue focus. |
| Crowd citizen | 5–7 k, shared 1–2K atlas | Forced LOD1/2 past ~6 m; **no aura material** (see reverence guardrail). |
| **Max animated skeletal meshes** | **10–12 (≤3 hero LOD0)** — **plus Animation Budget Allocator ON, URO enabled (reduce eval rate past ~8–10 m / off-screen), crowd anim ticked at reduced rate, per-bone/skeletal motion blur OFF** | **Corrected reasoning + levers.** The wall is CPU anim-eval + shadow re-skin, not GPU skinning. URO/ABA are the real character-count levers. |
| **Character dynamic-shadow lights** | **≤2 stationary lights re-skin/re-draw characters into shadow depth** (brazier + extra lamps use baked/static env shadows); force char shadow depth to LOD1+; contact shadow hero only | **Corrected from 4.** Halving shadow-casting lights on characters ≈ the biggest single character-count win. |
| Character LOD chain | LOD0 @1.0 / LOD1 60 %@0.40 / LOD2 30 %@0.18 / LOD3 12 %@0.07; crowd LOD4 imposter @0.03; LODGroup "ShiaCharacter" | Screen-size thresholds so pop lands inside fog. |
| Hero prop / kit piece / clutter | 8–20 k / 2–8 k / 150–1.5 k tris; 3–4 LODs | Clutter always instanced. |
| Draw calls | ≤1,200 base-pass, ≤2,000 total, alarm 2,500 | Shadow-depth re-draw is the multiplier; kept to ≤2 char-shadow lights. |
| **Material slots** | Standard ≤2; **HERO ≤5–6 (skin/eyes/lashes-teeth/hair/robe/body)**; crowd/named ≤2 | **Corrected.** A real eye+skin face is physically incompatible with ≤3; affordable at 1–3 heroes. |
| Instancing | ≥4 uses → ISM; ≥8 or scattered → HISM; share one material; NumCustomDataFloats for wear/aura variation | Collapses N draws → 1. |
| HISM cull (Start/End cm) | Clutter 0/1200, market 0/1800, columns 0/4000, tiles 0/2500 | Ends land inside fog opacity. |
| Cull Distance Volume | ≤50→1000, ≤100→1500, ≤200→2500, ≤500→4000, ≤1000→6000, >1000→never | One volume/cell. |
| Precomputed Visibility | `bPrecomputeVisibility=true`, VisibilityCellSize=300; volumes around playable space only | Free at runtime; **rebake on every static-geometry move**. |
| Occlusion | `r.HZBOcclusion=1`; modular walls authored solid; invisible occluder planes behind mashrabiya/arches | Lattice would leak visibility. |
| Cell scoping | ≤30×30 m/cell, streaming volumes at fog thresholds, ≤2 cells resident, unload ~45 m | Never open-world. |
| Distant vista | Single matte-painting skybox card (or ≤5k proxy) behind fog, excluded from cull volumes | Painting, not geometry. |
| **Hair** | **Masked (alpha-test), not sorted alpha-blend** | **Added.** Blended hair on 3 close heroes adds a translucency pass + overdraw the draw budget doesn't account for. |
| Mesh VRAM | ≤160 MB VB/IB/cell, ≤20 morphs/character | Small vs textures; not the risk. |
| **Presence-scene geometry cap** | **Authored to a reduced budget: ≤6 animated chars (0 crowd if possible), reveal band pre-culled BY DESIGN, volumetric-fog samples NOT increased during recession.** Cull-distance ×1.5–2 / LOD ScreenSize +0.15 override kept ONLY as pop-prevention, never as license to add content | **Corrected.** The fog-recession override otherwise stacks maximum reveal + shading exactly where the frame is heaviest. Fewer things to reveal, staged at author time — not a runtime dial that adds cost. |

---

### 2.3 Materials & Textures

Strategy: ~6 uber master-materials, everything else a Material Instance + shared MF_ library + one palette MPC, so static switches compile out unused branches.

| Setting | FINAL value | Notes |
|---|---|---|
| Master set (6) | M_Arch_Master, M_Char_Master (SSS skin via static switch, carries aura rim), M_Aura_Shell (fallback), M_Presence, M_LF_Kufic (LightFunction), M_Decal_Master (DeferredDecal) | Static switches (not dynamic branches) so the 4060 never pays for an unused feature. |
| MF_ library | MF_FresnelRim (refactored M_Nur core), MF_LampRimAura, MF_AuraBodyTint, **MF_TriplanarTiling (use ONLY on seam-critical reused pieces — 9 samples; default walls stay standard UV)**, MF_DetailNormal, MF_VertexWear | **Triplanar scope corrected** — blanket use triples sampler cost. |
| Palette MPC | MPC_BaytAlNur: Gold_Core #D9A84E, Gold_Rim #F0C46B, Navy #0B1B3A, Navy_Lift #1E3A8A, NearBlack #060B18, Teal #2B7A78, Ochre #7A5C3E, Slate #3E4F5A + Presence scalars | Single source of truth; a Presence scene crossfades the world grade by writing 2 scalars. |
| Arch recipe | T_Albedo (BC7 sRGB) → MF_VertexWear → BaseColor; T_Normal (BC5) + MF_DetailNormal; T_ORM (BC7 linear R=AO G=Rough B=Metal); wet-layer switch → Rough 0.15; ember switch → emissive | 4 samplers, under the 16 ceiling. Roughness discipline makes SSR selective. |
| Trim + tiling | TS_Arch_01 @2048 + ~7 seamless 2K tiling sets (albedo+normal+ORM); ~512 px/m hero, ~256 px/m background; wear/soot/wet via vertex colors | **Hard dependency: props must be UV-unwrapped onto trim strips** — coordinate with the mesh slice. |
| Compression | BaseColor BC7 sRGB (BC1 far background); Normal BC5 sRGB-off 2ch; ORM/masks BC7 TC_Masks; grayscale (Kufic/soot/ember) BC4; 2K max, **no 4K** | Set after Ali's import. |
| **Streaming pool** | **`r.Streaming.PoolSize=2560`, `LimitPoolSizeToVRAM=1`** (drop to 2000 first if VRAM pressure appears) | **Reconciled** across materials (2000)/perf (2560)/geometry (2560–3072): 2560 HIGH against ~6.5 GB usable; 2000 is the pressure-relief floor. |
| Texture-group caps | World/WorldNormal/Character MaxLODSize 2048, Effects 512, UI 1024; drop World background to 1024 via scalability bucket under pressure | Guarantees no 4K blows the budget. |
| SSR | `r.SSR.Quality=3`, `HalfResSceneColor=1`, `Temporal=1`; PPV Intensity 60, Quality 70, **MaxRoughness 0.42**; only glazed tile (0.12–0.18) + wet stone (~0.15) qualify | Half-res temporal ≈1.5 ms; matte mudbrick excluded automatically. |
| Char skin | MSM_Subsurface, SubsurfaceColor ~#8A3B2A, amount ~0.4, ramp #C89A6B→#5C3E2A, Rough 0.35–0.5, micro-normal faded by CameraDepthFade | Lamp-warmed skin without Subsurface-Profile cost. |
| Decals | M_Decal_Master DeferredDecal, **DBuffer (project setting "DBuffer Decals" ON)**; D_Soot/D_Puddle/D_Crack/D_Stain; **write Roughness-up as well as albedo-darken so blobs read as shadow on lit stone** | DBuffer modifies pre-lit albedo only — pure color-darken reads weak next to lamps. |
| Baked-lighting hygiene | `bUseEmissiveForStaticLighting=false` on ALL aura/Presence/threshold/ember-glow materials; those actors Movable/Stationary, never Static. Exception: fixed lamp/brazier glass may bake bounce (`=true`, low boost) | A misflagged emissive burns an aura into a lightmap permanently. |
| **De-risk first** | Prototype ONE M_Arch instance with StaticSwitchParameterValues via set_properties + recompile, AND set CompressionSettings/sRGB on one imported texture, **before** authoring all 6 masters | **Added.** These two MCP paths are the unproven, load-bearing assumptions of the whole architecture. |

---

### 2.4 Auras & the Maʿṣūm Presence

Core mechanism: one **MPC_Aura_Presence** broadcasts PresencePos/Radius/Strength/WindStrength/FogClear globally, so materials, Niagara, fog, lights and camera read one constant buffer and the same reaction code serves both Sequencer (sacred scripted beats) and gameplay proximity triggers.

**Aura tier table (Material Instances of MF_Aura over M_Char/M_Cloth):**

| Tier | Rim color / power / intensity | Body / flicker | Extra |
|---|---|---|---|
| **T1 Steady Flame** (ṣāliḥ) | #F0C46B / 4.0 / 1.5 | none | **The one per-NPC light in the game:** Movable Point, 6 cd (4–8), 180 cm, 2200 K, Cast Shadows **FALSE**, Vol.Scatter **0.1** *(corrected down from 0.3)*, + NS_Aura_Embers (CPU, ≤10) |
| **T2 Clear** (default) | teal #2B7A78 / 5.5 / 0.12 | none | Applies to on-screen **story NPCs only** — see guardrail |
| **T3 Guttering** (muḍṭarib) | slate #3E4F5A / 4.5 / 0.4 | ColdBias 0.5 (desat+cool albedo, Spec ×0.4), flicker 0.5–2 Hz | NS_Aura_GutterMotes (falling), elongated blob decal |
| **T4 Hollow Lamp** (zāʾif) | edge #1E3A8A / 7.0 / 0.3 (tight cold edge, no warm glow) | BodyDarken 0.35→#060B18, Rough +0.15, Spec ×0.5 | Doubled/misaligned blob decal (LieBeat scalar), soot + fog-skirt, lamp-dim BP |

| Setting | FINAL value | Notes |
|---|---|---|
| **Crowd guardrail** | Crowd + non-story real-historical NPCs use **plain M_Char/M_Cloth, NO MF_Aura**. "AuraTier=2" for a crowd record means *no aura material*, not MF_Aura@0.12. Auras on story NPCs only → ≤5 on screen, ≤3 T1 lights | **Corrected contradiction.** The 30 fps envelope rides on ≤5 aura instances; the Fresnel MID must not run on every extra. |
| Data lock | NPC `AuraTier` defaults 2, LOCKED to 2 for `is_real_historical`/`is_crowd`; T1/T3/T4 only for `is_fictional_teaching`/`is_object` | Enforced at the data layer — no artist or MCP call can paint a real person as damned/blessed. |
| Blob shadow | Procedural radial-gradient DBuffer decal (no texture), Darkness ≤0.4, write Roughness-up | Extra tell layered under the real lamp shadow; ≤0.4 so it reads as omen not bug. |
| T4 lamp-dim | Sphere r=200 cm, overlap tag "OilLamp", Timeline 0.5 s ease Intensity ×0.8, restore on exit; excludes baked hero lamps flagged "NoDim" | Only scales the **dynamic/stationary direct** component — baked bounce won't dim; use Stationary lamps where a live dim is needed. |
| **Presence — Form B (recommended)** | SpotLight outside frame through mashrabiya mesh, LF_Kufic light function, 2200 K gold, Vol.Scatter 2.0, mashrabiya casts shadow — **no presence mesh in frame at all** | The world is the portrait; the sacred hard-line satisfied by construction. |
| Presence — Form A | Headless robed mesh (≤600 tris, **no head geometry**) + emissive plane, M_Presence Emissive #F0C46B ×12 (8–16), breathing WPO ±0.5 % @0.2 Hz, **Cast Shadow FALSE** | Bloom erases interior detail — "made of light, not lit." |
| Presence — proximity | **Camera min distance 600 cm; DissolveNear=600, DissolveFar=1200** (corrected from 300 to match the 6 m clamp), EmissiveScale ramps to ~24 → frame whites out | **Fixed contradiction** — the 3 m dissolve was unreachable behind the 6 m clamp. |
| **Reaction 2 (fog recedes −40 %)** | **Lerp GLOBAL ExponentialHeightFog VolumetricFog density −40 % over ~1.5 s via Sequencer/BP** — **NOT a Local Fog Volume** (those only ADD density, cannot carve a clearing). Gameplay path where fog must stay dense elsewhere: fake with inscatter/exposure lift + bright soft fill | **Corrected technical error.** |
| Reactions 1/3/4/5/6 | Wind→0 (all cloth/foliage/flame read WindStrength); auras lean via point-attractor to PresencePos; grade lifts by driving PP color-grading params directly (no LUT binary); rim re-aims to PresenceKeyDir; camera pitch −4°/FOV −2.5°/input ×0.6 | All MPC-driven; identical code for scripted + gameplay. |
| **Hard reverence locks** | On ALL presence actors: Cast Shadow FALSE; no head/face/eye/hair geometry; no SkeletalMesh head; no walk cycle; no nameplate; no portrait; no VO; camera ≥600 cm; emissive always high enough that bloom erases interior detail | Engine SETTINGS, not art discipline — the 14 Maʿṣūmīn / Allah / angels remain light only, forever. |

---

## 3. Unified Performance Budget (LAMPLIGHT HIGH / T5 / locked 30 fps, 720p internal → 1080p)

**VRAM — budget against ~6.5 GB usable (not 8 GB):**

| Line item | FINAL est. | Note |
|---|---|---|
| Texture streaming pool | 2.56 GB | `PoolSize=2560`, `LimitPoolSizeToVRAM=1` |
| GBuffer + RTs + post + TSR history | **0.6–0.7 GB** | Corrected up from 0.25–0.3; drop `r.TSR.History.ScreenPercentage` 200→150 to reclaim |
| Volumetric fog froxel (×2 temporal) | 0.10–0.15 GB | At 16/64 (not 8/128) |
| Shadow depth atlases (≤2 char + CSM) | 0.25–0.35 GB | Counted separately |
| Resident baked lightmaps | 0.25–0.40 GB | Hero ≤256 |
| Static/skeletal mesh VB/IB | 0.5–0.7 GB | |
| Niagara / decals | 0.15–0.20 GB | |
| Shaders / PSO cache / engine | 0.5 GB | |
| Mesh Distance Fields | **0 (disabled)** | Reclaims 0.2–0.5 GB — the headroom source |
| **Total** | **~5.5–6.2 GB** | **TIGHT — monitor `stat streaming` / `stat d3d12memory`** |

**Frametime — 33.3 ms, target ≤30 ms GPU (~3 ms safety):**

| Pass | Budget | Note |
|---|---|---|
| Geometry + base pass | ≤6 ms | Has headroom — NOT the governor |
| Shadow depth (≤2 char-shadow lights + CSM) | ≤6 ms | The draw/skinning multiplier |
| Volumetric fog + volumetric lighting | ≤4–5 ms | Largest tunable sink; `stat gpu` gate |
| SSS + GTAO + SSR | ≤4 ms | |
| Translucency + Niagara auras | ≤3 ms | Masked hair, ≤5 aura NPCs |
| TSR upscale + post | ≤4 ms | |
| Safety | ~4 ms | Thermal/1%-low margin |

**Preset authority (correctness fix):** `[SystemSettings]` in DefaultEngine.ini holds **only the constraint guards** (AllowStaticLighting, DGI=None, Reflection=ScreenSpace, RayTracing-runtime-off, Nanite off, VSM off, MeshDistanceFields off, Substrate off, TSR default). **Both presets live in a custom Scalability.ini as group levels driven by UGameUserSettings**; `r.ScreenPercentage` is driven via `ResolutionScale`, not forced globally. **Do not** mix `sg.ShadowQuality=3` with hand-set `r.Shadow.MaxResolution=2048` in one block — the sg apply clobbers the r.* value. **Lock 30 via `t.MaxFPS=30` + `r.GTSyncType`; do NOT hardcode `rhi.SyncInterval=2`** (assumes a 60 Hz panel — 4060 laptops ship 120/144/165 Hz, where it yields 60–82 fps). Enable **PSO precaching + ship a gathered bundled PSO cache** or first-encounter shader hitches break the "locked 30".

**MEDIUM / T1 / ~60 fps floor** (the honest, comfortable target, ~6.0 GB): `t.MaxFPS=60`, ResolutionScale ~59 %, `r.VolumetricFog.GridPixelSize=16/GridSizeZ=64`, SSAO not GTAO, ShadowMaxRes 1024, ContactShadows 0, PoolSize 2560. Expose both as "Lamplight (60 fps)" / "Lamplight High (30 fps)".

---

## 4. MCP Build Order (numbered, actionable)

Legend: **[MCP]** = editor-driving agent · **[Ali]** = human GUI/binary/restart/save/bake. Bakes and startup-ini edits are the slow, human-gated steps — the agent **batches all light/material/BP edits per scene, then hands off one restart+save+bake**.

**Phase 0 — project state & guards (must precede everything)**
1. **[MCP]** SearchCVars read-back: confirm `r.RayTracing`, `r.Nanite.ProjectEnabled=0`, `r.Shadow.Virtual.Enable=0`, `r.DynamicGlobalIlluminationMethod=0`, `r.ReflectionMethod=2`, `r.AllowStaticLighting=1`, `r.Substrate`. (Repo already has RT/Lumen/SSR set; VSM/Nanite/Substrate are unconfirmed — verify.)
2. **[Ali]** (editor CLOSED) DefaultEngine.ini: **Support Hardware Ray Tracing = TRUE** + Support Compute Skin Cache TRUE + DX12/SM6; Allow Static Lighting TRUE; DGI None; Reflection Screen Space; Nanite off; VSM off; **MeshDistanceFields off**; Substrate off; TSR default AA; the constraint-guard block; device-profile `r.RayTracing=0` for the shipping/packaged build. **Restart editor** (this drops the live MCP connection — cannot be an MCP step).
3. **[Ali]** **Remove the legacy M_PP_PSX PostProcessVolume** from the level and **purge any `r.ScreenPercentage=50` / `AntiAliasingMethod=0` lines** — the retired PS1 direction is mutually exclusive with Lamplight + TSR and invalidates both the look and every perf number.

**Phase 1 — binaries (batched, one pass)**
4. **[Ali]** Import all binaries + set compression/sRGB targets, then Ctrl+S: **3 core textures** (Kufic BC4 alpha, split-tone LUT, navy star cubemap); trim sheets + ~7 tiling sets + decal atlas; ember/soot sprites (or accept engine defaults); **meshes with LOD0–LODn chains + lightmap UV1** (arches, lamps, brazier, mashrabiya, star-dome, ≤600-tri **headless** robe) — reject Nanite-only marketplace meshes that ship without LODs; one sustained presence chord.

**Phase 2 — lighting rig & world settings [MCP]**
5. **[MCP]** Spawn/configure: Moon **(Stationary)**, Sky Light, 2–4 hero lamps **(Stationary)**, decorative lamps **(Static)**, brazier, Kufic spot, ExponentialHeightFog (16/64), star-dome actor, **Reflection Captures (Sphere per courtyard + alcoves)**, **Lightmass Importance Volume** (cell ≥50), PostProcessVolume (Manual/clamped exposure, Local Exposure, LUT, Bloom 0.6/thr 1.0, GTAO, SSR MaxRough 0.42, grain/vignette).
6. **[MCP]** World Settings > Lightmass fields (bounces/AO/smoothness/environment/Volumetric Lightmap cell size). *(Verify MCP exposes a config/Python path first; else Ali.)*

**Phase 3 — materials & instances [MCP]**
7. **[MCP]** **De-risk pass:** author ONE M_Arch instance with StaticSwitchParameterValues + recompile, and set CompressionSettings/sRGB on one imported texture. Only on success proceed.
8. **[MCP]** MPC_BaytAlNur; the 6 masters + MF_ library; wire Ali-imported textures into TextureSampleParameter2D slots; the 4 aura tier MIs; procedural M_BlobShadow + T3/T4 instances; M_LF_Kufic; direct-PostProcess grade-lift. Verify each via CaptureViewport (aura = warm rim not halo; Presence = white-out, no interior/face, no cast shadow).

**Phase 4 — geometry population [MCP]**
9. **[MCP]** From a deterministic manifest `(mesh, transform, instance-group, cull-start/end, forced-LOD, cast-shadow)`: ISM/HISM scatter + custom-data; CullDistanceVolumes; PrecomputedVisibilityVolumes; streaming volumes at fog thresholds; per-actor draw-distance/LOD/shadow flags; set `bPrecomputeVisibility=true`, VisibilityCellSize=300. *(Pre-confirm MCP supports the CullDistances struct-array + HISM custom-data + cvar exec.)*

**Phase 5 — Blueprints, Niagara, Sequencer**
10. **[MCP]** Blueprint graphs: brazier flicker, T4 lamp-dim (sphere + Timeline), Presence proximity→MPC writes, the six MPC reactions (reusable Presence BP), Presence-radius cull/LOD-bias override.
11. **[MCP or Ali/editor-Python]** Niagara systems (NS_Aura_Embers/GutterMotes/Soot/FogSkirt) and the **Majlis Door Level Sequence** — **treat as human/editor-Python, not assumed automatable**; MCP attaches components + sets user params, but Niagara system authoring and Sequencer track authoring are the least-proven MCP operations.

**Phase 6 — bake, profile, iterate**
12. **[Ali]** Verify Stationary Overlap green → Ctrl+S → **GPU Lightmass Build (128 preview; 512 final off-machine or per-sublevel)** + Precomputed Visibility. **Rebake+resave after ANY MCP static-geometry move** (visibility silently staleness-fails otherwise).
13. **[Ali]** Enable PSO precaching + gather bundled cache; package a **Standalone Development build** for the real go/no-go (PIE + editor + MCP + browser on 16 GB is memory-starved and inflates every number).
14. **[MCP]** Live-tune non-baked PPV params (exposure/bloom/grade/SSR) freely between bakes; sweep runtime cvars via console exec *(if ProgrammaticToolset/Python-exec exists; else Ali types them in PIE)*.

---

## 5. Open Risks & First Three Things to Profile

**Open risks (ranked):**
1. **RT-support toggle is the single point of failure** — GPU Lightmass needs Support Hardware Ray Tracing = TRUE; if anyone sets it FALSE to "honor no-RT", you get zero baked GI and a flat/black scene. Runtime RT stays off via device profile.
2. **Volumetric fog is the dominant, most volatile GPU cost and the most likely sub-30 breaker** — ship 16/64, reserve 8/128 for cinematics, restrict volumetric scattering to the 2–4 hero lamps + one Kufic spot.
3. **VRAM is genuinely tight (~5.5–6.2 GB of ~6.5 usable)** — MeshDistanceFields-off is the reclaim that makes it fit; a dense bazaar or an un-capped pool thrashes (silent texture blur via LimitPoolSizeToVRAM, not an OOM).
4. **GPU Lightmass bake-time OOM on 8 GB** (distinct from runtime) — final 512 hero bakes off-machine or per-sublevel.
5. **Stationary-overlap ≤4 cliff** and **≤2 char-shadow lights** — exceeding either silently demotes lamps / multiplies skinned draws.
6. **Precomputed-visibility staleness** — every MCP static move invalidates the bake; enforce MCP-place → Ali rebuild+save before trusting culling.
7. **Auto-exposure must be locked per space before any rim/emissive tuning** — otherwise tier legibility and the Presence white-out are non-deterministic.
8. **Presence-scene frame** stacks reveal + shading at the worst moment — it is authored to a reduced budget, not rescued by a runtime dial.
9. **MCP unverified for Niagara / Blueprint graphs / Sequencer / cvar-exec** and offline this session — scope the human wall to "binary + Niagara + graphs + Sequencer + restart + bake + save".
10. **DLSS is a human-installed binary plugin** — TSR is the baseline; without DLSS the fallback is heavier and 720p-internal shimmer on mashrabiya/hair needs a QA gate.
11. **Thermal throttling** — a 30 fps that passes a 30-second test can fail a 10-minute soak.

**First three things to profile on the real 4060 (worst case: densest courtyard, dense fog, all shadow lamps, a T1+T4 aura'd NPC, Presence rig active, player WALKING, packaged Standalone Development build, plugged in, 10-min soak):**
1. **`stat gpu` per-pass ms** — confirm VolumetricFog, ShadowDepths, BasePass and PostProcessing(TSR) sum to ≤30 ms with ~3 ms safety; attack the tallest pole first. Check 1 % lows with PresentMon/CapFrameX (average 30 with 15 fps lows feels broken).
2. **VRAM via `stat streaming` + `stat d3d12memory`** — confirm no "Streaming Pool Over Budget" and total working set fits ~6.5 GB; then sweep `r.ScreenPercentage` (50/59/66/71/77) and pick the highest that holds 30 fps with ~10 % headroom.
3. **Volumetric-fog cost specifically** — sweep GridPixelSize 16→12→8 with all shadow lights + the Presence recession active; keep the highest quality that holds VolumetricFog < ~4 ms and 30 fps overall, and profile the Presence-reveal frame (global fog lerp + reveal band) as the single worst frame.

---

*Reverence guardrails are engine settings, not art discipline: ordinary people render with real faces (T2 Clear is the visual zero; real historical persons are locked to it); the Maʿṣūmīn / Allah / angels are light only — no head geometry, `Cast Shadow = OFF`, emissive always above bloom threshold, camera ≥ 6 m — so a face or a shadow is structurally impossible to render.*
