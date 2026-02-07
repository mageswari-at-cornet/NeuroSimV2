# app.py
# NeuroSim Pro: Causal Stroke Pathway Simulator (Improved Logic + Cleaner Causal Semantics + UI Enhancements)
# Run:
#   pip install streamlit pandas numpy plotly graphviz pillow
# Then:
#   streamlit run app.py
#
# Images:
#   Create a folder named "images" beside this file (same folder as this .py)
#   Save images with names like:
#     S1_CTP.png, S1_CBV.png, S1_CTA.png, S1_AI.png
#     S2_CTP.png, ... etc

import os
import numpy as np
import pandas as pd
import streamlit as st
import plotly.graph_objects as go
import graphviz
from PIL import Image

# -----------------------------
# 1) CONFIG & CSS
# -----------------------------
st.set_page_config(layout="wide", page_title="NeuroSim Pro")

st.markdown(
    """
<style>
    .stApp { background-color: #050505; color: #e5e7eb; font-family: 'Inter', sans-serif; }

    .glass-panel {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(71, 85, 105, 0.5);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        backdrop-filter: blur(10px);
        height: 100%;
    }

    .header-text { font-size: 2.0rem; font-weight: 700; color: #f3f4f6; letter-spacing: -0.025em; }
    .sub-text { font-size: 1.0rem; color: #94a3b8; }

    .metric-label { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .metric-val { font-size: 1.6rem; font-weight: 600; color: #f3f4f6; }

    .delta-pos { color: #4ade80; font-weight: 500; font-size: 0.9rem; }
    .delta-neg { color: #f87171; font-weight: 500; font-size: 0.9rem; }
    .delta-neu { color: #94a3b8; font-weight: 500; font-size: 0.9rem; }

    .impact-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-top: 10px; }
    .impact-table th { text-align: left; color: #94a3b8; border-bottom: 1px solid #334155; padding: 8px; font-weight: 500; }
    .impact-table td { padding: 8px; border-bottom: 1px solid #1e293b; color: #e2e8f0; }

    .narrative-box {
        background-color: #111827;
        border-left: 5px solid #06b6d4;
        padding: 15px;
        border-radius: 6px;
        margin-top: 5px;
        font-size: 0.95rem;
        line-height: 1.5;
    }

    .patient-box {
        background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%);
        border: 1px solid #334155;
        padding: 20px;
        border-radius: 8px;
        margin-top: 20px;
        margin-bottom: 20px;
        color: #e2e8f0;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    .patient-title { font-size: 1.1rem; font-weight: 700; color: #38bdf8; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
    .patient-text { font-size: 1.05rem; font-weight: 400; line-height: 1.6; }

    .highlight { color: #06b6d4; font-weight: bold; }
    .risk { color: #f87171; font-weight: bold; }

    .img-box {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: #000; border: 1px dashed #334155; border-radius: 8px;
        height: 280px; width: 100%; color: #475569;
        text-align: center;
    }

    .pill {
        display: inline-block;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(71, 85, 105, 0.6);
        background: rgba(15, 23, 42, 0.65);
        color: #e2e8f0;
        font-size: 0.85rem;
        margin-right: 8px;
        margin-bottom: 6px;
    }

    .stTabs [data-baseweb="tab-list"] { gap: 8px; }
    .stTabs [data-baseweb="tab"] { background-color: #1e293b; border-radius: 4px; color: #94a3b8; padding: 4px 16px; border: none; }
    .stTabs [aria-selected="true"] { background-color: #3b82f6; color: white; }
</style>
""",
    unsafe_allow_html=True,
)

# -----------------------------
# 2) UTILITIES
# -----------------------------
def clamp(x, lo, hi):
    return float(max(lo, min(hi, x)))

def clamp_int(x, lo, hi):
    return int(max(lo, min(hi, int(x))))

def score_to_bar(score: int, out_of: int = 5) -> str:
    score = max(0, min(out_of, int(score)))
    return "▮" * score + "▯" * (out_of - score)

def load_image(filename):
    path = os.path.join("images", filename)
    if os.path.exists(path):
        try:
            return Image.open(path)
        except Exception:
            return None
    return None

def normalize_occlusion(occl_str: str) -> str:
    s = (occl_str or "").strip().lower()
    if "tandem" in s or "+" in s:
        return "TANDEM"
    if ("ica" in s) and ("terminus" in s or "ica-t" in s or "ica t" in s):
        return "ICA_T"
    if "ica" in s and "m1" in s:
        return "TANDEM"
    if "m2" in s:
        return "M2"
    if "m1" in s:
        return "M1"
    if "ica" in s:
        return "ICA"
    return "OTHER"

def bp_penalty_multiplier(sbp: float, collaterals: float) -> float:
    sbp = float(sbp)
    coll = float(collaterals)

    if coll < 1.5:
        if sbp < 135:
            return 1.80
    elif coll < 2.2:
        if sbp < 125:
            return 1.45
    else:
        if sbp < 110:
            return 1.25

    if sbp > 185:
        return 1.08
    return 1.0

def fast_progressor_multiplier(mode: str, seed: int, n: int = 1):
    rng = np.random.default_rng(seed)
    if mode == "deterministic":
        return np.array([0.25])
    draws = rng.beta(2, 5, size=n)
    return draws

