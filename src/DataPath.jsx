import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard, Map, CheckSquare, CalendarDays, BarChart3,
  CheckCircle2, Circle, Clock, ExternalLink,
  Plus, X, ChevronDown, ChevronRight, Target,
  ArrowRight, BookOpen, Settings,
  Calendar,
} from "lucide-react";
import { storage } from "./storage.js";
import { Capacitor } from "@capacitor/core";

// ─── helpers ──────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split("T")[0];
const addDays = (d, n) => { const x = new Date(d + "T00:00:00"); x.setDate(x.getDate() + n); return x.toISOString().split("T")[0]; };
const daysBetween = (a, b) => Math.max(0, Math.floor((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000));
// Signed day difference (can be negative) — needed to detect dates outside the 84-day plan.
const dayDiff = (a, b) => Math.floor((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
const fmtShort = d => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtFull = d => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtWeekday = d => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" });

// ─── static data ──────────────────────────────────────────────────────────────
const PHASES = [
  { id: 1, title: "SQL Mastery", sub: "Deep query skills", weeks: "1–2", color: "#22d3a5", dim: "rgba(34,211,165,0.1)", icon: "🔍" },
  { id: 2, title: "Python Analytics", sub: "Pandas & EDA", weeks: "3–4", color: "#8b7cf8", dim: "rgba(139,124,248,0.1)", icon: "🐍" },
  { id: 3, title: "Visualization", sub: "Charts & Dashboards", weeks: "5–8", color: "#f87171", dim: "rgba(248,113,113,0.1)", icon: "📊" },
  { id: 4, title: "Portfolio & Jobs", sub: "Launch & Land", weeks: "9–12", color: "#fb923c", dim: "rgba(251,146,60,0.1)", icon: "🚀" },
];

const W = (ph, tp, cl, ts) => ({ ph, tp, cl, ts });
const T = (ti, ds, tm, rs = []) => ({ ti, ds, tm, rs });

const WRAW = [
  W(1, "SQL Foundations", "#22d3a5", [
    T("Dev environment setup", "Install DBeaver, connect to Supabase free PostgreSQL. Run your first SELECT, WHERE, ORDER BY queries.", "2h", ["supabase.com", "dbeaver.io"]),
    T("JOINs mastery", "Write 15 queries: INNER, LEFT, RIGHT, FULL OUTER JOINs. Understand how nulls behave in each type.", "3h", ["mode.com/sql-tutorial"]),
    T("Subqueries", "Correlated vs non-correlated subqueries. IN, EXISTS, ANY, ALL operators with real examples.", "2h"),
    T("CTEs (WITH clause)", "Chain multiple CTEs. Compare readability vs subqueries. Write 5 CTEs on your dataset.", "2h"),
    T("Window functions I", "ROW_NUMBER, RANK, DENSE_RANK, NTILE — partition and rank rows within groups.", "3h"),
    T("Window functions II", "LAG, LEAD, FIRST_VALUE, LAST_VALUE, running SUM/AVG OVER PARTITION BY.", "3h"),
    T("HackerRank SQL ×10", "Solve 10 Medium-difficulty SQL challenges on HackerRank. Document each solution in notes.", "3h", ["hackerrank.com/domains/sql"]),
  ]),
  W(1, "Advanced SQL + Real Data", "#22d3a5", [
    T("String & date functions", "CONCAT, TRIM, SUBSTRING, UPPER/LOWER. DATE_TRUNC, EXTRACT, DATEDIFF, DATE_ADD.", "2h"),
    T("CASE WHEN logic", "Conditional expressions, score banding, pivot-style transformations with CASE WHEN.", "2h"),
    T("Advanced GROUP BY", "GROUPING SETS, ROLLUP, CUBE. Multi-level aggregations with HAVING filters.", "2h"),
    T("Query performance", "Read EXPLAIN ANALYZE output. B-tree vs Hash indexes. Identify and fix slow queries.", "2h"),
    T("Import real dataset", "Download Zomato / IPL / Indian jobs from Kaggle. Import CSV into PostgreSQL.", "2h", ["kaggle.com/datasets"]),
    T("5 business queries", "Write 5 queries answering real business questions from your imported dataset.", "3h"),
    T("Week 2 review + cheat sheet", "Redo your 5 hardest SQL problems. Build a personal SQL functions reference sheet.", "2h"),
  ]),
  W(2, "Pandas Deep Dive", "#8b7cf8", [
    T("Python env setup", "Install Anaconda, launch Jupyter Lab. Import pandas, numpy, matplotlib. First notebook.", "1h", ["anaconda.com"]),
    T("DataFrame basics", "Read CSV/Excel, select columns, filter rows, sort, shape, info(), describe().", "2h"),
    T("Data cleaning", "Handle nulls (fillna/dropna), duplicates, wrong dtypes, outlier detection and removal.", "3h"),
    T("GroupBy & agg()", "groupby().agg({col: func}), named aggregations, multi-column grouping, transform().", "3h"),
    T("Merge, join, concat", "pd.merge all join types. pd.concat axis=0/1. DataFrame.join(). When to use each.", "2h"),
    T("Pivot tables", "pd.pivot_table, pd.crosstab, stack/unstack, melt. Reshape data any way you need.", "2h"),
    T("Time series basics", "DatetimeIndex, resample('M'), rolling(7).mean(), date range filtering.", "2h"),
  ]),
  W(2, "First Analysis Project", "#8b7cf8", [
    T("Choose & load dataset", "Pick: Zomato / IPL / Indian jobs. Load, inspect shape, check all column types.", "2h", ["kaggle.com/datasets"]),
    T("Full data cleaning pipeline", "Nulls, types, duplicates, outliers — complete pipeline. Document every decision.", "3h"),
    T("EDA — 10 insights", "Distributions, correlations, top-N analysis. Write each insight in markdown cells.", "3h"),
    T("10 SQL queries on same data", "Answer 10 business questions on the same dataset via SQL — compare with pandas.", "3h"),
    T("Push to GitHub", "Clean notebook with markdown narrative + professional README. Commit and push.", "2h"),
    T("Write LinkedIn post", "Screenshot your best chart. Write 3 key insights as text. Publish it publicly.", "1h"),
    T("Month 1 review", "Write a 1-page cheat sheet: all SQL functions + key pandas operations learned.", "2h"),
  ]),
  W(3, "Power BI Basics", "#f87171", [
    T("Install Power BI Desktop", "Download free Power BI Desktop. Watch official Microsoft 30-min intro course.", "2h", ["powerbi.microsoft.com"]),
    T("Import data & model", "Connect to your CSV + PostgreSQL. Star schema: fact vs dimension tables.", "2h"),
    T("DAX basics", "Calculated columns vs measures. SUM, COUNT, AVERAGE, DISTINCTCOUNT, DIVIDE.", "3h"),
    T("CALCULATE & context", "CALCULATE, FILTER, ALL, ALLEXCEPT — master row context vs filter context.", "3h"),
    T("Core visuals", "Bar, line, pie, card, table, matrix visuals. Format every property systematically.", "2h"),
    T("Slicers & filters", "Page/visual/report filters, slicers, cross-filter vs cross-highlight behaviour.", "2h"),
    T("Draft 3-page report", "Build rough dashboard on your Month 1 dataset. Focus on layout and flow.", "3h"),
  ]),
  W(3, "Power BI Advanced", "#f87171", [
    T("Date table + time intelligence", "Build date table with DAX. TOTALYTD, SAMEPERIODLASTYEAR, DATESMTD.", "3h"),
    T("Advanced DAX patterns", "RANKX, TOPN, SWITCH, cumulative totals, % of total, YoY % change.", "3h"),
    T("Advanced visuals", "Treemap, waterfall, decomposition tree, smart narrative visual.", "2h"),
    T("Dashboard design principles", "Colour theory, hierarchy, alignment, white space in data visualization.", "2h"),
    T("Full 5-page polished dashboard", "Complete professional report on your project data. Consistent theme throughout.", "4h"),
    T("Publish to Power BI Service", "Upload to Power BI Service free tier. Get and save the shareable public link.", "1h"),
    T("Document & screenshot", "Write a description for each page. Take screenshots for your portfolio.", "2h"),
  ]),
  W(3, "Python Visualization", "#f87171", [
    T("Matplotlib basics", "Line, bar, scatter, histogram. Understand Figure + Axes architecture deeply.", "2h"),
    T("Matplotlib advanced", "Subplots, twin axes, custom styles with rcParams, annotations, fill_between.", "3h"),
    T("Seaborn statistical plots", "boxplot, violin, kdeplot, histplot, regplot. When to use each type.", "2h"),
    T("Seaborn heatmaps & pairs", "Correlation heatmap, pairplot, clustermap. Choosing right colour palettes.", "2h"),
    T("Plotly interactive charts", "px.line, bar, scatter, choropleth. Hover, zoom, HTML export.", "3h", ["plotly.com/python"]),
    T("Full viz notebook", "One polished notebook: 8 labelled publication-quality charts with insights.", "4h"),
    T("Chart recreation challenge", "Find a data chart in a news article. Recreate it with Python exactly.", "2h"),
  ]),
  W(3, "React Analytics (Your Edge)", "#f87171", [
    T("Recharts setup", "npx create-react-app, install recharts. Render first responsive LineChart.", "2h", ["recharts.org"]),
    T("Charts with real data", "BarChart, LineChart, PieChart loading data from a local JSON file.", "3h"),
    T("Public API integration", "Fetch from a free REST API. Display live updating data in your charts.", "3h"),
    T("Dashboard layout", "4-metric analytics card layout. Responsive CSS Grid. Dark theme styling.", "3h"),
    T("Filters & interactivity", "Date picker, dropdown filters. Charts re-render dynamically on change.", "3h"),
    T("Deploy on Vercel", "Push to GitHub, connect Vercel, get a live URL. Add to your portfolio.", "2h", ["vercel.com"]),
    T("Month 2 review", "List all tools learned. Update resume skills section. Update LinkedIn.", "2h"),
  ]),
  W(4, "Capstone Project", "#fb923c", [
    T("Choose capstone dataset", "Indian e-commerce, Naukri job market data, or IPL cricket stats.", "1h", ["kaggle.com"]),
    T("Full EDA notebook", "20+ insights, markdown narrative cells, well-commented Python code.", "4h"),
    T("SQL deep analysis", "15 complex queries: window functions, CTEs, subqueries, case pivots.", "3h"),
    T("Power BI dashboard", "Professional 5-page report with time intelligence measures throughout.", "4h"),
    T("React KPI dashboard", "Mini dashboard showing your capstone key metrics, deployed live.", "4h"),
    T("Write case study", "500-word write-up: problem statement, methods, key findings, business value.", "2h"),
    T("Push full project to GitHub", "Notebook + SQL file + dashboard screenshots + full README.", "2h"),
  ]),
  W(4, "Kaggle + Portfolio", "#fb923c", [
    T("Polish Kaggle profile", "Bio, avatar, GitHub link. Publish your 2 best analysis notebooks.", "2h", ["kaggle.com"]),
    T("Submit Kaggle notebook", "Publish on an active trending dataset. Aim for upvotes and engagement.", "3h"),
    T("GitHub profile README", "Skills table, 3 project links, learning journey narrative section.", "2h"),
    T("Portfolio site", "GitHub Pages: 3 projects with screenshots, case studies, live links.", "3h", ["pages.github.com"]),
    T("Polish all 3 projects", "Every project: clear README, visuals, live Power BI / React link.", "2h"),
    T("Request peer review", "Post on r/dataanalysis or Data Analysts Discord. Ask for honest feedback.", "1h"),
    T("Apply peer feedback", "Improve your weakest project based on what the community tells you.", "3h"),
  ]),
  W(4, "Resume + LinkedIn", "#fb923c", [
    T("Update resume", "Add all 3 projects. Skills: SQL, Python, Power BI, Pandas, React, Tableau.", "2h"),
    T("LinkedIn optimization", "Headline: 'Data Analyst | SQL · Python · Power BI'. Fill every section.", "2h", ["linkedin.com"]),
    T("LinkedIn success post", "'3 months → Data Analyst. Here's everything I built.' Add screenshots.", "1h"),
    T("Connect with 20 people", "Data analysts + recruiters at your 20 shortlisted target companies.", "1h"),
    T("Research 20 target companies", "List on Naukri + LinkedIn India that actively hire DA freshers.", "2h"),
    T("SQL interview prep", "Practice 15 common SQL interview questions. Window functions focus.", "3h"),
    T("Python DA live-coding prep", "5 tasks: clean data, group, merge, visualise, summarise insights.", "3h"),
  ]),
  W(4, "Job Hunt Launch", "#fb923c", [
    T("Apply: 5 jobs on Naukri", "Search 'Data Analyst 0–2 yrs Bangalore/Hyd'. Tailored cover note each.", "2h", ["naukri.com"]),
    T("Apply: 5 jobs on LinkedIn", "Easy Apply 5 DA roles. Personalise the intro message for each.", "2h", ["linkedin.com/jobs"]),
    T("Cold message 3 recruiters", "'Fresher DA: 3 end-to-end projects in SQL, Power BI, Python, React...'", "1h"),
    T("Apply: 5 on Indeed India", "Indeed India + AngelList for startup data analyst / BI roles.", "2h", ["indeed.co.in"]),
    T("Follow up all applications", "Email/LinkedIn DM every app from Days 78–81. Track in a spreadsheet.", "1h"),
    T("Record mock interview", "Answer: 'Tell me about a project' + 5 live SQL questions on camera.", "2h"),
    T("Keep the momentum going!", "Review progress. Plan your next 2-week application sprint. You're almost there!", "2h"),
  ]),
];

const TASKS = WRAW.flatMap((w, wi) =>
  w.ts.map((t, ti) => ({ id: wi * 7 + ti + 1, day: wi * 7 + ti + 1, week: wi + 1, phase: w.ph, color: w.cl, weekTopic: w.tp, ...t })));

const RESOURCES = [
  { cat: "SQL", color: "#22d3a5", items: [
    { name: "Mode SQL Tutorial", url: "mode.com/sql-tutorial", desc: "Best free interactive SQL course" },
    { name: "HackerRank SQL", url: "hackerrank.com/domains/sql", desc: "Ranked challenges — Medium+ focus" },
    { name: "StrataScratch", url: "stratascratch.com", desc: "Real interview SQL problems" },
    { name: "Supabase (Free DB)", url: "supabase.com", desc: "Free PostgreSQL cloud database" },
    { name: "LeetCode SQL", url: "leetcode.com/problemset/database", desc: "250+ SQL problems, sorted by freq" },
  ]},
  { cat: "Python", color: "#8b7cf8", items: [
    { name: "Anaconda (env)", url: "anaconda.com", desc: "Best Python data science setup" },
    { name: "Kaggle Datasets", url: "kaggle.com/datasets", desc: "Thousands of free datasets" },
    { name: "Pandas Docs", url: "pandas.pydata.org/docs", desc: "Official reference — bookmark it" },
    { name: "Plotly Python", url: "plotly.com/python", desc: "Interactive charts library" },
    { name: "Real Python", url: "realpython.com", desc: "High-quality Python tutorials" },
  ]},
  { cat: "Visualization", color: "#f87171", items: [
    { name: "Power BI Desktop", url: "powerbi.microsoft.com", desc: "Free download, most in-demand BI tool" },
    { name: "Recharts", url: "recharts.org", desc: "React charting library — your edge" },
    { name: "Tableau Public", url: "public.tableau.com", desc: "Free tier for portfolio dashboards" },
    { name: "Figma (design ref)", url: "figma.com", desc: "Reference for dashboard design patterns" },
    { name: "Datawrapper", url: "datawrapper.de", desc: "Quick publication-quality charts" },
  ]},
  { cat: "Jobs & Portfolio", color: "#fb923c", items: [
    { name: "Naukri", url: "naukri.com", desc: "#1 India job portal for DA roles" },
    { name: "LinkedIn Jobs", url: "linkedin.com/jobs", desc: "LinkedIn Easy Apply + network" },
    { name: "GitHub Pages", url: "pages.github.com", desc: "Free portfolio hosting" },
    { name: "Vercel", url: "vercel.com", desc: "Deploy React dashboards free" },
    { name: "Indeed India", url: "indeed.co.in", desc: "Good for startup DA roles" },
  ]},
];

// ─── storage key ──────────────────────────────────────────────────────────────
const SK = "datapath_raveend_v1";
const DEF_STATE = { completed: {}, startDate: TODAY, customBlocks: {}, scheduleNotes: {}, theme: DEFAULT_THEME };

// ─── themes ───────────────────────────────────────────────────────────────────
// Accent hues (teal/purple/coral/amber) match the four phase colors and stay
// consistent across themes; each theme varies the surface + text tones.
const THEMES = {
  midnight: {
    label: "Midnight", dark: true, swatch: ["#070b14", "#22d3a5"],
    bg: "#070b14", surf: "#0d1321", surf2: "#111827", surf3: "#1a2540",
    navBg: "rgba(13,19,33,0.92)", onAccent: "#070b14",
    bdr: "rgba(148,163,184,0.07)", bdr2: "rgba(148,163,184,0.13)",
    txt: "#f1f5f9", txt2: "#94a3b8", txt3: "#475569",
    teal: "#22d3a5", purple: "#8b7cf8", coral: "#f87171", amber: "#fb923c",
  },
  carbon: {
    label: "Carbon", dark: true, swatch: ["#0a0a0b", "#22d3a5"],
    bg: "#0a0a0b", surf: "#151517", surf2: "#1d1d20", surf3: "#29292e",
    navBg: "rgba(21,21,23,0.92)", onAccent: "#0a0a0b",
    bdr: "rgba(255,255,255,0.06)", bdr2: "rgba(255,255,255,0.12)",
    txt: "#fafafa", txt2: "#a1a1aa", txt3: "#5b5b63",
    teal: "#22d3a5", purple: "#8b7cf8", coral: "#f87171", amber: "#fb923c",
  },
  ocean: {
    label: "Ocean", dark: true, swatch: ["#04141f", "#38bdf8"],
    bg: "#04141f", surf: "#0a2433", surf2: "#0e2e40", surf3: "#16435c",
    navBg: "rgba(10,36,51,0.92)", onAccent: "#04141f",
    bdr: "rgba(125,211,252,0.08)", bdr2: "rgba(125,211,252,0.16)",
    txt: "#ecfeff", txt2: "#94b8c9", txt3: "#4b6b7d",
    teal: "#22d3a5", purple: "#8b7cf8", coral: "#f87171", amber: "#fb923c",
  },
  plum: {
    label: "Plum", dark: true, swatch: ["#120a1f", "#c084fc"],
    bg: "#120a1f", surf: "#1c1030", surf2: "#251640", surf3: "#34215a",
    navBg: "rgba(28,16,48,0.92)", onAccent: "#120a1f",
    bdr: "rgba(192,132,252,0.08)", bdr2: "rgba(192,132,252,0.16)",
    txt: "#faf5ff", txt2: "#b8a9cf", txt3: "#6b5b85",
    teal: "#22d3a5", purple: "#a78bfa", coral: "#f87171", amber: "#fb923c",
  },
  forest: {
    label: "Forest", dark: true, swatch: ["#08140f", "#34d399"],
    bg: "#08140f", surf: "#0e1f17", surf2: "#142a20", surf3: "#1d3d2e",
    navBg: "rgba(14,31,23,0.92)", onAccent: "#08140f",
    bdr: "rgba(134,239,172,0.07)", bdr2: "rgba(134,239,172,0.14)",
    txt: "#f0fdf4", txt2: "#9bb5a6", txt3: "#4d6b58",
    teal: "#22d3a5", purple: "#8b7cf8", coral: "#f87171", amber: "#fb923c",
  },
  daylight: {
    label: "Daylight", dark: false, swatch: ["#ffffff", "#0d9488"],
    bg: "#eef2f7", surf: "#ffffff", surf2: "#f1f5f9", surf3: "#e2e8f0",
    navBg: "rgba(255,255,255,0.92)", onAccent: "#ffffff",
    bdr: "rgba(15,23,42,0.08)", bdr2: "rgba(15,23,42,0.16)",
    txt: "#0f172a", txt2: "#475569", txt3: "#94a3b8",
    teal: "#0d9488", purple: "#7c5cf0", coral: "#e11d48", amber: "#d97706",
  },
};
const THEME_LIST = Object.entries(THEMES).map(([id, t]) => ({ id, label: t.label, swatch: t.swatch, dark: t.dark }));
const DEFAULT_THEME = "midnight";

// ─── style constants ────────────────────────────────────────────────────────
// `C` is the active palette. It is reassigned to the selected theme at the top
// of each render, so the shared components below (which read C at render time)
// always reflect the current theme.
let C = THEMES[DEFAULT_THEME];

// ─── reusable components ──────────────────────────────────────────────────────
const Pbar = ({ val, color, h = 4 }) => (
  <div style={{ height: h, background: C.surf3, borderRadius: 99, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, val))}%`, background: color, borderRadius: 99, transition: "width 0.5s ease" }} />
  </div>
);

const Cb = ({ done, onToggle, color = "#22d3a5" }) => (
  <div onClick={onToggle} style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${done ? color : C.bdr2}`, background: done ? color + "20" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}>
    {done && <CheckCircle2 size={14} color={color} />}
  </div>
);

const Tag = ({ children, color, bg }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 500, color: color || C.txt2, background: bg || C.surf3, border: `1px solid ${color ? color + "30" : C.bdr}` }}>{children}</span>
);

