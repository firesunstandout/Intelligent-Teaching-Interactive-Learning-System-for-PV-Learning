## PV Learning Interactive Teaching Platform (pv-learning-site-v6)

A single-page web teaching platform for high-school / vocational classrooms. It covers the full learning loop of “PV power generation fundamentals” with animations, experiments, knowledge cards, practice, and class rankings. Everything is front-end only—clone and open `index.html` in your browser.

---

### ✨ Key Features

- **Research-grade principle animation**  
  - Visualizes Sun → PN junction → external circuit.  
  - Photons, electrons, holes, bulb, and field strength are rendered in real time; the field fluctuates with carrier count.  
  - Timeline text highlights in sync with play/reset controls.

- **Two experiment modules**  
  1. *PV I‑V curve lab*: adjust irradiance/temperature, compute Voc/Isc/Pmax, and plot the curve live.  
  2. *Incidence-angle lab*: adjust angle and irradiance to see effective irradiance, efficiency, and output power.

- **Knowledge operations**  
  - Knowledge cards, knowledge graph, smart Q&A, and suggested questions.  
  - Self-test records mistakes; class leaderboard supports teacher notices and points.  
  - Hidden “data export” Easter egg lets teachers export classroom interaction data.

- **Data & visualization**  
  - `analysis_output/` contains sample charts of learning behavior.  
  - `analyze_learning_data.py` and friends can re-analyze exported JSON.

---

### 🗂️ Directory (excerpt)

```
pv-learning-site-v6/
├─ index.html           # Main single page
├─ script.js            # All interactions, animations, and module logic
├─ style.css            # Global styles
├─ style-extra.css      # Extra theme styles
├─ data.js              # Copy, quiz bank, and graph data
├─ analysis_output/     # Sample analytics outputs
├─ exprot_data/         # Sample exported classroom data
└─ image/, *.png        # Image assets
```

---

### 🚀 Run locally

1. Clone or unzip the project.  
2. Open `index.html` directly, or start a static server (e.g., `python -m http.server 8080`) and visit `http://localhost:8080/`.  
3. Allow local scripts if prompted to experience the animation.

> **Tip:** Click the footer 5 times quickly to unlock the “Export Teaching Data” button and download QA and quiz logs.

---

### 🧩 Customization tips

- **Animation tuning:** `pnGeometry`, `colorScheme`, `fieldStrength`, etc. in `script.js` manage layout and colors.  
- **Experiments / question bank:** `siteData` in `data.js` holds questions, cards, and graph data—swap as needed.  
- **Deployment:** Purely static—host anywhere (GitHub Pages, Netlify, Vercel, etc.).

---

### 🤝 Contributing

Issues/PRs are welcome for new teaching needs, animation tweaks, or analytics ideas. If collecting real classroom data, please follow your institution’s compliance requirements.