# -----------------------------
# 3) CAUSAL SIMULATOR
# -----------------------------
def compute_reperfusion_probability(s_id: str, static: dict, levers: dict) -> float:
    occl_type = static["OcclType"]
    coll = float(static["Collaterals"])
    core0 = float(static["Core0"])

    rep = 0.82
    if occl_type == "M2":
        rep = 0.88
    elif occl_type == "M1":
        rep = 0.84
    elif occl_type == "ICA_T":
        rep = 0.72
    elif occl_type == "TANDEM":
        rep = 0.68
    elif occl_type == "ICA":
        rep = 0.75

    rep += 0.02 * (coll - 2.0)

    if core0 > 70:
        rep -= 0.08
    elif core0 > 40:
        rep -= 0.04

    technique = levers.get("technique", "Standard")
    if technique == "Direct Angio":
        rep += 0.03

    strategy = levers.get("strategy", None)
    if s_id == "S4":
        if strategy == "Acute Stenting + DAPT":
            rep += 0.12
        else:
            rep -= 0.03

    # ✅ make S2 strategy consistent with ivt logic (optional but avoids confusion)
    if s_id == "S2":
        strat = levers.get("strategy", "EVT Alone")
        ivt = (strat == "Bridging (IVT+EVT)") or bool(levers.get("ivt", False))
    else:
        ivt = bool(levers.get("ivt", False))

    if ivt:
        if occl_type == "M2":
            rep += 0.06
        elif occl_type == "M1":
            rep += 0.03
        else:
            rep += 0.01

    if s_id == "S5":
        action = levers.get("action", "Medical Mgmt")
        if action == "Medical Mgmt":
            rep = 0.05
        else:
            rep -= 0.06

    if s_id == "S6":
        mismatch_strength = levers.get("mismatch_strength", static.get("MismatchStrength", "Moderate"))
        if mismatch_strength == "Strong":
            rep += 0.02
        elif mismatch_strength == "Mild":
            rep -= 0.01

    return clamp(rep * 100.0, 5, 98)

def expected_salvage_fraction(s_id: str, static: dict, levers: dict, rep_prob_pct: float) -> float:
    p = clamp(rep_prob_pct / 100.0, 0.0, 1.0)

    salv_if_success = 0.78
    salv_if_fail = 0.10

    if s_id == "S3":
        if levers.get("technique") == "Standard":
            salv_if_success += 0.03

    if s_id == "S6":
        ms = levers.get("mismatch_strength", static.get("MismatchStrength", "Moderate"))
        if ms == "Strong":
            salv_if_success += 0.06
        elif ms == "Mild":
            salv_if_success -= 0.04

    core0 = float(static["Core0"])
    if core0 > 70:
        salv_if_success -= 0.18
        salv_if_fail = 0.05
    elif core0 > 40:
        salv_if_success -= 0.08

    salv_if_success = clamp(salv_if_success, 0.25, 0.90)
    salv_if_fail = clamp(salv_if_fail, 0.02, 0.20)

    return (p * salv_if_success) + ((1 - p) * salv_if_fail)

def simulate_pathway_once(s_id: str, static: dict, levers: dict, latent_fast: float, noise_seed: int) -> dict:
    rng = np.random.default_rng(noise_seed)

    age = float(static["Age"])
    coll = float(static["Collaterals"])
    core0 = float(static["Core0"])
    territory = float(static.get("Territory", 150.0))

    ttr = float(levers.get("time", 120.0))
    sbp = float(levers.get("sbp", 150.0))

    base_rate = 0.18 + 0.14 * (2.5 - coll)
    base_rate = clamp(base_rate, 0.12, 0.55)

    fast_mult = 0.85 + 0.9 * float(latent_fast)
    bp_mult = bp_penalty_multiplier(sbp, coll)
    growth_noise = rng.normal(1.0, 0.08)

    growth = ttr * base_rate * fast_mult * bp_mult * growth_noise
    core_final = clamp(core0 + growth, 5, territory - 5)

    penumbra_at_risk = max(0.0, territory - core_final)

    rep_prob = compute_reperfusion_probability(s_id, static, levers)
    salv_frac = expected_salvage_fraction(s_id, static, levers, rep_prob)
    salvaged = penumbra_at_risk * salv_frac
    dead_penumbra = max(0.0, penumbra_at_risk - salvaged)

    # ✅ keep S2 strategy consistent with IVT flag
    if s_id == "S2":
        strat = levers.get("strategy", "EVT Alone")
        ivt = (strat == "Bridging (IVT+EVT)") or bool(levers.get("ivt", False))
    else:
        ivt = bool(levers.get("ivt", False))

    sich = 3.5 + 0.09 * core_final

    if ivt:
        sich += 4.0
        if core_final > 60:
            sich += 2.5

    if sbp > 170:
        sich += (sbp - 170) * 0.28

    if s_id == "S4" and levers.get("strategy") == "Acute Stenting + DAPT":
        sich += 9.0

    if s_id == "S5" and levers.get("action") == "Thrombectomy":
        if core_final > 80:
            sich += 6.0
        else:
            sich += 3.0

    sich = clamp(sich, 1, 60)

    mortality = 4.0 + 0.13 * core_final + 0.30 * sich + 0.22 * max(0.0, age - 60)
    if s_id == "S5" and levers.get("action") == "Medical Mgmt":
        mortality += 18.0
    mortality = clamp(mortality, 1, 95)

    mrs = 84.0 - 0.55 * core_final - 0.55 * max(0.0, age - 55) - 1.05 * sich

    if core_final > 80:
        mrs = min(mrs, 32.0)
    elif core_final > 60:
        mrs = min(mrs, 50.0)

    if s_id == "S6":
        ms = levers.get("mismatch_strength", static.get("MismatchStrength", "Moderate"))
        if ms == "Strong":
            mrs += 6.0
        elif ms == "Mild":
            mrs -= 5.0

    if s_id == "S5" and levers.get("action") == "Thrombectomy":
        mrs += 6.0

    mrs = clamp(mrs, 0, 95)

    return {
        "ttr": ttr,
        "sbp": sbp,
        "core": core_final,
        "penumbra_at_risk": penumbra_at_risk,
        "salvaged": salvaged,
        "dead_penumbra": dead_penumbra,
        "rep_prob": rep_prob,
        "sich_prob": sich,
        "mortality": mortality,
        "mrs_prob": mrs,
    }

