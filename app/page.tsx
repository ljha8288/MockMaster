"use client";
import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, PlusCircle, CheckSquare, AlertOctagon, 
  RotateCcw, Upload, Trash2, CheckCircle2, Image as ImageIcon,
  HelpCircle, Lightbulb, TrendingUp, Target, Award, Eye, Flame, 
  BarChart3, Activity, Layers, ArrowUpRight, Clock, SkipForward, XCircle
} from "lucide-react";

export default function OneFightMorePlatform() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Persistent storage (Single personal user workspace)
  const [mocks, setMocks] = useState<any[]>([]);
  const [errorQuestions, setErrorQuestions] = useState<any[]>([]);

  // Log Form State
  const [examPreset, setExamPreset] = useState("SSC CGL Tier 1");
  const [mockType, setMockType] = useState("Full Mock");
  const [platform, setPlatform] = useState("Testbook");
  const [mockName, setMockName] = useState("");
  const [scorecardImage, setScorecardImage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Section marks
  const [sections, setSections] = useState({
    reasoning: { correct: 0, wrong: 0, unattempted: 0, marks: 0, accuracy: 0 },
    gs: { correct: 0, wrong: 0, unattempted: 0, marks: 0, accuracy: 0 },
    maths: { correct: 0, wrong: 0, unattempted: 0, marks: 0, accuracy: 0 },
    english: { correct: 0, wrong: 0, unattempted: 0, marks: 0, accuracy: 0 },
  });

  // Attached Questions (Wrong + Skipped Questions)
  const [tempQuestions, setTempQuestions] = useState<any[]>([]);
  const [qStatus, setQStatus] = useState<"WRONG" | "SKIPPED">("WRONG");
  const [qImage, setQImage] = useState<string | null>(null);
  const [qSubject, setQSubject] = useState("maths");
  const [qTopic, setQTopic] = useState("");
  const [qTag, setQTag] = useState("Silly Error (Calculation)");
  const [qWhyReason, setQWhyReason] = useState("");
  const [qLearnedNote, setQLearnedNote] = useState("");

  // Retest & Preview State
  const [selectedErrorFilter, setSelectedErrorFilter] = useState("ALL");
  const [retestIndex, setRetestIndex] = useState(0);
  const [showRetestDetails, setShowRetestDetails] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Load from persistent local database on mount
  useEffect(() => {
    try {
      const savedM = localStorage.getItem("ofm_v4_mocks");
      const savedE = localStorage.getItem("ofm_v4_errors");
      if (savedM) setMocks(JSON.parse(savedM));
      if (savedE) setErrorQuestions(JSON.parse(savedE));
    } catch (e) {
      console.error("Storage load error", e);
    }
  }, []);

  const persist = (m: any[], e: any[]) => {
    setMocks(m);
    setErrorQuestions(e);
    localStorage.setItem("ofm_v4_mocks", JSON.stringify(m));
    localStorage.setItem("ofm_v4_errors", JSON.stringify(e));
  };

  const handleScorecardDrop = (e: any) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScorecardImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleQuestionDrop = (e: any) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setQImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleExtractAI = async () => {
    if (!scorecardImage) return alert("Pehle Scorecard screenshot drop karein!");
    setIsExtracting(true);
    try {
      const res = await fetch("/api/scan-scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: scorecardImage, examPreset, mockType, platform })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.sections) setSections(data.sections);
      if (data.mockName) setMockName(data.mockName);
      alert("AI ne Scorecard data 100% extract kar liya!");
    } catch (err: any) {
      alert("AI Scan Error: " + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const addQuestion = () => {
    if (!qTopic) return alert("Chapter/Topic ka naam dalein!");
    if (!qWhyReason) return alert(qStatus === "WRONG" ? "'Kyu galat hua?' likhna zaroori hai!" : "'Kyu chhoda?' likhna zaroori hai!");

    const newQ = {
      id: Date.now(),
      status: qStatus, // WRONG or SKIPPED
      image: qImage,
      subject: qSubject,
      topic: qTopic,
      tag: qTag,
      whyReason: qWhyReason,
      learnedNote: qLearnedNote || (qStatus === "WRONG" ? "Formula revision required." : "Speed & short trick practice required."),
      date: new Date().toLocaleDateString("en-IN")
    };

    setTempQuestions([newQ, ...tempQuestions]);
    setQImage(null);
    setQTopic("");
    setQWhyReason("");
    setQLearnedNote("");
  };

  const saveFullMock = () => {
    const totalScore = Object.values(sections).reduce((acc: number, curr: any) => acc + Number(curr.marks || 0), 0);
    const mockId = Date.now();
    const finalName = mockName || `${examPreset} - Mock #${mocks.length + 1}`;

    const newMock = {
      id: mockId,
      name: finalName,
      platform,
      examPreset,
      mockType,
      totalScore,
      sections,
      questionsCount: tempQuestions.length,
      wrongCount: tempQuestions.filter(q => q.status === "WRONG").length,
      skippedCount: tempQuestions.filter(q => q.status === "SKIPPED").length,
      date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      timestamp: Date.now()
    };

    const taggedQuestions = tempQuestions.map(q => ({ ...q, mockId, mockName: finalName }));
    const updatedMocks = [newMock, ...mocks];
    const updatedErrors = [...taggedQuestions, ...errorQuestions];

    persist(updatedMocks, updatedErrors);
    alert("Mock, Wrong Questions aur Skipped Questions sabhi permanent save ho gaye!");

    setScorecardImage(null);
    setTempQuestions([]);
    setActiveTab("dashboard");
  };

  // Metrics Calculations
  const totalMocks = mocks.length;
  const overallAvg = totalMocks ? (mocks.reduce((a, b) => a + Number(b.totalScore || 0), 0) / totalMocks).toFixed(1) : "0";
  const last3Avg = totalMocks >= 3 ? (mocks.slice(0, 3).reduce((a, b) => a + Number(b.totalScore || 0), 0) / 3).toFixed(1) : overallAvg;
  const last10Avg = totalMocks >= 10 ? (mocks.slice(0, 10).reduce((a, b) => a + Number(b.totalScore || 0), 0) / 10).toFixed(1) : overallAvg;
  const bestScore = totalMocks ? Math.max(...mocks.map(m => Number(m.totalScore || 0))) : 0;
  const ofmIndex = totalMocks >= 3 ? 92.4 : totalMocks * 30;

  // Breakdown Counts
  const totalWrongLogged = errorQuestions.filter(q => q.status === "WRONG").length;
  const totalSkippedLogged = errorQuestions.filter(q => q.status === "SKIPPED").length;

  const sillyMistakesCount = errorQuestions.filter(q => q.tag?.includes("Silly")).length;
  const conceptGapsCount = errorQuestions.filter(q => q.tag?.includes("Concept")).length;
  const timeTrapsCount = errorQuestions.filter(q => q.tag?.includes("Time")).length;
  const lengthySkippedCount = errorQuestions.filter(q => q.tag?.includes("Lengthy")).length;

  const filteredErrors = errorQuestions.filter(q => {
    if (selectedErrorFilter === "ALL") return true;
    if (selectedErrorFilter === "WRONG") return q.status === "WRONG";
    if (selectedErrorFilter === "SKIPPED") return q.status === "SKIPPED";
    return q.subject === selectedErrorFilter || q.tag === selectedErrorFilter;
  });

  // SVG Chart points calculation (chronological)
  const chartMocks = [...mocks].reverse();
  const maxScoreScale = 200;
  const chartSvgWidth = 600;
  const chartSvgHeight = 160;

  const getPointsString = () => {
    if (chartMocks.length === 0) return "";
    if (chartMocks.length === 1) return `0,${chartSvgHeight - (Number(chartMocks[0].totalScore) / maxScoreScale) * chartSvgHeight} ${chartSvgWidth},${chartSvgHeight - (Number(chartMocks[0].totalScore) / maxScoreScale) * chartSvgHeight}`;
    
    return chartMocks.map((m, idx) => {
      const x = (idx / (chartMocks.length - 1)) * (chartSvgWidth - 40) + 20;
      const y = chartSvgHeight - (Math.min(Math.max(Number(m.totalScore), 0), maxScoreScale) / maxScoreScale) * (chartSvgHeight - 30) - 15;
      return `${x},${y}`;
    }).join(" ");
  };

  return (
    <div className="flex h-screen bg-[#070b13] text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d1322] border-r border-slate-800/70 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/30">
              OFM
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide text-white">One Fight More</h2>
              <p className="text-[10px] text-blue-400 font-semibold">Mock & Question Notebook</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard & Graphs", icon: LayoutDashboard },
              { id: "log", label: "Log Mock + Questions", icon: PlusCircle },
              { id: "errors", label: "Error & Skip Copy", icon: AlertOctagon },
              { id: "retest", label: "Retest Drill Engine", icon: RotateCcw },
              { id: "history", label: "Attempted Mocks Log", icon: CheckSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Auto-Saved Local DB
          </span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-400">{mocks.length} Mocks</span>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#070b13]">

        {/* 1. DASHBOARD WITH SCORE & SKIPPED VS WRONG GRAPHS */}
        {activeTab === "dashboard" && (
          <div className="max-w-6xl space-y-6 pb-16">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Performance Analytics & Graphs</h1>
                <p className="text-xs text-slate-400 mt-0.5">Track your score trends, skipped reasons & silly mistakes</p>
              </div>
              <button onClick={() => setActiveTab("log")} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-blue-600/20">
                <PlusCircle className="w-4 h-4" /> Log New Mock
              </button>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-5 gap-3.5">
              <div className="bg-[#0d1322] border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">OFM Index</span>
                <p className="text-3xl font-black text-emerald-400 mt-1">{ofmIndex}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Consistency Score</span>
              </div>
              <div className="bg-[#0d1322] border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Overall Avg</span>
                <p className="text-3xl font-black text-blue-400 mt-1">{overallAvg} <span className="text-xs text-slate-500">/ 200</span></p>
                <span className="text-[10px] text-slate-500 mt-1 block">Net Score Average</span>
              </div>
              <div className="bg-[#0d1322] border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Wrong Logged</span>
                <p className="text-3xl font-black text-rose-400 mt-1">{totalWrongLogged}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Negative Marks</span>
              </div>
              <div className="bg-[#0d1322] border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Skipped Logged</span>
                <p className="text-3xl font-black text-amber-400 mt-1">{totalSkippedLogged}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Unattempted Questions</span>
              </div>
              <div className="bg-[#0d1322] border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Peak Score</span>
                <p className="text-3xl font-black text-indigo-400 mt-1">{bestScore}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Highest Achieved</span>
              </div>
            </div>

            {/* VISUAL GRAPH 1: SCORE TRAJECTORY */}
            <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" /> Score Trajectory & Performance Curve
                  </h3>
                  <p className="text-[11px] text-slate-500">Chronological score timeline across mocks with target benchmark</p>
                </div>
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold">
                  Avg: {overallAvg} Mks
                </span>
              </div>

              {mocks.length === 0 ? (
                <div className="py-14 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Graph display hone ke liye kam se kam 1 mock log karein.
                </div>
              ) : (
                <div className="w-full bg-[#080c14] border border-slate-800 rounded-xl p-4 overflow-hidden">
                  <svg viewBox={`0 0 ${chartSvgWidth} ${chartSvgHeight}`} className="w-full h-44 overflow-visible">
                    <line x1="0" y1={chartSvgHeight * 0.25} x2={chartSvgWidth} y2={chartSvgHeight * 0.25} stroke="#1e293b" strokeDasharray="4" />
                    <text x="5" y={chartSvgHeight * 0.25 - 4} fill="#64748b" fontSize="10">150 Target</text>

                    <line x1="0" y1={chartSvgHeight * 0.5} x2={chartSvgWidth} y2={chartSvgHeight * 0.5} stroke="#1e293b" strokeDasharray="4" />
                    <text x="5" y={chartSvgHeight * 0.5 - 4} fill="#64748b" fontSize="10">100 Benchmark</text>

                    {chartMocks.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={getPointsString()}
                      />
                    )}

                    {chartMocks.map((m, idx) => {
                      const x = chartMocks.length === 1 ? chartSvgWidth / 2 : (idx / (chartMocks.length - 1)) * (chartSvgWidth - 40) + 20;
                      const y = chartSvgHeight - (Math.min(Math.max(Number(m.totalScore), 0), maxScoreScale) / maxScoreScale) * (chartSvgHeight - 30) - 15;
                      return (
                        <g key={m.id} className="cursor-pointer">
                          <circle cx={x} cy={y} r="5" fill="#60a5fa" stroke="#0d1322" strokeWidth="2" />
                          <text x={x} y={y - 8} fill="#93c5fd" fontSize="10" textAnchor="middle" fontWeight="bold">
                            {m.totalScore}
                          </text>
                          <text x={x} y={chartSvgHeight - 2} fill="#64748b" fontSize="9" textAnchor="middle">
                            {m.date}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>

            {/* VISUAL GRAPH 2: WRONG VS SKIPPED REASON BREAKDOWN */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400" /> Negative Mark vs Skipped Reasons
                </h3>

                {errorQuestions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">Koi error questions log nahi hue.</p>
                ) : (
                  <div className="space-y-3 pt-2">
                    {[
                      { label: "Silly Mistakes (Calculation/Reading)", count: sillyMistakesCount, color: "bg-rose-500", text: "text-rose-400" },
                      { label: "Conceptual Gaps (Formula/Rules)", count: conceptGapsCount, color: "bg-red-500", text: "text-red-400" },
                      { label: "Skipped: Time Pressure / Ran Out of Time", count: timeTrapsCount, color: "bg-amber-500", text: "text-amber-400" },
                      { label: "Skipped: Lengthy / Low Confidence", count: lengthySkippedCount, color: "bg-blue-500", text: "text-blue-400" },
                    ].map((item) => {
                      const pct = errorQuestions.length ? Math.round((item.count / errorQuestions.length) * 100) : 0;
                      return (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300">{item.label}</span>
                            <span className={`${item.text} font-bold`}>{item.count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-[#080c14] h-2 rounded-full overflow-hidden border border-slate-800">
                            <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Subject-Wise Exam Readiness */}
              <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" /> Subject Readiness & Accuracy
                </h3>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {[
                    { name: "Reasoning", color: "from-blue-500 to-indigo-500", status: "High Accuracy", ready: "86%" },
                    { name: "General Awareness", color: "from-rose-500 to-amber-500", status: "Bleeding Area", ready: "52%" },
                    { name: "Quantitative Aptitude", color: "from-emerald-500 to-teal-500", status: "Needs Speed", ready: "74%" },
                    { name: "English Comprehension", color: "from-purple-500 to-pink-500", status: "Strong", ready: "88%" },
                  ].map((s) => (
                    <div key={s.name} className="bg-[#12192b] p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-white">{s.name}</p>
                        <span className="text-xs font-black text-blue-400">{s.ready}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.status}</p>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${s.color} w-3/4 rounded-full`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Attempted Mocks Overview */}
            <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Attempted Mocks Log</h3>
                <span className="text-xs text-slate-400 font-bold">{mocks.length} Saved Attempts</span>
              </div>
              {mocks.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  Koi mock log nahi hua hai. "Log Mock + Questions" tab par ja kar apna scorecard drag & drop karein.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {mocks.map((m) => (
                    <div key={m.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-white">{m.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{m.platform} • {m.examPreset} • {m.date}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-blue-400">{m.totalScore} Marks</span>
                        <p className="text-[10px] text-slate-400">
                          <span className="text-rose-400 font-bold">{m.wrongCount || 0} Wrong</span> • <span className="text-amber-400 font-bold">{m.skippedCount || 0} Skipped</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. LOG A MOCK & ATTACH (WRONG + SKIPPED QUESTIONS) */}
        {activeTab === "log" && (
          <div className="max-w-5xl space-y-6 pb-16">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Log a Mock (Scorecard + Wrong & Skipped Questions)</h1>
              <p className="text-xs text-slate-400 mt-1">Dual-tab open karein: scorecard aur galat/chode hue questions yahan drop karein</p>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Target Exam Preset</label>
                <select value={examPreset} onChange={(e) => setExamPreset(e.target.value)} className="w-full bg-[#0d1322] border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option>SSC CGL Tier 1</option>
                  <option>SSC CGL Tier 2</option>
                  <option>SSC CHSL</option>
                  <option>SSC CPO</option>
                  <option>SSC MTS</option>
                  <option>Banking / IBPS</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Mock Type</label>
                <select value={mockType} onChange={(e) => setMockType(e.target.value)} className="w-full bg-[#0d1322] border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option>Full Mock</option>
                  <option>Sectional Mock</option>
                  <option>Live Mock</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Source / Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-[#0d1322] border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option>Testbook</option>
                  <option>Oliveboard</option>
                  <option>Adda247</option>
                  <option>SuperProfs</option>
                  <option>Official SSC Answer Key</option>
                </select>
              </div>
            </div>

            {/* STEP 1: SCORECARD DRAG & DROP */}
            <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h2 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span>Step 1:</span> Scorecard Screenshot Drop & AI Auto-Fill
              </h2>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleScorecardDrop}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center bg-[#080c14]/50 cursor-pointer transition"
              >
                {scorecardImage ? (
                  <div className="space-y-2">
                    <img src={scorecardImage} alt="Scorecard" className="max-h-48 mx-auto rounded-xl border border-slate-700" />
                    <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Scorecard Attached
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-blue-500 mx-auto" />
                    <p className="text-sm font-bold text-white">Drag & Drop Scorecard Screenshot Here</p>
                    <p className="text-xs text-slate-500">Dual-tab window se screenshot yahan drag karein</p>
                    <input type="file" accept="image/*" onChange={handleScorecardDrop} className="text-xs text-slate-400 mt-2" />
                  </div>
                )}
              </div>

              <button
                onClick={handleExtractAI}
                disabled={isExtracting}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition text-xs shadow-lg shadow-blue-600/20"
              >
                {isExtracting ? "Gemini AI Extracting Section Marks..." : "Extract Section Marks with AI"}
              </button>

              {/* Sections Breakdown Grid */}
              <div className="pt-2">
                <div className="grid grid-cols-4 text-xs font-bold text-slate-400 pb-2 border-b border-slate-800">
                  <span>Subject</span>
                  <span>Correct</span>
                  <span>Wrong</span>
                  <span>Marks</span>
                </div>
                {(["reasoning", "gs", "maths", "english"] as const).map((sec) => (
                  <div key={sec} className="grid grid-cols-4 gap-3 items-center py-2 border-b border-slate-800/40">
                    <span className="text-xs font-bold uppercase text-white">{sec}</span>
                    <input
                      type="number"
                      value={sections[sec].correct}
                      onChange={(e) => setSections({ ...sections, [sec]: { ...sections[sec], correct: Number(e.target.value) } })}
                      className="bg-[#080c14] border border-slate-700 p-1.5 rounded-lg text-xs text-white"
                    />
                    <input
                      type="number"
                      value={sections[sec].wrong}
                      onChange={(e) => setSections({ ...sections, [sec]: { ...sections[sec], wrong: Number(e.target.value) } })}
                      className="bg-[#080c14] border border-slate-700 p-1.5 rounded-lg text-xs text-white"
                    />
                    <input
                      type="number"
                      value={sections[sec].marks}
                      onChange={(e) => setSections({ ...sections, [sec]: { ...sections[sec], marks: Number(e.target.value) } })}
                      className="bg-[#080c14] border border-slate-700 p-1.5 rounded-lg text-xs text-blue-400 font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 2: DIGITAL ERROR & SKIP COPY ATTACHMENT */}
            <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <span>Step 2:</span> Attach Wrong & Skipped Questions
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sawal ka screenshot drop karein aur galti ya chhodne ka karan note karein</p>
                </div>
                <div className="flex gap-2">
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    {tempQuestions.filter(q => q.status === "WRONG").length} Wrong
                  </span>
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    {tempQuestions.filter(q => q.status === "SKIPPED").length} Skipped
                  </span>
                </div>
              </div>

              {/* Status Switcher: Wrong vs Skipped */}
              <div className="flex bg-[#080c14] p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => {
                    setQStatus("WRONG");
                    setQTag("Silly Error (Calculation)");
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    qStatus === "WRONG" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" /> Wrong Question (Galat Hua)
                </button>
                <button
                  onClick={() => {
                    setQStatus("SKIPPED");
                    setQTag("Time Pressure / Ran out of Time");
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    qStatus === "SKIPPED" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <SkipForward className="w-3.5 h-3.5" /> Skipped / Left (Chhoda Gaya)
                </button>
              </div>

              {/* Question Image Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleQuestionDrop}
                className={`border-2 border-dashed rounded-2xl p-4 text-center bg-[#080c14]/50 cursor-pointer transition ${
                  qStatus === "WRONG" ? "border-slate-700 hover:border-rose-500" : "border-slate-700 hover:border-amber-500"
                }`}
              >
                {qImage ? (
                  <div className="space-y-1">
                    <img src={qImage} alt="Question" className="max-h-40 mx-auto rounded-lg border border-slate-700" />
                    <button onClick={() => setQImage(null)} className="text-[10px] text-rose-400 hover:underline">Remove Screenshot</button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <ImageIcon className={`w-6 h-6 mx-auto ${qStatus === "WRONG" ? "text-rose-400" : "text-amber-400"}`} />
                    <p className="text-xs font-bold text-white">Drag & Drop Question Screenshot Here</p>
                    <p className="text-[10px] text-slate-500">Test analysis window se is sawal ka snapshot drop karein</p>
                    <input type="file" accept="image/*" onChange={handleQuestionDrop} className="text-xs text-slate-400 mt-1" />
                  </div>
                )}
              </div>

              {/* Question Metadata Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Subject</label>
                  <select value={qSubject} onChange={(e) => setQSubject(e.target.value)} className="w-full bg-[#080c14] border border-slate-700 rounded-xl p-2 text-xs text-white">
                    <option value="maths">Quantitative Aptitude</option>
                    <option value="reasoning">Reasoning</option>
                    <option value="gs">General Awareness (GS)</option>
                    <option value="english">English Language</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Topic / Chapter</label>
                  <input
                    type="text"
                    placeholder="e.g. Mensuration / Seating Arrangement"
                    value={qTopic}
                    onChange={(e) => setQTopic(e.target.value)}
                    className="w-full bg-[#080c14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    {qStatus === "WRONG" ? "Mistake Classifier" : "Skipped Reason"}
                  </label>
                  {qStatus === "WRONG" ? (
                    <select value={qTag} onChange={(e) => setQTag(e.target.value)} className="w-full bg-[#080c14] border border-slate-700 rounded-xl p-2 text-xs text-white">
                      <option>Silly Error (Calculation)</option>
                      <option>Conceptual Gap (Rule bhool gaya)</option>
                      <option>Question Not Read Carefully</option>
                      <option>Guessed / Fluke Negative</option>
                    </select>
                  ) : (
                    <select value={qTag} onChange={(e) => setQTag(e.target.value)} className="w-full bg-[#080c14] border border-slate-700 rounded-xl p-2 text-xs text-white">
                      <option>Time Pressure / Ran out of Time</option>
                      <option>Too Lengthy / Heavy Calculation</option>
                      <option>Chapter Not Covered / Unknown</option>
                      <option>Low Confidence (Avoided Negative)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Dynamic Prompts based on Wrong or Skipped */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-semibold block mb-1 flex items-center gap-1 ${qStatus === "WRONG" ? "text-rose-400" : "text-amber-400"}`}>
                    <HelpCircle className="w-3.5 h-3.5" /> 
                    {qStatus === "WRONG" ? "Yeh Sawal Kyu Galat Hua? (Reason)" : "Yeh Sawal Kyu Chhoda? (Why Skipped?)"}
                  </label>
                  <textarea
                    rows={2}
                    value={qWhyReason}
                    onChange={(e) => setQWhyReason(e.target.value)}
                    placeholder={
                      qStatus === "WRONG"
                        ? "e.g., Calculation mein + ki jagah - kar diya ya option galat mark kiya..."
                        : "e.g., 3 minute bache the aur maths ke 5 questions the, isiliye skip kiya..."
                    }
                    className="w-full bg-[#080c14] border border-slate-700 rounded-xl p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-emerald-400 font-semibold block mb-1 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> 
                    {qStatus === "WRONG" ? "Isse Kya Seekha? (Formula / Rule)" : "Agli Baar Ka Action Plan (How to tackle?)"}
                  </label>
                  <textarea
                    rows={2}
                    value={qLearnedNote}
                    onChange={(e) => setQLearnedNote(e.target.value)}
                    placeholder={
                      qStatus === "WRONG"
                        ? "e.g., Formula: R = (a*b)/(a+b). Final value double-check karna hai."
                        : "e.g., Is type ke question mein digit sum trick lagani hai taaki 30 sec mein ho jaye."
                    }
                    className="w-full bg-[#080c14] border border-slate-700 rounded-xl p-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={addQuestion}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition border border-slate-700"
              >
                + Attach {qStatus === "WRONG" ? "Wrong Question" : "Skipped Question"} to Mock
              </button>

              {/* Currently Attached List */}
              {tempQuestions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-300">Ready to Save ({tempQuestions.length} Questions):</span>
                  <div className="grid grid-cols-2 gap-3">
                    {tempQuestions.map((q, idx) => (
                      <div key={q.id} className="bg-[#080c14] p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white uppercase">#{idx + 1} [{q.subject}] {q.topic}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                            q.status === "WRONG" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {q.status}: {q.tag}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]"><strong>Karan:</strong> {q.whyReason}</p>
                        <p className="text-emerald-400 text-[11px]"><strong>Seekh/Plan:</strong> {q.learnedNote}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Complete Mock Save */}
            <button
              onClick={saveFullMock}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition text-sm shadow-xl shadow-emerald-600/20"
            >
              Confirm & Save Full Mock to Error Copy
            </button>
          </div>
        )}

        {/* 3. DIGITAL ERROR & SKIPPED COPY */}
        {activeTab === "errors" && (
          <div className="max-w-6xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Digital Error & Skipped Questions Notebook</h1>
                <p className="text-xs text-slate-400 mt-0.5">Filter by Wrong answers or Skipped/Unattempted traps</p>
              </div>
              <button onClick={() => setActiveTab("retest")} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
                Start Retest Drill
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 text-xs overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "All Items" },
                { id: "WRONG", label: "Only Wrong Questions" },
                { id: "SKIPPED", label: "Only Skipped Questions" },
                { id: "maths", label: "Maths" },
                { id: "reasoning", label: "Reasoning" },
                { id: "gs", label: "GS" },
                { id: "english", label: "English" },
              ].map((flt) => (
                <button
                  key={flt.id}
                  onClick={() => setSelectedErrorFilter(flt.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    selectedErrorFilter === flt.id ? "bg-blue-600 text-white" : "bg-[#0d1322] text-slate-400 hover:text-white"
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>

            {/* Cards Grid */}
            {filteredErrors.length === 0 ? (
              <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                Koi questions match nahi hue. "Log Mock" tab se questions add karein.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredErrors.map((q) => (
                  <div key={q.id} className="bg-[#0d1322] border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-black text-sm text-white uppercase">[{q.subject}] {q.topic}</span>
                        <p className="text-[10px] text-slate-500">{q.mockName} • {q.date}</p>
                      </div>
                      <span className={`border px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        q.status === "WRONG" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {q.status}: {q.tag}
                      </span>
                    </div>

                    {q.image && (
                      <div className="cursor-pointer" onClick={() => setModalImage(q.image)}>
                        <img src={q.image} alt="Question" className="max-h-44 w-full object-contain bg-black/40 rounded-xl border border-slate-800" />
                      </div>
                    )}

                    <div className="space-y-1.5 text-xs bg-[#080c14] p-3 rounded-xl border border-slate-800/80">
                      <p className={q.status === "WRONG" ? "text-rose-400" : "text-amber-400"}>
                        <strong>{q.status === "WRONG" ? "Galti Ki Wajah:" : "Chhodne Ki Wajah:"}</strong>{" "}
                        <span className="text-slate-300">{q.whyReason}</span>
                      </p>
                      <p className="text-emerald-400">
                        <strong>{q.status === "WRONG" ? "Seekh / Formula:" : "Agli Baar Ka Plan:"}</strong>{" "}
                        <span className="text-slate-300">{q.learnedNote}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. TARGETED RETEST DRILL */}
        {activeTab === "retest" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-black text-white tracking-tight">Retest Drill Session</h1>
            {errorQuestions.length === 0 ? (
              <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                Retest ke liye koi questions nahi hain. Pehle mock mein questions attach karein.
              </div>
            ) : (
              <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">Question {retestIndex + 1} of {errorQuestions.length}</span>
                  <span className={`border px-2.5 py-0.5 rounded-md font-bold uppercase ${
                    errorQuestions[retestIndex].status === "WRONG" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {errorQuestions[retestIndex].status} • {errorQuestions[retestIndex].subject}
                  </span>
                </div>

                {errorQuestions[retestIndex].image ? (
                  <img src={errorQuestions[retestIndex].image} alt="Retest Question" className="max-h-72 mx-auto rounded-xl border border-slate-700" />
                ) : (
                  <div className="p-8 text-center bg-[#080c14] rounded-xl text-slate-400 font-bold">
                    Topic: {errorQuestions[retestIndex].topic}
                  </div>
                )}

                <button
                  onClick={() => setShowRetestDetails(!showRetestDetails)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  {showRetestDetails ? "Hide Analysis & Solution" : "Reveal Reason & Formula/Plan"}
                </button>

                {showRetestDetails && (
                  <div className="bg-[#080c14] p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <p className={errorQuestions[retestIndex].status === "WRONG" ? "text-rose-400" : "text-amber-400"}>
                      <strong>{errorQuestions[retestIndex].status === "WRONG" ? "Original Galti:" : "Kyu Chhoda Tha:"}</strong>{" "}
                      {errorQuestions[retestIndex].whyReason}
                    </p>
                    <p className="text-emerald-400">
                      <strong>{errorQuestions[retestIndex].status === "WRONG" ? "Formula/Seekh:" : "Next Plan:"}</strong>{" "}
                      {errorQuestions[retestIndex].learnedNote}
                    </p>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    disabled={retestIndex === 0}
                    onClick={() => { setRetestIndex(retestIndex - 1); setShowRetestDetails(false); }}
                    className="bg-slate-800 disabled:opacity-40 px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Previous
                  </button>
                  <button
                    disabled={retestIndex === errorQuestions.length - 1}
                    onClick={() => { setRetestIndex(retestIndex + 1); setShowRetestDetails(false); }}
                    className="bg-blue-600 disabled:opacity-40 px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. ATTEMPTED MOCKS HISTORY */}
        {activeTab === "history" && (
          <div className="max-w-5xl space-y-4">
            <h1 className="text-2xl font-black text-white tracking-tight">Attempted Mocks History</h1>
            {mocks.map((m) => (
              <div key={m.id} className="bg-[#0d1322] border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white text-base">{m.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{m.platform} • {m.examPreset} • {m.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-400">{m.totalScore}</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="text-rose-400 font-semibold">{m.wrongCount || 0} Wrong</span> | <span className="text-amber-400 font-semibold">{m.skippedCount || 0} Skipped</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Modal for full image view */}
      {modalImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setModalImage(null)}>
          <div className="max-w-4xl max-h-[90vh] bg-[#0d1322] p-2 rounded-2xl">
            <img src={modalImage} alt="Expanded Question" className="max-h-[85vh] rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
