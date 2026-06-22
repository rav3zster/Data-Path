import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { LayoutDashboard, Map, CheckSquare, CalendarDays, BarChart3, CheckCircle2, Clock, ExternalLink, Plus, X, ChevronDown, ChevronRight, Target, ArrowRight, BookOpen, Settings, Calendar, Code2, Search, Zap, Award, Brain, Timer, Sun, Moon, Star, Trophy, Bookmark, Flag, TrendingUp, RefreshCw, Download, Github, Menu } from "lucide-react";
import { storage } from "./storage.js";


const TODAY = new Date().toISOString().split("T")[0];
const addD = (d, n) => { const x = new Date(d + "T00:00:00"); x.setDate(x.getDate() + n); return x.toISOString().split("T")[0] };
const diffD = (a, b) => Math.max(0, Math.floor((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000));
const fmtS = d => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtF = d => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtWD = d => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" });

const QUOTES = [
    { t: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
    { t: "First, solve the problem. Then, write the code.", a: "John Johnson" },
    { t: "Data is the new oil. Valuable, but if unrefined it cannot be used.", a: "Clive Humby" },
    { t: "Without data, you are just another person with an opinion.", a: "W. Edwards Deming" },
    { t: "Continuous improvement is better than delayed perfection.", a: "Mark Twain" },
    { t: "An investment in knowledge pays the best interest.", a: "Benjamin Franklin" },
    { t: "Success is the sum of small efforts repeated day in and day out.", a: "Robert Collier" },
    { t: "The secret of getting ahead is getting started.", a: "Mark Twain" },
    { t: "Every expert was once a beginner.", a: "Helen Hayes" },
    { t: "Small daily improvements lead to staggering long-term results.", a: "Robin Sharma" },
    { t: "Talent is cheaper than table salt. Hard work separates the talented from the successful.", a: "Stephen King" },
    { t: "The goal is to turn data into information, and information into insight.", a: "Carly Fiorina" },
    { t: "Any fool can write code a computer understands. Good programmers write code humans understand.", a: "Martin Fowler" },
    { t: "You do not have to be great to start, but you have to start to be great.", a: "Zig Ziglar" },
    { t: "In God we trust. All others must bring data.", a: "W. Edwards Deming" },
    { t: "The future belongs to those who learn more skills and combine them in creative ways.", a: "Robert Greene" },
    { t: "Do not wish it were easier. Wish you were better.", a: "Jim Rohn" },
    { t: "Learning never exhausts the mind.", a: "Leonardo da Vinci" },
    { t: "Consistency is the key. If you cannot be consistent, you cannot be anything.", a: "Tony Gaskins" },
    { t: "Strive not to be a success, but rather to be of value.", a: "Albert Einstein" },
];

const ACHIEVEMENTS = [
    { id: "first", icon: "🌱", title: "First Step", desc: "Complete your first task", pts: 10, check: (c) => Object.values(c).filter(Boolean).length >= 1 },
    { id: "wk1", icon: "⭐", title: "Week 1 Done", desc: "Complete all Week 1 tasks", pts: 25, check: (c, t) => t.filter(x => x.week === 1).every(x => c[x.id]) },
    { id: "mo1", icon: "🔥", title: "Month 1 Complete", desc: "Finish all 4 weeks of Month 1", pts: 100, check: (c, t) => t.filter(x => x.week <= 4).every(x => c[x.id]) },
    { id: "s3", icon: "💫", title: "On a Roll", desc: "3-day study streak", pts: 20, check: (c, t, s) => s >= 3 },
    { id: "s7", icon: "🚀", title: "Week Warrior", desc: "7-day study streak", pts: 50, check: (c, t, s) => s >= 7 },
    { id: "s14", icon: "💪", title: "2-Week Streak", desc: "14 consecutive study days", pts: 100, check: (c, t, s) => s >= 14 },
    { id: "s30", icon: "🏅", title: "30-Day Legend", desc: "30 days straight — incredible!", pts: 300, check: (c, t, s) => s >= 30 },
    { id: "half", icon: "🎯", title: "Halfway Hero", desc: "Complete 42 of 84 tasks", pts: 150, check: (c) => Object.values(c).filter(Boolean).length >= 42 },
    { id: "ph1", icon: "✅", title: "Phase 1 Master", desc: "Complete all Phase 1 tasks", pts: 80, check: (c, t) => t.filter(x => x.phase === 1).every(x => c[x.id]) },
    { id: "ph2", icon: "✅", title: "Phase 2 Master", desc: "Complete all Phase 2 tasks", pts: 80, check: (c, t) => t.filter(x => x.phase === 2).every(x => c[x.id]) },
    { id: "ph3", icon: "✅", title: "Phase 3 Master", desc: "Complete all Phase 3 tasks", pts: 80, check: (c, t) => t.filter(x => x.phase === 3).every(x => c[x.id]) },
    { id: "ph4", icon: "✅", title: "Phase 4 Master", desc: "Complete all Phase 4 tasks", pts: 80, check: (c, t) => t.filter(x => x.phase === 4).every(x => c[x.id]) },
    { id: "done", icon: "🏆", title: "84-Day Champion", desc: "Complete ALL 84 tasks. You did it!", pts: 500, check: (c) => Object.values(c).filter(Boolean).length >= 84 },
    { id: "notes", icon: "📝", title: "Note Taker", desc: "Write solution notes for 5 problems", pts: 30, check: (c, t, s, n) => Object.values(n || {}).filter(x => x && x.length > 10).length >= 5 },
    { id: "bookmarks", icon: "🔖", title: "Resource Hunter", desc: "Save 5 bookmarks", pts: 20, check: (c, t, s, n, bk) => (bk || []).length >= 5 },
];

const DA_FLASHCARDS = [
    { id: 1, cat: "SQL", q: "RANK() vs DENSE_RANK()?", a: "RANK() skips numbers after ties: 1,1,3. DENSE_RANK() no gaps: 1,1,2. ROW_NUMBER() always unique: 1,2,3. All use OVER(ORDER BY col)." },
    { id: 2, cat: "SQL", q: "CTE vs Subquery — when to use which?", a: "Use CTE (WITH clause) for readability, recursive queries, reusing same subquery multiple times. Use subquery for simple inline one-off filtering." },
    { id: 3, cat: "SQL", q: "Running total window function syntax?", a: "SUM(sales) OVER (PARTITION BY region ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)" },
    { id: 4, cat: "SQL", q: "What does LAG(col, 1) return?", a: "Value of col from the PREVIOUS row in the partition. LAG(col,1,0) = default 0 if no prior row. LEAD() gets next row. Great for period-over-period analysis." },
    { id: 5, cat: "SQL", q: "PARTITION BY vs GROUP BY?", a: "GROUP BY collapses rows to one per group. PARTITION BY preserves all rows — just defines the window for window functions. Both can have the same column." },
    { id: 6, cat: "SQL", q: "HAVING vs WHERE?", a: "WHERE filters BEFORE aggregation — cannot use aggregate functions. HAVING filters AFTER aggregation — always used with GROUP BY. Think: WHERE=rows, HAVING=groups." },
    { id: 7, cat: "SQL", q: "How to find 2nd highest salary?", a: "SELECT MAX(salary) FROM emp WHERE salary < (SELECT MAX(salary) FROM emp). Or: SELECT DISTINCT salary FROM emp ORDER BY salary DESC LIMIT 1 OFFSET 1." },
    { id: 8, cat: "SQL", q: "NULL handling in JOINs?", a: "NULL never matches NULL in JOIN conditions. LEFT JOIN keeps unmatched left rows with NULL for right columns. Use IS NULL / COALESCE() to handle NULLs explicitly." },
    { id: 9, cat: "SQL", q: "B-tree vs Hash index?", a: "B-tree: equality AND range (>, <, BETWEEN, ORDER BY). Hash: equality only (=, IN). PostgreSQL defaults to B-tree. Add index on your most-filtered column." },
    { id: 10, cat: "SQL", q: "Order of SQL clause execution?", a: "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. This is why you cannot use SELECT aliases in WHERE (WHERE runs before SELECT)." },
    { id: 11, cat: "Pandas", q: "pd.merge vs pd.concat?", a: "merge: SQL-style JOIN on key columns (left/right/inner/outer). concat: stacks DataFrames axis=0 (rows) or axis=1 (columns). No key needed for concat." },
    { id: 12, cat: "Pandas", q: "groupby().transform() vs groupby().agg()?", a: "agg(): collapses to one row per group. transform(): preserves all rows, same shape as input. Use transform to add group statistics as new column to original DataFrame." },
    { id: 13, cat: "Pandas", q: "How to detect outliers in pandas?", a: "IQR method: Q1=df.quantile(0.25), Q3=df.quantile(0.75), IQR=Q3-Q1. Outliers: values < Q1-1.5*IQR or > Q3+1.5*IQR. Also use df.describe() and sns.boxplot()." },
    { id: 14, cat: "Pandas", q: "loc vs iloc?", a: "loc: label-based — df.loc['row_label', 'col_name']. iloc: integer position — df.iloc[0:5, 0:3]. loc includes end of slice, iloc does not. loc can use boolean masks." },
    { id: 15, cat: "Pandas", q: "pd.pivot_table syntax?", a: "pd.pivot_table(df, values='sales', index='region', columns='quarter', aggfunc='sum', fill_value=0). index=rows, columns=pivot cols." },
    { id: 16, cat: "Power BI", q: "Measure vs Calculated Column?", a: "Calculated Column: row-level, stored in model, uses row context. Measure: computed at query time per filter context, not stored. Always prefer Measures for aggregations." },
    { id: 17, cat: "Power BI", q: "What does CALCULATE() do?", a: "CALCULATE(expression, filter1, filter2) evaluates expression in MODIFIED filter context. Most powerful DAX function. Can add, remove, or override filters." },
    { id: 18, cat: "Power BI", q: "TOTALYTD() vs SAMEPERIODLASTYEAR()?", a: "TOTALYTD([Sales], 'Date'[Date]) = year-to-date total. CALCULATE([Sales], SAMEPERIODLASTYEAR('Date'[Date])) = same period last year. Both need a marked Date table." },
    { id: 19, cat: "Power BI", q: "RANKX() syntax?", a: "RANKX(ALL(Products), [Sales]) ranks all products. Add ,,,DESC for descending. Must use ALL() to rank across all rows — not just current filter context." },
    { id: 20, cat: "Power BI", q: "Row context vs Filter context?", a: "Row context: current row being evaluated (in calculated columns, SUMX/AVERAGEX). Filter context: filters from slicers, matrix rows/cols, CALCULATE. CALCULATE converts row to filter context." },
];

const DA_QA = [
    { id: 1, cat: "SQL", d: "Easy", q: "What is the difference between RANK() and DENSE_RANK()?", a: "RANK() assigns same rank to ties but skips subsequent numbers (1,1,3). DENSE_RANK() same rank without skipping (1,1,2). Use DENSE_RANK when continuous ranks matter." },
    { id: 2, cat: "SQL", d: "Easy", q: "What is the difference between WHERE and HAVING?", a: "WHERE filters BEFORE aggregation — cannot use aggregate functions. HAVING filters AFTER aggregation — always used with GROUP BY to filter groups." },
    { id: 3, cat: "SQL", d: "Medium", q: "How do you find duplicate records in a table?", a: "SELECT col1, col2, COUNT(*) FROM t GROUP BY col1, col2 HAVING COUNT(*) > 1. To delete: WITH cte AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY col1,col2 ORDER BY id) rn FROM t) DELETE FROM cte WHERE rn > 1." },
    { id: 4, cat: "SQL", d: "Medium", q: "Explain window functions with an example.", a: "Window functions compute across related rows without collapsing them. Example: SUM(salary) OVER (PARTITION BY dept ORDER BY date) gives running total within each department while keeping all rows." },
    { id: 5, cat: "SQL", d: "Hard", q: "Write a query to find month-over-month revenue growth.", a: "WITH m AS (SELECT DATE_TRUNC('month',dt) mo, SUM(rev) rev FROM sales GROUP BY 1) SELECT mo, rev, LAG(rev) OVER (ORDER BY mo) prev_rev, ROUND((rev-LAG(rev) OVER (ORDER BY mo))::decimal/LAG(rev) OVER (ORDER BY mo)*100,1) AS pct_growth FROM m" },
    { id: 6, cat: "Python", d: "Easy", q: "How do you handle missing values in pandas?", a: "Identify: df.isnull().sum(). Drop: df.dropna(). Fill: df.fillna(0), df.fillna(df.mean()), df.fillna(method='ffill'). Use domain knowledge to decide: impute when data is recoverable, drop when truly unavailable." },
    { id: 7, cat: "Python", d: "Medium", q: "What is the difference between apply() and transform()?", a: "apply() can return any shape — reduced result per group. transform() must return same shape as input — preserves all rows. Use transform() to add group statistics (e.g., group mean) as a new column." },
    { id: 8, cat: "Python", d: "Hard", q: "How would you calculate YoY growth in pandas?", a: "monthly = df.groupby(df['date'].dt.to_period('Y'))['sales'].sum().reset_index(). monthly['yoy'] = (monthly['sales'] - monthly['sales'].shift(1)) / monthly['sales'].shift(1) * 100" },
    { id: 9, cat: "Power BI", d: "Easy", q: "What is the difference between a Measure and a Calculated Column?", a: "Calculated Column: computed row-by-row at refresh, stored in model, uses row context. Measure: computed on demand per visual/filter context. Always prefer Measures for aggregations shown in visuals." },
    { id: 10, cat: "Power BI", d: "Hard", q: "How do you create Year-over-Year comparison in DAX?", a: "YoY % = DIVIDE([Sales] - CALCULATE([Sales], SAMEPERIODLASTYEAR('Date'[Date])), CALCULATE([Sales], SAMEPERIODLASTYEAR('Date'[Date]))). Requires a Date table marked as such in the data model." },
    { id: 11, cat: "General", d: "Easy", q: "How do you communicate data insights to non-technical stakeholders?", a: "1) Lead with business impact not methodology 2) Use simple bar/line charts not complex ones 3) Limit to 3 key insights per slide 4) Make chart titles the insight itself 5) Avoid jargon and statistical terms" },
    { id: 12, cat: "General", d: "Medium", q: "Walk me through your data analysis process end to end.", a: "1) Understand business question 2) Identify data sources 3) Clean and validate data 4) Exploratory analysis 5) Build visualizations 6) Validate findings with domain expert 7) Present actionable recommendations" },
    { id: 13, cat: "SQL", d: "Easy", q: "What is the execution order of SQL clauses?", a: "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. Understanding this: you cannot use SELECT aliases in WHERE (WHERE runs before SELECT). You CAN use them in ORDER BY." },
    { id: 14, cat: "Python", d: "Medium", q: "How do you merge two DataFrames in pandas?", a: "pd.merge(df1, df2, on='key', how='left'). how options: inner (both match), left (all left rows), right (all right rows), outer (all rows). Add left_on/right_on if key column names differ." },
    { id: 15, cat: "General", d: "Hard", q: "A Power BI dashboard is slow with 1M rows. How do you optimize?", a: "1) Use Import mode instead of DirectQuery 2) Remove unused columns 3) Pre-aggregate in SQL before import 4) Use integers for keys 5) Avoid calculated columns — use measures 6) Create a proper date table 7) Check for many-to-many relationships" },
];

const DA_PHASES = [
    { id: 1, title: "SQL Mastery", weeks: "1-2", color: "#22d3a5", dim: "rgba(34,211,165,.1)", icon: "🔍" },
    { id: 2, title: "Python Analytics", weeks: "3-4", color: "#8b7cf8", dim: "rgba(139,124,248,.1)", icon: "🐍" },
    { id: 3, title: "Visualization", weeks: "5-8", color: "#f87171", dim: "rgba(248,113,113,.1)", icon: "📊" },
    { id: 4, title: "Portfolio & Jobs", weeks: "9-12", color: "#fb923c", dim: "rgba(251,146,60,.1)", icon: "🚀" },
];
const DSA_PHASES = [
    { id: 1, title: "Arrays & Strings", weeks: "1-2", color: "#4ade80", dim: "rgba(74,222,128,.1)", icon: "🔢" },
    { id: 2, title: "Data Structures", weeks: "3-5", color: "#60a5fa", dim: "rgba(96,165,250,.1)", icon: "🏗️" },
    { id: 3, title: "Trees Graphs & DP", weeks: "6-9", color: "#c084fc", dim: "rgba(192,132,252,.1)", icon: "🌳" },
    { id: 4, title: "Advanced & Interviews", weeks: "10-12", color: "#fb923c", dim: "rgba(251,146,60,.1)", icon: "🏆" },
];

const W = (ph, tp, cl, obj, ts) => ({ ph, tp, cl, obj, ts });
const T = (ti, ds, tm, rs = []) => ({ ti, ds, tm, rs });
const DA_WRAW = [
    W(1, "SQL Foundations", "#22d3a5", "Master JOINs, CTEs & window functions — patterns that appear in 80% of DA interviews.", [
        T("Dev environment setup", "Install DBeaver, create Supabase account (free PostgreSQL). Connect and run first SELECT/WHERE/ORDER BY queries.", "2h", ["supabase.com", "dbeaver.io"]),
        T("JOINs mastery", "Write 15 queries: INNER, LEFT, RIGHT, FULL OUTER JOINs. Draw Venn diagrams. Understand null behavior in each type.", "3h", ["mode.com/sql-tutorial"]),
        T("Subqueries", "Correlated vs non-correlated. Practice IN, EXISTS, ANY, ALL. Tip: if subquery runs once = non-correlated, per row = correlated.", "2h"),
        T("CTEs — WITH clause", "Chain 3 CTEs. Write same query as subquery and compare readability. CTEs win every time for complex logic.", "2h"),
        T("Window functions I", "ROW_NUMBER(), RANK(), DENSE_RANK(), NTILE(4). Practice PARTITION BY and ORDER BY. Know the tie-handling difference.", "3h"),
        T("Window functions II", "LAG(col,1) previous row, LEAD(col,1) next row. Running totals: SUM() OVER (PARTITION BY x ORDER BY y). Write 5 queries.", "3h"),
        T("HackerRank SQL x10", "Solve 10 Medium challenges. Time each: aim under 15 min. Document approach in notes doc.", "3h", ["hackerrank.com/domains/sql"]),
    ]),
    W(1, "Advanced SQL + Real Data", "#22d3a5", "Apply SQL to a real 51K-row dataset and build your SQL reference sheet.", [
        T("String & date functions", "CONCAT, TRIM, UPPER, LOWER. DATE_TRUNC, EXTRACT, AGE. Write 10 practice queries for each group.", "2h"),
        T("CASE WHEN logic", "Score banding (0-50 Low, 51-80 Mid, 81+ High). Pivot rows to columns with CASE. Write 5 examples.", "2h"),
        T("Advanced GROUP BY", "ROLLUP for subtotals, CUBE for all combinations. HAVING filters AFTER aggregation, WHERE filters BEFORE.", "2h"),
        T("Query performance", "EXPLAIN ANALYZE output. Add B-tree index on most-filtered column. Measure timing difference before/after.", "2h"),
        T("Import real dataset", "Download Zomato Bangalore from Kaggle (51K rows). Import CSV into Supabase PostgreSQL table.", "2h", ["kaggle.com/datasets"]),
        T("5 business queries", "Top cuisines by rating, priciest areas, rating>4.5 count, delivery split, best value (rating/cost ratio).", "3h"),
        T("Week 2 review + cheat sheet", "Redo 5 hardest problems. Create SQL cheat sheet Google Doc — your permanent interview reference.", "2h"),
    ]),
    W(2, "Pandas Deep Dive", "#8b7cf8", "Master pandas for end-to-end data manipulation — used in every Python DA interview.", [
        T("Python env setup", "Install Anaconda, open Jupyter Lab. Import pandas/numpy/matplotlib. Run first notebook cell.", "1h", ["anaconda.com"]),
        T("DataFrame basics", "read_csv/read_excel, select columns, filter rows df[condition], sort_values, shape, info, describe.", "2h"),
        T("Data cleaning", "isnull().sum(), fillna(), dropna(), drop_duplicates(), astype() for types. IQR method for outlier removal.", "3h"),
        T("GroupBy & agg()", "groupby().agg({col:func}), named aggregations, transform() for row-level group operations.", "3h"),
        T("Merge, join, concat", "pd.merge all 4 join types. pd.concat axis=0 rows, axis=1 columns. When to use each.", "2h"),
        T("Pivot tables", "pd.pivot_table(values, index, columns, aggfunc, fill_value). pd.crosstab for frequency tables.", "2h"),
        T("Time series basics", "pd.to_datetime, set_index, resample('M').sum(), rolling(7).mean(), date range filtering.", "2h"),
    ]),
    W(2, "First Analysis Project", "#8b7cf8", "Build first portfolio project: complete IPL analysis pushed to GitHub.", [
        T("Choose & load dataset", "Download IPL matches from Kaggle (950 matches). Load, inspect all columns and dtypes.", "2h", ["kaggle.com"]),
        T("Full data cleaning", "Fix nulls, standardize team names, fix dtypes, remove duplicates. Document every decision.", "3h"),
        T("EDA — 10 insights", "Wins by team, toss impact, home vs away, top batsmen by matches, win margin trends over seasons.", "3h"),
        T("10 SQL queries on same data", "Answer same 10 questions in SQL. Compare pandas vs SQL. Note which felt more natural.", "3h"),
        T("Push to GitHub", "Organized folders, clean notebook with markdown cells, professional README with key findings.", "2h"),
        T("Write LinkedIn post", "Screenshot best chart. Write 3 key insights. Post with #DataAnalytics #Python #SQL.", "1h"),
        T("Month 1 review", "2-page reference: Page 1 = SQL cheat sheet, Page 2 = Pandas operations. Keep it pinned.", "2h"),
    ]),
    W(3, "Power BI Basics", "#f87171", "Create your first Power BI dashboards — most in-demand BI tool across Indian companies.", [
        T("Install Power BI Desktop", "Download from powerbi.microsoft.com (free, Windows). Watch 30-min getting started YouTube video.", "2h", ["powerbi.microsoft.com"]),
        T("Import data & model", "Connect CSV + PostgreSQL. Import mode vs DirectQuery. Build star schema.", "2h"),
        T("DAX basics", "Calculated column (row-level, stored) vs Measure (aggregates, recalculates). SUM, COUNT, AVERAGE, DIVIDE.", "3h"),
        T("CALCULATE & context", "CALCULATE changes filter context. ALL() removes filters. FILTER() adds row conditions. Build 10 measures.", "3h"),
        T("Core visuals", "Bar, line, pie, card, table, matrix. Format titles (insight not label), axis labels, colors.", "2h"),
        T("Slicers & interactions", "Add cuisine + city slicers. Test cross-filtering. Edit Interactions to control which visuals respond.", "2h"),
        T("Draft 3-page report", "Overview KPIs, Cuisine analysis, Rating distribution pages on your Zomato dataset.", "3h"),
    ]),
    W(3, "Power BI Advanced", "#f87171", "Master advanced DAX and publish a live dashboard with a shareable link for recruiters.", [
        T("Date table + time intelligence", "CALENDAR(). Mark as Date Table. TOTALYTD, SAMEPERIODLASTYEAR for period comparisons.", "3h"),
        T("Advanced DAX patterns", "RANKX() for rankings, TOPN() for top 10, SWITCH(TRUE()) for grade/banding logic.", "3h"),
        T("Advanced visuals", "Treemap (proportional), Waterfall (step changes), Decomposition Tree (drill into why).", "2h"),
        T("Dashboard design principles", "Rule of thirds, 3-color max, titles ARE the insight, 1 business question per chart.", "2h"),
        T("Full 5-page polished dashboard", "Executive summary, Geographic, Cuisine & price, Ratings deep-dive, Recommendations pages.", "4h"),
        T("Publish to Power BI Service", "Upload to app.powerbi.com (free). Get shareable link. Add to LinkedIn Featured section.", "1h"),
        T("Document & screenshot", "2-line description per page. Screenshots for portfolio PDF.", "2h"),
    ]),
    W(3, "Python Visualization", "#f87171", "Add Python charts to your toolkit from Matplotlib to interactive Plotly dashboards.", [
        T("Matplotlib basics", "fig, ax = plt.subplots(). plot, bar, scatter, hist. set_title, set_xlabel, legend, savefig.", "2h"),
        T("Matplotlib advanced", "subplots(2,2) grid, twinx() dual axis, plt.style.use(), ax.annotate() callouts.", "3h"),
        T("Seaborn statistical", "boxplot, violinplot show distributions. histplot(kde=True) shows density. regplot adds trendline.", "2h"),
        T("Seaborn heatmaps", "corr heatmap with annot=True. pairplot(df, hue='col') shows all relationships at once.", "2h"),
        T("Plotly interactive", "px.bar/line/scatter with hover_data. template='plotly_dark'. write_html() for sharing.", "3h", ["plotly.com/python"]),
        T("Full viz notebook — 8 charts", "One polished notebook. Each chart title IS the insight. Consistent colors. Axis labels on all.", "4h"),
        T("Chart recreation challenge", "Find a chart in news. Recreate in Python. Post both on LinkedIn with your improvements.", "2h"),
    ]),
    W(3, "React Analytics — Your Edge", "#f87171", "Build a live analytics dashboard in React — differentiates you from 99% of DA candidates.", [
        T("Recharts setup", "npx create-react-app analytics, npm install recharts. Render first ResponsiveContainer LineChart.", "2h", ["recharts.org"]),
        T("Charts with real data", "BarChart, LineChart, PieChart loading from local JSON. XAxis, YAxis, Tooltip, Legend.", "3h"),
        T("Public API integration", "Fetch from free REST API. useEffect(()=>{},[]) with loading and error states.", "3h"),
        T("Dashboard layout", "2x2 KPI card grid with CSS Grid. Metric cards: total, avg, max, trend. Responsive.", "3h"),
        T("Filters & interactivity", "Team dropdown + year slider. useState drives filtering. Charts re-render automatically.", "3h"),
        T("Deploy on Vercel", "npm run build, push to GitHub, connect Vercel. Get yourapp.vercel.app live URL.", "2h", ["vercel.com"]),
        T("Month 2 review", "List all 8 tools mastered. Update resume + LinkedIn skills section.", "2h"),
    ]),
    W(4, "Capstone Project", "#fb923c", "Build the showstopper project that demonstrates every skill you have learned.", [
        T("Choose: Naukri job market data", "Download Naukri job postings from Kaggle — directly relevant for your own DA job search.", "1h", ["kaggle.com"]),
        T("Full EDA notebook", "20+ insights: top skills, salary by city, company volumes, experience gaps, remote trends.", "4h"),
        T("SQL deep analysis", "15 queries: RANKX by company, NTILE salary percentiles, YoY growth with LAG.", "3h"),
        T("Power BI dashboard", "5 pages: market overview, skills heatmap, salary analysis, company spotlight, your job guide.", "4h"),
        T("React KPI dashboard", "Jobs count, avg salary, top skill, top city. Bar chart top 10 skills. Deploy on Vercel.", "4h"),
        T("Write case study", "500 words: problem, method, 3 key findings, business value. Goes in every application.", "2h"),
        T("Push full project to GitHub", "All files with impressive README: GIF of dashboards, key insights, live links.", "2h"),
    ]),
    W(4, "Kaggle + Portfolio", "#fb923c", "Build the presence that recruiters find before they meet you.", [
        T("Polish Kaggle profile", "Complete bio, add GitHub link, photo. Publish IPL and Zomato notebooks.", "2h", ["kaggle.com"]),
        T("Submit Kaggle notebook", "Publish on active dataset. Add markdown throughout. Share for upvotes.", "3h"),
        T("GitHub profile README", "Skills table, 3 project cards with badges, learning journey. shields.io badges.", "2h"),
        T("Portfolio website", "GitHub Pages with clean template. Projects section with screenshots and live links.", "3h", ["pages.github.com"]),
        T("Polish all 3 projects", "Every project: README, 3-bullet findings, best screenshot, live link.", "2h"),
        T("Request peer review", "Post on r/dataanalysis Reddit. Ask for honest feedback. Note every criticism.", "1h"),
        T("Apply peer feedback", "Fix top 3 issues. Small improvements signal attention to detail recruiters notice.", "3h"),
    ]),
    W(4, "Resume + LinkedIn", "#fb923c", "Create resume and LinkedIn that pass ATS and impress humans in 6 seconds.", [
        T("Update resume with ATS keywords", "Single-column. Skills: SQL, Python, pandas, Power BI, DAX, React, Recharts. STAR format for projects.", "2h"),
        T("LinkedIn optimization", "Headline has keywords. About = 3 sentences. 3 Featured projects with screenshots.", "2h", ["linkedin.com"]),
        T("LinkedIn success post", "3-month journey with 3 project screenshots. This post gets recruiter DMs.", "1h"),
        T("Connect with 20 data people", "DAs and recruiters with personalized notes. 20 = 2-3 real conversations.", "1h"),
        T("Research 20 target companies", "Filter Naukri: DA 0-2 yrs Bangalore. Note tech stack. Prepare why-this-company.", "2h"),
        T("SQL interview prep — 15 Qs", "Practice aloud: RANK vs DENSE_RANK, 2nd highest salary, month-over-month growth CTE.", "3h"),
        T("Python live-coding prep", "On blank doc: clean data, groupby+agg, merge on key, plot top 10, summarize insights.", "3h"),
    ]),
    W(4, "Job Hunt Launch", "#fb923c", "Execute systematic job hunt — volume and consistency are the only strategies that work.", [
        T("Apply: 5 on Naukri", "DA 0-2 yrs, Last 7 days, Bangalore. 2-sentence cover note with best project link.", "2h", ["naukri.com"]),
        T("Apply: 5 on LinkedIn", "Easy Apply with personalized message. Also try: junior DA, associate DA, business analyst.", "2h", ["linkedin.com/jobs"]),
        T("Cold message 3 recruiters", "MCA fresher, 3 end-to-end projects in SQL/Python/Power BI/React, share Naukri analysis link.", "1h"),
        T("Apply: 5 on Indeed + AngelList", "Indeed India + Wellfound. Startups prioritize skills over college name.", "2h", ["indeed.co.in"]),
        T("Follow up on all applications", "DM hiring managers on LinkedIn for all previous apps. One follow-up doubles response rate.", "1h"),
        T("Record mock interview", "Record yourself: intro, walk through Naukri project, write SQL query on camera.", "2h"),
        T("Review and keep going!", "Track apps in Google Sheet. Target 5 per day. 50-100 apps = 5-10 interviews.", "2h"),
    ]),
];
const DA_TASKS = DA_WRAW.flatMap((w, wi) => w.ts.map((t, ti) => ({ id: wi * 7 + ti + 1, day: wi * 7 + ti + 1, week: wi + 1, phase: w.ph, color: w.cl, weekTopic: w.tp, weekObj: w.obj, ...t })));

const DSA_FLASHCARDS = [
    { id: 1, cat: "Big O", q: "Time complexity of HashMap get/put?", a: "O(1) average case. O(n) worst case (all keys hash to same bucket). Space: O(n). Always say 'O(1) amortized' in interviews." },
    { id: 2, cat: "Big O", q: "Time complexity of binary search?", a: "O(log n) time. O(1) space (iterative). O(log n) space (recursive, call stack). Works ONLY on sorted arrays." },
    { id: 3, cat: "Big O", q: "Time complexity of merge sort vs quicksort?", a: "Merge sort: O(n log n) always, O(n) space. Quick sort: O(n log n) average, O(n2) worst, O(log n) space. Merge sort is stable, quicksort is not." },
    { id: 4, cat: "Big O", q: "Time complexity of BFS and DFS?", a: "Both O(V+E) where V=vertices, E=edges. BFS uses O(V) space (queue). DFS uses O(V) space (stack/recursion). BFS finds shortest path, DFS explores all paths." },
    { id: 5, cat: "Big O", q: "Time complexity of heap push and pop?", a: "Both O(log n). Build heap from array: O(n). Peek (min or max): O(1). Use heap for: Top-K problems, priority queue, Dijkstra's algorithm." },
    { id: 6, cat: "Patterns", q: "When to use two pointers?", a: "Use when: sorted array, looking for a pair/triplet sum, palindrome check, removing duplicates. Both pointers move toward each other or in same direction. O(n) time O(1) space." },
    { id: 7, cat: "Patterns", q: "When to use sliding window?", a: "Use for: subarray/substring problems with constraint (max, min, exact length). Fixed window: anagram, permutation. Variable window: longest/shortest subarray. Expand right, shrink left." },
    { id: 8, cat: "Patterns", q: "When to use BFS vs DFS?", a: "BFS: shortest path in unweighted graph, level-order traversal, nearest neighbor. DFS: cycle detection, topological sort, all paths, connectivity. BFS uses queue, DFS uses stack/recursion." },
    { id: 9, cat: "Patterns", q: "When to use dynamic programming?", a: "Use DP when: 1) Optimal substructure (optimal solution uses optimal sub-solutions) 2) Overlapping subproblems (same sub-problems solved multiple times). If both true, DP beats brute force." },
    { id: 10, cat: "Patterns", q: "When to use backtracking?", a: "Use for: find ALL solutions (subsets, permutations, combinations), constraint satisfaction (N-Queens, Sudoku). Template: choose, explore, UNCHOOSE. Pruning = cutting branches early." },
    { id: 11, cat: "Trees", q: "What is a BST and its key property?", a: "Binary Search Tree: left child < root < right child for every node. Inorder traversal gives sorted sequence. Search/insert/delete: O(h) where h = height. Balanced BST: O(log n). Unbalanced: O(n)." },
    { id: 12, cat: "Trees", q: "DFS vs BFS on a tree?", a: "DFS (stack/recursion): inorder (L-Root-R), preorder (Root-L-R), postorder (L-R-Root). BFS (queue): level-order. Use DFS for path problems, BFS for level problems or shortest path." },
    { id: 13, cat: "Graphs", q: "Directed vs Undirected graph representation?", a: "Adjacency list: O(V+E) space, efficient for sparse graphs. Adjacency matrix: O(V2) space, O(1) edge lookup, better for dense graphs. Most interview graphs use adjacency list." },
    { id: 14, cat: "Graphs", q: "What is topological sort and when to use it?", a: "Linear ordering of vertices where u comes before v for every directed edge u->v. Only works on DAGs (no cycles). Use for: dependency resolution, course scheduling, build systems. Kahn's BFS or DFS approach." },
    { id: 15, cat: "DP", q: "Top-down vs bottom-up DP?", a: "Top-down (memoization): recursive + cache, natural to write, only solves needed subproblems. Bottom-up (tabulation): iterative + table, no recursion overhead, easier to optimize space. Both O(n) time." },
];

const DSA_PATTERNS = [
    { id: 1, name: "Two Pointers", when: "Sorted array, pair/triplet sum, palindrome, remove duplicates", code: "l, r = 0, len(arr)-1\nwhile l < r:\n    if condition: return result\n    elif too_small: l += 1\n    else: r -= 1" },
    { id: 2, name: "Sliding Window (Variable)", when: "Longest/shortest subarray with constraint", code: "l = 0; window = {}\nfor r in range(len(s)):\n    window[s[r]] = window.get(s[r],0)+1\n    while invalid(window):\n        window[s[l]] -= 1\n        if window[s[l]]==0: del window[s[l]]\n        l += 1\n    best = max(best, r-l+1)" },
    { id: 3, name: "Binary Search", when: "Sorted array, find target, minimize/maximize value", code: "lo, hi = 0, len(nums)-1\nwhile lo <= hi:\n    mid = lo + (hi-lo)//2\n    if nums[mid] == target: return mid\n    elif nums[mid] < target: lo = mid+1\n    else: hi = mid-1\nreturn -1" },
    { id: 4, name: "DFS Recursive (Tree)", when: "Tree traversal, path problems, depth calculation", code: "def dfs(node):\n    if not node: return base_case\n    left = dfs(node.left)\n    right = dfs(node.right)\n    return compute(left, right, node.val)" },
    { id: 5, name: "BFS Graph", when: "Shortest path, level order, connected components", code: "from collections import deque\nvisited = set([start])\nq = deque([start])\nwhile q:\n    node = q.popleft()\n    for neighbor in graph[node]:\n        if neighbor not in visited:\n            visited.add(neighbor)\n            q.append(neighbor)" },
    { id: 6, name: "Backtracking", when: "All subsets, permutations, combinations, N-Queens", code: "def backtrack(start, current):\n    if base_case:\n        result.append(list(current))\n        return\n    for i in range(start, len(nums)):\n        current.append(nums[i])  # choose\n        backtrack(i+1, current)  # explore\n        current.pop()            # unchoose" },
    { id: 7, name: "1D Dynamic Programming", when: "Sequence optimization, take-or-skip decisions", code: "# Define: dp[i] = optimal value for first i elements\ndp = [0] * (n+1)\ndp[0] = base_case\nfor i in range(1, n+1):\n    dp[i] = max(dp[i-1], dp[i-2] + nums[i-1])  # example: house robber" },
    { id: 8, name: "Union Find (DSU)", when: "Connected components, cycle detection, MST", code: "parent = list(range(n))\nrank = [0]*n\ndef find(x):\n    if parent[x] != x: parent[x] = find(parent[x])  # path compression\n    return parent[x]\ndef union(x, y):\n    px, py = find(x), find(y)\n    if px == py: return False\n    if rank[px] < rank[py]: px,py = py,px\n    parent[py] = px\n    if rank[px]==rank[py]: rank[px]+=1\n    return True" },
];

const DSA_QA = [
    { id: 1, cat: "Arrays", d: "Easy", q: "Explain the two-pointer technique.", a: "Use two indices (usually l=0, r=n-1 or both starting at 0) to scan an array from both ends or in same direction. Reduces O(n2) brute force to O(n). Used for: pair sum, palindrome, remove duplicates, container with most water." },
    { id: 2, cat: "Arrays", d: "Medium", q: "What is the sliding window pattern and when do you use it?", a: "Maintain a window (subarray) that expands right and shrinks left based on a condition. Two types: fixed size (for anagram, permutation) and variable size (for longest/shortest subarray with constraint). O(n) time." },
    { id: 3, cat: "DP", d: "Medium", q: "How do you know when to use dynamic programming?", a: "DP applies when a problem has: 1) Optimal substructure (optimal answer uses optimal sub-answers) 2) Overlapping subproblems (same calculations repeated). Always define dp[i] BEFORE writing code." },
    { id: 4, cat: "Trees", d: "Easy", q: "What is the difference between BFS and DFS on a tree?", a: "DFS uses stack/recursion, explores deep before wide. Three orders: inorder (sorted for BST), preorder (copy tree), postorder (delete tree). BFS uses queue, level by level. Use BFS for level problems, DFS for path problems." },
    { id: 5, cat: "Graphs", d: "Medium", q: "Explain topological sort and when to use it.", a: "Linear ordering of vertices such that u comes before v for every directed edge u->v. Only works for DAGs (no cycles). Use for: course schedule, task dependencies, build system. Kahn's BFS: process in-degree 0 nodes first." },
    { id: 6, cat: "DP", d: "Hard", q: "What is the difference between 0/1 Knapsack and Unbounded Knapsack?", a: "0/1 Knapsack: each item used at most once — iterate weights in REVERSE to avoid reusing. Unbounded Knapsack: items can be reused — iterate weights FORWARD. LC#416 Partition Subset = 0/1, LC#322 Coin Change = Unbounded." },
    { id: 7, cat: "General", d: "Easy", q: "What is the time and space complexity of common sorting algorithms?", a: "Merge Sort: O(n log n) time, O(n) space, stable. Quick Sort: O(n log n) avg, O(n2) worst, O(log n) space, unstable. Heap Sort: O(n log n), O(1) space, unstable. Counting Sort: O(n+k), O(k) space." },
    { id: 8, cat: "Trees", d: "Medium", q: "How do you validate a Binary Search Tree?", a: "Do NOT just check left.val < root.val < right.val — this fails for nodes further down the tree. Instead, pass valid range (min, max) down recursively: left child must be < root, right child must be > root." },
    { id: 9, cat: "Graphs", d: "Hard", q: "Explain Dijkstra's algorithm. When does it fail?", a: "Single-source shortest path for weighted graphs with NON-NEGATIVE weights. Use min-heap. Pop minimum distance node, relax neighbors. O((V+E) log V). FAILS with negative weights — use Bellman-Ford instead." },
    { id: 10, cat: "General", d: "Medium", q: "When would you use a heap vs a sorted array?", a: "Heap: O(log n) insert/delete, O(1) peek min/max. Best for: streaming data, dynamic Top-K problems. Sorted array: O(n) insert, O(log n) search. Best for: static data with frequent searches. Heap wins for dynamic scenarios." },
];

const MOCK_PROBLEMS = [
    { id: 1, d: "Easy", title: "Two Sum", desc: "Given array nums and integer target, return indices of two numbers that add to target.", hint: "Use a HashMap. For each number, check if target-num is already in the map.", slug: "two-sum", time: 10 },
    { id: 2, d: "Easy", title: "Valid Parentheses", desc: "Given string with brackets, determine if brackets are valid (properly opened and closed).", hint: "Use a stack. Push open brackets. On close bracket, check if top of stack matches.", slug: "valid-parentheses", time: 10 },
    { id: 3, d: "Medium", title: "Longest Substring Without Repeating Characters", desc: "Find length of longest substring without repeating characters.", hint: "Sliding window with HashSet. Expand right, shrink left when duplicate found.", slug: "longest-substring-without-repeating-characters", time: 20 },
    { id: 4, d: "Medium", title: "3Sum", desc: "Find all unique triplets in array that sum to zero.", hint: "Sort array. Fix one pointer, use two pointers for the rest. Skip duplicates!", slug: "3sum", time: 25 },
    { id: 5, d: "Medium", title: "Maximum Subarray (Kadane's)", desc: "Find contiguous subarray with the largest sum.", hint: "Kadane: maxHere = max(num, maxHere+num). Track maxSoFar = max(maxSoFar, maxHere).", slug: "maximum-subarray", time: 15 },
    { id: 6, d: "Medium", title: "Coin Change", desc: "Given coins and amount, find minimum number of coins to make the amount.", hint: "DP: dp[amt] = min(dp[amt-coin]+1) for each coin. Initialize with infinity.", slug: "coin-change", time: 25 },
    { id: 7, d: "Medium", title: "Number of Islands", desc: "Count distinct islands (connected 1s) in a 2D binary grid.", hint: "DFS/BFS flood fill. For each unvisited land cell, DFS and mark all connected cells.", slug: "number-of-islands", time: 20 },
    { id: 8, d: "Hard", title: "Trapping Rain Water", desc: "Given elevation map, compute how much water it can trap after rain.", hint: "Precompute maxLeft[i] and maxRight[i]. Water at i = min(maxL,maxR) - height[i].", slug: "trapping-rain-water", time: 35 },
    { id: 9, d: "Hard", title: "Merge K Sorted Lists", desc: "Merge k sorted linked lists and return as one sorted list.", hint: "Use min-heap of (val, list_index, node). Pop minimum, push that node's next.", slug: "merge-k-sorted-lists", time: 35 },
    { id: 10, d: "Medium", title: "House Robber", desc: "Maximum money you can rob without robbing adjacent houses.", hint: "dp[i] = max(dp[i-1], dp[i-2]+nums[i]). Optimize to two variables.", slug: "house-robber", time: 20 },
];

const DW = (ph, tp, cl, obj, ts) => ({ ph, tp, cl, obj, ts });
const DT = (ti, ds, tm, tp, df, lc, hint) => ({ ti, ds, tm, tp: tp || "problem", df: df || null, lc: lc || [], hint: hint || "" });
const DSA_WRAW = [
    DW(1, "Arrays & Big O", "#4ade80", "HashMap and two-pointer cover 40% of Easy/Medium problems — master these first.", [
        DT("Big O notation + setup", "Study O(1) O(log n) O(n) O(n log n) O(n2). Setup LeetCode, write Big O cheat sheet.", "2h", "learn"),
        DT("Two Sum + Contains Duplicate", "LC#1: one-pass HashMap {val:index}. LC#217: HashSet, true if already present. Both O(n).", "2h", "problem", "Easy", ["two-sum", "contains-duplicate"], "Two Sum: HashMap. Duplicate: HashSet. Both O(n) one-pass."),
        DT("Best Time Stock + Max Subarray", "LC#121: track minPrice, update maxProfit. LC#53 Kadane: maxHere=max(num, maxHere+num).", "3h", "problem", "Easy|Medium", ["best-time-to-buy-and-sell-stock", "maximum-subarray"], "Kadane: extend subarray OR start fresh. Take the better option each step."),
        DT("Product Array Except Self + Rotate Array", "LC#238: left pass then right pass, no division, O(1) extra. LC#189: triple reverse trick.", "3h", "problem", "Medium", ["product-of-array-except-self", "rotate-array"], "Product: two-pass O(1) space. Rotate: reverse full, reverse first k, reverse rest."),
        DT("Valid Anagram + Group Anagrams", "LC#242: count chars, subtract, check zeros. LC#49: sorted word as HashMap key.", "2h", "problem", "Easy|Medium", ["valid-anagram", "group-anagrams"], "Anagram: char count array[26]. Group: sorted string is the canonical key."),
        DT("Valid Palindrome + Longest Common Prefix", "LC#125: two pointers, skip non-alphanumeric, compare lowercase. LC#14: vertical scan.", "2h", "problem", "Easy", ["valid-palindrome", "longest-common-prefix"], "Palindrome: two-pointer after filtering. LCP: compare char-by-char across all words."),
        DT("Week 1 review + templates", "Re-solve Two Sum and Group Anagrams from memory. Write HashMap + Two Pointer templates.", "2h", "review", null, [], "Core: HashMap O(n) lookup, Two Pointers O(n) scan. Default to O(n) thinking."),
    ]),
    DW(1, "Sorting & Binary Search", "#4ade80", "Binary search appears in 15% of Mediums disguised as optimization questions.", [
        DT("Binary Search 3 templates", "Exact match: while(lo<=hi). Left bound: return lo. Right bound: return hi. Code all 3.", "2h", "learn", null, [], "Mid = lo+(hi-lo)//2. What to do when nums[mid]==target defines which template."),
        DT("Binary Search + Search Rotated", "LC#704: exact template. LC#33: identify sorted half, check if target in it.", "3h", "problem", "Easy|Medium", ["binary-search", "search-in-rotated-sorted-array"], "Rotated: one half is always sorted. Identify it, check if target belongs there."),
        DT("Find Min Rotated + Kth Largest", "LC#153: binary search for inflection point. LC#215: maintain min-heap of size k.", "3h", "problem", "Medium", ["find-minimum-in-rotated-sorted-array", "kth-largest-element-in-an-array"], "Find Min: BS on rotation point. Kth Largest: min-heap size k."),
        DT("Merge Intervals + Insert Interval", "LC#56: sort by start, merge if curr.start<=prev.end. LC#57: find position, insert, merge.", "3h", "problem", "Medium", ["merge-intervals", "insert-interval"], "Merge when curr.start <= prev.end. New end = max(prev.end, curr.end)."),
        DT("Sort Colors + 3Sum", "LC#75 Dutch Flag: 3 pointers lo/mid/hi. LC#15: sort, fix one pointer, two-ptr rest.", "2h", "problem", "Medium", ["sort-colors", "3sum"], "3Sum: SORT FIRST. Fix one, two-ptr rest. Skip duplicates at every level!"),
        DT("Top K Frequent + 4Sum", "LC#347: bucket sort O(n). LC#18: add outer loop to 3Sum.", "3h", "problem", "Medium", ["top-k-frequent-elements", "4sum"], "Top K bucket sort is O(n) — cleaner than heap here. 4Sum reduces to 3Sum."),
        DT("Week 2 review — 5 timed", "Solve LC#33, LC#15, LC#56, LC#347, LC#153. 20 min each. Review all.", "2h", "review", null, [], "Binary search: which half can I ELIMINATE? Maintain invariant every iteration."),
    ]),
    DW(2, "Linked Lists", "#60a5fa", "Reverse, cycle detection, merge — appear in nearly every phone screen.", [
        DT("LL fundamentals + reverse", "Code singly LL. Reverse: prev=None, curr=head, loop: next=curr.next, curr.next=prev, prev=curr, curr=next.", "2h", "learn", null, [], "Draw every pointer change. 3 pointers: prev, curr, next. Return prev."),
        DT("Reverse LL + Merge Two Sorted", "LC#206: apply template. LC#21: dummy=ListNode(0), attach smaller, advance that pointer.", "2h", "problem", "Easy", ["reverse-linked-list", "merge-two-sorted-lists"], "Dummy node prevents edge cases. Use it in all LL merge problems."),
        DT("LL Cycle + Remove Nth Node", "LC#141 Floyd: slow 1 step, fast 2 steps. LC#19: advance first n+1 steps, then both.", "3h", "problem", "Easy|Medium", ["linked-list-cycle", "remove-nth-node-from-end-of-list"], "Floyd fast/slow. Remove Nth: gap between pointers = distance from end."),
        DT("Reorder List + Find Duplicate", "LC#143: find mid, reverse 2nd half, merge alternating. LC#287: Floyd on array as LL.", "3h", "problem", "Medium", ["reorder-list", "find-the-duplicate-number"], "LC#287: array IS a linked list. Duplicate = cycle entry point."),
        DT("Add Two Numbers + Copy Random", "LC#2: iterate with carry. LC#138: HashMap {old:new}, 2 passes: create then connect.", "3h", "problem", "Medium", ["add-two-numbers", "copy-list-with-random-pointer"], "Copy List: HashMap old->new solves random pointer in 2 clean passes."),
        DT("LRU Cache", "LC#146: HashMap (O(1) lookup) + Doubly Linked List (O(1) reorder). Both get/put O(1).", "3h", "problem", "Medium", ["lru-cache"], "LRU = HashMap + DLL. Most common design problem in interviews."),
        DT("Week 3 review", "Write 3 templates: reverse (3 ptrs), fast/slow (cycle/middle), dummy head (merge).", "2h", "review", null, [], "Three LL patterns: reverse, fast/slow, dummy head. Know all cold."),
    ]),
    DW(2, "Stacks & Queues", "#60a5fa", "Monotonic stack solves 15+ Medium/Hard in O(n) — one of the most powerful patterns.", [
        DT("Monotonic stack study", "Increasing: pop larger. Decreasing: pop smaller. Test on [3,1,4,1,5,9,2,6]. Draw each step.", "2h", "learn", null, [], "Pop when invariant breaks. What causes the pop gets the answer."),
        DT("Valid Parentheses + Min Stack", "LC#20: push open, check match on close. LC#155: store (val, curMin) pairs.", "2h", "problem", "Easy|Medium", ["valid-parentheses", "min-stack"], "Min Stack: store current min AT TIME OF PUSH."),
        DT("Evaluate RPN + Daily Temperatures", "LC#150: operators pop two, compute, push. LC#739: decreasing mono stack of indices.", "3h", "problem", "Medium", ["evaluate-reverse-polish-notation", "daily-temperatures"], "Daily Temps: classic mono stack. Answer = current_index - popped_index."),
        DT("Largest Rectangle + Car Fleet", "LC#84 Hard: mono increasing stack, pop when shorter, width=curr-top-1. LC#853: sort+stack.", "3h", "problem", "Hard|Medium", ["largest-rectangle-in-histogram", "car-fleet"], "Histogram: each bar is shortest in its maximal rectangle. Draw it out."),
        DT("Sliding Window Max + Next Greater", "LC#239: deque, pop smaller from back, expired from front. LC#496: stack+HashMap.", "3h", "problem", "Hard|Easy", ["sliding-window-maximum", "next-greater-element-i"], "Sliding Max: deque maintains decreasing candidates. O(n) total."),
        DT("Trapping Rain Water + Impl Queue", "LC#42: precompute maxL/maxR. Water=min(maxL,maxR)-height. LC#232: two stacks.", "3h", "problem", "Hard|Easy", ["trapping-rain-water", "implement-queue-using-stacks"], "Rain Water: bounded by shorter of tallest bars on each side."),
        DT("Week 4 review — mono stack", "Write mono stack template. Solve Daily Temps and Histogram from memory.", "2h", "review", null, [], "Mono stacks: next greater, span, sliding max — all O(n)."),
    ]),
    DW(2, "HashMap & Sliding Window", "#60a5fa", "Sliding window turns O(n2) brute force into O(n) for substring/subarray problems.", [
        DT("Two Sum II + Container Water", "LC#167: two ptrs, move based on sum. LC#11: move SHORTER height pointer.", "3h", "problem", "Medium", ["two-sum-ii-input-array-is-sorted", "container-with-most-water"], "Container: move shorter side. Area = min(h[l],h[r])*(r-l)."),
        DT("Longest Substring + Min Window", "LC#3: window+HashSet, expand right, shrink on duplicate. LC#76 Hard: need/have counters.", "3h", "problem", "Medium|Hard", ["longest-substring-without-repeating-characters", "minimum-window-substring"], "Min Window: expand until valid, shrink left while still valid."),
        DT("Subarray Sum + Continuous Subarray", "LC#560: prefix sum HashMap. LC#523: same prefix%k at distance>=2.", "3h", "problem", "Medium", ["subarray-sum-equals-k", "continuous-subarray-sum"], "Prefix: sum(i,j)=prefix[j]-prefix[i]. Check if prefix[j]-k in map."),
        DT("Move Zeroes + Find All Anagrams", "LC#283: two ptrs, swap non-zero into slot. LC#438: fixed window, compare freq dicts.", "2h", "problem", "Easy|Medium", ["move-zeroes", "find-all-anagrams-in-a-string"], "Anagrams: when window slides, update ONE char in and ONE out."),
        DT("Permutation in String + Min Subarray", "LC#567: fixed window len(s1). LC#209: expand right, shrink left while sum>=target.", "3h", "problem", "Medium", ["permutation-in-string", "minimum-size-subarray-sum"], "Fixed window: anagram. Variable: min/max subarray. Know both."),
        DT("Non-overlapping Intervals", "LC#435: sort by END time. Keep earliest-ending, count overlaps removed.", "2h", "problem", "Medium", ["non-overlapping-intervals"], "Sort by end. Keep earliest-ending — leaves max room for future."),
        DT("Week 5 review", "Write Fixed and Variable window templates. Solve LC#3 and LC#560 from memory.", "2h", "review", null, [], "Two window types: fixed (anagram) and variable (min/max subarray)."),
    ]),
    DW(3, "Binary Trees", "#c084fc", "Tree traversal, BST ops, path problems — appear in every FAANG phone screen.", [
        DT("Tree traversals — all 4 iterative", "Inorder (stack), Preorder (push R then L), BFS (queue). Must be iterative.", "2h", "learn", null, [], "Iterative inorder: push left until None, pop, visit, go right."),
        DT("Max Depth + Invert Binary Tree", "LC#104: 1+max(left,right). LC#226: swap children, recurse both.", "2h", "problem", "Easy", ["maximum-depth-of-binary-tree", "invert-binary-tree"], "Max Depth: DFS returns heights bottom-up."),
        DT("Level Order + Symmetric Tree", "LC#102: BFS, snapshot size per level. LC#101: compare mirror positions.", "2h", "problem", "Medium|Easy", ["binary-tree-level-order-traversal", "symmetric-tree"], "Level order: record queue size at START of level."),
        DT("Validate BST + Kth Smallest", "LC#98: pass (min,max) bounds down. LC#230: inorder = sorted, count to k.", "3h", "problem", "Medium", ["validate-binary-search-tree", "kth-smallest-element-in-a-bst"], "Validate: pass valid range! Kth Smallest: inorder traversal."),
        DT("LCA + BT Right Side View", "LC#235: split point = LCA. LC#199: BFS, last node per level.", "3h", "problem", "Medium", ["lowest-common-ancestor-of-a-binary-search-tree", "binary-tree-right-side-view"], "LCA BST: both smaller go left, both larger go right, else found."),
        DT("Construct BT + Path Sum II", "LC#105: preorder[0]=root, find in inorder to split. LC#113: DFS track path.", "3h", "problem", "Medium", ["construct-binary-tree-from-preorder-and-inorder-traversal", "path-sum-ii"], "Preorder gives root. Inorder gives left/right split."),
        DT("Week 6 review — tree templates", "Write DFS recursive, iterative BFS, BST inorder templates. Solve Invert + Level Order.", "2h", "review", null, [], "Inorder BST = sorted. DFS = 3 lines. BFS = queue + level snapshot."),
    ]),
    DW(3, "Graphs", "#c084fc", "Graphs in 20% of Medium/Hard — DFS, BFS, topological sort, Union Find.", [
        DT("DFS + BFS from scratch", "Implement both on adjacency list. Mark visited BEFORE enqueuing.", "2h", "learn", null, [], "BFS = shortest path. DFS = connectivity. Both need visited set."),
        DT("Number of Islands + Clone Graph", "LC#200: DFS flood-fill per island. LC#133: HashMap + DFS to copy.", "3h", "problem", "Medium", ["number-of-islands", "clone-graph"], "Islands: count DFS starts. Clone: HashMap prevents infinite loops."),
        DT("Course Schedule I + II", "LC#207: DFS cycle (3 states 0/1/2). LC#210: Kahn BFS with in-degrees.", "3h", "problem", "Medium", ["course-schedule", "course-schedule-ii"], "Kahn BFS: process in-degree 0 nodes first. Easy to implement."),
        DT("Pacific Atlantic + Surrounded Regions", "LC#417: BFS backwards from both oceans. LC#130: DFS from border Os.", "3h", "problem", "Medium", ["pacific-atlantic-water-flow", "surrounded-regions"], "Work backwards from destination. Border cells always reachable."),
        DT("Union Find + Redundant Connection", "Implement find() path compression, union() by rank. Apply to LC#684.", "3h", "problem", "Medium", ["redundant-connection"], "DSU: nearly O(1) per op. Finds edges that create cycles."),
        DT("Word Ladder — Hard BFS", "LC#127: BFS, try all 26-letter substitutions per position.", "3h", "problem", "Hard", ["word-ladder"], "Words=nodes, single-letter-diff=edges. BFS = shortest path."),
        DT("Week 7 review — graph templates", "Write DFS, BFS, Kahn topological sort, Union Find templates.", "2h", "review", null, [], "BFS=shortest. DFS=connectivity. Topo=ordering. DSU=grouping."),
    ]),
    DW(3, "DP Basics", "#c084fc", "1D DP is the most common pattern — build intuition from scratch.", [
        DT("DP philosophy — 4 implementations", "Fibonacci: naive, memo, tabulated, space-optimized. Code all 4.", "2h", "learn", null, [], "Define what dp[i] REPRESENTS before writing any code."),
        DT("Climbing Stairs + House Robber", "LC#70: dp[n]=dp[n-1]+dp[n-2]. LC#198: dp[i]=max(dp[i-1], dp[i-2]+nums[i]).", "2h", "problem", "Easy|Medium", ["climbing-stairs", "house-robber"], "Both are take-or-skip. Robber: rob+skip-prev vs skip-this."),
        DT("House Robber II + Coin Change", "LC#213: run Robber on [0..n-2] and [1..n-1], take max. LC#322: unbounded knapsack.", "3h", "problem", "Medium", ["house-robber-ii", "coin-change"], "Robber II: break circular into 2 linear. Coin Change: dp[amt]=min+1."),
        DT("LIS + LCS", "LC#300: dp[i]=LIS ending at i, O(n2). LC#1143: 2D DP table.", "3h", "problem", "Medium", ["longest-increasing-subsequence", "longest-common-subsequence"], "LIS: dp[i]=LIS ending HERE. LCS: match=1+diag, mismatch=max(left,top)."),
        DT("Partition Equal Subset Sum", "LC#416: dp[s]=can make sum s. Iterate in REVERSE: dp[j]=dp[j] OR dp[j-num].", "3h", "problem", "Medium", ["partition-equal-subset-sum"], "Reverse iteration = 0/1 knapsack. Forward = unbounded knapsack."),
        DT("Jump Game I + II", "LC#55: track max_reach. LC#45: greedy, count jumps at current boundary.", "3h", "problem", "Medium", ["jump-game", "jump-game-ii"], "Jump II: greedy works! Count when you REACH the current boundary."),
        DT("Week 8 review — DP guide", "Create: sequence, grid, interval, knapsack categories. Re-solve Coin Change.", "2h", "review", null, [], "DP needs: optimal substructure AND overlapping subproblems. Verify both."),
    ]),
    DW(3, "Advanced DP", "#c084fc", "Grid and string DP — required for FAANG-level interviews.", [
        DT("Unique Paths I + II", "LC#62: dp[i][j]=dp[i-1][j]+dp[i][j-1]. LC#63: obstacle cell = 0.", "2h", "problem", "Medium", ["unique-paths", "unique-paths-ii"], "Grid DP: current = sum of valid predecessors."),
        DT("Min Path Sum + Triangle", "LC#64: dp[i][j]=grid+min(above,left). LC#120: bottom-up dp[j]=tri+min(dp[j],dp[j+1]).", "3h", "problem", "Medium", ["minimum-path-sum", "triangle"], "Triangle bottom-up: O(n) space. Start from row n-2."),
        DT("Edit Distance + Distinct Subsequences", "LC#72 Hard: match=dp[i-1][j-1], else 1+min(3 ops). LC#115 Hard: count subsequences.", "3h", "problem", "Hard", ["edit-distance", "distinct-subsequences"], "Edit Distance: 3 ops from 3 adjacent cells. Draw the 2D table."),
        DT("Palindromic Substrings + LPS", "LC#647: expand around each center. LC#516: LPS=LCS(s, reverse(s)).", "3h", "problem", "Medium", ["palindromic-substrings", "longest-palindromic-subsequence"], "LPS insight: reverse the string, then LCS gives LPS."),
        DT("Word Break + Decode Ways", "LC#139: dp[i]=True if dp[j] and s[j..i] in wordSet. LC#91: 1-digit and 2-digit.", "3h", "problem", "Medium", ["word-break", "decode-ways"], "Word Break: O(n2*L). Decode Ways: like climbing stairs with constraints."),
        DT("Burst Balloons + Regex Matching", "LC#312 Hard: interval DP, k is LAST to burst. LC#10 Hard: handle * carefully.", "4h", "problem", "Hard", ["burst-balloons", "regular-expression-matching"], "Burst Balloons: last-to-burst makes subproblems independent."),
        DT("Week 9 review — DP pattern map", "Draw classification: 1D, 2D, interval, knapsack, string. Re-solve Edit Distance.", "2h", "review", null, [], "dp[i][j] REPRESENTATION determines if solution is elegant or messy."),
    ]),
    DW(4, "Backtracking & Heap", "#fb923c", "Backtracking for all-solutions, heap for Top-K — together cover 20+ problems.", [
        DT("Backtracking template", "if base_case: add+return. For each choice: ADD, recurse, REMOVE. REMOVE = backtracking.", "2h", "learn", null, ["subsets"], "Add on way in, REMOVE on way out. This creates all paths."),
        DT("Subsets II + Permutations", "LC#90: sort, skip nums[i]==nums[i-1] at same depth. LC#46: used[] array.", "3h", "problem", "Medium", ["subsets-ii", "permutations"], "Duplicate handling: sort first, skip same element at same depth."),
        DT("Combination Sum I + II", "LC#39 reuse: pass i. LC#40 no reuse: pass i+1, sort, skip dups.", "3h", "problem", "Medium", ["combination-sum", "combination-sum-ii"], "Reuse: pass same index. No reuse: pass i+1. Prune if sum>target."),
        DT("N-Queens + Sudoku Solver", "LC#51: track cols, diag1(r-c), diag2(r+c) sets. LC#37: try 1-9, backtrack.", "4h", "problem", "Hard", ["n-queens", "sudoku-solver"], "N-Queens: 3 sets for conflicts. Sudoku: return False if no digit works."),
        DT("Generate Parens + Letter Combos", "LC#22: add ( if open<n, ) if close<open. LC#17: map digits to letters.", "3h", "problem", "Medium", ["generate-parentheses", "letter-combinations-of-a-phone-number"], "Generate Parens: constraints ensure validity naturally."),
        DT("Merge K Sorted Lists — heap", "LC#23 Hard: min-heap (val, idx, node). Pop min, push next from that list.", "3h", "problem", "Medium|Hard", ["top-k-frequent-elements", "merge-k-sorted-lists"], "K-way merge: heap gives next min in O(log k). O(n log k) total."),
        DT("Week 10 review", "Backtracking vs DP: all solutions=backtrack, optimal=DP. Re-solve Combo Sum.", "2h", "review", null, [], "Backtracking = brute force + pruning. Prune early = fast."),
    ]),
    DW(4, "Advanced Data Structures", "#fb923c", "Trie, Dijkstra, Segment Tree — differentiates strong candidates at top companies.", [
        DT("Trie + Word Search II", "LC#208: children=dict, is_end=False. LC#212 Hard: Trie+DFS grid, prune found words.", "3h", "problem", "Medium|Hard", ["implement-trie-prefix-tree", "word-search-ii"], "Trie: O(L) search. Word Search: prune Trie after finding word."),
        DT("Dijkstra: Network Delay + Flights", "LC#743: min-heap (dist, node). LC#787: Bellman-Ford k iterations.", "3h", "problem", "Medium", ["network-delay-time", "cheapest-flights-within-k-stops"], "Dijkstra: O((V+E)log V). K Stops: Bellman-Ford runs exactly k times."),
        DT("Segment Tree + Range Sum", "Build O(n), update O(log n), query O(log n). Apply to LC#307.", "2h", "problem", "Medium", ["range-sum-query-mutable"], "Segment tree beats O(n) recomputation. Each op is O(log n)."),
        DT("Greedy: Gas Station + Task Scheduler", "LC#134: start after last deficit. LC#621: (maxFreq-1)*(n+1)+countMaxFreq.", "2h", "problem", "Medium", ["gas-station", "task-scheduler"], "Gas Station: if total>=cost, solution exists. Find start point."),
        DT("Serialize BT + Find Median", "LC#297: preorder+None markers. LC#295: two heaps for O(1) median.", "4h", "problem", "Hard", ["serialize-and-deserialize-binary-tree", "find-median-from-data-stream"], "Two heaps: O(log n) insert, O(1) median. Elegant trick."),
        DT("Alien Dictionary + Hard review", "LC#269: build char ordering graph, topological sort.", "3h", "problem", "Hard", ["alien-dictionary"], "Alien Dict IS topological sort. Build graph from adjacent words."),
        DT("Week 11 — complexity cheat sheet", "Write O() for all: HashMap, Heap, Sort, DFS/BFS, Dijkstra, DP, Backtrack.", "2h", "review", null, [], "Know all complexities cold. Tested in every interview."),
    ]),
    DW(4, "Mock Interviews & Job Ready", "#fb923c", "Simulate real conditions, identify gaps, launch your applications.", [
        DT("Mock Interview 1: Easy + Medium", "3 Easy + 1 Medium. 90 min. Talk approach BEFORE coding. Review optimals after.", "3h", "mock", "Easy|Medium", []),
        DT("Mock Interview 2: Medium + Hard", "2 Medium + 1 Hard. 90 min. State brute force if stuck, then optimize.", "3h", "mock", "Medium|Hard", []),
        DT("System design basics", "Design LRU Cache + Rate Limiter. Discuss data structures and trade-offs.", "2h", "learn"),
        DT("Blind 75 — revisit weakest", "Find lowest-scored category on neetcode.io. Solve 5 timed.", "3h", "review"),
        DT("Mock Interview 3: Record yourself", "1 Medium + 1 Hard. Record screen+voice. Grade: approach, code, edge cases.", "3h", "mock", "Medium|Hard", []),
        DT("FAANG Hard sprint: 4 essentials", "LC#23 Merge K Sorted, LC#76 Min Window, LC#297 Serialize BT, LC#42 Trapping Water.", "3h", "problem", "Hard", ["merge-k-sorted-lists", "minimum-window-substring", "serialize-and-deserialize-binary-tree", "trapping-rain-water"], "These 4 appear in 30%+ of FAANG interviews. Know them cold."),
        DT("You are Interview Ready!", "Update LeetCode profile, resume, apply: Flipkart, Swiggy, Razorpay, CRED, FAANG.", "1h", "mock"),
    ]),
];
const DSA_TASKS = DSA_WRAW.flatMap((w, wi) => w.ts.map((t, ti) => ({ id: wi * 7 + ti + 1, day: wi * 7 + ti + 1, week: wi + 1, phase: w.ph, color: w.cl, weekTopic: w.tp, weekObj: w.obj, ...t })));

const SK = "devpath_v5";
const DEF = {
    mode: "both", section: "da", theme: "dark",
    da_completed: {}, da_startDate: TODAY, da_customBlocks: {},
    dsa_completed: {}, dsa_startDate: TODAY, dsa_customBlocks: {}, dsa_notes: {},
    journal: {}, bookmarks: [],
    weekly_goals: {},
    time_log: {},
    pom_total: 0,
    pom_auto_log: false,
    github_user: "rav3zster",
};

export default function DevPath() {
    const [st, setSt] = useState(DEF);
    const [page, setPage] = useState("dashboard");
    const [loaded, setLoaded] = useState(false);
    // 5-point breakpoint: xs<480 (Z Flip / small phone) | sm<768 (phone) | md<1024 (tablet portrait / Fold unfolded) | lg<1280 (Tab S10+ / large tablet portrait) | xl≥1280 (Tab Ultra / landscape tablet)
    const getBreakpoint = w => w < 480 ? "xs" : w < 768 ? "sm" : w < 1024 ? "md" : w < 1280 ? "lg" : "xl";
    const [bp, setBp] = useState(() => getBreakpoint(window.innerWidth));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selDate, setSelDate] = useState(TODAY);
    const [filterPh, setFilterPh] = useState(0);
    const [filterWk, setFilterWk] = useState(0);
    const [openPhase, setOpenPhase] = useState(null);
    const [expandTask, setExpandTask] = useState(null);
    const [tempPomLog, setTempPomLog] = useState(false);

    useEffect(() => {
        const handleResize = () => setBp(getBreakpoint(window.innerWidth));
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    const [newBlock, setNewBlock] = useState("");
    const [newSlot, setNewSlot] = useState("Morning");
    const [showSettings, setShowSettings] = useState(false);
    const [tempDa, setTempDa] = useState(TODAY);
    const [tempDsa, setTempDsa] = useState(TODAY);
    const [tempMode, setTempMode] = useState("both");
    const [tempGithub, setTempGithub] = useState("rav3zster");
    const [search, setSearch] = useState("");
    const [diffFilt, setDiffFilt] = useState("All");
    // Pomodoro
    const [pomRunning, setPomRunning] = useState(false);
    const [pomTime, setPomTime] = useState(25 * 60);
    const [pomMode, setPomMode] = useState(25);
    const [pomTask, setPomTask] = useState("");
    const pomRef = useRef(null);
    // Flashcards
    const [fcIdx, setFcIdx] = useState(0);
    const [fcFlipped, setFcFlipped] = useState(false);
    const [fcCat, setFcCat] = useState("All");
    // Mock Interview
    const [mockActive, setMockActive] = useState(false);
    const [mockProblem, setMockProblem] = useState(null);
    const [mockTime, setMockTime] = useState(0);
    const [mockRunning, setMockRunning] = useState(false);
    const [mockNote, setMockNote] = useState("");
    const mockRef = useRef(null);
    // Weekly goals
    const [newGoal, setNewGoal] = useState("");
    // Journal
    const [journalText, setJournalText] = useState("");
    const [journalDate, setJournalDate] = useState(TODAY);
    // Bookmarks
    const [newBmUrl, setNewBmUrl] = useState("");
    const [newBmName, setNewBmName] = useState("");
    const [newBmTag, setNewBmTag] = useState("");
    // Time log
    const [logTask, setLogTask] = useState("");
    const [logTime, setLogTime] = useState("");
    // Interview Q&A states
    const [qacat, setQacat] = useState("All");
    const [qadiff, setQadiff] = useState("All");
    const [qaopen, setQaopen] = useState(null);
    // Bookmarks filter state
    const [bmtag, setBmtag] = useState("All");
    // Quote of the day
    const todayQuote = useMemo(() => QUOTES[new Date().getDate() % QUOTES.length], []);

    useEffect(() => {
        const lk = document.createElement("link"); lk.rel = "stylesheet";
        lk.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
        document.head.appendChild(lk);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await storage.get(SK);
                if (res?.value) {
                    const d = JSON.parse(res.value);
                    setSt({ ...DEF, ...d });
                    setTempDa(d.da_startDate || TODAY);
                    setTempDsa(d.dsa_startDate || TODAY);
                    setTempMode(d.mode || "both");
                    setTempGithub(d.github_user || "rav3zster");
                    setTempPomLog(d.pom_auto_log || false);
                    setJournalDate(TODAY);
                }
            } catch { }
            setLoaded(true);
        })();
    }, []);

    useEffect(() => { setExpandTask(null); setFilterPh(0); setFilterWk(0); setSearch(""); setDiffFilt("All"); setQacat("All"); setQadiff("All"); setQaopen(null); setBmtag("All"); }, [st.section]);

    // Define save and upd early so they can be used in useEffect dependency arrays
    // storage.set is fire-and-forget (returns a Promise we don't need to await here)
    const save = useCallback(ns => { storage.set(SK, JSON.stringify(ns)); }, []);
    const upd = useCallback(patch => setSt(p => { const n = { ...p, ...patch }; save(n); return n; }), [save]);

    const pomTaskRef = useRef(pomTask);
    const pomAutoLogRef = useRef(st.pom_auto_log);
    useEffect(() => { pomTaskRef.current = pomTask; }, [pomTask]);
    useEffect(() => { pomAutoLogRef.current = st.pom_auto_log; }, [st.pom_auto_log]);

    // Clear the draft journal text when the user switches to a different date
    // so the textarea shows the saved entry for the newly selected date (not stale draft)
    useEffect(() => { setJournalText(""); }, [journalDate]);

    // Pomodoro timer
    useEffect(() => {
        if (pomRunning) {
            pomRef.current = setInterval(() => {
                setPomTime(t => {
                    if (t <= 1) {
                        clearInterval(pomRef.current);
                        setPomRunning(false);
                        setSt(p => {
                            const newPomTotal = (p.pom_total || 0) + 1;
                            const n = { ...p, pom_total: newPomTotal };
                            if (pomAutoLogRef.current) {
                                const key = TODAY;
                                const existing = p.time_log[key] || [];
                                const taskName = pomTaskRef.current.trim() || "Pomodoro Session";
                                const entry = { id: Date.now(), task: taskName, time: parseFloat((pomMode / 60).toFixed(2)), ts: Date.now() };
                                n.time_log = { ...p.time_log, [key]: [...existing, entry] };
                            }
                            save(n);
                            return n;
                        });
                        return pomMode * 60;
                    }
                    return t - 1;
                });
            }, 1000);
        }
        return () => clearInterval(pomRef.current);
    }, [pomRunning, pomMode, save]);

    // Mock timer
    useEffect(() => {
        if (mockRunning) { mockRef.current = setInterval(() => setMockTime(t => t + 1), 1000); }
        return () => clearInterval(mockRef.current);
    }, [mockRunning]);

    const openSettings = () => {
        setTempMode(st.mode || "both");
        setTempDa(st.da_startDate || TODAY);
        setTempDsa(st.dsa_startDate || TODAY);
        setTempGithub(st.github_user || "rav3zster");
        setTempPomLog(st.pom_auto_log || false);
        setShowSettings(true);
    };

    const handlePomReset = () => {
        setPomRunning(false);
        const timeSpent = pomMode * 60 - pomTime;
        if (st.pom_auto_log && timeSpent >= 60) {
            const mins = Math.floor(timeSpent / 60);
            const hours = parseFloat((timeSpent / 3600).toFixed(2));
            const taskName = pomTask.trim() || "Pomodoro Session";
            const confirmLog = window.confirm(`You spent ${mins} min on "${taskName}". Would you like to log this to your Time Log before resetting?`);
            if (confirmLog) {
                setSt(p => {
                    const key = TODAY;
                    const existing = p.time_log[key] || [];
                    const entry = { id: Date.now(), task: taskName, time: hours, ts: Date.now() };
                    const n = { ...p, time_log: { ...p.time_log, [key]: [...existing, entry] } };
                    save(n);
                    return n;
                });
            }
        }
        setPomTime(pomMode * 60);
    };

    const toggle = useCallback((id, s) => {
        const sec = s || st.section;
        if (sec === "dsa") upd({ dsa_completed: { ...st.dsa_completed, [id]: !st.dsa_completed[id] } });
        else upd({ da_completed: { ...st.da_completed, [id]: !st.da_completed[id] } });
    }, [st, upd]);

    const sec = st.section, isDSA = sec === "dsa";
    // Derived breakpoint flags
    const isPhone = bp === "xs" || bp === "sm";          // phones, Z Flip open (<768px)
    const isTablet = bp === "md";                         // tablet portrait, Fold unfolded (768–1023px)
    const isLargeTablet = bp === "lg" || bp === "xl";   // large tablets, Tab Ultra (1024px+)
    const isMobile = isPhone;                             // backward-compat alias
    const sidebarIcons = isTablet;                       // 64px icon-only collapsed sidebar
    const sidebarHidden = isPhone;                       // hidden behind hamburger drawer
    // Responsive helpers
    const cols = (ph, tab, lg) => isPhone ? ph : isTablet ? tab : lg;
    const contentMaxW = isPhone ? "100%" : isTablet ? 820 : 1040;
    const isDark = st.theme !== "light";
    const tasks = isDSA ? DSA_TASKS : DA_TASKS;
    const completed = isDSA ? st.dsa_completed : st.da_completed;
    const startDate = isDSA ? st.dsa_startDate : st.da_startDate;
    const customBlocks = isDSA ? st.dsa_customBlocks : st.da_customBlocks;
    const phases = isDSA ? DSA_PHASES : DA_PHASES;
    const wraw = isDSA ? DSA_WRAW : DA_WRAW;
    const ac = isDSA ? "#4ade80" : "#22d3a5";

    const doneCnt = useMemo(() => Object.values(completed).filter(Boolean).length, [completed]);
    const pct = Math.round(doneCnt / 84 * 100);
    const dayNum = useMemo(() => Math.min(Math.max(diffD(startDate, TODAY) + 1, 1), 84), [startDate]);
    const curWeek = Math.ceil(dayNum / 7);
    const todayTasks = tasks.filter(t => t.day === dayNum);
    const phStats = useMemo(() => phases.map(p => { const pt = tasks.filter(t => t.phase === p.id); const dn = pt.filter(t => completed[t.id]).length; return { ...p, total: pt.length, done: dn, pct: Math.round(dn / pt.length * 100) }; }), [completed, phases, tasks]);
    const streak = useMemo(() => { let s = 0; for (let i = dayNum - 2; i >= 0; i--) { const dt = tasks.filter(t => t.day === i + 1); if (dt.length > 0 && dt.every(t => completed[t.id])) s++; else break; } return s; }, [completed, dayNum, tasks]);
    const selDayNum = useMemo(() => { const d = diffD(startDate, selDate) + 1; return (d >= 1 && d <= 84) ? d : null; }, [startDate, selDate]);
    const selDayTasks = useMemo(() => selDayNum ? tasks.filter(t => t.day === selDayNum) : [], [selDayNum, tasks]);
    const dateBlocks = customBlocks[selDate] || [];
    const daPct = Math.round(Object.values(st.da_completed).filter(Boolean).length / 84 * 100);
    const dsaPct = Math.round(Object.values(st.dsa_completed).filter(Boolean).length / 84 * 100);
    const daTotalDone = Object.values(st.da_completed).filter(Boolean).length;
    const dsaTotalDone = Object.values(st.dsa_completed).filter(Boolean).length;

    // Achievements
    const unlockedAch = useMemo(() => {
        const allC = { ...st.da_completed, ...st.dsa_completed };
        const allT = [...DA_TASKS, ...DSA_TASKS];
        return ACHIEVEMENTS.filter(a => a.check(allC, allT, streak, st.dsa_notes, st.bookmarks));
    }, [st, streak]);
    const totalPts = useMemo(() => unlockedAch.reduce((s, a) => s + a.pts, 0), [unlockedAch]);

    // Weekly goals
    const curWeekKey = `${startDate}_w${curWeek}`;
    const weekGoals = st.weekly_goals[curWeekKey] || [];
    const weekTasksDone = tasks.filter(t => t.week === curWeek && completed[t.id]).length;
    const weekTasksTotal = tasks.filter(t => t.week === curWeek).length;

    const filteredTasks = useMemo(() => {
        let res = tasks.filter(t => (filterPh === 0 || t.phase === filterPh) && (filterWk === 0 || t.week === filterWk));
        if (search.trim()) res = res.filter(t => t.ti.toLowerCase().includes(search.toLowerCase()) || t.ds.toLowerCase().includes(search.toLowerCase()));
        if (isDSA && diffFilt !== "All") {
            if (diffFilt === "Learn") res = res.filter(t => t.tp === "learn");
            else if (diffFilt === "Review") res = res.filter(t => t.tp === "review" || t.tp === "mock");
            else res = res.filter(t => t.df && t.df.includes(diffFilt));
        }
        return res;
    }, [tasks, filterPh, filterWk, search, isDSA, diffFilt]);

    const byWeek = useMemo(() => { const g = {}; filteredTasks.forEach(t => { if (!g[t.week]) g[t.week] = { topic: t.weekTopic, obj: t.weekObj || "", color: t.color, tasks: [] }; g[t.week].tasks.push(t); }); return g; }, [filteredTasks]);

    const addBlock = () => { if (!newBlock.trim()) return; const b = { id: Date.now(), title: newBlock, slot: newSlot, done: false }; const nb = { ...customBlocks, [selDate]: [...dateBlocks, b] }; if (isDSA) upd({ dsa_customBlocks: nb }); else upd({ da_customBlocks: nb }); setNewBlock(""); };
    const toggleBlock = id => { const nb = { ...customBlocks, [selDate]: dateBlocks.map(b => b.id === id ? { ...b, done: !b.done } : b) }; if (isDSA) upd({ dsa_customBlocks: nb }); else upd({ da_customBlocks: nb }); };
    const removeBlock = id => { const nb = { ...customBlocks, [selDate]: dateBlocks.filter(b => b.id !== id) }; if (isDSA) upd({ dsa_customBlocks: nb }); else upd({ da_customBlocks: nb }); };
    const saveNote = (id, val) => upd({ dsa_notes: { ...st.dsa_notes, [id]: val } });
    const goToWeek = wkNum => { setFilterPh(0); setFilterWk(wkNum); setExpandTask(null); setSearch(""); setDiffFilt("All"); setPage(isDSA ? "dsa_probs" : "tasks"); };
    const addBookmark = () => { if (!newBmUrl.trim()) return; const b = { id: Date.now(), url: newBmUrl.startsWith("http") ? newBmUrl : "https://" + newBmUrl, name: newBmName || newBmUrl, tag: newBmTag || "General", date: TODAY }; upd({ bookmarks: [...st.bookmarks, b] }); setNewBmUrl(""); setNewBmName(""); setNewBmTag(""); };
    const removeBookmark = id => upd({ bookmarks: st.bookmarks.filter(b => b.id !== id) });
    const addGoal = () => { if (!newGoal.trim()) return; const g = { id: Date.now(), text: newGoal, done: false }; upd({ weekly_goals: { ...st.weekly_goals, [curWeekKey]: [...weekGoals, g] } }); setNewGoal(""); };
    const toggleGoal = id => upd({ weekly_goals: { ...st.weekly_goals, [curWeekKey]: weekGoals.map(g => g.id === id ? { ...g, done: !g.done } : g) } });
    const removeGoal = id => upd({ weekly_goals: { ...st.weekly_goals, [curWeekKey]: weekGoals.filter(g => g.id !== id) } });
    const saveJournal = () => { if (!journalText.trim()) return; upd({ journal: { ...st.journal, [journalDate]: { text: journalText, date: journalDate, ts: Date.now() } } }); };
    const addTimeLog = () => { if (!logTask.trim() || !logTime) return; const key = TODAY; const existing = st.time_log[key] || []; const entry = { id: Date.now(), task: logTask, time: parseFloat(logTime), ts: Date.now() }; upd({ time_log: { ...st.time_log, [key]: [...existing, entry] } }); setLogTask(""); setLogTime(""); };
    const removeTimeLog = (key, id) => { const updated = (st.time_log[key] || []).filter(e => e.id !== id); upd({ time_log: { ...st.time_log, [key]: updated } }); };

    // Flashcard helpers
    const fcCards = useMemo(() => { const all = isDSA ? DSA_FLASHCARDS : DA_FLASHCARDS; return fcCat === "All" ? all : all.filter(c => c.cat === fcCat); }, [isDSA, fcCat]);
    const fcCard = fcCards[fcIdx % Math.max(fcCards.length, 1)];
    const fcNext = () => { setFcFlipped(false); setTimeout(() => setFcIdx(i => (i + 1) % fcCards.length), 150); };
    const fcPrev = () => { setFcFlipped(false); setTimeout(() => setFcIdx(i => (i - 1 + fcCards.length) % fcCards.length), 150); };

    // Mock helpers
    const startMock = prob => { setMockProblem(prob); setMockActive(true); setMockTime(0); setMockRunning(true); setMockNote(""); };
    const stopMock = () => { clearInterval(mockRef.current); setMockRunning(false); };
    const fmtMockTime = s => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
    const fmtPomTime = s => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    if (!loaded) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#070b14", color: "#22d3a5", fontFamily: "monospace" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div><div style={{ fontSize: 14 }}>Loading DevPath...</div></div></div>;

    // Theme colors
    const C = isDark ? {
        bg: "#070b14", surf: "#0d1321", surf2: "#111827", surf3: "#1a2540",
        bdr: "rgba(148,163,184,.07)", bdr2: "rgba(148,163,184,.14)",
        txt: "#f1f5f9", txt2: "#94a3b8", txt3: "#475569",
        teal: "#22d3a5", lime: "#4ade80", purple: "#8b7cf8", coral: "#f87171", amber: "#fb923c", blue: "#60a5fa", violet: "#c084fc"
    } : {
        bg: "#f8fafc", surf: "#ffffff", surf2: "#f1f5f9", surf3: "#e2e8f0",
        bdr: "rgba(148,163,184,.2)", bdr2: "rgba(148,163,184,.35)",
        txt: "#0f172a", txt2: "#475569", txt3: "#94a3b8",
        teal: "#0d9488", lime: "#16a34a", purple: "#7c3aed", coral: "#dc2626", amber: "#d97706", blue: "#2563eb", violet: "#7c3aed"
    };
    const font = "'Plus Jakarta Sans',system-ui,sans-serif", mono = "'JetBrains Mono',monospace";

    const Pbar = ({ val, color, h = 4 }) => <div style={{ height: h, background: C.surf3, borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.max(0, Math.min(100, val))}%`, background: color, borderRadius: 99, transition: "width .5s ease" }} /></div>;
    const Cb = ({ done, onToggle, color = C.teal }) => <div onClick={e => { e.stopPropagation(); onToggle(); }} style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${done ? color : C.bdr2}`, background: done ? color + "22" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all .2s" }}>{done && <CheckCircle2 size={13} color={color} />}</div>;
    const Tag = ({ children, color }) => <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 500, color: color || C.txt2, background: color ? color + "18" : C.surf3, border: `1px solid ${color ? color + "35" : C.bdr}` }}>{children}</span>;
    const Btn = ({ onClick, children, primary, small, warn, active }) => <button onClick={onClick} style={{ background: primary ? ac : warn ? C.coral + "18" : active ? C.surf3 : "transparent", border: `1px solid ${primary ? ac : warn ? C.coral : active ? C.bdr2 : C.bdr2}`, borderRadius: 8, padding: small ? "3px 10px" : "7px 14px", fontSize: small ? 11 : 12, color: primary ? "#070b14" : warn ? C.coral : C.txt2, cursor: "pointer", fontWeight: primary ? 700 : 500, display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "inherit", transition: "all .15s" }}>{children}</button>;
    const Card = ({ children, style = {} }) => <div style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16, ...style }}>{children}</div>;
    const DiffBadge = ({ df }) => { if (!df) return null; const m = { Easy: [C.lime, "🟢"], Medium: [C.amber, "🟡"], Hard: [C.coral, "🔴"] }; return <>{df.split("|").map(d => { const [c, e] = m[d] || [C.blue, "📚"]; return <span key={d} style={{ padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 600, color: c, background: c + "18", border: `1px solid ${c}35`, marginRight: 3 }}>{e} {d}</span>; })}</>; };
    const TypeBadge = ({ tp }) => { const m = { learn: [C.blue, "📚 Learn"], review: [C.lime, "🔄 Review"], mock: [C.amber, "🎯 Mock"] }; if (!m[tp]) return null; const [c, l] = m[tp]; return <span style={{ padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 600, color: c, background: c + "18", border: `1px solid ${c}35` }}>{l}</span>; };
    const SecLabel = ({ children }) => <div style={{ fontSize: 11, fontWeight: 600, color: C.txt3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{children}</div>;

    const navDA = [{ id: "dashboard", label: "Dashboard", Icon: LayoutDashboard }, { id: "roadmap", label: "Roadmap", Icon: Map }, { id: "tasks", label: "Tasks", Icon: CheckSquare }, { id: "schedule", label: "Schedule", Icon: CalendarDays }, { id: "progress", label: "Progress", Icon: BarChart3 }, { id: "resources", label: "Resources", Icon: BookOpen }, { id: "flashcards", label: "Flashcards", Icon: Brain }, { id: "interview_qa", label: "Interview Q&A", Icon: Flag }, { id: "pomodoro", label: "Pomodoro", Icon: Timer }, { id: "goals", label: "Weekly Goals", Icon: Target }, { id: "time_log", label: "Time Log", Icon: Clock }, { id: "journal", label: "Journal", Icon: Calendar }, { id: "achievements", label: "Achievements", Icon: Trophy }, { id: "bookmarks", label: "Bookmarks", Icon: Bookmark }, { id: "mock_interview", label: "Mock Interview", Icon: Zap }];
    const navDSA = [{ id: "dsa_dash", label: "Dashboard", Icon: LayoutDashboard }, { id: "dsa_road", label: "Roadmap", Icon: Map }, { id: "dsa_probs", label: "Problems", Icon: Code2 }, { id: "dsa_sched", label: "Schedule", Icon: CalendarDays }, { id: "dsa_prog", label: "Progress", Icon: BarChart3 }, { id: "dsa_res", label: "Resources", Icon: BookOpen }, { id: "flashcards", label: "Flashcards", Icon: Brain }, { id: "interview_qa", label: "Interview Q&A", Icon: Flag }, { id: "patterns", label: "DS Patterns", Icon: Brain }, { id: "pomodoro", label: "Pomodoro", Icon: Timer }, { id: "goals", label: "Weekly Goals", Icon: Target }, { id: "time_log", label: "Time Log", Icon: Clock }, { id: "journal", label: "Journal", Icon: Calendar }, { id: "achievements", label: "Achievements", Icon: Trophy }, { id: "bookmarks", label: "Bookmarks", Icon: Bookmark }, { id: "mock_interview", label: "Mock Interview", Icon: Zap }];

    const Sidebar = () => {
        const navW = sidebarHidden ? 0 : sidebarIcons ? 64 : 220;
        return <div style={{
            width: navW, minWidth: navW, background: C.surf, borderRight: `1px solid ${C.bdr}`,
            display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", overflowY: "auto",
            position: sidebarHidden ? "fixed" : "sticky", top: 0, left: 0, bottom: 0, zIndex: 1000,
            transform: sidebarHidden ? (drawerOpen ? "translateX(0)" : "translateX(-100%)") : "none",
            transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: sidebarHidden && drawerOpen ? "5px 0 25px rgba(0,0,0,0.4)" : "none",
        }}>
            {/* ── Logo ── */}
            <div style={{ padding: sidebarIcons ? "14px 0 10px" : "14px 14px 10px", borderBottom: `1px solid ${C.bdr}`, textAlign: sidebarIcons ? "center" : "left" }}>
                <div style={{ fontSize: sidebarIcons ? 22 : 14, fontWeight: 800, color: ac, fontFamily: mono }}>{sidebarIcons ? "⚡" : "DevPath ⚡"}</div>
                {!sidebarIcons && <div style={{ fontSize: 9, color: C.txt3, marginTop: 2 }}>Raveend's Learning OS</div>}
            </div>
            {/* ── Progress bars (full sidebar only) ── */}
            {!sidebarIcons && <div style={{ padding: "8px 14px 10px", borderBottom: `1px solid ${C.bdr}` }}>
                {st.mode === "both" ? <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: mono, marginBottom: 3 }}><span style={{ color: C.txt3 }}>📊 DA</span><span style={{ color: C.teal }}>{daPct}%</span></div>
                    <Pbar val={daPct} color={C.teal} h={3} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: mono, marginTop: 6, marginBottom: 3 }}><span style={{ color: C.txt3 }}>💻 DSA</span><span style={{ color: C.lime }}>{dsaPct}%</span></div>
                    <Pbar val={dsaPct} color={C.lime} h={3} />
                </> : <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: mono, marginBottom: 4 }}><span style={{ color: C.txt3 }}>Day {dayNum}/84</span><span style={{ color: ac }}>{pct}%</span></div>
                    <Pbar val={pct} color={ac} h={3} />
                </>}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: C.txt3 }}>
                    <span>🏆 {totalPts} pts</span>
                    <span>🔥 {streak}d streak</span>
                </div>
            </div>}
            {/* ── DA / DSA switcher ── */}
            {st.mode === "both" && <div style={{ display: "flex", margin: sidebarIcons ? "6px 4px 2px" : "6px 8px 2px", gap: 4 }}>
                {[{ id: "da", icon: "📊", label: "📊 DA", color: C.teal }, { id: "dsa", icon: "💻", label: "💻 DSA", color: C.lime }].map(s => <div key={s.id} onClick={() => { upd({ section: s.id }); setPage(s.id === "da" ? "dashboard" : "dsa_dash"); if (sidebarHidden) setDrawerOpen(false); }} style={{ flex: 1, textAlign: "center", padding: sidebarIcons ? "7px 0" : "4px 0", borderRadius: 8, border: `1px solid ${sec === s.id ? s.color : C.bdr2}`, background: sec === s.id ? s.color + "18" : "transparent", color: sec === s.id ? s.color : C.txt3, fontSize: sidebarIcons ? 16 : 10, fontWeight: 600, cursor: "pointer" }}>{sidebarIcons ? s.icon : s.label}</div>)}
            </div>}
            {/* ── Nav items ── */}
            <nav style={{ flex: 1, padding: sidebarIcons ? "4px 0" : "4px 6px", overflowY: "auto" }}>
                {(isDSA ? navDSA : navDA).map(({ id, label, Icon }) => <div key={id} title={sidebarIcons ? label : undefined} onClick={() => { setPage(id); if (sidebarHidden) setDrawerOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: sidebarIcons ? "center" : "flex-start", gap: sidebarIcons ? 0 : 8, padding: sidebarIcons ? "11px 0" : "7px 8px", borderRadius: sidebarIcons ? 0 : 8, cursor: "pointer", marginBottom: 1, background: page === id ? ac + "15" : "transparent", color: page === id ? ac : C.txt2, fontSize: 11, fontWeight: page === id ? 600 : 400, transition: "all .15s" }}><Icon size={sidebarIcons ? 20 : 13} />{!sidebarIcons && label}</div>)}
            </nav>
            {/* ── Bottom controls ── */}
            {sidebarIcons
                ? <div style={{ padding: "8px 0 12px", borderTop: `1px solid ${C.bdr}` }}>
                    <div onClick={() => upd({ theme: isDark ? "light" : "dark" })} title={isDark ? "Light mode" : "Dark mode"} style={{ display: "flex", justifyContent: "center", padding: "10px 0", cursor: "pointer", color: C.txt2 }}>{isDark ? <Sun size={20} /> : <Moon size={20} />}</div>
                    <div onClick={() => openSettings()} title="Settings" style={{ display: "flex", justifyContent: "center", padding: "10px 0", cursor: "pointer", color: C.txt2 }}><Settings size={20} /></div>
                </div>
                : <div style={{ padding: "8px 6px 8px", borderTop: `1px solid ${C.bdr}` }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        <div onClick={() => upd({ theme: isDark ? "light" : "dark" })} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px", borderRadius: 8, cursor: "pointer", background: C.surf2, color: C.txt2, fontSize: 10 }}>{isDark ? <Sun size={11} /> : <Moon size={11} />}{isDark ? "Light" : "Dark"}</div>
                        <div onClick={() => { openSettings(); if (sidebarHidden) setDrawerOpen(false); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px", borderRadius: 8, cursor: "pointer", background: C.surf2, color: C.txt2, fontSize: 10 }}><Settings size={11} />Settings</div>
                    </div>
                    <div style={{ fontSize: 9, color: C.txt3, padding: "0 4px", lineHeight: 1.8 }}>Started: {fmtS(startDate)}<br />Target: {fmtS(addD(startDate, 83))}</div>
                </div>}
        </div>;
    };

    const SettingsModal = () => <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={e => { if (e.target === e.currentTarget) setShowSettings(false); }}>
        <div style={{ background: C.surf, border: `1px solid ${C.bdr2}`, borderRadius: 16, padding: 24, width: 380, maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.txt }}>⚙ Settings</span>
                <div onClick={() => setShowSettings(false)} style={{ cursor: "pointer", color: C.txt3 }}><X size={18} /></div>
            </div>
            <SecLabel>Learning Mode</SecLabel>
            {[{ id: "da", icon: "📊", label: "Data Analyst Only", sub: "SQL, Python, Power BI, React" }, { id: "dsa", icon: "💻", label: "DSA / LeetCode Only", sub: "Arrays → DP → Graphs → Mocks" }, { id: "both", icon: "🚀", label: "Both Tracks", sub: "Switch between DA and DSA" }].map(m => <div key={m.id} onClick={() => setTempMode(m.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${tempMode === m.id ? ac : C.bdr2}`, background: tempMode === m.id ? ac + "10" : "transparent", cursor: "pointer", marginBottom: 6, transition: "all .15s" }}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: C.txt }}>{m.label}</div><div style={{ fontSize: 10, color: C.txt2 }}>{m.sub}</div></div>
                {tempMode === m.id && <CheckCircle2 size={15} color={ac} />}
            </div>)}
            <div style={{ height: 1, background: C.bdr, margin: "14px 0" }} />
            {[{ label: "DA Start Date", val: tempDa, set: setTempDa }, { label: "DSA Start Date", val: tempDsa, set: setTempDsa }].map(f => <div key={f.label} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 10, color: C.txt3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 5 }}>{f.label}</label>
                <input type="date" value={f.val} onChange={e => f.set(e.target.value)} style={{ width: "100%", background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "7px 12px", color: C.txt, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                <div style={{ fontSize: 9, color: C.txt3, marginTop: 3 }}>Day 84 = {fmtS(addD(f.val, 83))}</div>
            </div>)}
            <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 10, color: C.txt3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 5 }}>GitHub Username</label>
                <input value={tempGithub} onChange={e => setTempGithub(e.target.value)} placeholder="rav3zster" style={{ width: "100%", background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "7px 12px", color: C.txt, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 0 6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: C.txt3, textTransform: "uppercase", letterSpacing: ".08em", margin: 0 }}>Auto-Log Pomodoro</label>
                    <div 
                        title="When enabled, completed Pomodoro sessions are automatically added to your daily Time Log. Resetted sessions will offer an option to log partial time." 
                        style={{ cursor: "help", display: "flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: "50%", background: C.surf3, color: C.txt2, fontSize: 9, fontWeight: 700 }}
                    >
                        ?
                    </div>
                </div>
                <input 
                    type="checkbox" 
                    checked={tempPomLog} 
                    onChange={e => setTempPomLog(e.target.checked)} 
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: ac }} 
                />
            </div>
            <div style={{ height: 1, background: C.bdr, margin: "14px 0" }} />
            <SecLabel>Export Progress</SecLabel>
            <button onClick={() => { const data = { progress: { da_pct: daPct, dsa_pct: dsaPct, da_done: daTotalDone, dsa_done: dsaTotalDone, streak, achievements: unlockedAch.map(a => a.title), points: totalPts }, date: TODAY }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "devpath_progress.json"; a.click(); }} style={{ width: "100%", background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "8px 12px", color: C.txt2, fontSize: 12, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 14 }}><Download size={13} />Export Progress as JSON</button>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Btn onClick={() => setShowSettings(false)}>Cancel</Btn>
                <Btn primary onClick={() => { const ns = { ...st, mode: tempMode, da_startDate: tempDa, dsa_startDate: tempDsa, github_user: tempGithub, pom_auto_log: tempPomLog }; if (tempMode === "da") ns.section = "da"; if (tempMode === "dsa") ns.section = "dsa"; setSt(ns); save(ns); setPage(ns.section === "da" ? "dashboard" : "dsa_dash"); setShowSettings(false); }}>Save Changes</Btn>
            </div>
        </div>
    </div>;

    const renderDashboard = () => {
        const curPhase = phases[Math.min(Math.ceil(curWeek / 3) - 1, 3)];
        const todayDone = todayTasks.filter(t => completed[t.id]).length;
        const goalsComplete = weekGoals.filter(g => g.done).length;
        const todayTimeLog = st.time_log[TODAY] || [];
        const todayHours = todayTimeLog.reduce((s, e) => s + e.time, 0);
        return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>{isDSA ? "DSA / LeetCode" : "Data Analyst Bootcamp"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.txt, margin: "0 0 3px" }}>Hey Raveend! 👋</h1>
                        <div style={{ fontSize: 12, color: C.txt2 }}>{fmtF(TODAY)} · Day {dayNum} of 84</div>
                    </div>
                    <div style={{ background: ac + "18", border: `1px solid ${ac}35`, borderRadius: 10, padding: "8px 14px", textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: ac, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>Days left</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: ac, fontFamily: mono }}>{84 - dayNum}</div>
                    </div>
                </div>
            </div>

            {/* Quote of day */}
            <Card style={{ marginBottom: 12, background: `linear-gradient(135deg,${ac}12,${C.purple}12)`, border: `1px solid ${ac}30` }}>
                <div style={{ fontSize: 11, color: ac, fontWeight: 600, marginBottom: 4 }}>💭 Quote of the Day</div>
                <div style={{ fontSize: 13, color: C.txt, fontStyle: "italic", lineHeight: 1.6, marginBottom: 4 }}>"{todayQuote.t}"</div>
                <div style={{ fontSize: 11, color: C.txt3 }}>— {todayQuote.a}</div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: cols("repeat(2,1fr)", "repeat(4,1fr)", "repeat(4,1fr)"), gap: 8, marginBottom: 12 }}>
                {[{ l: "Progress", v: `${pct}%`, s: `${doneCnt}/84`, c: ac }, { l: "Streak", v: `${streak}d`, s: "🔥 days", c: C.amber }, { l: "Points", v: totalPts, s: `${unlockedAch.length} badges`, c: C.purple }, { l: "Today", v: `${todayDone}/${todayTasks.length}`, s: "tasks done", c: C.coral }].map(m => <div key={m.l} style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: C.txt3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>{m.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: m.c, fontFamily: mono, lineHeight: 1 }}>{m.v}</div>
                    <div style={{ fontSize: 9, color: C.txt3, marginTop: 3 }}>{m.s}</div>
                </div>)}
            </div>

            <Card style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>Overall Progress — {curPhase.icon} {curPhase.title}</span><span style={{ fontSize: 13, fontWeight: 700, color: ac, fontFamily: mono }}>{pct}%</span></div>
                <Pbar val={pct} color={ac} h={7} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: C.txt3 }}><span>Started {fmtS(startDate)}</span><span>Target {fmtS(addD(startDate, 83))}</span></div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: cols("1fr", "1fr 1fr", "1fr 1fr"), gap: 10, marginBottom: 12 }}>
                <Card style={{ padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.txt, marginBottom: 10 }}>Phase Progress</div>
                    {phStats.map(p => <div key={p.id} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 11, color: C.txt }}>{p.icon} {p.title}</span><span style={{ fontSize: 10, color: p.color, fontFamily: mono }}>{p.done}/{p.total}</span></div>
                        <Pbar val={p.pct} color={p.color} h={4} />
                    </div>)}
                </Card>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Card style={{ padding: 12, flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.txt, marginBottom: 8 }}>📅 Week {curWeek} Goals</div>
                        <div style={{ fontSize: 11, color: C.txt2, marginBottom: 8 }}>Tasks: {weekTasksDone}/{weekTasksTotal} done</div>
                        <Pbar val={weekTasksTotal > 0 ? Math.round(weekTasksDone / weekTasksTotal * 100) : 0} color={ac} h={3} />
                        {weekGoals.slice(0, 2).map(g => <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                            <Cb done={g.done} onToggle={() => toggleGoal(g.id)} color={ac} />
                            <span style={{ fontSize: 10, color: g.done ? C.txt3 : C.txt, textDecoration: g.done ? "line-through" : "none" }}>{g.text}</span>
                        </div>)}
                        {weekGoals.length === 0 && <div style={{ fontSize: 10, color: C.txt3, marginTop: 6 }}>No goals set yet</div>}
                        <div style={{ marginTop: 8 }}><Btn small onClick={() => setPage("goals")}>Manage Goals →</Btn></div>
                    </Card>
                    <Card style={{ padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.txt, marginBottom: 6 }}>⏱ Today Logged</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: C.amber, fontFamily: mono }}>{todayHours.toFixed(1)}h</div>
                        <div style={{ fontSize: 10, color: C.txt3 }}>{todayTimeLog.length} sessions tracked</div>
                        <div style={{ marginTop: 6 }}><Btn small onClick={() => setPage("time_log")}>Track Time →</Btn></div>
                    </Card>
                </div>
            </div>

            {isDSA && <Card style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 10 }}>Difficulty Breakdown</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {[{ l: "🟢 Easy", c: C.lime, k: "Easy" }, { l: "🟡 Medium", c: C.amber, k: "Medium" }, { l: "🔴 Hard", c: C.coral, k: "Hard" }].map(d => {
                        const dt = tasks.filter(t => t.df && t.df.includes(d.k)); const dn = dt.filter(t => completed[t.id]).length; return <div key={d.k} style={{ background: C.surf2, borderRadius: 10, padding: "8px", textAlign: "center", border: `1px solid ${d.c}25` }}>
                            <div style={{ fontSize: 10, color: d.c, marginBottom: 3 }}>{d.l}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: d.c, fontFamily: mono }}>{dn}/{dt.length}</div>
                            <Pbar val={dt.length > 0 ? Math.round(dn / dt.length * 100) : 0} color={d.c} h={3} />
                        </div>;
                    })}
                </div>
            </Card>}

            <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>Today — Day {dayNum}, Week {curWeek}</span>
                    <Btn small onClick={() => setPage(isDSA ? "dsa_probs" : "tasks")}>All {isDSA ? "problems" : "tasks"} <ArrowRight size={10} /></Btn>
                </div>
                {todayTasks.length === 0 ? <div style={{ textAlign: "center", padding: "16px 0", color: C.txt3, fontSize: 12 }}>No tasks assigned. Set start date in Settings ⚙</div> :
                    todayTasks.map(task => <div key={task.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.bdr}` }}>
                        <Cb done={!!completed[task.id]} onToggle={() => toggle(task.id)} color={task.color} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: completed[task.id] ? C.txt3 : C.txt, textDecoration: completed[task.id] ? "line-through" : "none" }}>{task.ti}</div>
                            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}><Tag><Clock size={9} /> {task.tm}</Tag>{isDSA && task.df && <DiffBadge df={task.df} />}</div>
                        </div>
                    </div>)}
            </Card>
        </div>;
    };

    const renderPomodoro = () => {
        const mins = Math.floor(pomTime / 60), secs = pomTime % 60;
        const radius = 70, circ = 2 * Math.PI * radius;
        const total = pomMode * 60, progress = (total - pomTime) / total;
        const offset = circ * (1 - progress);
        return <div style={{ padding: "20px 18px 48px", maxWidth: 520 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Focus Tool</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 18px" }}>Pomodoro Timer</h1>
            <Card style={{ textAlign: "center", marginBottom: 12 }}>
                <svg width={180} height={180} viewBox="0 0 180 180" style={{ margin: "0 auto 8px" }}>
                    <circle cx={90} cy={90} r={radius} fill="none" stroke={C.surf3} strokeWidth={8} />
                    <circle cx={90} cy={90} r={radius} fill="none" stroke={ac} strokeWidth={8} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 90 90)" style={{ transition: "stroke-dashoffset .5s ease" }} />
                    <text x={90} y={84} textAnchor="middle" fill={C.txt} fontSize={32} fontWeight={700} fontFamily={mono}>{mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}</text>
                    <text x={90} y={106} textAnchor="middle" fill={C.txt3} fontSize={11}>{pomRunning ? "Focus time!" : "Ready"}</text>
                </svg>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
                    {[{ l: "25 min", v: 25 }, { l: "50 min", v: 50 }, { l: "Short break", v: 5 }, { l: "Long break", v: 15 }].map(m => <button key={m.v} onClick={() => { setPomMode(m.v); setPomTime(m.v * 60); setPomRunning(false); }} style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${pomMode === m.v ? ac : C.bdr2}`, background: pomMode === m.v ? ac + "18" : "transparent", color: pomMode === m.v ? ac : C.txt2, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>{m.l}</button>)}
                </div>
                <input value={pomTask} onChange={e => setPomTask(e.target.value)} placeholder="What are you working on? (optional)" style={{ width: "100%", background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "8px 12px", color: C.txt, fontSize: 12, fontFamily: "inherit", outline: "none", marginBottom: 12, textAlign: "center" }} />
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <Btn primary onClick={() => setPomRunning(!pomRunning)}>{pomRunning ? "⏸ Pause" : "▶ Start"}</Btn>
                    <Btn onClick={handlePomReset}>↺ Reset</Btn>
                </div>
            </Card>
            <Card>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 10 }}>Session Stats</div>
                <div style={{ display: "grid", gridTemplateColumns: cols("1fr", "repeat(2,1fr)", "repeat(3,1fr)"), gap: 10 }}>
                    {[{ l: "Total Sessions", v: st.pom_total || 0, c: ac }, { l: "Focus Hours", v: ((st.pom_total || 0) * pomMode / 60).toFixed(1) + "h", c: C.purple }, { l: "Current Mode", v: pomMode + "m", c: C.amber }].map(s => <div key={s.l} style={{ textAlign: "center", background: C.surf2, borderRadius: 10, padding: "10px 8px" }}>
                        <div style={{ fontSize: 9, color: C.txt3, marginBottom: 3 }}>{s.l}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: s.c, fontFamily: mono }}>{s.v}</div>
                    </div>)}
                </div>
            </Card>
        </div>;
    };

    const renderFlashcards = () => {
        const cats = ["All", ...new Set((isDSA ? DSA_FLASHCARDS : DA_FLASHCARDS).map(c => c.cat))];
        return <div style={{ padding: "20px 18px 48px", maxWidth: 560 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Quick Review</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 18px" }}>Flashcards</h1>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {cats.map(c => <div key={c} onClick={() => { setFcCat(c); setFcIdx(0); setFcFlipped(false); }} style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer", background: fcCat === c ? ac + "22" : C.surf2, border: `1px solid ${fcCat === c ? ac : C.bdr}`, color: fcCat === c ? ac : C.txt2 }}>{c}</div>)}
            </div>
            {fcCard && <>
                <div onClick={() => setFcFlipped(!fcFlipped)} style={{ cursor: "pointer", marginBottom: 12 }}>
                    <Card style={{ minHeight: 200, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", background: fcFlipped ? `linear-gradient(135deg,${ac}15,${C.purple}15)` : C.surf, border: `2px solid ${fcFlipped ? ac : C.bdr}`, transition: "all .3s", padding: 24 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: fcFlipped ? ac : C.txt3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>{fcFlipped ? "Answer ✓" : "Question — click to flip"}</div>
                        <Tag color={fcCard.cat === ("Big O" || "Patterns" || "Arrays" || "Trees" || "Graphs" || "DP") ? C.lime : C.teal}>{fcCard.cat}</Tag>
                        <div style={{ fontSize: 15, fontWeight: fcFlipped ? 400 : 600, color: C.txt, lineHeight: 1.7, marginTop: 14 }}>{fcFlipped ? fcCard.a : fcCard.q}</div>
                    </Card>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Btn onClick={fcPrev}>← Prev</Btn>
                    <span style={{ fontSize: 12, color: C.txt3, fontFamily: mono }}>{fcIdx % fcCards.length + 1} / {fcCards.length}</span>
                    <Btn primary onClick={fcNext}>Next →</Btn>
                </div>
            </>}
        </div>;
    };

    const renderInterviewQA = () => {
        const allQA = isDSA ? DSA_QA : DA_QA;
        const cats = ["All", ...new Set(allQA.map(q => q.cat))];
        const diffs = ["All", "Easy", "Medium", "Hard"];
        const filtered = allQA.filter(q => (qacat === "All" || q.cat === qacat) && (qadiff === "All" || q.d === qadiff));
        return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Interview Prep</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 18px" }}>Interview Q&A Bank</h1>
            <Card style={{ marginBottom: 12 }}>
                <SecLabel>Filter by Category</SecLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {cats.map(c => <div key={c} onClick={() => { setQacat(c); setQaopen(null); }} style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer", background: qacat === c ? ac + "22" : C.surf2, border: `1px solid ${qacat === c ? ac : C.bdr}`, color: qacat === c ? ac : C.txt2 }}>{c}</div>)}
                </div>
                <SecLabel>Filter by Difficulty</SecLabel>
                <div style={{ display: "flex", gap: 6 }}>
                    {diffs.map(d => <div key={d} onClick={() => { setQadiff(d); setQaopen(null); }} style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer", background: qadiff === d ? ac + "22" : C.surf2, border: `1px solid ${qadiff === d ? ac : C.bdr}`, color: qadiff === d ? ac : C.txt2 }}>{d === "Easy" ? "🟢 " + d : d === "Medium" ? "🟡 " + d : d === "Hard" ? "🔴 " + d : d}</div>)}
                </div>
            </Card>
            <div style={{ fontSize: 11, color: C.txt3, marginBottom: 10 }}>{filtered.length} questions</div>
            {filtered.map(q => <div key={q.id} style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                <div onClick={() => setQaopen(qaopen === q.id ? null : q.id)} style={{ padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.txt, lineHeight: 1.4 }}>{q.q}</div>
                        <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                            <Tag>{q.cat}</Tag>
                            <span style={{ padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 600, color: q.d === "Easy" ? C.lime : q.d === "Medium" ? C.amber : C.coral, background: (q.d === "Easy" ? C.lime : q.d === "Medium" ? C.amber : C.coral) + "18", border: `1px solid ${(q.d === "Easy" ? C.lime : q.d === "Medium" ? C.amber : C.coral)}35` }}>{q.d === "Easy" ? "🟢" : q.d === "Medium" ? "🟡" : "🔴"} {q.d}</span>
                        </div>
                    </div>
                    {qaopen === q.id ? <ChevronDown size={14} color={C.txt3} /> : <ChevronRight size={14} color={C.txt3} />}
                </div>
                {qaopen === q.id && <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${C.bdr}`, paddingTop: 12 }}>
                    <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.7, background: C.surf2, borderRadius: 8, padding: "10px 12px" }}>{q.a}</div>
                </div>}
            </div>)}
        </div>;
    };

    const renderAchievements = () => {
        const allC = { ...st.da_completed, ...st.dsa_completed };
        const allT = [...DA_TASKS, ...DSA_TASKS];
        return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Your Badges</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: 0 }}>Achievements</h1>
                <div style={{ background: C.purple + "18", border: `1px solid ${C.purple}35`, borderRadius: 10, padding: "6px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.purple, fontWeight: 600, textTransform: "uppercase" }}>Total Points</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.purple, fontFamily: mono }}>{totalPts}</div>
                </div>
            </div>
            <div style={{ marginBottom: 12, fontSize: 12, color: C.txt2 }}>{unlockedAch.length}/{ACHIEVEMENTS.length} badges unlocked · {ACHIEVEMENTS.length - unlockedAch.length} remaining</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
                {ACHIEVEMENTS.map(a => {
                    const unlocked = a.check(allC, allT, streak, st.dsa_notes, st.bookmarks);
                    return <div key={a.id} style={{ background: C.surf, border: `1px solid ${unlocked ? ac + "50" : C.bdr}`, borderRadius: 12, padding: "14px 12px", textAlign: "center", opacity: unlocked ? 1 : 0.5, transition: "all .3s" }}>
                        <div style={{ fontSize: 28, marginBottom: 8, filter: unlocked ? "none" : "grayscale(1)" }}>{a.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: unlocked ? C.txt : C.txt3, marginBottom: 3 }}>{a.title}</div>
                        <div style={{ fontSize: 10, color: C.txt3, lineHeight: 1.5, marginBottom: 8 }}>{a.desc}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: unlocked ? ac : C.txt3 }}>{unlocked ? "✓ Unlocked" : "Locked"}</div>
                        <div style={{ fontSize: 9, color: C.txt3, marginTop: 2 }}>+{a.pts} pts</div>
                    </div>;
                })}
            </div>
        </div>;
    };

    const renderJournal = () => {
        const entries = Object.values(st.journal || {}).sort((a, b) => b.ts - a.ts);
        return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Daily Notes</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 18px" }}>Journal</h1>
            <Card style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                    <input type="date" value={journalDate} onChange={e => setJournalDate(e.target.value)} style={{ background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "6px 10px", color: C.txt, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                    <span style={{ fontSize: 12, color: C.txt2 }}>Writing for {fmtS(journalDate)}</span>
                </div>
                <textarea value={journalText || st.journal[journalDate]?.text || ""} onChange={e => setJournalText(e.target.value)} placeholder={"What did you learn today?\nWhat problems did you solve?\nWhat was challenging?\nWhat are you proud of?\nTomorrow's plan..."} style={{ width: "100%", background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "10px 12px", color: C.txt, fontSize: 12, fontFamily: "inherit", resize: "vertical", minHeight: 160, outline: "none", lineHeight: 1.7 }} />
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                    <Btn primary onClick={() => { saveJournal(); setJournalText(""); }}>Save Entry 💾</Btn>
                </div>
            </Card>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 10 }}>Previous Entries ({entries.length})</div>
            {entries.slice(0, 10).map(e => <Card key={e.date} style={{ marginBottom: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 11, fontWeight: 600, color: ac }}>{fmtS(e.date)}</span><span style={{ fontSize: 10, color: C.txt3 }}>{e.text.length} chars</span></div>
                <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{e.text.substring(0, 200)}{e.text.length > 200 ? "..." : ""}</div>
            </Card>)}
            {entries.length === 0 && <div style={{ textAlign: "center", padding: "24px", color: C.txt3, fontSize: 12 }}>No journal entries yet. Start writing today!</div>}
        </div>;
    };

    const renderBookmarks = () => {
        const tags = ["All", ...new Set(st.bookmarks.map(b => b.tag))];
        const filtered = bmtag === "All" ? st.bookmarks : st.bookmarks.filter(b => b.tag === bmtag);
        return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Saved Links</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 18px" }}>Bookmarks</h1>
            <Card style={{ marginBottom: 12 }}>
                <SecLabel>Add New Bookmark</SecLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input value={newBmUrl} onChange={e => setNewBmUrl(e.target.value)} placeholder="URL (https://...)" style={{ background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "8px 12px", color: C.txt, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                    <div style={{ display: "flex", flexDirection: cols("column", "row", "row"), gap: 8 }}>
                        <input value={newBmName} onChange={e => setNewBmName(e.target.value)} placeholder="Name (optional)" style={{ flex: 1, background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "8px 12px", color: C.txt, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                        <input value={newBmTag} onChange={e => setNewBmTag(e.target.value)} placeholder="Tag (e.g. SQL)" style={{ flex: 1, background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "8px 12px", color: C.txt, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                        <Btn primary onClick={addBookmark}><Plus size={13} />Add</Btn>
                    </div>
                </div>
            </Card>
            {tags.length > 1 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {tags.map(t => <div key={t} onClick={() => setBmtag(t)} style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer", background: bmtag === t ? ac + "22" : C.surf2, border: `1px solid ${bmtag === t ? ac : C.bdr}`, color: bmtag === t ? ac : C.txt2 }}>{t}</div>)}
            </div>}
            {filtered.map(b => <div key={b.id} style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <ExternalLink size={13} color={ac} />
                <div style={{ flex: 1 }}>
                    <a href={b.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 500, color: C.txt, textDecoration: "none" }}>{b.name}</a>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}><Tag color={ac}>{b.tag}</Tag><span style={{ fontSize: 10, color: C.txt3 }}>{fmtS(b.date)}</span></div>
                </div>
                <div onClick={() => removeBookmark(b.id)} style={{ cursor: "pointer", color: C.txt3 }}><X size={13} /></div>
            </div>)}
            {st.bookmarks.length === 0 && <div style={{ textAlign: "center", padding: "24px", color: C.txt3, fontSize: 12 }}>No bookmarks saved yet. Add useful links above!</div>}
        </div>;
    };

    const renderMockInterview = () => {
        if (!mockActive) return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Practice Arena</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 6px" }}>Mock Interview</h1>
            <div style={{ fontSize: 13, color: C.txt2, marginBottom: 18 }}>Simulate real interview conditions. Timer starts when you begin. Talk through your approach.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                {MOCK_PROBLEMS.map(p => <Card key={p.id} style={{ cursor: "pointer", border: `1px solid ${C.bdr}`, transition: "border-color .2s" }} onClick={() => startMock(p)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <span style={{ padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 600, color: p.d === "Easy" ? C.lime : p.d === "Medium" ? C.amber : C.coral, background: (p.d === "Easy" ? C.lime : p.d === "Medium" ? C.amber : C.coral) + "18", border: `1px solid ${(p.d === "Easy" ? C.lime : p.d === "Medium" ? C.amber : C.coral)}35` }}>{p.d === "Easy" ? "🟢" : p.d === "Medium" ? "🟡" : "🔴"} {p.d}</span>
                        <span style={{ fontSize: 10, color: C.txt3 }}>{p.time}m limit</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.txt, marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: C.txt2, lineHeight: 1.5 }}>{p.desc}</div>
                    <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: ac }}>▶ Start Mock →</div>
                </Card>)}
            </div>
        </div>;

        return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: ac, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Mock Interview Active</div>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: C.txt, margin: 0 }}>{mockProblem.title}</h1>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: mockTime > mockProblem.time * 60 ? C.coral : ac, fontFamily: mono }}>{fmtMockTime(mockTime)}</div>
                    <div style={{ fontSize: 10, color: C.txt3 }}>{mockProblem.time}min limit</div>
                </div>
            </div>
            <Card style={{ marginBottom: 10, borderLeft: `3px solid ${mockProblem.d === "Easy" ? C.lime : mockProblem.d === "Medium" ? C.amber : C.coral}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.txt, marginBottom: 8 }}>Problem</div>
                <div style={{ fontSize: 13, color: C.txt2, lineHeight: 1.7, marginBottom: 10 }}>{mockProblem.desc}</div>
                <a href={`https://leetcode.com/problems/${mockProblem.slug}/`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.amber, textDecoration: "none" }}><ExternalLink size={11} />Open on LeetCode ↗</a>
            </Card>
            <Card style={{ marginBottom: 10, background: C.violet + "08", border: `1px solid ${C.violet}25` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.violet, marginBottom: 6 }}>💡 Approach Hint</div>
                <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.6 }}>{mockProblem.hint}</div>
            </Card>
            <Card style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 8 }}>My Solution Notes</div>
                <textarea value={mockNote} onChange={e => setMockNote(e.target.value)} placeholder="Write your approach here...&#10;Time complexity: O(?)&#10;Space complexity: O(?)&#10;Edge cases to consider:&#10;Key insight:" style={{ width: "100%", background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "10px 12px", color: C.txt, fontSize: 12, fontFamily: mono, resize: "vertical", minHeight: 140, outline: "none", lineHeight: 1.6 }} />
            </Card>
            <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={() => { mockRunning ? stopMock() : setMockRunning(true); }} active={!mockRunning}>{mockRunning ? "⏸ Pause" : "▶ Resume"}</Btn>
                <Btn primary onClick={() => { stopMock(); setMockActive(false); setMockProblem(null); }}>✓ Done — Exit Mock</Btn>
            </div>
        </div>;
    };


    const renderPatterns = () => <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>Algorithm Templates</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 6px" }}>DSA Pattern Cheat Sheet</h1>
        <div style={{ fontSize: 12, color: C.txt2, marginBottom: 18 }}>Copy-paste templates for the 8 most important coding patterns. Study these until they are muscle memory.</div>
        {DSA_PATTERNS.map(p => <div key={p.id} style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${ac}`, borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.bdr}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.txt2, lineHeight: 1.5 }}><span style={{ fontWeight: 600, color: ac }}>When to use: </span>{p.when}</div>
            </div>
            <pre style={{ margin: 0, padding: "12px 14px", background: C.surf2, fontSize: 11, color: C.lime, fontFamily: "'JetBrains Mono',monospace", overflowX: "auto", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{p.code}</pre>
        </div>)}
    </div>;

    const renderGoals = () => {
        const goalsDone = weekGoals.filter(g => g.done).length;
        return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Week Planning</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 18px" }}>Weekly Goals</h1>
            <Card style={{ marginBottom: 12, background: ac + "12", border: `1px solid ${ac}30` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>Week {curWeek} Progress</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: ac, fontFamily: mono }}>{weekTasksDone}/{weekTasksTotal} tasks</span>
                </div>
                <Pbar val={weekTasksTotal > 0 ? Math.round(weekTasksDone / weekTasksTotal * 100) : 0} color={ac} h={6} />
                {weekGoals.length > 0 && <div style={{ marginTop: 10, fontSize: 12, color: C.txt2 }}>{goalsDone}/{weekGoals.length} personal goals done</div>}
            </Card>
            <Card style={{ marginBottom: 12 }}>
                <SecLabel>Add Personal Goal for Week {curWeek}</SecLabel>
                <div style={{ display: "flex", gap: 8 }}>
                    <input value={newGoal} onChange={e => setNewGoal(e.target.value)} onKeyDown={e => e.key === "Enter" && addGoal()} placeholder="e.g. Complete 5 SQL tasks, Solve 3 LeetCode problems..." style={{ flex: 1, background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "8px 12px", color: C.txt, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                    <Btn primary onClick={addGoal}><Plus size={13} />Add</Btn>
                </div>
            </Card>
            {weekGoals.map(g => <div key={g.id} style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <Cb done={g.done} onToggle={() => toggleGoal(g.id)} color={ac} />
                <span style={{ flex: 1, fontSize: 13, color: g.done ? C.txt3 : C.txt, textDecoration: g.done ? "line-through" : "none" }}>{g.text}</span>
                <div onClick={() => removeGoal(g.id)} style={{ cursor: "pointer", color: C.txt3 }}><X size={13} /></div>
            </div>)}
            {weekGoals.length === 0 && <div style={{ textAlign: "center", padding: "24px", color: C.txt3, fontSize: 12 }}>No personal goals set for this week. Add some above!</div>}
        </div>;
    };

    const renderTimeLog = () => {
        const todayLog = st.time_log[TODAY] || [];
        const todayTotal = todayLog.reduce((s, e) => s + e.time, 0);
        const allDays = Object.entries(st.time_log || {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);
        return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Time Tracking</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 18px" }}>Time Log</h1>
            <div style={{ display: "grid", gridTemplateColumns: cols("1fr", "repeat(3,1fr)", "repeat(3,1fr)"), gap: 10, marginBottom: 12 }}>
                {[{ l: "Today", v: todayTotal.toFixed(1) + "h", c: ac }, { l: "Sessions Today", v: todayLog.length, c: C.purple }, { l: "7-Day Total", v: allDays.reduce((s, [, e]) => s + (e.reduce((a, x) => a + x.time, 0)), 0).toFixed(1) + "h", c: C.amber }].map(s => <Card key={s.l} style={{ padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.txt3, marginBottom: 3 }}>{s.l}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.c, fontFamily: mono }}>{s.v}</div>
                </Card>)}
            </div>
            <Card style={{ marginBottom: 12 }}>
                <SecLabel>Log Study Session</SecLabel>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                    <input value={logTask} onChange={e => setLogTask(e.target.value)} placeholder="Task name (e.g. SQL Window Functions)" style={{ flex: 2, background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "8px 12px", color: C.txt, fontSize: 12, fontFamily: "inherit", outline: "none", minWidth: 150 }} />
                    <input value={logTime} onChange={e => setLogTime(e.target.value)} type="number" step="0.5" min="0.5" max="12" placeholder="Hours (e.g. 1.5)" style={{ flex: 1, background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "8px 12px", color: C.txt, fontSize: 12, fontFamily: "inherit", outline: "none", minWidth: 80 }} />
                    <Btn primary onClick={addTimeLog}><Plus size={13} />Log</Btn>
                </div>
            </Card>
            {todayLog.length > 0 && <Card style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 10 }}>Today — {fmtS(TODAY)}</div>
                {todayLog.map(e => <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.bdr}` }}>
                    <span style={{ fontSize: 12, color: C.txt }}>{e.task}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: ac, fontFamily: mono }}>{e.time}h</span>
                        <div onClick={() => removeTimeLog(TODAY, e.id)} style={{ cursor: "pointer", color: C.txt3 }}><X size={11} /></div>
                    </div>
                </div>)}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, paddingTop: 6, borderTop: `1px solid ${C.bdr}` }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ac }}>Total: {todayTotal.toFixed(1)}h</span>
                </div>
            </Card>}
            {allDays.slice(1).map(([date, entries]) => {
                const total = entries.reduce((s, e) => s + e.time, 0); return entries.length > 0 && <Card key={date} style={{ marginBottom: 8, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 11, fontWeight: 600, color: C.txt }}>{fmtS(date)}</span><span style={{ fontSize: 11, color: ac, fontFamily: mono }}>{total.toFixed(1)}h</span></div>
                    {entries.map(e => <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.txt2, padding: "3px 0" }}><span>{e.task}</span><span>{e.time}h</span></div>)}
                </Card>;
            })}
        </div>;
    };

    const renderRoadmap = () => <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
        <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>{isDSA ? "Coding Journey" : "Learning Path"}</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 4px" }}>{isDSA ? "DSA Roadmap" : "Data Analyst Roadmap"}</h1>
            <div style={{ fontSize: 12, color: C.txt2 }}>12 weeks · 84 tasks · 4 phases · Click phase to expand weeks</div>
        </div>
        <div style={{ display: "flex", marginBottom: 18, background: C.surf, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.bdr}` }}>
            {phStats.map((p, i) => <div key={p.id} onClick={() => setOpenPhase(openPhase === p.id ? null : p.id)} style={{ flex: 1, padding: "10px 6px", background: openPhase === p.id ? p.color + "20" : p.pct === 100 ? p.color + "15" : "transparent", borderRight: i < 3 ? `1px solid ${C.bdr}` : "none", textAlign: "center", cursor: "pointer", transition: "background .2s" }}>
                <div style={{ fontSize: 14, marginBottom: 2 }}>{p.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: p.color }}>{p.title}</div>
                <div style={{ fontSize: 8, color: C.txt3, margin: "2px 0" }}>Wk {p.weeks}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: p.color, fontFamily: mono }}>{p.pct}%</div>
                <div style={{ marginTop: 3, height: 3, background: C.surf3, borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: `${p.pct}%`, background: p.color, borderRadius: 99 }} /></div>
            </div>)}
        </div>
        {phases.map(ph => {
            const isOpen = openPhase === ph.id;
            const phTasks = tasks.filter(t => t.phase === ph.id);
            const phDone = phTasks.filter(t => completed[t.id]).length;
            const phPct = Math.round(phDone / phTasks.length * 100);
            const phWeeks = wraw.map((w, i) => ({ ...w, wkNum: i + 1 })).filter(w => w.ph === ph.id);
            return <div key={ph.id} style={{ marginBottom: 8 }}>
                <div onClick={() => setOpenPhase(isOpen ? null : ph.id)} style={{ background: C.surf, border: `1px solid ${isOpen ? ph.color + "50" : C.bdr}`, borderLeft: `3px solid ${ph.color}`, borderRadius: 10, padding: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, userSelect: "none" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: ph.dim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{ph.icon}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}><span style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>{ph.title}</span><Tag color={ph.color}>Wk {ph.weeks}</Tag>{phPct === 100 && <Tag color={C.teal}>✓ Done</Tag>}{Math.ceil(curWeek / 3) === ph.id && phPct < 100 && <Tag color={C.amber}>📍 Now</Tag>}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1 }}><Pbar val={phPct} color={ph.color} h={4} /></div><span style={{ fontSize: 10, fontWeight: 600, color: ph.color, fontFamily: mono }}>{phDone}/{phTasks.length}</span></div>
                    </div>
                    {isOpen ? <ChevronDown size={14} color={C.txt3} /> : <ChevronRight size={14} color={C.txt3} />}
                </div>
                {isOpen && <div style={{ marginTop: 6, paddingLeft: 10 }}>
                    {phWeeks.map(wk => {
                        const wkTasks = tasks.filter(t => t.week === wk.wkNum);
                        const wkDone = wkTasks.filter(t => completed[t.id]).length;
                        const wkPct = Math.round(wkDone / wkTasks.length * 100);
                        const isCur = wk.wkNum === curWeek;
                        return <div key={wk.wkNum} style={{ background: C.surf2, border: `1px solid ${isCur ? ph.color + "60" : C.bdr}`, borderLeft: `3px solid ${isCur ? ph.color : ph.color + "40"}`, borderRadius: 9, padding: 12, marginBottom: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><span style={{ fontSize: 11, fontWeight: 700, color: ph.color, fontFamily: mono }}>Week {wk.wkNum}</span><span style={{ fontSize: 11, color: C.txt }}>{wk.tp}</span>{isCur && <span style={{ fontSize: 9, fontWeight: 600, color: C.amber, background: C.amber + "18", border: `1px solid ${C.amber}35`, padding: "1px 6px", borderRadius: 99 }}>📍 You are here</span>}</div>
                                    {wk.obj && <div style={{ fontSize: 10, color: C.txt2, lineHeight: 1.5, maxWidth: 400 }}>{wk.obj}</div>}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                    <span style={{ fontSize: 10, color: ph.color, fontFamily: mono }}>{wkDone}/{wkTasks.length}</span>
                                    <button onClick={e => { e.stopPropagation(); goToWeek(wk.wkNum); }} style={{ background: ph.color + "18", border: `1px solid ${ph.color}40`, borderRadius: 6, padding: "3px 8px", fontSize: 10, color: ph.color, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>View →</button>
                                </div>
                            </div>
                            <Pbar val={wkPct} color={ph.color} h={3} />
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 8 }}>
                                {wkTasks.map(t => {
                                    const done = !!completed[t.id]; return <div key={t.id} onClick={e => { e.stopPropagation(); toggle(t.id); }} title={t.ds.substring(0, 100)} style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "2px 7px", borderRadius: 5, background: done ? ph.color + "22" : C.surf3, border: `1px solid ${done ? ph.color + "44" : C.bdr}`, cursor: "pointer", maxWidth: 170 }}>
                                        {done ? <CheckCircle2 size={8} color={ph.color} /> : <Clock size={8} color={C.txt3} />}
                                        <span style={{ fontSize: 9, color: done ? ph.color : C.txt2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.ti}</span>
                                        {isDSA && t.df && <span style={{ fontSize: 8, flexShrink: 0, color: t.df.includes("Hard") ? C.coral : t.df.includes("Medium") ? C.amber : C.lime }}>{t.df.includes("Hard") ? "H" : t.df.includes("Medium") ? "M" : "E"}</span>}
                                    </div>;
                                })}
                            </div>
                        </div>;
                    })}
                </div>}
            </div>;
        })}
    </div>;

    const renderTasks = () => {
        const wkNums = [...new Set(tasks.filter(t => filterPh === 0 || t.phase === filterPh).map(t => t.week))];
        const isFiltered = filterWk > 0 || filterPh > 0 || search.trim() || (isDSA && diffFilt !== "All");
        return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div><div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>{isDSA ? "Problems" : "Checklist"}</div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 3px" }}>{isDSA ? "All Problems" : "All Tasks"}</h1>
                    <div style={{ fontSize: 12, color: C.txt2 }}>{doneCnt}/84 done · {84 - doneCnt} remaining</div>
                </div>
                {isFiltered && <Btn small warn onClick={() => { setFilterPh(0); setFilterWk(0); setSearch(""); setDiffFilt("All"); }}>✕ Clear</Btn>}
            </div>
            <Card style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "7px 10px", marginBottom: 10 }}>
                    <Search size={13} color={C.txt3} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder={isDSA ? "Search problems..." : "Search tasks..."} style={{ flex: 1, background: "transparent", border: "none", color: C.txt, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                    {search && <div onClick={() => setSearch("")} style={{ cursor: "pointer", color: C.txt3 }}><X size={12} /></div>}
                </div>
                <SecLabel>Phase</SecLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: filterPh > 0 ? 10 : 0 }}>
                    {[{ id: 0, label: "All", color: C.txt2 }, ...phases.map(p => ({ id: p.id, label: p.icon + " " + p.title, color: p.color }))].map(f => <div key={f.id} onClick={() => { setFilterPh(f.id); setFilterWk(0); }} style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500, cursor: "pointer", background: filterPh === f.id ? f.color + "22" : C.surf2, border: `1px solid ${filterPh === f.id ? f.color : C.bdr}`, color: filterPh === f.id ? f.color : C.txt2 }}>{f.label}</div>)}
                </div>
                {filterPh > 0 && <><SecLabel>Week</SecLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: isDSA ? 10 : 0 }}>
                        <div onClick={() => setFilterWk(0)} style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer", background: filterWk === 0 ? ac + "22" : C.surf2, border: `1px solid ${filterWk === 0 ? ac : C.bdr}`, color: filterWk === 0 ? ac : C.txt2 }}>All</div>
                        {wkNums.map(wn => <div key={wn} onClick={() => setFilterWk(wn)} style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer", background: filterWk === wn ? ac + "22" : C.surf2, border: `1px solid ${filterWk === wn ? ac : C.bdr}`, color: filterWk === wn ? ac : C.txt2 }}>Week {wn}</div>)}
                    </div></>}
                {isDSA && <><SecLabel>Difficulty</SecLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {["All", "Easy", "Medium", "Hard", "Learn", "Review"].map(d => <div key={d} onClick={() => setDiffFilt(d)} style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer", background: diffFilt === d ? ac + "22" : C.surf2, border: `1px solid ${diffFilt === d ? ac : C.bdr}`, color: diffFilt === d ? ac : C.txt2 }}>{d === "Easy" ? "🟢 " + d : d === "Medium" ? "🟡 " + d : d === "Hard" ? "🔴 " + d : d}</div>)}
                    </div></>}
            </Card>
            {isFiltered && <div style={{ fontSize: 11, color: C.txt3, marginBottom: 8 }}>{filteredTasks.length} results{filterWk > 0 ? ` from Week ${filterWk}` : ""}</div>}
            {Object.entries(byWeek).map(([wk, group]) => {
                const wkDone = group.tasks.filter(t => completed[t.id]).length;
                return <div key={wk} style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${group.color}`, borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.bdr}` }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                            <div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: group.obj ? 3 : 0 }}><span style={{ fontSize: 10, fontWeight: 700, color: group.color, fontFamily: mono }}>WK {wk}</span><span style={{ fontSize: 12, fontWeight: 600, color: C.txt }}>{group.topic}</span></div>
                                {group.obj && <div style={{ fontSize: 10, color: C.txt2, maxWidth: 380 }}>{group.obj}</div>}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}><div style={{ width: 40 }}><Pbar val={Math.round(wkDone / group.tasks.length * 100)} color={group.color} h={3} /></div><span style={{ fontSize: 10, fontWeight: 600, color: group.color, fontFamily: mono }}>{wkDone}/{group.tasks.length}</span></div>
                        </div>
                    </div>
                    {group.tasks.map(task => {
                        const done = !!completed[task.id], isExp = expandTask === task.id;
                        return <div key={task.id} style={{ borderBottom: `1px solid ${C.bdr}` }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", cursor: "pointer" }} onClick={() => setExpandTask(isExp ? null : task.id)}>
                                <Cb done={done} onToggle={() => toggle(task.id)} color={task.color} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: 500, color: done ? C.txt3 : C.txt, textDecoration: done ? "line-through" : "none", lineHeight: 1.4 }}>Day {task.day} — {task.ti}</span>
                                        {isExp ? <ChevronDown size={12} color={C.txt3} style={{ flexShrink: 0, marginTop: 2 }} /> : <ChevronRight size={12} color={C.txt3} style={{ flexShrink: 0, marginTop: 2 }} />}
                                    </div>
                                    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                                        <Tag><Clock size={8} /> {task.tm}</Tag>
                                        {isDSA && task.df && <DiffBadge df={task.df} />}
                                        {isDSA && task.tp !== "problem" && <TypeBadge tp={task.tp} />}
                                        {!isExp && <span style={{ fontSize: 10, color: C.txt3 }}>{task.ds.substring(0, 60)}...</span>}
                                    </div>
                                </div>
                            </div>
                            {isExp && <div style={{ padding: "10px 14px 12px 46px", background: task.color + "06", borderTop: `1px solid ${C.bdr}` }}>
                                <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.7, marginBottom: 10 }}>{task.ds}</div>
                                {isDSA && task.hint && <div style={{ fontSize: 11, color: C.violet, background: "rgba(192,132,252,.08)", border: "1px solid rgba(192,132,252,.2)", borderRadius: 8, padding: "8px 10px", marginBottom: 8, lineHeight: 1.6 }}><span style={{ fontWeight: 600 }}>💡 </span>{task.hint}</div>}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: isDSA ? 8 : 0 }}>
                                    <Tag color={task.color}>Day {task.day}</Tag>
                                    {isDSA && task.df && <DiffBadge df={task.df} />}
                                    {isDSA && task.tp !== "problem" && <TypeBadge tp={task.tp} />}
                                    {task.rs && task.rs.map(r => <a key={r} href={`https://${r}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "2px 7px", borderRadius: 99, fontSize: 10, fontWeight: 500, color: C.purple, background: C.purple + "15", border: `1px solid ${C.purple}30`, textDecoration: "none" }}><ExternalLink size={8} />{r}</a>)}
                                    {isDSA && task.lc && task.lc.map(slug => <a key={slug} href={`https://leetcode.com/problems/${slug}/`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "3px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600, color: C.amber, background: C.amber + "15", border: `1px solid ${C.amber}35`, textDecoration: "none" }}><ExternalLink size={8} />LC ↗</a>)}
                                </div>
                                {isDSA && <textarea key={`note-${task.id}`} defaultValue={st.dsa_notes[task.id] || ""} onBlur={e => saveNote(task.id, e.target.value)} placeholder="Solution approach, complexity, key insight..." style={{ width: "100%", background: C.surf3, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "8px 10px", color: C.txt, fontSize: 11, fontFamily: mono, resize: "vertical", minHeight: 60, outline: "none", lineHeight: 1.5 }} />}
                            </div>}
                        </div>;
                    })}
                </div>;
            })}
            {Object.keys(byWeek).length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: C.txt3 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🔍</div>
                <div style={{ fontSize: 13 }}>No results. <span onClick={() => { setFilterPh(0); setFilterWk(0); setSearch(""); setDiffFilt("All"); }} style={{ color: ac, cursor: "pointer" }}>Clear filters</span></div>
            </div>}
        </div>;
    };

    const renderSchedule = () => {
        const dt = new Date(selDate + "T00:00:00"), d = dt.getDay(), diff = d === 0 ? -6 : 1 - d;
        const mon = new Date(dt); mon.setDate(dt.getDate() + diff);
        const weekDates = Array.from({ length: 7 }, (_, i) => addD(mon.toISOString().split("T")[0], i));
        const totalHrs = selDayTasks.reduce((a, t) => a + parseInt(t.tm || 0), 0);
        const slotC = { Morning: C.amber, Afternoon: C.purple, Evening: ac };
        return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>Daily Planner</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 16px" }}>Schedule</h1>
            <Card style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 4 }}>
                    {weekDates.map(d => {
                        const isTd = d === TODAY, isSel = d === selDate, dN = diffD(startDate, d) + 1;
                        const dT = tasks.filter(t => t.day === dN), dD = dT.filter(t => completed[t.id]).length;
                        const dot = dT.length > 0 && dD === dT.length ? ac : dD > 0 ? C.amber : C.surf3;
                        return <div key={d} onClick={() => setSelDate(d)} style={{ flex: 1, textAlign: "center", padding: "7px 3px", borderRadius: 9, cursor: "pointer", background: isSel ? ac + "22" : isTd ? C.surf2 : "transparent", border: `1px solid ${isSel ? ac : isTd ? C.bdr2 : "transparent"}` }}>
                            <div style={{ fontSize: 8, color: isSel ? ac : C.txt3, marginBottom: 3, fontWeight: 600 }}>{fmtWD(d).substring(0, 3)}</div>
                            <div style={{ fontSize: 13, fontWeight: isSel || isTd ? 700 : 400, color: isSel ? ac : isTd ? C.txt : C.txt2 }}>{new Date(d + "T00:00:00").getDate()}</div>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: dot, margin: "3px auto 0" }} />
                            {dT.length > 0 && <div style={{ fontSize: 8, color: C.txt3 }}>{dD}/{dT.length}</div>}
                        </div>;
                    })}
                </div>
            </Card>
            <Card style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>{fmtF(selDate)}</div><div style={{ fontSize: 11, color: selDayNum ? ac : C.txt3, marginTop: 2 }}>{selDayNum ? `Day ${selDayNum} · Week ${Math.ceil(selDayNum / 7)}` : "Outside 84-day program"}</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: C.txt3 }}>Planned</div><div style={{ fontSize: 16, fontWeight: 700, color: C.amber, fontFamily: mono }}>{totalHrs}h</div></div>
                </div>
            </Card>
            {selDayTasks.length > 0 && <Card style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><Target size={13} color={ac} /> Assigned Tasks</div>
                {selDayTasks.map(task => <div key={task.id} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.bdr}` }}>
                    <Cb done={!!completed[task.id]} onToggle={() => toggle(task.id)} color={task.color} />
                    <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: completed[task.id] ? C.txt3 : C.txt, textDecoration: completed[task.id] ? "line-through" : "none" }}>{task.ti}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 3 }}><Tag><Clock size={8} />{task.tm}</Tag>{isDSA && task.df && <DiffBadge df={task.df} />}</div></div>
                </div>)}
            </Card>}
            <Card>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><Calendar size={13} color={C.purple} /> My Study Plan</div>
                {["Morning", "Afternoon", "Evening"].map(slot => {
                    const blocks = dateBlocks.filter(b => b.slot === slot); if (!blocks.length) return null;
                    return <div key={slot} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: slotC[slot], textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 5 }}>{slot}</div>
                        {blocks.map(b => <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", background: C.surf2, border: `1px solid ${C.bdr}`, borderRadius: 7, marginBottom: 4 }}>
                            <Cb done={b.done} onToggle={() => toggleBlock(b.id)} color={slotC[slot]} />
                            <span style={{ flex: 1, fontSize: 11, color: b.done ? C.txt3 : C.txt, textDecoration: b.done ? "line-through" : "none" }}>{b.title}</span>
                            <span style={{ fontSize: 9, color: slotC[slot], padding: "1px 5px", borderRadius: 99, background: slotC[slot] + "20" }}>{slot}</span>
                            <div onClick={() => removeBlock(b.id)} style={{ cursor: "pointer", color: C.txt3 }}><X size={11} /></div>
                        </div>)}
                    </div>;
                })}
                {dateBlocks.length === 0 && <div style={{ fontSize: 11, color: C.txt3, textAlign: "center", padding: "8px 0 12px" }}>No sessions yet — add below 👇</div>}
                <div style={{ display: "flex", gap: 7, marginTop: 6 }}>
                    <input value={newBlock} onChange={e => setNewBlock(e.target.value)} onKeyDown={e => e.key === "Enter" && addBlock()} placeholder="Add a study session..." style={{ flex: 1, background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "7px 10px", color: C.txt, fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                    <select value={newSlot} onChange={e => setNewSlot(e.target.value)} style={{ background: C.surf2, border: `1px solid ${C.bdr2}`, borderRadius: 8, padding: "7px 8px", color: C.txt2, fontSize: 10, fontFamily: "inherit", cursor: "pointer" }}>
                        {["Morning", "Afternoon", "Evening"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Btn primary onClick={addBlock}><Plus size={12} /></Btn>
                </div>
            </Card>
        </div>;
    };

    const renderProgress = () => {
        const r = 50, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ;
        const elapsed = diffD(startDate, TODAY), avg = elapsed > 0 ? doneCnt / elapsed : 0;
        const dLeft = avg > 0 ? Math.ceil((84 - doneCnt) / avg) : "—";
        const recentDays = Array.from({ length: 56 }, (_, i) => { const d = addD(TODAY, -(55 - i)), dn = diffD(startDate, d) + 1; const dt = tasks.filter(t => t.day === dn), dd = dt.filter(t => completed[t.id]).length; return { date: d, tasks: dt.length, done: dd }; });
        return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>Analytics</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 16px" }}>Your Progress</h1>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 145, padding: 16 }}>
                    <svg width={110} height={110} viewBox="0 0 110 110">
                        <circle cx={55} cy={55} r={r} fill="none" stroke={C.surf3} strokeWidth={8} />
                        <circle cx={55} cy={55} r={r} fill="none" stroke={ac} strokeWidth={8} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 55 55)" style={{ transition: "stroke-dashoffset .8s ease" }} />
                        <text x={55} y={50} textAnchor="middle" fill={ac} fontSize={18} fontWeight={700} fontFamily={mono}>{pct}%</text>
                        <text x={55} y={65} textAnchor="middle" fill={C.txt3} fontSize={8}>complete</text>
                    </svg>
                    <div style={{ fontSize: 10, color: C.txt2 }}>{doneCnt}/84 tasks</div>
                </Card>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    {[{ l: "Streak", v: `${streak}d`, c: C.amber, i: "🔥" }, { l: "Day", v: `${dayNum}/84`, c: C.purple, i: "📅" }, { l: "Est. left", v: typeof dLeft === "number" ? `${dLeft}d` : "On track", c: ac, i: "🎯" }, { l: "Avg/day", v: avg > 0 ? avg.toFixed(1) : "—", c: C.coral, i: "⚡" }, { l: "Points", v: totalPts, c: C.purple, i: "🏆" }].map(s => <div key={s.l} style={{ background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 9, padding: "7px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 12 }}>{s.i}</span><span style={{ fontSize: 10, color: C.txt2 }}>{s.l}</span></div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: s.c, fontFamily: mono }}>{s.v}</span>
                    </div>)}
                </div>
            </div>
            {isDSA && <Card style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 10 }}>Difficulty Breakdown</div>
                <div style={{ display: "grid", gridTemplateColumns: cols("1fr", "repeat(2,1fr)", "repeat(3,1fr)"), gap: 8 }}>
                    {[{ l: "🟢 Easy", c: C.lime, k: "Easy" }, { l: "🟡 Medium", c: C.amber, k: "Medium" }, { l: "🔴 Hard", c: C.coral, k: "Hard" }].map(d => { const dt = tasks.filter(t => t.df && t.df.includes(d.k)); const dn = dt.filter(t => completed[t.id]).length; return <div key={d.k} style={{ background: C.surf2, border: `1px solid ${d.c}25`, borderRadius: 9, padding: "10px 8px", textAlign: "center" }}><div style={{ fontSize: 10, color: d.c, marginBottom: 3 }}>{d.l}</div><div style={{ fontSize: 18, fontWeight: 700, color: d.c, fontFamily: mono, marginBottom: 4 }}>{dn}/{dt.length}</div><Pbar val={dt.length > 0 ? Math.round(dn / dt.length * 100) : 0} color={d.c} h={3} /></div>; })}
                </div>
            </Card>}
            <Card style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 10 }}>Phase Breakdown</div>
                <div style={{ display: "grid", gridTemplateColumns: cols("1fr", "1fr 1fr", "1fr 1fr"), gap: 8 }}>
                    {phStats.map(p => <div key={p.id} style={{ background: C.surf2, border: `1px solid ${C.bdr}`, borderRadius: 9, padding: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><div style={{ display: "flex", alignItems: "center", gap: 5 }}><span>{p.icon}</span><span style={{ fontSize: 10, fontWeight: 600, color: p.color }}>{p.title}</span></div><span style={{ fontSize: 10, fontWeight: 700, color: p.color, fontFamily: mono }}>{p.pct}%</span></div>
                        <Pbar val={p.pct} color={p.color} h={4} />
                        <div style={{ fontSize: 9, color: C.txt3, marginTop: 4 }}>{p.done}/{p.total} · Wk {p.weeks}</div>
                    </div>)}
                </div>
            </Card>
            <Card>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 4 }}>8-Week Activity Heatmap</div>
                <div style={{ fontSize: 10, color: C.txt3, marginBottom: 10 }}>Hover for details · Green = tasks done</div>
                <div style={{ overflowX: "auto", width: "100%", paddingBottom: 6 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(56,1fr)", gap: 2, minWidth: 460 }}>
                        {recentDays.map((d, i) => { const intensity = d.tasks === 0 ? 0 : d.done / d.tasks; const bg = intensity === 0 ? C.surf3 : intensity === 1 ? ac : ac + Math.round(intensity * 160).toString(16).padStart(2, "0"); return <div key={i} title={`${fmtS(d.date)}: ${d.done}/${d.tasks}`} style={{ aspectRatio: "1", borderRadius: 2, background: bg }} />; })}
                    </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: C.txt3 }}><span>8 weeks ago</span><span>Today</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                    <span style={{ fontSize: 9, color: C.txt3 }}>Less</span>
                    {[0, .25, .5, .75, 1].map(v => <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: v === 0 ? C.surf3 : ac + Math.round(v * 255).toString(16).padStart(2, "0") }} />)}
                    <span style={{ fontSize: 9, color: C.txt3 }}>More</span>
                </div>
            </Card>
        </div>;
    };

    const renderResources = () => {
        const res = isDSA ? [
            { cat: "Practice Platforms", color: C.lime, items: [{ name: "LeetCode", url: "leetcode.com", desc: "Primary platform — solve 1-2 daily" }, { name: "NeetCode 150", url: "neetcode.io/practice", desc: "Curated 150 + free video solutions" }, { name: "Striver A2Z Sheet", url: "takeuforward.org/strivers-a2z-dsa-course", desc: "Most popular DS&A roadmap in India" }] },
            { cat: "Learning", color: C.blue, items: [{ name: "Abdul Bari", url: "youtube.com/@abdul_bari", desc: "Best DS&A YouTube for Indian learners" }, { name: "NeetCode YouTube", url: "youtube.com/@NeetCode", desc: "Clean explanations for every LC problem" }, { name: "Back To Back SWE", url: "youtube.com/@BackToBackSWE", desc: "Deep visual explanations of hard topics" }] },
            { cat: "Interview Prep", color: C.violet, items: [{ name: "Blind 75", url: "leetcode.com/discuss/general-discussion/460599", desc: "Top 75 problems by pattern" }, { name: "Pramp", url: "pramp.com", desc: "Free peer mock interviews — very good" }, { name: "Tech Interview Handbook", url: "techinterviewhandbook.org", desc: "Complete guide from resume to offer" }] },
        ] : [
            { cat: "SQL", color: C.teal, items: [{ name: "Mode SQL Tutorial", url: "mode.com/sql-tutorial", desc: "Best free structured SQL course" }, { name: "HackerRank SQL", url: "hackerrank.com/domains/sql", desc: "Ranked challenges easy to hard" }, { name: "StrataScratch", url: "stratascratch.com", desc: "Real SQL questions from top companies" }, { name: "Supabase", url: "supabase.com", desc: "Free cloud PostgreSQL — use with DBeaver" }] },
            { cat: "Python & BI", color: C.purple, items: [{ name: "Anaconda", url: "anaconda.com", desc: "Best Python data science setup" }, { name: "Kaggle Datasets", url: "kaggle.com/datasets", desc: "Start with Zomato and IPL" }, { name: "Power BI Desktop", url: "powerbi.microsoft.com", desc: "Free — most in-demand BI tool in India" }, { name: "Plotly", url: "plotly.com/python", desc: "Interactive charts for your portfolio" }] },
            { cat: "Jobs", color: C.amber, items: [{ name: "Naukri", url: "naukri.com", desc: "#1 India job portal for DA roles" }, { name: "LinkedIn Jobs", url: "linkedin.com/jobs", desc: "Easy Apply + recruiter DMs" }, { name: "Wellfound", url: "wellfound.com", desc: "Startups that value skills over pedigree" }, { name: "Vercel", url: "vercel.com", desc: "Deploy React dashboards free" }] },
        ];
        return <div style={{ padding: "20px 18px 48px", maxWidth: 680 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: ac, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>Curated Links</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.txt, margin: "0 0 16px" }}>Resources</h1>
            {res.map(cat => <Card key={cat.cat} style={{ borderLeft: `3px solid ${cat.color}`, marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: cat.color, marginBottom: 10 }}>{cat.cat}</div>
                {cat.items.map(item => <a key={item.url} href={`https://${item.url}`} target="_blank" rel="noreferrer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", background: C.surf2, borderRadius: 8, border: `1px solid ${C.bdr}`, textDecoration: "none", marginBottom: 6 }}>
                    <div><div style={{ fontSize: 12, fontWeight: 500, color: C.txt }}>{item.name}</div><div style={{ fontSize: 10, color: C.txt2, marginTop: 1 }}>{item.desc}</div></div>
                    <ExternalLink size={12} color={cat.color} style={{ flexShrink: 0, marginLeft: 8 }} />
                </a>)}
            </Card>)}
            <div style={{ background: `linear-gradient(135deg,${ac}12,${C.purple}12)`, border: `1px solid ${ac}30`, borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{isDSA ? "⚡" : "🎯"}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 6 }}>{isDSA ? "1 problem/day × 84 days = interview ready" : "You are building something real, Raveend"}</div>
                <div style={{ fontSize: 11, color: C.txt2, lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>{isDSA ? "Consistency beats intensity. Your Python background already helps with logic." : "Flutter + Python + React is a genuine differentiator. Now channel that into data analytics."}</div>
            </div>
        </div>;
    };

    const MobileHeader = () => (
        <div style={{ 
            height: 52, 
            background: C.surf, 
            borderBottom: `1px solid ${C.bdr}`, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            padding: "0 16px",
            position: "sticky",
            top: 0,
            zIndex: 900
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div onClick={() => setDrawerOpen(true)} style={{ cursor: "pointer", color: ac, display: "flex", padding: 4 }}>
                    <Menu size={20} />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.txt, fontFamily: mono }}>DevPath ⚡</div>
                </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: ac }}>{isDSA ? "DSA Track 💻" : "Data Analyst 📊"}</div>
        </div>
    );

    const pageMap = {
        dashboard: renderDashboard, roadmap: renderRoadmap, tasks: renderTasks, schedule: renderSchedule, progress: renderProgress, resources: renderResources,
        dsa_dash: renderDashboard, dsa_road: renderRoadmap, dsa_probs: renderTasks, dsa_sched: renderSchedule, dsa_prog: renderProgress, dsa_res: renderResources,
        flashcards: renderFlashcards, interview_qa: renderInterviewQA, patterns: renderPatterns, pomodoro: renderPomodoro, journal: renderJournal, achievements: renderAchievements, bookmarks: renderBookmarks, mock_interview: renderMockInterview, goals: renderGoals, time_log: renderTimeLog,
    };

    return (
        <div style={{ display: "flex", flexDirection: isPhone ? "column" : "row", background: C.bg, minHeight: "100vh", fontFamily: font, color: C.txt }}>
            {isPhone && <MobileHeader />}
            {isPhone && drawerOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,.6)",
                        backdropFilter: "blur(2px)",
                        zIndex: 998
                    }}
                    onClick={() => setDrawerOpen(false)}
                />
            )}
            <Sidebar />
            <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", alignItems: isLargeTablet ? "center" : "stretch" }}>
                <div style={{ width: "100%", maxWidth: contentMaxW }}>
                    {(pageMap[page] || renderDashboard)()}
                </div>
            </main>
            {showSettings && <SettingsModal />}
        </div>
    );
}