def simulate(s_id: str, static: dict, levers: dict, mode: str, seed: int, n_runs: int = 200) -> dict:
    if mode == "deterministic":
        latent = fast_progressor_multiplier("deterministic", seed, n=1)[0]
        res = simulate_pathway_once(s_id, static, levers, latent_fast=latent, noise_seed=seed + 101)
        return {"type": "single", "single": res}

    latents = fast_progressor_multiplier("uncertainty", seed, n=n_runs)
    runs = []
    for i in range(n_runs):
        res = simulate_pathway_once(
            s_id, static, levers,
            latent_fast=float(latents[i]),
            noise_seed=seed + 1000 + i
        )
        runs.append(res)
    df = pd.DataFrame(runs)

    def summary(col):
        return {
            "mean": float(df[col].mean()),
            "p05": float(np.percentile(df[col], 5)),
            "p95": float(np.percentile(df[col], 95)),
        }

    return {
        "type": "dist",
        "df": df,
        "summary": {
            "mrs_prob": summary("mrs_prob"),
            "mortality": summary("mortality"),
            "sich_prob": summary("sich_prob"),
            "rep_prob": summary("rep_prob"),
            "core": summary("core"),
            "salvaged": summary("salvaged"),
            "dead_penumbra": summary("dead_penumbra"),
            "ttr": summary("ttr"),
        },
    }

# -----------------------------
# 4) VISUALS
# -----------------------------
def render_tissue_donut(core, salvaged, dead_penumbra, territory=150.0):
    labels = ["Core (Dead)", "Salvaged (Living)", "At Risk (Lost)"]
    values = [core, salvaged, dead_penumbra]
    colors = ["#b91c1c", "#06b6d4", "#f59e0b"]

    saved_txt = f"{int(round(salvaged))}cc"
    denom_txt = f"/ {int(round(territory))}cc"

    fig = go.Figure(
        data=[
            go.Pie(
                labels=labels,
                values=values,
                hole=0.7,
                marker=dict(colors=colors),
                textinfo="none",
                hoverinfo="label+value",
                sort=False,
            )
        ]
    )
    fig.update_layout(
        showlegend=False,
        annotations=[
            dict(text=saved_txt, x=0.5, y=0.56, font_size=24, showarrow=False, font_color="white", font_family="Inter"),
            dict(text="Saved", x=0.5, y=0.43, font_size=12, showarrow=False, font_color="#94a3b8"),
            dict(text=denom_txt, x=0.5, y=0.33, font_size=11, showarrow=False, font_color="#94a3b8"),
        ],
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=0, r=0, t=0, b=0),
        height=200,
    )
    return fig

def render_outcome_bar(base, curr):
    fig = go.Figure()
    metrics = ["Functional Outcome (mRS 0-2)", "Mortality", "Safety (sICH Risk)"]

    base_vals = [base["mrs_prob"], base["mortality"], base["sich_prob"]]
    curr_vals = [curr["mrs_prob"], curr["mortality"], curr["sich_prob"]]
    deltas = [curr_vals[i] - base_vals[i] for i in range(3)]

    fig.add_trace(
        go.Bar(
            name="Baseline",
            x=metrics,
            y=base_vals,
            marker_color="#475569",
            text=[f"{int(round(v))}%" for v in base_vals],
            textposition="auto",
        )
    )

    fig.add_trace(
        go.Bar(
            name="Intervention",
            x=metrics,
            y=curr_vals,
            marker_color=["#06b6d4", "#ef4444", "#f59e0b"],
            text=[f"{int(round(v))}% ({'+' if d>0 else ''}{int(round(d))})" for v, d in zip(curr_vals, deltas)],
            textposition="auto",
        )
    )

    fig.update_layout(
        barmode="group",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#e2e8f0", family="Inter"),
        margin=dict(l=10, r=10, t=20, b=10),
        height=260,
        legend=dict(orientation="h", y=1.12, x=1, xanchor="right"),
        yaxis=dict(showgrid=True, gridcolor="#334155", range=[0, 100]),
    )
    return fig

def render_impact_table(baseline, current):
    metrics = [
        ("Time-to-reperfusion", current["ttr"], baseline["ttr"], "min", True),
        ("Final Core", current["core"], baseline["core"], "cc", True),
        ("Reperfusion Prob", current["rep_prob"], baseline["rep_prob"], "%", False),
        ("Penumbra Salvaged", current["salvaged"], baseline["salvaged"], "cc", False),
        ("Functional Outcome", current["mrs_prob"], baseline["mrs_prob"], "%", False),
        ("Mortality Risk", current["mortality"], baseline["mortality"], "%", True),
        ("sICH Risk", current["sich_prob"], baseline["sich_prob"], "%", True),
    ]
    html = '<table class="impact-table"><thead><tr><th>Metric</th><th>Value</th><th>Δ vs Base</th></tr></thead><tbody>'
    for name, curr, base, unit, low_good in metrics:
        curr_i = float(curr)
        base_i = float(base)
        delta = curr_i - base_i
        d_str = f"{'+' if delta > 0 else ''}{int(round(delta))}{unit}"
        cls = "delta-neu"
        if abs(delta) >= 0.5:
            better = (delta < 0 and low_good) or (delta > 0 and not low_good)
            cls = "delta-pos" if better else "delta-neg"
        html += f'<tr><td>{name}</td><td>{int(round(curr_i))}{unit}</td><td class="{cls}">{d_str}</td></tr>'
    html += "</tbody></table>"
    return html

