const siteData = {
    knowledgeCards: [
        {
            id: "solar-energy",
            title: "Solar Energy",
            definition: "Energy released by continuous nuclear fusion reactions inside the Sun.",
            // Simple SVG for Sun
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIyNSIgZmlsbD0iI0ZGRDcwMCIgLz4KICA8ZyBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iNCI+CiAgICA8bGluZSB4MT0iNTAiIHkxPSIxMCIgeDI9IjUwIiB5Mj0iMCIgLz4KICAgIDxsaW5lIHgxPSI1MCIgeTE9IjkwIiB4Mj0iNTAiIHkyPSIxMDAiIC8+CiAgICA8bGluZSB4MT0iMTAiIHkxPSI1MCIgeDI9IjAiIHkyPSI1MCIgLz4KICAgIDxsaW5lIHgxPSI5MCIgeTE9IjUwIiB4Mj0iMTAwIiB5Mj0iNTAiIC8+CiAgICA8bGluZSB4MT0iMjIiIHkxPSIyMiIgeDI9IjE1IiB5Mj0iMTUiIC8+CiAgICA8bGluZSB4MT0iNzgiIHkxPSI3OCIgeDI9Ijg1IiB5Mj0iODUiIC8+CiAgICA8bGluZSB4MT0iMjIiIHkxPSI3OCIgeDI9IjE1IiB5Mj0iODUiIC8+CiAgICA8bGluZSB4MT0iNzgiIHkxPSIyMiIgeDI9Ijg1IiB5Mj0iMTUiIC8+CiAgPC9nPgo8L3N2Zz4=",
            keyPoints: [
                "Clean and renewable",
                "Huge radiant output",
                "Impacted by weather and day/night"
            ]
        },
        {
            id: "photon",
            title: "Photon",
            definition: "The fundamental particle of light that carries energy.",
            // SVG for Wave/Particle
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cGF0aCBkPSJNMTAgNTAgcTIwIC0zMCA0MCAwIHQ0MCAwIiBmaWxsPSJub25lIiBzdHJva2U9IiM1QUM4RkEiIHN0cm9rZS13aWR0aD0iNCIgLz4KICA8Y2lyY2xlIGN4PSI5MCIgY3k9IjUwIiByPSI4IiBmaWxsPSIjRkZEMzAwIiAvPgo8L3N2Zz4=",
            keyPoints: [
                "Wave–particle duality",
                "Energy E = hν",
                "Excites electrons in semiconductors"
            ]
        },
        {
            id: "pn-junction",
            title: "PN Junction",
            definition: "Region formed by joining p-type and n-type semiconductors; the core of a PV cell.",
            // SVG for PN Junction
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB4PSIxMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI0QzRDNEMyIgLz4KICA8cmVjdCB4PSI1MCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI0E5QTlBOSIgLz4KICA8dGV4dCB4PSIzMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJhcmlhbCIgZm9udC1zaXplPSIxNSIgZmlsbD0iIzMzMyI+TjwvdGV4dD4KICA8dGV4dCB4PSI2NSIgeT0iNTUiIGZvbnQtZmFtaWx5PSJhcmlhbCIgZm9udC1zaXplPSIxNSIgZmlsbD0id2hpdGUiPlA8L3RleHQ+CiAgPGxpbmUgeDE9IjUwIiB5MT0iMjAiIHgyPSI1MCIgeTI9IjgwIiBzdHJva2U9IndoaXRlIiBzdHJva2UtZGFzaGFycmF5PSI0IiAvPgo8L3N2Zz4=",
            keyPoints: [
                "Creates a built-in electric field",
                "Separates electron–hole pairs",
                "One-way conductivity"
            ]
        },
        {
            id: "photovoltaic-effect",
            title: "Photovoltaic Effect",
            definition: "Illumination causes a potential difference across a non-uniform semiconductor or semiconductor–metal junction.",
            // SVG for PV Effect
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB4PSIyMCIgeT0iNjAiIHdpZHRoPSI2MCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzMzMyIgLz4KICA8cGF0aCBkPSJNNDAgMTAgTDUwIDQwIEw2MCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZEMzAwIiBzdHJva2Utd2lkdGg9IjMiIC8+CiAgPGNpcmNsZSBjeD0iNDUiIGN5PSI1MCIgcj0iNSIgZmlsbD0iYmx1ZSIgLz4KICA8Y2lyY2xlIGN4PSI1NSIgY3k9IjUwIiByPSI1IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJibHVlIiAvPgo8L3N2Zz4=",
            keyPoints: [
                "Converts light into electricity",
                "No mechanical movement needed",
                "Foundation of photovoltaic power"
            ]
        },
        {
            id: "pv-cell",
            title: "PV Cell",
            definition: "A device that converts light directly into electricity via the photovoltaic effect.",
            // SVG for Cell
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgZmlsbD0iIzAwM0E3MCIgcng9IjQiIC8+CiAgPGcgc3Ryb2tlPSIjQzBDMEMwIiBzdHJva2Utd2lkdGg9IjEiPgogICAgPGxpbmUgeDE9IjIwIiB5MT0iMjUiIHgyPSI4MCIgeTI9IjI1IiAvPgogICAgPGxpbmUgeDE9IjIwIiB5MT0iNDAiIHgyPSI4MCIgeTI9IjQwIiAvPgogICAgPGxpbmUgeDE9IjIwIiB5MT0iNTUiIHgyPSI4MCIgeTI9IjU1IiAvPgogICAgPGxpbmUgeDE9IjIwIiB5MT0iNzAiIHgyPSI4MCIgeTI9IjcwIiAvPgogICAgPGxpbmUgeDE9IjMwIiB5MT0iMTAiIHgyPSIzMCIgeTI9IjkwIiBzdHJva2Utd2lkdGg9IjIiIC8+CiAgICA8bGluZSB4MT0iNzAiIHkxPSIxMCIgeDI9IjcwIiB5Mj0iOTAiIHN0cm9rZS13aWR0aD0iMiIgLz4KICA8L2c+Cjwvc3ZnPg==",
            keyPoints: [
                "Basic power-generating unit",
                "Usually made of silicon",
                "Connected in series to form modules"
            ]
        },
        {
            id: "inverter",
            title: "PV Inverter",
            definition: "Device that converts the DC from PV modules into AC.",
            // SVG for Inverter
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB4PSIxNSIgeT0iMjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2YwZjBmMCIgc3Ryb2tlPSIjMDA3QUZG IiBzdHJva2Utd2lkdGg9IjMiIHJ4PSI1IiAvPgogIDwhLS0gREMgSW5wdXQgLS0+CiAgPGxpbmUgeDE9IjUiIHkxPSI0MCIgeDI9IjE1IiB5Mj0iNDAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiAvPgogIDxsaW5lIHgxPSI4IiB5MT0iMzciIHgyPSI4IiB5Mj0iNDMiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiAvPgogIDxsaW5lIHgxPSIxMiIgeTE9IjM3IiB4Mj0iMTIiIHkyPSI0MyIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiIC8+CiAgPGxpbmUgeDE9IjUiIHkxPSI2MCIgeDI9IjE1IiB5Mj0iNjAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiAvPgogIDxsaW5lIHgxPSIxMCIgeTE9IjU3IiB4Mj0iMTAiIHkyPSI2MyIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiIC8+CiAgPCEtLSBBQyBPdXRwdXQgLS0+CiAgPGxpbmUgeDE9Ijg1IiB5MT0iNDAiIHgyPSI5NSIgeTI9IjQwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMyIgLz4KICA8cGF0aCBkPSJNODcgMzYgUTkwIDQwIDg3IDQ0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDdBRkYiIHN0cm9rZS13aWR0aD0iMiIgLz4KICA8bGluZSB4MT0iODUiIHkxPSI2MCIgeDI9Ijk1IiB5Mj0iNjAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiAvPgogIDxwYXRoIGQ9Ik04NyA1NiBROTAgNjAgODcgNjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwN0FGRiIgc3Ryb2tlLXdpZHRoPSIyIiAvPgogIDx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9ImFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjMDA3QUZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+fn48L3RleHQ+Cjwvc3ZnPg==",
            keyPoints: [
                "Heart of the system",
                "Has MPPT functionality",
                "Required for grid connection"
            ]
        }
    ],
    animations: {
        title: "PV Principle Demo",
        description: "Watch photons hit the PN junction, create electron–hole pairs, and flow as current under the built-in field.",
        steps: [
            { time: 0, label: "Ready", info: "Click play to start the PV effect." },
            { time: 2, label: "Photon Incident", info: "Sunlight (photons) passes the AR coating into the silicon wafer." },
            { time: 4, label: "Excite Electrons", info: "Photon energy is absorbed, creating free electrons and holes." },
            { time: 6, label: "Field Separation", info: "The PN junction field separates electrons and holes." },
            { time: 8, label: "Circuit Current", info: "Electrons flow through the external circuit and light the bulb." }
        ]
    },
    qna: [
        {
            id: 1,
            question: "Why can a PV cell generate current?",
            answer: "It relies on the photovoltaic effect. When photons strike the PN junction, their energy creates free electrons and holes. The built-in electric field drives them in opposite directions, building a voltage across the junction. Once an external circuit is connected, current flows.",
            keywords: ["principle", "current", "why", "how", "generate"]
        },
        {
            id: 2,
            question: "What factors affect PV efficiency?",
            answer: "Key factors: 1) Irradiance (more sun, more power); 2) Temperature (higher cell temperature lowers voltage and efficiency); 3) Shading (severely reduces output and may harm modules); 4) Aging and soiling of modules.",
            keywords: ["efficiency", "factors", "impact", "fast", "slow"]
        },
        {
            id: 3,
            question: "What is the difference between monocrystalline and polycrystalline silicon?",
            answer: "Monocrystalline silicon has an ordered lattice, offering higher efficiency (~20–24%) at slightly higher cost, with a deep blue/black look. Polycrystalline has a less ordered lattice, slightly lower efficiency (~18–20%), lower cost, and a blue shattered-glass appearance.",
            keywords: ["mono", "poly", "difference", "silicon"]
        },
        {
            id: 4,
            question: "What does an inverter do?",
            answer: "PV modules output DC, but homes and the grid use AC. The inverter converts DC to AC and performs maximum power point tracking (MPPT) to keep the array operating efficiently.",
            keywords: ["inverter", "purpose", "dc", "ac"]
        }
    ],
    practice: [
        {
            id: 1,
            type: "choice",
            question: "What is the basic principle of photovoltaic power generation?",
            options: ["Electromagnetic induction", "Photovoltaic effect", "Thermoelectric effect", "Chemical reaction"],
            correctAnswer: 1,
            explanation: "PV power converts light directly to electricity via the photovoltaic effect at a semiconductor junction."
        },
        {
            id: 2,
            type: "truefalse",
            question: "The hotter a PV module is, the higher its power output.",
            options: ["True", "False"],
            correctAnswer: 1,
            explanation: "False. For crystalline silicon, higher temperature lowers open-circuit voltage and reduces efficiency."
        },
        {
            id: 3,
            type: "choice",
            question: "In a PN junction, what is the direction of the built-in electric field?",
            options: ["From p-region to n-region", "From n-region to p-region", "No direction", "Randomly changes"],
            correctAnswer: 1,
            explanation: "After contact, the n-side near the junction is positively charged and the p-side is negative, so the field points from n to p."
        },
        {
            id: 4,
            type: "choice",
            question: "What is the main role of the inverter in a PV system?",
            options: ["Store energy", "Convert DC to AC", "Step up voltage", "Reduce temperature"],
            correctAnswer: 1,
            explanation: "The inverter converts PV DC into AC for grid/home use and performs MPPT."
        },
        {
            id: 5,
            type: "choice",
            question: "Which factor is NOT a major environmental influence on PV efficiency?",
            options: ["Irradiance", "Ambient temperature", "Altitude", "Module tilt angle"],
            correctAnswer: 2,
            explanation: "Altitude has minimal impact. Irradiance, temperature, and tilt angle are key factors."
        }
    ],
    rankingData: [
        { name: "Zhang Wei", score: 980, badge: "🌟 PV Expert" },
        { name: "Li Na", score: 950, badge: "⚡ Power Pioneer" },
        { name: "Wang Qiang", score: 920, badge: "🔋 Storage Guru" },
        { name: "Zhao Min", score: 890, badge: "💡 Innovation Star" },
        { name: "Liu Yang", score: 850, badge: "📚 Diligent Learner" },
        { name: "Chen Jing", score: 820, badge: "" },
        { name: "Yang Bo", score: 780, badge: "" },
        { name: "Huang Yong", score: 750, badge: "" }
    ]
};