const Btn = ({ onClick, children, primary, small }) => (
  <button onClick={onClick} style={{ background: primary ? C.teal : "transparent", border: `1px solid ${primary ? C.teal : C.bdr2}`, borderRadius: 8, padding: small ? "5px 11px" : "9px 16px", fontSize: small ? 11 : 12, color: primary ? (C.onAccent || "#070b14") : C.txt2, cursor: "pointer", fontWeight: primary ? 700 : 500, display: "inline-flex", alignItems: "center", gap: 4, transition: "all 0.15s", fontFamily: "inherit" }}>{children}</button>
);

// ─── main app ─────────────────────────────────────────────────────────────────
export default function DataPath() {
  const [st, setSt] = useState(DEF_STATE);
  const [page, setPage] = useState("dashboard");
  const [loaded, setLoaded] = useState(false);
  const [selDate, setSelDate] = useState(TODAY);
  const [filterPh, setFilterPh] = useState(0);
  const [filterWk, setFilterWk] = useState(0);
  const [openPhase, setOpenPhase] = useState(null);
  const [expandTask, setExpandTask] = useState(null);
  const [newBlock, setNewBlock] = useState("");
  const [newBlockSlot, setNewBlockSlot] = useState("Morning");
  const [showSettings, setShowSettings] = useState(false);
  const [tempStart, setTempStart] = useState(TODAY);

  // inject fonts
  useEffect(() => {
    const lk = document.createElement("link");
    lk.rel = "stylesheet";
    lk.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(lk);
  }, []);

  // load storage
  useEffect(() => {
    (async () => {
      try {
        const r = await storage.get(SK);
        if (r) { const d = JSON.parse(r.value); setSt({ ...DEF_STATE, ...d }); setTempStart(d.startDate || TODAY); }
      } catch { /* ignore */ }
      setLoaded(true);
    })();
  }, []);

  const save = useCallback((ns) => { try { storage.set(SK, JSON.stringify(ns)); } catch { /* ignore */ } }, []);
  const upd = useCallback((patch) => setSt(p => { const n = { ...p, ...patch }; save(n); return n; }), [save]);
  const toggle = useCallback((id) => setSt(p => { const n = { ...p, completed: { ...p.completed, [id]: !p.completed[id] } }; save(n); return n; }), [save]);

  // Keep the page background, theme-color meta, and native status bar in sync with the theme.
  useEffect(() => {
    const th = THEMES[st.theme] || THEMES[DEFAULT_THEME];
    document.documentElement.style.background = th.bg;
    document.body.style.background = th.bg;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
    meta.content = th.surf;
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/status-bar")
        .then(({ StatusBar, Style }) => {
          StatusBar.setStyle({ style: th.dark ? Style.Dark : Style.Light }).catch(() => {});
          StatusBar.setBackgroundColor({ color: th.surf }).catch(() => {});
        })
        .catch(() => {});
    }
  }, [st.theme]);

  const { completed, startDate, customBlocks } = st;
  // Apply the active theme. `C` is read at render time by the shared components
  // and every page renderer, so reassigning it here re-skins the whole app.
  C = THEMES[st.theme] || THEMES[DEFAULT_THEME];
  const doneCnt = useMemo(() => Object.values(completed).filter(Boolean).length, [completed]);
  const pct = Math.round(doneCnt / 84 * 100);
  const dayNum = useMemo(() => { const d = daysBetween(startDate, TODAY) + 1; return Math.min(Math.max(d, 1), 84); }, [startDate]);
  const curWeek = Math.ceil(dayNum / 7);
  const todayTasks = TASKS.filter(t => t.day === dayNum);

  const selDayNum = useMemo(() => { const d = dayDiff(startDate, selDate) + 1; return (d >= 1 && d <= 84) ? d : null; }, [startDate, selDate]);
  const selDayTasks = useMemo(() => selDayNum ? TASKS.filter(t => t.day === selDayNum) : [], [selDayNum]);
  const dateBlocks = customBlocks[selDate] || [];

  const phStats = useMemo(() => PHASES.map(p => {
    const pt = TASKS.filter(t => t.phase === p.id);
    const dn = pt.filter(t => completed[t.id]).length;
    return { ...p, total: pt.length, done: dn, pct: Math.round(dn / pt.length * 100) };
  }), [completed]);

  const streak = useMemo(() => {
    // Count consecutive fully-completed days ending today.
    // Today counts once it's done; an unfinished today doesn't break the streak
    // (the day isn't over yet), so we start from yesterday in that case.
    const isDayDone = (dn) => {
      const dt = TASKS.filter(t => t.day === dn);
      return dt.length > 0 && dt.every(t => completed[t.id]);
    };
    let s = 0;
    let start = dayNum;
    if (!isDayDone(dayNum)) start = dayNum - 1; // today not finished yet — don't penalise
    for (let dn = start; dn >= 1; dn--) {
      if (isDayDone(dn)) s++;
      else break;
    }
    return s;
  }, [completed, dayNum]);

  const addBlock = () => {
    if (!newBlock.trim()) return;
    const b = { id: Date.now(), title: newBlock, slot: newBlockSlot, done: false };
    upd({ customBlocks: { ...customBlocks, [selDate]: [...dateBlocks, b] } });
    setNewBlock("");
  };
  const toggleBlock = id => upd({ customBlocks: { ...customBlocks, [selDate]: dateBlocks.map(b => b.id === id ? { ...b, done: !b.done } : b) } });
  const removeBlock = id => upd({ customBlocks: { ...customBlocks, [selDate]: dateBlocks.filter(b => b.id !== id) } });

  // filtered tasks
  const filteredTasks = useMemo(() =>
    TASKS.filter(t => (filterPh === 0 || t.phase === filterPh) && (filterWk === 0 || t.week === filterWk)),
    [filterPh, filterWk]);

  const byWeek = useMemo(() => {
    const g = {};
    filteredTasks.forEach(t => {
      if (!g[t.week]) g[t.week] = { topic: t.weekTopic, color: t.color, phase: t.phase, tasks: [] };
      g[t.week].tasks.push(t);
    });
    return g;
  }, [filteredTasks]);

  if (!loaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.teal, fontFamily: "monospace", fontSize: 14 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
        <div>Loading DataPath...</div>
      </div>
    </div>
  );

  // ── NAV ──────────────────────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "roadmap", label: "Roadmap", Icon: Map },
    { id: "tasks", label: "Tasks", Icon: CheckSquare },
    { id: "schedule", label: "Schedule", Icon: CalendarDays },
    { id: "progress", label: "Progress", Icon: BarChart3 },
    { id: "resources", label: "Resources", Icon: BookOpen },
  ];

  // Top app bar (DataPath branding + mini progress + settings) — replaces desktop sidebar header
  const TopBar = () => (
    <div style={{ position: "sticky", top: 0, zIndex: 50, background: C.surf, borderBottom: `1px solid ${C.bdr}`, padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.teal, fontFamily: "'JetBrains Mono', monospace" }}>DataPath</div>
          <div style={{ fontSize: 10, color: C.txt3, marginTop: 1 }}>Raveend's DA Journey</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: C.txt3, fontFamily: "'JetBrains Mono', monospace" }}>Day {dayNum}/84 · {pct}%</div>
            <div style={{ width: 90, marginTop: 4 }}><Pbar val={pct} color={C.teal} h={3} /></div>
          </div>
          <div onClick={() => { setTempStart(startDate); setShowSettings(true); }} style={{ cursor: "pointer", color: C.txt2, display: "flex", padding: 4 }}>
            <Settings size={18} />
          </div>
        </div>
      </div>
    </div>
  );

  // Floating bottom navigation bar (mobile) — detached pill that hovers above content
  const BottomNav = () => (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)", zIndex: 50, display: "flex", justifyContent: "center", pointerEvents: "none", padding: "0 16px" }}>
      <div style={{ display: "flex", width: "100%", maxWidth: 460, background: C.navBg, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${C.bdr2}`, borderRadius: 20, padding: "8px 6px", boxShadow: "0 8px 28px rgba(0,0,0,0.45)", pointerEvents: "auto" }}>
        {navItems.map(({ id, label, Icon }) => {
          const active = page === id;
          return (
            <div key={id} onClick={() => setPage(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 2px", borderRadius: 12, cursor: "pointer", color: active ? C.teal : C.txt3, background: active ? C.teal + "18" : "transparent", transition: "all 0.15s" }}>
              <Icon size={19} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500 }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── SETTINGS MODAL ──────────────────────────────────────────────────────────
  const SettingsModal = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }}>
      <div style={{ background: C.surf, border: `1px solid ${C.bdr2}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 340 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.txt }}>Settings</span>
          <div onClick={() => setShowSettings(false)} style={{ cursor: "pointer", color: C.txt3 }}><X size={18} /></div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, color: C.txt3, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Program Start Date</label>
          <input type="date" value={tempStart} onChange={e => setTempStart(e.target.value)} style={{ width: "100%", background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "10px 12px", color: C.txt, fontSize: 13, fontFamily: "inherit" }} />
          <div style={{ fontSize: 11, color: C.txt3, marginTop: 6 }}>Day 1 = {fmtShort(tempStart)} · Day 84 = {fmtShort(addDays(tempStart, 83))}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, color: C.txt3, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Theme</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {THEME_LIST.map(t => {
              const active = st.theme === t.id;
              return (
                <div key={t.id} onClick={() => upd({ theme: t.id })} style={{ cursor: "pointer", borderRadius: 10, padding: 8, background: active ? C.teal + "18" : C.surf2, border: `1.5px solid ${active ? C.teal : C.bdr}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
                  <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", width: "100%", height: 28, border: `1px solid ${C.bdr2}` }}>
                    <div style={{ flex: 1, background: t.swatch[0] }} />
                    <div style={{ width: 14, background: t.swatch[1] }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.teal : C.txt2 }}>{t.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.txt3 }}>Started: {fmtShort(startDate)}</div>
          <div style={{ fontSize: 11, color: C.txt3, marginTop: 3 }}>Target: {fmtShort(addDays(startDate, 83))}</div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn onClick={() => setShowSettings(false)}>Cancel</Btn>
          <Btn primary onClick={() => { upd({ startDate: tempStart }); setShowSettings(false); }}>Save</Btn>
        </div>
      </div>
    </div>
  );

  // ── DASHBOARD ─────────────────────────────────────────────────────────────────
  const renderDashboard = () => {
    // Derive the current phase from the actual task data for this week.
    // (Phases are not evenly sized: 2 / 2 / 4 / 4 weeks, so a fixed formula is wrong.)
    const curPhaseId = TASKS.find(t => t.week === curWeek)?.phase ?? 1;
    const curPhase = PHASES.find(p => p.id === curPhaseId) || PHASES[0];
    return (
      <div style={{ padding: "20px 16px 24px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Data Analyst Bootcamp</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.txt, margin: 0, marginBottom: 6 }}>Hey Raveend! 👋</h1>
          <div style={{ fontSize: 12, color: C.txt2 }}>{fmtFull(TODAY)} · Day {dayNum} of 84 · Week {curWeek} of 12</div>
        </div>
        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 18 }}>
          {[
            { label: "Overall", val: `${pct}%`, sub: `${doneCnt}/84 done`, color: C.teal },
            { label: "Streak", val: `${streak}d`, sub: "day streak 🔥", color: C.amber },
            { label: "Week", val: curWeek, sub: "of 12 weeks", color: C.purple },
            { label: "Phase", val: curPhase.icon, sub: curPhase.title, color: C.coral },
          ].map(m => (
            <div key={m.label} style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: C.txt3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: m.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{m.val}</div>
              <div style={{ fontSize: 9, color: C.txt3, marginTop: 4 }}>{m.sub}</div>
            </div>
          ))}
        </div>
        {/* Overall progress */}
        <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>Overall Progress</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.teal, fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
          </div>
          <Pbar val={pct} color={C.teal} h={8} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: C.txt3 }}>Started {fmtShort(startDate)}</span>
            <span style={{ fontSize: 11, color: C.txt3 }}>Target {fmtShort(addDays(startDate, 83))}</span>
          </div>
        </div>
        {/* Phase progress */}
        <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.txt, marginBottom: 14 }}>Phase Progress</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {phStats.map(p => (
              <div key={p.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{p.icon}</span>
                    <span style={{ fontSize: 12, color: C.txt }}>{p.title}</span>
                    <Tag color={p.color}>Wk {p.weeks}</Tag>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: p.color, fontFamily: "'JetBrains Mono', monospace" }}>{p.done}/{p.total}</span>
                </div>
                <Pbar val={p.pct} color={p.color} h={5} />
              </div>
            ))}
          </div>
        </div>
        {/* Today's tasks */}
        <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>Today — Day {dayNum} Tasks</span>
            <Btn small onClick={() => setPage("tasks")}>All tasks <ArrowRight size={11} /></Btn>
          </div>
          {todayTasks.length === 0
            ? <div style={{ textAlign: "center", padding: "16px 0", color: C.txt3, fontSize: 12 }}>No tasks assigned today. Check your start date in Settings.</div>
            : todayTasks.map(task => (
              <div key={task.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.bdr}` }}>
                <Cb done={!!completed[task.id]} onToggle={() => toggle(task.id)} color={task.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: completed[task.id] ? C.txt3 : C.txt, textDecoration: completed[task.id] ? "line-through" : "none" }}>{task.ti}</div>
                  <div style={{ fontSize: 11, color: C.txt2, marginTop: 3 }}>{task.ds}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                    <Tag><Clock size={10} />{task.tm}</Tag>
                    <Tag color={task.color}>Wk {task.week}</Tag>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  // ── ROADMAP ───────────────────────────────────────────────────────────────────
  const renderRoadmap = () => (
    <div style={{ padding: "20px 16px 24px", maxWidth: 680, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Your Learning Path</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: 0, marginBottom: 6 }}>Data Analyst Roadmap</h1>
        <div style={{ fontSize: 12, color: C.txt2 }}>12 weeks · 84 daily tasks · 4 phases · Tailored to your stack</div>
      </div>
      {/* The journey line */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, background: C.surf, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.bdr}` }}>
        {phStats.map((p, i) => (
          <div key={p.id} style={{ flex: 1, padding: "12px 6px", background: p.pct === 100 ? p.color + "20" : "transparent", borderRight: i < 3 ? `1px solid ${C.bdr}` : "none", textAlign: "center" }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{p.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: p.color }}>{p.title}</div>
            <div style={{ fontSize: 9, color: C.txt3, margin: "3px 0" }}>Wk {p.weeks}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: p.color, fontFamily: "'JetBrains Mono',monospace" }}>{p.pct}%</div>
          </div>
        ))}
      </div>
      {/* Phase accordions */}
      {PHASES.map(ph => {
        const isOpen = openPhase === ph.id;
        const phTasks = TASKS.filter(t => t.phase === ph.id);
        const phDone = phTasks.filter(t => completed[t.id]).length;
        const phPct = Math.round(phDone / phTasks.length * 100);
        const phWeeks = WRAW.map((w, i) => ({ ...w, wkNum: i + 1 })).filter(w => w.ph === ph.id);
        return (
          <div key={ph.id} style={{ marginBottom: 10 }}>
            <div onClick={() => setOpenPhase(isOpen ? null : ph.id)} style={{ background: C.surf, border: `1px solid ${isOpen ? ph.color + "50" : C.bdr}`, borderLeft: `3px solid ${ph.color}`, borderRadius: 12, padding: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, userSelect: "none", transition: "border-color 0.2s" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: ph.dim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{ph.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>{ph.title}</span>
                  <Tag color={ph.color}>Weeks {ph.weeks}</Tag>
                  {phPct === 100 && <Tag color={C.teal}>✓ Done</Tag>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}><Pbar val={phPct} color={ph.color} h={4} /></div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: ph.color, fontFamily: "'JetBrains Mono',monospace", minWidth: 28 }}>{phDone}/{phTasks.length}</span>
                </div>
              </div>
              {isOpen ? <ChevronDown size={16} color={C.txt3} /> : <ChevronRight size={16} color={C.txt3} />}
            </div>
            {isOpen && (
              <div style={{ marginTop: 8, paddingLeft: 8 }}>
                {phWeeks.map(wk => {
                  const wkTasks = TASKS.filter(t => t.week === wk.wkNum);
                  const wkDone = wkTasks.filter(t => completed[t.id]).length;
                  const wkPct = Math.round(wkDone / wkTasks.length * 100);
                  return (
                    <div key={wk.wkNum} style={{ background: C.surf2, border: `1px solid ${C.bdr}`, borderLeft: `2px solid ${ph.color}40`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: ph.color, fontFamily: "'JetBrains Mono',monospace" }}>Week {wk.wkNum}</span>
                          <span style={{ fontSize: 12, color: C.txt2 }}>{wk.tp}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, color: C.txt3, fontFamily: "'JetBrains Mono',monospace" }}>{wkDone}/{wkTasks.length}</span>
                          <Btn small onClick={() => { setFilterWk(wk.wkNum); setFilterPh(0); setPage("tasks"); }}>View →</Btn>
                        </div>
                      </div>
                      <Pbar val={wkPct} color={ph.color} h={3} />
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
                        {wkTasks.map(t => (
                          <div key={t.id} onClick={() => toggle(t.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: completed[t.id] ? ph.color + "20" : C.surf3, border: `1px solid ${completed[t.id] ? ph.color + "40" : C.bdr}`, cursor: "pointer", transition: "all 0.15s" }}>
                            {completed[t.id] ? <CheckCircle2 size={10} color={ph.color} /> : <Circle size={10} color={C.txt3} />}
                            <span style={{ fontSize: 10, color: completed[t.id] ? ph.color : C.txt3 }}>{t.ti}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── TASKS ─────────────────────────────────────────────────────────────────────
  const renderTasks = () => {
    const weekNums = [...new Set(TASKS.filter(t => filterPh === 0 || t.phase === filterPh).map(t => t.week))];
    return (
      <div style={{ padding: "20px 16px 24px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Full Checklist</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: 0, marginBottom: 6 }}>All Tasks</h1>
          <div style={{ fontSize: 12, color: C.txt2 }}>{doneCnt}/84 completed · {84 - doneCnt} remaining</div>
        </div>
        {/* Filters */}
        <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.txt3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Filter by Phase</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {[{ id: 0, label: "All", color: C.txt2 }, ...PHASES.map(p => ({ id: p.id, label: p.title, color: p.color }))].map(f => (
              <div key={f.id} onClick={() => { setFilterPh(f.id); setFilterWk(0); }} style={{ padding: "5px 12px", borderRadius: 99, fontSize: 11, fontWeight: 500, cursor: "pointer", background: filterPh === f.id ? f.color + "20" : C.surf2, border: `1px solid ${filterPh === f.id ? f.color : C.bdr}`, color: filterPh === f.id ? f.color : C.txt2, transition: "all 0.15s" }}>{f.label}</div>
            ))}
          </div>
          {filterPh > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.txt3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Filter by Week</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <div onClick={() => setFilterWk(0)} style={{ padding: "5px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer", background: filterWk === 0 ? C.teal + "20" : C.surf2, border: `1px solid ${filterWk === 0 ? C.teal : C.bdr}`, color: filterWk === 0 ? C.teal : C.txt2 }}>All weeks</div>
                {weekNums.map(wn => (
                  <div key={wn} onClick={() => setFilterWk(wn)} style={{ padding: "5px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer", background: filterWk === wn ? C.teal + "20" : C.surf2, border: `1px solid ${filterWk === wn ? C.teal : C.bdr}`, color: filterWk === wn ? C.teal : C.txt2 }}>Week {wn}</div>
                ))}
              </div>
            </>
          )}
        </div>
        {/* Task groups */}
        {Object.entries(byWeek).map(([wk, group]) => {
          const wkDone = group.tasks.filter(t => completed[t.id]).length;
          return (
            <div key={wk} style={{ marginBottom: 12 }}>
              <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${group.color}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.bdr}`, gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: group.color, fontFamily: "'JetBrains Mono',monospace" }}>WEEK {wk}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.topic}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ width: 50 }}><Pbar val={Math.round(wkDone / group.tasks.length * 100)} color={group.color} h={3} /></div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: group.color, fontFamily: "'JetBrains Mono',monospace", minWidth: 32, textAlign: "right" }}>{wkDone}/{group.tasks.length}</span>
                  </div>
                </div>
                {group.tasks.map(task => (
                  <div key={task.id} style={{ borderBottom: `1px solid ${C.bdr}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", cursor: "pointer" }} onClick={() => setExpandTask(expandTask === task.id ? null : task.id)}>
                      <div onClick={e => { e.stopPropagation(); toggle(task.id); }}>
                        <Cb done={!!completed[task.id]} onToggle={() => toggle(task.id)} color={task.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: completed[task.id] ? C.txt3 : C.txt, textDecoration: completed[task.id] ? "line-through" : "none" }}>Day {task.day} — {task.ti}</span>
                          {expandTask === task.id ? <ChevronDown size={14} color={C.txt3} style={{ flexShrink: 0 }} /> : <ChevronRight size={14} color={C.txt3} style={{ flexShrink: 0 }} />}
                        </div>
                        {expandTask !== task.id && <div style={{ fontSize: 11, color: C.txt2, marginTop: 2 }}>{task.ds.substring(0, 60)}...</div>}
                      </div>
                    </div>
                    {expandTask === task.id && (
                      <div style={{ padding: "0 16px 14px 48px", background: task.color + "08" }}>
                        <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.6, marginBottom: 10 }}>{task.ds}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          <Tag><Clock size={10} /> {task.tm}</Tag>
                          <Tag color={task.color}>Day {task.day}</Tag>
                          {task.rs.map(r => (
                            <a key={r} href={`https://${r}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 500, color: C.purple, background: C.purple + "15", border: `1px solid ${C.purple}30`, textDecoration: "none" }}>
                              <ExternalLink size={9} />{r}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── SCHEDULE ──────────────────────────────────────────────────────────────────
  const renderSchedule = () => {
    const weekDates = (() => {
      const dt = new Date(selDate + "T00:00:00");
      const day = dt.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const mon = new Date(dt); mon.setDate(dt.getDate() + diff);
      return Array.from({ length: 7 }, (_, i) => addDays(mon.toISOString().split("T")[0], i));
    })();
    const slotColors = { Morning: "#fb923c", Afternoon: "#8b7cf8", Evening: "#22d3a5" };
    const dayLabel = selDayNum ? `Day ${selDayNum} of 84` : "Outside your 84-day plan";
    const totalHrs = selDayTasks.reduce((a, t) => a + parseInt(t.tm), 0);
    return (
      <div style={{ padding: "20px 16px 24px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Daily Planner</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: 0, marginBottom: 6 }}>Schedule</h1>
          <div style={{ fontSize: 12, color: C.txt2 }}>Plan your day, track study blocks, stay consistent</div>
        </div>
        {/* Week strip */}
        <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {weekDates.map(d => {
              const isToday = d === TODAY;
              const isSel = d === selDate;
              const dNum = dayDiff(startDate, d) + 1;
              const inPlan = dNum >= 1 && dNum <= 84;
              const dTasks = inPlan ? TASKS.filter(t => t.day === dNum) : [];
              const dDone = dTasks.filter(t => completed[t.id]).length;
              const hasAll = dTasks.length > 0 && dDone === dTasks.length;
              return (
                <div key={d} onClick={() => setSelDate(d)} style={{ flex: 1, textAlign: "center", padding: "8px 2px", borderRadius: 10, cursor: "pointer", background: isSel ? C.teal + "20" : isToday ? C.surf2 : "transparent", border: `1px solid ${isSel ? C.teal : isToday ? C.bdr2 : "transparent"}`, transition: "all 0.15s" }}>
                  <div style={{ fontSize: 10, color: isSel ? C.teal : C.txt3, marginBottom: 4 }}>{fmtWeekday(d)}</div>
                  <div style={{ fontSize: 13, fontWeight: isSel || isToday ? 700 : 400, color: isSel ? C.teal : isToday ? C.txt : C.txt2 }}>{new Date(d + "T00:00:00").getDate()}</div>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: hasAll ? C.teal : dDone > 0 ? C.amber : C.surf3, margin: "4px auto 0" }} />
                </div>
              );
            })}
          </div>
        </div>
        {/* Selected date header */}
        <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.txt }}>{fmtFull(selDate)}</div>
              <div style={{ fontSize: 12, color: selDayNum ? C.teal : C.txt3, marginTop: 3 }}>{dayLabel}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: C.txt3 }}>Study time</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.amber, fontFamily: "'JetBrains Mono',monospace" }}>{totalHrs}h</div>
            </div>
          </div>
        </div>
        {/* Assigned tasks */}
        {selDayTasks.length > 0 && (
          <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={14} color={C.teal} /> Assigned Tasks for this Day
            </div>
            {selDayTasks.map(task => (
              <div key={task.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.bdr}` }}>
                <Cb done={!!completed[task.id]} onToggle={() => toggle(task.id)} color={task.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: completed[task.id] ? C.txt3 : C.txt, textDecoration: completed[task.id] ? "line-through" : "none" }}>{task.ti}</div>
                  <div style={{ fontSize: 11, color: C.txt2, marginTop: 2 }}>{task.ds}</div>
                  <div style={{ marginTop: 5 }}><Tag><Clock size={10} />{task.tm}</Tag></div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Custom blocks */}
        <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={14} color={C.purple} /> My Study Plan for this Day
          </div>
          {/* Slot grouping */}
          {["Morning", "Afternoon", "Evening"].map(slot => {
            const slotBlocks = dateBlocks.filter(b => b.slot === slot);
            if (slotBlocks.length === 0) return null;
            return (
              <div key={slot} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: slotColors[slot], textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{slot}</div>
                {slotBlocks.map(b => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: C.surf2, border: `1px solid ${C.bdr}`, marginBottom: 5 }}>
                    <Cb done={b.done} onToggle={() => toggleBlock(b.id)} color={slotColors[slot]} />
                    <span style={{ flex: 1, fontSize: 12, color: b.done ? C.txt3 : C.txt, textDecoration: b.done ? "line-through" : "none" }}>{b.title}</span>
                    <span style={{ fontSize: 10, color: slotColors[slot], padding: "1px 6px", borderRadius: 99, background: slotColors[slot] + "15" }}>{slot}</span>
                    <div onClick={() => removeBlock(b.id)} style={{ cursor: "pointer", color: C.txt3 }}><X size={13} /></div>
                  </div>
                ))}
              </div>
            );
          })}
          {/* Add block */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input value={newBlock} onChange={e => setNewBlock(e.target.value)} onKeyDown={e => e.key === "Enter" && addBlock()} placeholder="Add a study block..." style={{ flex: 1, minWidth: 0, background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "9px 12px", color: C.txt, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
            <select value={newBlockSlot} onChange={e => setNewBlockSlot(e.target.value)} style={{ background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "9px 8px", color: C.txt2, fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>
              {["Morning", "Afternoon", "Evening"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Btn primary onClick={addBlock}><Plus size={14} /></Btn>
          </div>
        </div>
      </div>
    );
  };

  // ── PROGRESS ──────────────────────────────────────────────────────────────────
  const renderProgress = () => {
    const r = 54, circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const daysElapsed = daysBetween(startDate, TODAY);
    const avgPerDay = daysElapsed > 0 ? doneCnt / daysElapsed : 0;
    const daysLeft = avgPerDay > 0 ? Math.ceil((84 - doneCnt) / avgPerDay) : "—";

    // Recent activity — last 28 days
    const recentDays = Array.from({ length: 28 }, (_, i) => {
      const d = addDays(TODAY, -(27 - i));
      const dn = dayDiff(startDate, d) + 1;
      const dt = (dn >= 1 && dn <= 84) ? TASKS.filter(t => t.day === dn) : [];
      const dd = dt.filter(t => completed[t.id]).length;
      return { date: d, tasks: dt.length, done: dd };
    });
    return (
      <div style={{ padding: "20px 16px 24px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Analytics</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: 0, marginBottom: 6 }}>Your Progress</h1>
          <div style={{ fontSize: 12, color: C.txt2 }}>Track your journey to becoming a Data Analyst</div>
        </div>
        {/* Main stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          {/* Circular progress */}
          <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 150, flex: "1 1 150px" }}>
            <svg width={130} height={130} viewBox="0 0 130 130">
              <circle cx={65} cy={65} r={r} fill="none" stroke={C.surf3} strokeWidth={10} />
              <circle cx={65} cy={65} r={r} fill="none" stroke={C.teal} strokeWidth={10} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 65 65)" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
              <text x={65} y={62} textAnchor="middle" fill={C.teal} fontSize={22} fontWeight={700} fontFamily="'JetBrains Mono',monospace">{pct}%</text>
              <text x={65} y={80} textAnchor="middle" fill={C.txt3} fontSize={10} fontFamily="inherit">complete</text>
            </svg>
            <div style={{ fontSize: 11, color: C.txt2, textAlign: "center" }}>{doneCnt} of 84 tasks</div>
          </div>
          {/* Quick stats */}
          <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Current Streak", val: `${streak} days`, color: C.amber, icon: "🔥" },
              { label: "Day of Journey", val: `${dayNum}/84`, color: C.purple, icon: "📅" },
              { label: "Est. Completion", val: typeof daysLeft === "number" ? `${daysLeft}d left` : "On track", color: C.teal, icon: "🎯" },
              { label: "Tasks/Day avg", val: avgPerDay > 0 ? avgPerDay.toFixed(1) : "—", color: C.coral, icon: "⚡" },
            ].map(s => (
              <div key={s.label} style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span style={{ fontSize: 12, color: C.txt2 }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace" }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Phase breakdown */}
        <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.txt, marginBottom: 14 }}>Phase Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {phStats.map(p => (
              <div key={p.id} style={{ background: C.surf2, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 14 }}>{p.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: p.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.color, fontFamily: "'JetBrains Mono',monospace" }}>{p.pct}%</span>
                </div>
                <Pbar val={p.pct} color={p.color} h={5} />
                <div style={{ fontSize: 10, color: C.txt3, marginTop: 6 }}>{p.done}/{p.total} tasks · Wk {p.weeks}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Activity heatmap */}
        <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.txt, marginBottom: 14 }}>Last 28 Days Activity</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(28, 1fr)", gap: 3 }}>
            {recentDays.map((d, i) => {
              const intensity = d.tasks === 0 ? 0 : d.done / d.tasks;
              const bg = intensity === 0 ? C.surf3 : intensity === 1 ? C.teal : C.teal + Math.round(intensity * 80).toString(16);
              return (
                <div key={i} title={`${fmtShort(d.date)}: ${d.done}/${d.tasks}`} style={{ aspectRatio: "1", borderRadius: 3, background: bg, cursor: "default" }} />
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 10, color: C.txt3 }}>4 weeks ago</span>
            <span style={{ fontSize: 10, color: C.txt3 }}>Today</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: 10, color: C.txt3 }}>Less</span>
            {[0, 0.25, 0.5, 0.75, 1].map(v => <div key={v} style={{ width: 12, height: 12, borderRadius: 2, background: v === 0 ? C.surf3 : C.teal + Math.round(v * 255).toString(16).padStart(2, "0") }} />)}
            <span style={{ fontSize: 10, color: C.txt3 }}>More</span>
          </div>
        </div>
      </div>
    );
  };

  // ── RESOURCES ─────────────────────────────────────────────────────────────────
  const renderResources = () => (
    <div style={{ padding: "20px 16px 24px", maxWidth: 680, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Learning Materials</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: 0, marginBottom: 6 }}>Resources</h1>
        <div style={{ fontSize: 12, color: C.txt2 }}>Every tool and resource you need, organised by phase</div>
      </div>
      {RESOURCES.map(cat => (
        <div key={cat.cat} style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${cat.color}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: cat.color, marginBottom: 12 }}>{cat.cat}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cat.items.map(item => (
              <a key={item.url} href={`https://${item.url}`} target="_blank" rel="noreferrer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 12px", background: C.surf2, borderRadius: 8, border: `1px solid ${C.bdr}`, textDecoration: "none", transition: "border-color 0.15s" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.txt }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: C.txt2, marginTop: 2 }}>{item.desc}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: cat.color, fontSize: 10, flexShrink: 0 }}>
                  <ExternalLink size={11} />
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
      {/* Motivational card */}
      <div style={{ background: `linear-gradient(135deg, ${C.teal}20, ${C.purple}20)`, border: `1px solid ${C.teal}30`, borderRadius: 12, padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.txt, marginBottom: 6 }}>You're building something real, Raveend</div>
        <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.7 }}>Your Flutter + Python + React background is a genuine edge over other DA freshers. The Travion project already proves you can build end-to-end systems. Now channel that into data — you'll be job-ready faster than you think.</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <Tag color={C.teal}>SQL 🔍</Tag>
          <Tag color={C.purple}>Python 🐍</Tag>
          <Tag color={C.coral}>Power BI 📊</Tag>
          <Tag color={C.amber}>React 🚀</Tag>
        </div>
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────────
  const pageMap = {
    dashboard: renderDashboard,
    roadmap: renderRoadmap,
    tasks: renderTasks,
    schedule: renderSchedule,
    progress: renderProgress,
    resources: renderResources,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", background: C.bg, minHeight: "100vh", height: "100vh", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: C.txt }}>
      {TopBar()}
      <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}>
        {(pageMap[page] || renderDashboard)()}
      </main>
      {BottomNav()}
      {showSettings && SettingsModal()}
    </div>
  );
}