def render_dag(scenario_id, active_nodes=None):
    active_nodes = set(active_nodes or [])

    dot = graphviz.Digraph(format="png")
    dot.attr(bgcolor="rgba(0,0,0,0)", rankdir="LR")
    dot.attr("node", shape="box", style="rounded,filled", color="#1e293b", fontcolor="#f3f4f6", fontname="Inter", fontsize="10")
    dot.attr("edge", color="#64748b")

    def node(name, label, color="#1e293b"):
        if name in active_nodes:
            dot.node(name, label, color="#0ea5e9")
        else:
            dot.node(name, label, color=color)

    node("X", "Phenotype (X)", color="#0f172a")
    node("Y", "Outcome (Y)", color="#06b6d4")

    if scenario_id == "S1":
        node("A", "Routing / Transfer (A)", color="#3b82f6")
        node("T", "Time-to-reperfusion (M)")
        node("C", "Collaterals (Effect modifier)", color="#f59e0b")
        node("Core", "Core growth (M)")
        dot.edge("A", "T")
        dot.edge("T", "Core")
        dot.edge("C", "Core", style="dashed")
        dot.edge("Core", "Y")
        dot.edge("X", "Core")
    elif scenario_id == "S2":
        node("A", "IVT + EVT policy (A)", color="#3b82f6")
        node("R", "Early recanalization / success (M)")
        node("B", "Bleed risk (M)")
        dot.edge("A", "R", label="benefit")
        dot.edge("A", "B", label="harm")
        dot.edge("R", "Y")
        dot.edge("B", "Y")
        dot.edge("X", "R")
        dot.edge("X", "B")
    elif scenario_id == "S3":
        node("A", "Imaging pathway (A)", color="#3b82f6")
        node("T", "Treatment delay (M)")
        node("Core", "Core growth (M)")
        dot.edge("A", "T")
        dot.edge("T", "Core")
        dot.edge("Core", "Y")
        dot.edge("X", "Core")
    elif scenario_id == "S4":
        node("A", "Stent + DAPT (A)", color="#3b82f6")
        node("P", "Patency / durable reperfusion (M)")
        node("B", "Bleed risk (M)")
        dot.edge("A", "P", label="benefit")
        dot.edge("A", "B", label="harm")
        dot.edge("P", "Y")
        dot.edge("B", "Y")
        dot.edge("X", "P")
        dot.edge("X", "B")
    elif scenario_id == "S5":
        node("A", "Treat vs medical mgmt (A)", color="#3b82f6")
        node("Core", "Large core (modifier)", color="#f59e0b")
        node("S", "Limited salvage (M)")
        node("R", "Reperfusion injury / sICH (M)")
        dot.edge("Core", "S", label="limits")
        dot.edge("Core", "R", label="amplifies")
        dot.edge("A", "S", label="benefit")
        dot.edge("A", "R", label="harm")
        dot.edge("S", "Y")
        dot.edge("R", "Y")
        dot.edge("X", "Core")
    elif scenario_id == "S6":
        node("M", "MRI mismatch (modifier)", color="#f59e0b")
        node("A", "IVT authorization (A)", color="#3b82f6")
        node("R", "Recanalization + salvage (M)")
        dot.edge("M", "A", style="dashed", label="authorizes")
        dot.edge("A", "R")
        dot.edge("R", "Y")
        dot.edge("X", "M")
    else:
        node("A", "Intervention (A)", color="#3b82f6")
        node("M", "Mediators (M)")
        dot.edge("A", "M")
        dot.edge("M", "Y")
        dot.edge("X", "M")

    return dot

def get_patient_explanation(s_id, levers, base_res, curr_res):
    diff = int(round(curr_res["mrs_prob"] - base_res["mrs_prob"]))
    if diff > 0:
        outcome_text = f"This option is projected to provide a better outcome (+{diff}% chance of independence)."
    elif diff < 0:
        outcome_text = f"This option is projected to result in a poorer outcome ({diff}% change in independence)."
    else:
        outcome_text = "This option provides a similar outcome to the baseline."

    reason = ""
    if s_id == "S1":
        if levers.get("route") == "Direct Mothership":
            reason = "Direct transport saves time to treatment, which preserves more brain tissue."
        else:
            reason = "Transfer adds delay, but early clot-busting treatment may still help some patients."
    elif s_id == "S2":
        if levers.get("ivt", False):
            reason = "Adding IV clot-busting may improve early recanalization in some clots, but increases bleeding risk."
        else:
            reason = "Skipping the clot-busting drug avoids some bleeding risk while still allowing clot removal."
    elif s_id == "S3":
        if levers.get("technique") == "Direct Angio":
            reason = "Skipping advanced perfusion imaging reduces delay, which matters when the stroke is fast-progressing."
        else:
            reason = "Perfusion imaging adds time, but can improve selection certainty in later or unclear windows."
    elif s_id == "S4":
        if levers.get("strategy") == "Acute Stenting + DAPT":
            reason = "A stent improves the chance the artery stays open, but blood thinners increase bleeding risk."
        else:
            reason = "Avoiding stenting reduces bleeding risk, but increases the chance of re-occlusion."
    elif s_id == "S5":
        if levers.get("action") == "Thrombectomy":
            reason = "Even with a large established core, thrombectomy can still reduce worst outcomes for selected patients, but bleeding risk is higher."
        else:
            reason = "Without thrombectomy, recovery is less likely in large-core stroke, but procedural risks are avoided."
    elif s_id == "S6":
        ms = levers.get("mismatch_strength", "Moderate")
        if levers.get("ivt", False):
            reason = f"Mismatch ({ms}) suggests some tissue may still be salvageable, so IV clot-busting may help, with bleeding trade-offs."
        else:
            reason = f"Mismatch ({ms}) suggests salvageable tissue, but avoiding IV clot-busting reduces bleeding risk."

    return f"{reason} {outcome_text}"

def compute_gauges(static: dict, levers: dict, curr_res: dict) -> dict:
    coll = float(static.get("Collaterals", 2.0))
    core0 = float(static.get("Core0", 20.0))
    occl = static.get("OcclType", "OTHER")
    sbp = float(levers.get("sbp", 150.0))

    delta_core = float(curr_res["core"]) - core0
    core_speed = 1
    core_speed += 2 if coll < 1.5 else (1 if coll < 2.2 else 0)
    core_speed += 1 if delta_core > 25 else 0
    core_speed += 1 if delta_core > 45 else 0
    core_speed = clamp_int(core_speed, 1, 5)

    rep = float(curr_res["rep_prob"])
    diff = 2
    if occl in ["ICA_T", "TANDEM"]:
        diff += 2
    elif occl in ["ICA"]:
        diff += 1
    if rep < 70:
        diff += 1
    elif rep > 85:
        diff -= 1
    diff = clamp_int(diff, 1, 5)

    sich = float(curr_res["sich_prob"])
    hv = 1
    if sich > 10:
        hv += 1
    if sich > 18:
        hv += 1
    if float(curr_res["core"]) > 60:
        hv += 1
    if sbp > 170:
        hv += 1
    hv = clamp_int(hv, 1, 5)

    return {
        "core_growth_speed": core_speed,
        "reperfusion_difficulty": diff,
        "hemorrhage_vulnerability": hv,
    }

def render_before_after_bars(core0, core_final, salvaged, territory=150.0):
    core0 = float(core0); core_final = float(core_final); salvaged = float(salvaged); territory = float(territory)
    penf = max(0.0, territory - core_final)

    rows = [
        ("Core (before)", core0),
        ("Core (after)", core_final),
        ("Penumbra (after)", penf),
        ("Salvaged", salvaged),
    ]

    fig = go.Figure()
    for name, val in rows[::-1]:
        fig.add_trace(
            go.Bar(
                x=[val],
                y=[name],
                orientation="h",
                text=[f"{int(round(val))} cc"],
                textposition="auto",
                marker=dict(color="#06b6d4" if name == "Salvaged" else "#475569"),
                hovertemplate=f"{name}: {int(round(val))} cc<extra></extra>",
            )
        )

    fig.update_layout(
        height=220,
        margin=dict(l=10, r=10, t=10, b=10),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#e2e8f0", family="Inter"),
        xaxis=dict(range=[0, territory], showgrid=True, gridcolor="#334155"),
        yaxis=dict(showgrid=False),
        showlegend=False,
    )
    return fig

def contribution_breakdown(base, curr):
    mrs_delta = float(curr["mrs_prob"]) - float(base["mrs_prob"])

    dt = float(curr["ttr"]) - float(base["ttr"])
    dcore = float(curr["core"]) - float(base["core"])
    dsich = float(curr["sich_prob"]) - float(base["sich_prob"])
    drep = float(curr["rep_prob"]) - float(base["rep_prob"])

    c_time = -0.04 * dt
    c_core = -0.18 * dcore
    c_sich = -0.55 * dsich
    c_rep = +0.10 * drep

    parts = [("Time delay", c_time), ("Larger core", c_core), ("sICH risk", c_sich), ("Reperfusion", c_rep)]
    raw_sum = sum(v for _, v in parts)

    if abs(raw_sum) > 1e-6:
        scale = mrs_delta / raw_sum
        parts = [(k, v * scale) for k, v in parts]

    parts = sorted(parts, key=lambda kv: abs(kv[1]), reverse=True)
    return mrs_delta, parts

def render_sensitivity_curve(s_id, static, user_levers, seed):
    t_center = float(user_levers.get("time", 120))
    t_grid = np.array(
        [max(30, t_center - 60), max(30, t_center - 30), t_center, t_center + 30, t_center + 60],
        dtype=float,
    )

    ys = []
    for t in t_grid:
        tmp = dict(user_levers)
        tmp["time"] = float(t)
        sim = simulate(s_id, static, tmp, mode="deterministic", seed=seed, n_runs=1)
        ys.append(sim["single"]["mrs_prob"])

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=t_grid, y=ys, mode="lines+markers", name="mRS 0-2", line=dict(width=3)))
    fig.update_layout(
        height=220,
        margin=dict(l=10, r=10, t=10, b=10),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#e2e8f0", family="Inter"),
        xaxis=dict(title="Time-to-reperfusion (min)", showgrid=True, gridcolor="#334155"),
        yaxis=dict(title="Good outcome probability (%)", range=[0, 100], showgrid=True, gridcolor="#334155"),
        showlegend=False,
    )
    return fig

def render_uncertainty_fan(dist_summary):
    m = dist_summary["mean"]
    lo = dist_summary["p05"]
    hi = dist_summary["p95"]

    labels = ["mRS 0-2"]
    fig = go.Figure()

    fig.add_trace(
        go.Bar(
            x=labels,
            y=[m],
            name="Mean",
            error_y=dict(type="data", symmetric=False, array=[hi - m], arrayminus=[m - lo], thickness=2),
            text=[f"{int(round(m))}% (P05 {int(round(lo))}%, P95 {int(round(hi))}%)"],
            textposition="auto",
        )
    )

    fig.update_layout(
        height=220,
        margin=dict(l=10, r=10, t=10, b=10),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#e2e8f0", family="Inter"),
        yaxis=dict(range=[0, 100], showgrid=True, gridcolor="#334155"),
        showlegend=False,
    )
    return fig

# -----------------------------
# 5) SCENARIOS (X fixed, A variable)
# -----------------------------
SCENARIOS = {
    "S1": {
        "name": "1. Routing: Drip-and-Ship",
        "static": {"Age": 72, "Sex": "M", "NIHSS": 18, "Occlusion": "Left M1", "Collaterals": 1.5, "Core0": 25, "Territory": 150},
        "desc": "Transfer (Drip & Ship) vs Direct Mothership. Moderate collaterals.",
    },
    "S2": {
        "name": "2. Treatment: Bridging",
        "static": {"Age": 58, "Sex": "F", "NIHSS": 14, "Occlusion": "Proximal M1", "Collaterals": 2.5, "Core0": 10, "Territory": 150},
        "desc": "IV tPA + EVT vs EVT Alone. Good collaterals.",
    },
    "S3": {
        "name": "3. Imaging: Direct-to-Angio",
        "static": {"Age": 65, "Sex": "M", "NIHSS": 20, "Occlusion": "ICA Terminus", "Collaterals": 0.5, "Core0": 40, "Territory": 150},
        "desc": "Bypass CT Perfusion vs Standard Imaging. Very poor collaterals.",
    },
    "S4": {
        "name": "4. Tandem Lesion (Complex)",
        "static": {"Age": 62, "Sex": "M", "NIHSS": 15, "Occlusion": "ICA + M1", "Collaterals": 2.0, "Core0": 15, "Territory": 150},
        "desc": "Acute stent (DAPT bleed risk) vs Balloon-only (re-occlusion risk).",
    },
    "S5": {
        "name": "5. Large Core (Select2)",
        "static": {"Age": 50, "Sex": "F", "NIHSS": 22, "Occlusion": "Proximal M1", "Collaterals": 1.0, "Core0": 90, "Territory": 150},
        "desc": "Treating a massive core. Smaller benefit, higher harm, but may reduce worst outcomes.",
    },
    "S6": {
        "name": "6. Wake-Up Stroke",
        "static": {"Age": 70, "Sex": "M", "NIHSS": 12, "Occlusion": "M2", "Collaterals": 2.0, "Core0": 30, "Territory": 150, "MismatchStrength": "Moderate"},
        "desc": "Unknown time. MRI mismatch strength guides IV tPA decision.",
    },
}

for _sid, _s in SCENARIOS.items():
    _s["static"]["OcclType"] = normalize_occlusion(_s["static"].get("Occlusion", ""))

# -----------------------------
# 6) SIDEBAR CONTROLS
# -----------------------------
with st.sidebar:
    st.markdown("### 🏥 Case Selector")
    s_name = st.selectbox("Select Scenario", [s["name"] for s in SCENARIOS.values()], key="scenario_select")
    s_id = next(k for k, v in SCENARIOS.items() if v["name"] == s_name)
    data = SCENARIOS[s_id]

    st.markdown("---")
    st.markdown("### 🎛️ Simulation Mode")
    sim_mode = st.radio("Outputs", ["Deterministic", "Uncertainty (Monte Carlo)"], index=0, key="sim_mode")
    mode = "deterministic" if sim_mode.startswith("Deterministic") else "uncertainty"
    n_runs = 200 if mode == "uncertainty" else 1

    st.markdown("---")
    st.markdown("### 🎲 Demo controls")
    seed = st.number_input("Random seed", min_value=1, max_value=999999, value=1337, step=1, key="seed")

    st.markdown("---")
    st.markdown("### 🛠️ Intervention Levers (A)")

    if s_id == "S1":
        base_levers = {"route": "Drip-and-Ship", "time": 160.0, "ivt": True, "sbp": 150.0, "technique": "Standard"}
        user_levers = dict(base_levers)

        route = st.radio("Routing", ["Drip-and-Ship", "Direct Mothership"], index=0, key="s1_route")
        transfer = st.slider("Transfer delay (min)", 0, 120, 60, step=5, key="s1_transfer")
        dtg = st.slider("Door-to-groin at EVT center (min)", 25, 120, 70, step=5, key="s1_dtg")
        ivt_delay = st.slider("IVT-related workflow delay (min)", 0, 20, 5, step=1, key="s1_ivt_delay")

        if route == "Direct Mothership":
            user_levers["route"] = route
            user_levers["ivt"] = False
            user_levers["time"] = float(dtg + 35)
        else:
            user_levers["route"] = route
            user_levers["ivt"] = True
            user_levers["time"] = float(80 + transfer + dtg + 35 + ivt_delay)

    elif s_id == "S2":
        base_levers = {"strategy": "EVT Alone", "ivt": False, "time": 105.0, "sbp": 150.0, "technique": "Standard"}
        user_levers = dict(base_levers)

        strat = st.radio("Strategy", ["EVT Alone", "Bridging (IVT+EVT)"], index=0, key="s2_strategy")
        ivt_delay = st.slider("IVT workflow delay (min)", 0, 20, 5, step=1, key="s2_ivt_delay")

        user_levers["strategy"] = strat
        user_levers["ivt"] = (strat == "Bridging (IVT+EVT)")
        base_e2r = 95.0
        user_levers["time"] = float(base_e2r + (ivt_delay if user_levers["ivt"] else 0))

    elif s_id == "S3":
        base_levers = {"technique": "Standard", "time": 105.0, "ivt": False, "sbp": 160.0}
        user_levers = dict(base_levers)

        path = st.radio("Pathway", ["Standard (CTA + Perfusion)", "Direct-to-Angio"], index=0, key="s3_path")
        if path == "Direct-to-Angio":
            user_levers["technique"] = "Direct Angio"
            user_levers["time"] = 70.0
        else:
            user_levers["technique"] = "Standard"
            user_levers["time"] = 105.0

    elif s_id == "S4":
        base_levers = {"strategy": "Balloon Only", "time": 105.0, "ivt": False, "sbp": 150.0}
        user_levers = dict(base_levers)

        strategy = st.radio("Neck strategy", ["Balloon Only", "Acute Stenting + DAPT"], index=0, key="s4_strategy")
        user_levers["strategy"] = strategy
        user_levers["time"] = 110.0 if strategy == "Acute Stenting + DAPT" else 105.0

    elif s_id == "S5":
        base_levers = {"action": "Medical Mgmt", "time": 130.0, "ivt": False, "sbp": 155.0}
        user_levers = dict(base_levers)

        action = st.radio("Decision", ["Medical Mgmt", "Thrombectomy"], index=0, key="s5_action")
        user_levers["action"] = action
        user_levers["time"] = 140.0 if action == "Thrombectomy" else 130.0

    elif s_id == "S6":
        base_levers = {
            "time": 120.0,
            "ivt": False,
            "sbp": 150.0,
            "mismatch_strength": "Moderate",
            "technique": "Standard",
        }
        user_levers = dict(base_levers)

        mismatch_strength = st.radio(
            "MRI mismatch strength",
            ["Mild", "Moderate", "Strong"],
            index=1,
            key="s6_mismatch_strength",
        )
        user_levers["mismatch_strength"] = mismatch_strength

        drug_choice = st.radio(
            "Pharmacology",
            ["EVT Alone", "IV tPA + EVT"],
            index=0,
            key="s6_drug_choice",
        )
        user_levers["ivt"] = (drug_choice == "IV tPA + EVT")

        ivt_delay = st.slider(
            "IVT workflow delay (min)",
            0, 20, 5,
            step=1,
            key="s6_ivt_delay",
        )
        base_time = 110.0
        user_levers["time"] = float(base_time + (ivt_delay if user_levers["ivt"] else 0))

    st.markdown("---")
    st.markdown("### 🧠 Physiology (shared)")
    user_levers["sbp"] = st.slider(
        "SBP target (mmHg)",
        100, 200,
        int(round(user_levers.get("sbp", 150))),
        step=5,
        key=f"{s_id}_sbp",
    )
    base_levers["sbp"] = float(base_levers.get("sbp", 150.0))

    if user_levers["sbp"] < 130 and float(data["static"]["Collaterals"]) < 2.0:
        st.error("⚠️ Risk: hypoperfusion. Low SBP in poor collaterals may accelerate core growth.")
    if user_levers["sbp"] > 180:
        st.warning("⚠️ Risk: hyperperfusion. High SBP increases hemorrhage/edema risk.")

# -----------------------------
# 7) RUN SIMULATIONS
# -----------------------------
# ✅ use the SAME seed for baseline vs intervention for clean comparisons
base_sim = simulate(s_id, data["static"], base_levers, mode=mode, seed=seed, n_runs=n_runs)
curr_sim = simulate(s_id, data["static"], user_levers, mode=mode, seed=seed, n_runs=n_runs)

if base_sim["type"] == "single":
    base_res = base_sim["single"]
    curr_res = curr_sim["single"]
else:
    base_res = {k: base_sim["summary"][k]["mean"] for k in base_sim["summary"].keys()}
    curr_res = {k: curr_sim["summary"][k]["mean"] for k in curr_sim["summary"].keys()}
    base_res["ttr"] = base_sim["summary"]["ttr"]["mean"]
    curr_res["ttr"] = curr_sim["summary"]["ttr"]["mean"]

# -----------------------------
# 8) HEADER + "WHAT CHANGED" STRIP
# -----------------------------
st.markdown('<div class="header-text">NeuroSim <span style="color:#06b6d4">Command Center</span></div>', unsafe_allow_html=True)
st.markdown(f'<div class="sub-text">{data["desc"]} | AI-Assisted causal decision support</div>', unsafe_allow_html=True)

changed_action = []
for k in sorted(set(base_levers.keys()) | set(user_levers.keys())):
    if base_levers.get(k) != user_levers.get(k):
        changed_action.append(f"{k}: {base_levers.get(k)} → {user_levers.get(k)}")
changed_action_txt = ", ".join(changed_action) if changed_action else "No intervention change."

strip_html = f"""
<div class="glass-panel" style="padding:12px 16px; margin-bottom:12px;">
  <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
    <span class="pill"><b>You changed (A)</b>: {changed_action_txt}</span>
    <span class="pill"><b>This changed (M)</b>: time-to-reperfusion = {int(round(curr_res["ttr"]))} min ({'+' if curr_res["ttr"]-base_res["ttr"]>0 else ''}{int(round(curr_res["ttr"]-base_res["ttr"]))} min)</span>
    <span class="pill"><b>This caused (Y)</b>: core {int(round(curr_res["core"]))} cc ({'+' if curr_res["core"]-base_res["core"]>0 else ''}{int(round(curr_res["core"]-base_res["core"]))} cc) → outcome {'+' if curr_res["mrs_prob"]-base_res["mrs_prob"]>0 else ''}{int(round(curr_res["mrs_prob"]-base_res["mrs_prob"]))}%</span>
  </div>
</div>
"""
st.markdown(strip_html, unsafe_allow_html=True)

# -----------------------------
# 9) ROW 1: IMAGING + PHENOTYPE + GAUGES
# -----------------------------
c_img, c_pheno = st.columns([2, 1])

with c_img:
    st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
    tabs = st.tabs(["CT Perfusion", "CBV Index", "Angiography", "AI Mask"])
    modalities = ["CTP", "CBV", "CTA", "AI"]

    for i, tab in enumerate(tabs):
        with tab:
            suffix = modalities[i]
            filename = f"{s_id}_{suffix}.png"
            img = load_image(filename)

            if img:
                st.image(img, width="stretch")
            else:
                st.markdown(
                    f"""
                <div class="img-box">
                    <div style="font-size:3rem; margin-bottom:10px;">🧠</div>
                    <div style="font-size:1rem; font-weight:600; color:#e2e8f0;">{tabs[i]._label} View</div>
                    <div style="font-size:0.8rem; color:#64748b; margin-top:10px;">
                        Save image as: <br>
                        <code style="color:#06b6d4; background:rgba(0,0,0,0.3); padding:2px 4px; border-radius:4px;">images/{filename}</code>
                    </div>
                </div>""",
                    unsafe_allow_html=True,
                )
    st.markdown("</div>", unsafe_allow_html=True)

with c_pheno:
    st.markdown('<div class="glass-panel" style="height: 100%;">', unsafe_allow_html=True)
    st.markdown('<div style="color:#06b6d4; font-weight:600; margin-bottom:10px;">Patient Phenotype (X)</div>', unsafe_allow_html=True)

    st.markdown(
        f"""
        <div>
          <span class="pill">Age {data["static"]["Age"]} {data["static"]["Sex"]}</span>
          <span class="pill">NIHSS {data["static"]["NIHSS"]}</span>
          <span class="pill">Occlusion {data["static"]["Occlusion"]}</span>
          <span class="pill">Collaterals {data["static"]["Collaterals"]}/3</span>
          <span class="pill">Core0 {data["static"]["Core0"]}cc</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    gauges = compute_gauges(data["static"], user_levers, curr_res)
    st.markdown("##### Effect Modifiers & Risk Context")
    st.markdown(
        f"""
<div style="margin-top:8px;">
  <div class="pill">Core growth speed: <b>{score_to_bar(gauges["core_growth_speed"])}</b> ({gauges["core_growth_speed"]}/5)</div>
  <div class="pill">Reperfusion difficulty: <b>{score_to_bar(gauges["reperfusion_difficulty"])}</b> ({gauges["reperfusion_difficulty"]}/5)</div>
  <div class="pill">Hemorrhage vulnerability: <b>{score_to_bar(gauges["hemorrhage_vulnerability"])}</b> ({gauges["hemorrhage_vulnerability"]}/5)</div>
</div>
""",
        unsafe_allow_html=True,
    )

    st.markdown("---")
    if s_id == "S5":
        st.error("⚠️ Large core phenotype")
    if s_id == "S6":
        st.success("✅ Mismatch-guided pathway")
    if s_id == "S4":
        st.warning("⚠️ Tandem lesion mechanics")

    st.markdown("</div>", unsafe_allow_html=True)

# -----------------------------
# 10) ROW 2: RESULTS
# -----------------------------
c1, c1b, c2, c3 = st.columns([0.9, 1.1, 1.2, 1])

with c1:
    st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
    st.markdown("##### Tissue Fate", unsafe_allow_html=True)
    st.plotly_chart(
        render_tissue_donut(
            curr_res["core"],
            curr_res["salvaged"],
            curr_res["dead_penumbra"],
            territory=data["static"].get("Territory", 150),
        ),
        width="stretch",
    )
    st.markdown("</div>", unsafe_allow_html=True)

with c1b:
    st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
    st.markdown("##### Brain Before vs After", unsafe_allow_html=True)
    st.plotly_chart(
        render_before_after_bars(
            core0=data["static"]["Core0"],
            core_final=curr_res["core"],
            salvaged=curr_res["salvaged"],
            territory=data["static"].get("Territory", 150),
        ),
        width="stretch",
    )
    st.markdown("</div>", unsafe_allow_html=True)

with c2:
    st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
    st.markdown("##### Outcomes", unsafe_allow_html=True)
    st.plotly_chart(render_outcome_bar(base_res, curr_res), width="stretch")

    if mode == "uncertainty" and curr_sim["type"] == "dist":
        st.markdown("##### Uncertainty Fan (Monte Carlo)", unsafe_allow_html=True)
        st.plotly_chart(render_uncertainty_fan(curr_sim["summary"]["mrs_prob"]), width="stretch")

    st.markdown("</div>", unsafe_allow_html=True)

with c3:
    st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
    st.markdown("##### Intervention Effects", unsafe_allow_html=True)
    st.markdown(render_impact_table(base_res, curr_res), unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

# -----------------------------
# 11) ROW 3: CAUSAL LOGIC + CONTRIBUTION + ACTIVE NODES
# -----------------------------
with st.expander("🕸️ Causal Logic & Mechanism (Under the Hood)", expanded=True):
    lc, rc = st.columns([1, 2])

    active = ["Y"]
    if s_id in ["S1", "S3"]:
        active += ["A", "T", "Core"]
    elif s_id in ["S2", "S6"]:
        active += ["A", "R", "B"]
    elif s_id == "S4":
        active += ["A", "P", "B"]
    elif s_id == "S5":
        active += ["A", "S", "R", "Core"]
    if s_id == "S1":
        active += ["C"]

    with lc:
        st.graphviz_chart(render_dag(s_id, active_nodes=active))

    with rc:
        mrs_diff = int(round(curr_res["mrs_prob"] - base_res["mrs_prob"]))
        st.markdown(
            f"""
        <div class="narrative-box">
            <strong>What changed causally?</strong><br>
            We keep the phenotype (X) fixed and only change the action (A). The simulator propagates changes through mediators:
            time-to-reperfusion, core growth, reperfusion probability, and hemorrhage risk.
            <br><br>
            Net effect estimate: <span class="highlight">{'+' if mrs_diff>0 else ''}{mrs_diff}%</span> change in probability of good functional outcome (mRS 0-2),
            with sICH risk at <span class="risk">{int(round(curr_res["sich_prob"]))}%</span>.
        </div>
        """,
            unsafe_allow_html=True,
        )

        mrs_delta, parts = contribution_breakdown(base_res, curr_res)
        lines = []
        for k, v in parts[:4]:
            lines.append(f"• {k}: {'+' if v>0 else ''}{int(round(v))}%")
        lines_txt = "<br>".join(lines)

        st.markdown(
            f"""
<div class="narrative-box" style="margin-top:10px;">
  <strong>Contribution Breakdown (Why the outcome changed):</strong><br>
  Net change in good outcome: <span class="highlight">{'+' if mrs_delta>0 else ''}{int(round(mrs_delta))}%</span><br><br>
  {lines_txt}
</div>
""",
            unsafe_allow_html=True,
        )

# -----------------------------
# 12) SENSITIVITY + PATIENT EXPLANATION
# -----------------------------
with st.expander("📈 Causal Slider Sensitivity (time-to-reperfusion)", expanded=False):
    st.markdown('<div class="glass-panel" style="margin-bottom:0px;">', unsafe_allow_html=True)
    st.plotly_chart(render_sensitivity_curve(s_id, data["static"], user_levers, seed=seed), width="stretch")
    st.markdown("</div>", unsafe_allow_html=True)

patient_text = get_patient_explanation(s_id, user_levers, base_res, curr_res)
st.markdown(
    f"""
<div class="patient-box">
    <div class="patient-title">Clinical Explanation (For Patient/Family)</div>
    <div class="patient-text">{patient_text}</div>
</div>
""",
    unsafe_allow_html=True,
)