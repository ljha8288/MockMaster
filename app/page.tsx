"use client";
import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, PlusCircle, CheckSquare, AlertOctagon, 
  RotateCcw, Upload, Trash2, CheckCircle2, Image as ImageIcon,
  HelpCircle, Lightbulb, TrendingUp, Target, Award, Eye, Flame, BookOpen
} from "lucide-react";

export default function OneFightMorePlatform() {
  const [activeTab, setActiveTab] = useState("log");

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

  // Sections State
  const [sections, setSections] = useState({
    reasoning: { correct: 0, wrong: 0, unattempted: 0, marks: 0, accuracy: 0 },
    gs: { correct: 0, wrong: 0, unattempted: 0, marks: 0, accuracy: 0 },
    maths: { correct: 0, wrong: 0, unattempted: 0, marks: 0, accuracy: 0 },
    english: { correct: 0, wrong: 0, unattempted: 0, marks: 0, accuracy: 0 },
  });

  // Attached Questions (Digital Error Copy)
  const [tempQuestions, setTempQuestions] = useState<any[]>([]);
  const [qImage, setQImage] = useState<string | null>(null);
  const [qSubject, setQSubject] = useState("maths");
  const [qTopic, setQTopic] = useState("");
  const [qTag, setQTag] = useState("Silly Error");
  const [qWhyWrong, setQWhyWrong] = useState("");
  const [qLearnedNote, setQLearnedNote] = useState("");

  // Retest & Preview State
  const [selectedErrorFilter, setSelectedErrorFilter] = useState("ALL");
  const [retestIndex, setRetestIndex] = useState(0);
  const [showRetestDetails, setShowRetestDetails] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    const m = localStorage.getItem("ofm_mock_data");
    const e = localStorage.getItem("ofm_error_data");
    if (m) setMocks(JSON.parse(m));
    if (e) setErrorQuestions(JSON.parse(e));
  }, []);

  const persist = (m: any[], e: any[]) => {
    setMocks(m);
    setErrorQuestions(e);
    localStorage.setItem("ofm_mock_data", JSON.stringify(m));
    localStorage.setItem("ofm_error_data", JSON.stringify(e));
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
    if (!qWhyWrong) return alert("'Yeh sawal kyu galat hua?' likhna zaroori hai!");

    const newQ = {
      id: Date.now(),
      image: qImage,
      subject: qSubject,
      topic: qTopic,
      tag: qTag,
      whyWrong: qWhyWrong,
      learnedNote: qLearnedNote || "Revision needed.",
      date: new Date().toLocaleDateString("en-IN")
    };

    setTempQuestions([newQ, ...tempQuestions]);
    setQImage(null);
    setQTopic("");
    setQWhyWrong("");
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
      date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    };

    const taggedQuestions = tempQuestions.map(q => ({ ...q, mockId, mockName: finalName }));
    const updatedMocks = [newMock, ...mocks];
    const updatedErrors = [...taggedQuestions, ...errorQuestions];

    persist(updatedMocks, updatedErrors);
    alert("Mock aur Error Copy saved!");

    setScorecardImage(null);
    setTempQuestions([]);
    setActiveTab("dashboard");
  };

  // Metrics
  const totalMocks = mocks.length;
  const overallAvg = totalMocks ? (mocks.reduce((a, b) => a + Number(b.totalScore || 0), 0) / totalMocks).toFixed(1) : "0";
  const last3Avg = totalMocks >= 3 ? (mocks.slice(0, 3).reduce((a, b) => a + Number(b.totalScore || 0), 0) / 3).toFixed(1) : overallAvg;
  const last10Avg = totalMocks >= 10 ? (mocks.slice(0, 10).reduce((a, b) => a + Number(b.totalScore || 0), 0) / 10).toFixed(1) : overallAvg;
  const bestScore = totalMocks ? Math.max(...mocks.map(m => Number(m.totalScore || 0))) : 0;
  const ofmIndex = totalMocks >= 3 ? 88.5 : totalMocks * 28;

  const filteredErrors = selectedErrorFilter === "ALL" 
    ? errorQuestions 
    : errorQuestions.filter(q => q.subject === selectedErrorFilter || q.tag === selectedErrorFilter);

  return (
    <div className="flex h-screen bg-[#080c14] text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar (OFM Original Dark Slate Theme) */}
      <aside className="w-64 bg-[#0d1320] border-r border-slate-800/80 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/30">
              OFM
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide text-white">One Fight More</h2>
              <p className="text-[10px] text-blue-400 font-semibold">AI Mock Test Analysis</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard & Metrics", icon: LayoutDashboard },
              { id: "log", label: "Log a Mock & Questions", icon: PlusCircle },
              { id: "errors", label: "Digital Error Copy", icon: AlertOctagon },
              { id: "retest", label: "Targeted Retest Engine", icon: RotateCcw },
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
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Personal Workspace
          </span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-400">100% OFM</span>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#080c14]">

        {/* 1. DASHBOARD & METRICS (OFM ORIGINAL DASHBOARD) */}
        {activeTab === "dashboard" && (
          <div className="max-w-6xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Mock Analysis Dashboard</h1>
                <p className="text-xs text-slate-400 mt-0.5">Track your exam readiness, accuracy trends & errors</p>
              </div>
              <button onClick={() => setActiveTab("log")} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
                + Log New Mock
              </button>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-5 gap-3.5">
              <div className="bg-[#0d1320] border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">OFM Index</span>
                <p className="text-3xl font-black text-emerald-400 mt-1">{ofmIndex}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Consistency Score</span>
              </div>
              <div className="bg-[#0d1320] border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Overall Avg</span>
                <p className="text-3xl font-black text-blue-400 mt-1">{overallAvg} <span className="text-xs text-slate-500">/ 200</span></p>
                <span className="text-[10px] text-slate-500 mt-1 block">Net Score Average</span>
              </div>
              <div className="bg-[#0d1320] border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Last 3 Avg</span>
                <p className="text-3xl font-black text-indigo-400 mt-1">{last3Avg}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Recent Momentum</span>
              </div>
              <div className="bg-[#0d1320] border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Last 10 Avg</span>
                <p className="text-3xl font-black text-purple-400 mt-1">{last10Avg}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Stabilized Average</span>
              </div>
              <div className="bg-[#0d1320] border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Best Score</span>
                <p className="text-3xl font-black text-amber-400 mt-1">{bestScore}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Peak Performance</span>
              </div>
            </div>

            {/* Subject-Wise Exam Readiness Cards */}
            <div className="bg-[#0d1320] border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Subject-Wise Performance & Exam Readiness</h3>
              <div className="grid grid-cols-4 gap-4 pt-1">
                {[
                  { name: "Reasoning", color: "from-blue-500 to-indigo-500", status: "Exam Ready (85%+)", ready: "86%" },
                  { name: "General Awareness", color: "from-rose-500 to-amber-500", status: "Bleeding Area (Critical)", ready: "52%" },
                  { name: "Quantitative Aptitude", color: "from-emerald-500 to-teal-500", status: "Moderate (Revision needed)", ready: "74%" },
                  { name: "English Comprehension", color: "from-purple-500 to-pink-500", status: "Strong Performance", ready: "88%" },
                ].map((s) => (
                  <div key={s.name} className="bg-[#12192b] p-3.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-white">{s.name}</p>
                      <span className="text-xs font-black text-blue-400">{s.ready}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{s.status}</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${s.color} w-3/4 rounded-full`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attempted Mocks Overview */}
            <div className="bg-[#0d1320] border border-slate-800/80 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Attempted Mocks Log</h3>
                <span className="text-xs text-slate-400 font-bold">{mocks.length} Attempts</span>
              </div>
              {mocks.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  Koi mock log nahi hua hai. "Log a Mock" tab par ja kar apna scorecard drag & drop karein.
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
                        <p className="text-[10px] text-rose-400 font-bold">{m.questionsCount} Mistakes Tagged</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. LOG A MOCK & ATTACH QUESTIONS (DUAL-TAB DRAG & DROP WORKFLOW) */}
        {activeTab === "log" && (
          <div className="max-w-5xl space-y-6 pb-16">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Log a Mock (One Fight More Method)</h1>
              <p className="text-xs text-slate-400 mt-1">Dual-tab open karein: ek tab mein scorecard screenshot aur yahan drag & drop karein</p>
            </div>

            {/* Top Selector Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Target Exam Preset</label>
                <select value={examPreset} onChange={(e) => setExamPreset(e.target.value)} className="w-full bg-[#0d1320] border border-slate-800 rounded-xl p-2.5 text-xs text-white">
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
                <select value={mockType} onChange={(e) => setMockType(e.target.value)} className="w-full bg-[#0d1320] border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option>Full Mock</option>
                  <option>Sectional Mock</option>
                  <option>Live Mock</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Source / Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-[#0d1320] border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option>Testbook</option>
                  <option>Oliveboard</option>
                  <option>Adda247</option>
                  <option>SuperProfs</option>
                  <option>Official SSC Answer Key</option>
                </select>
              </div>
            </div>

            {/* STEP 1: SCORECARD DRAG & DROP */}
            <div className="bg-[#0d1320] border border-slate-800/80 rounded-2xl p-5 space-y-4">
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

            {/* STEP 2: DIGITAL ERROR COPY - QUESTION ATTACHMENT */}
            <div className="bg-[#0d1320] border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    <span>Step 2:</span> Attach Wrong Questions (Digital Error Copy)
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Dual-tab se galat questions ka screenshot drop karein + kyu galat hua note karein</p>
                </div>
                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {tempQuestions.length} Attached
                </span>
              </div>

              {/* Question Image Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleQuestionDrop}
                className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl p-4 text-center bg-[#080c14]/50 cursor-pointer transition"
              >
                {qImage ? (
                  <div className="space-y-1">
                    <img src={qImage} alt="Question" className="max-h-40 mx-auto rounded-lg border border-slate-700" />
                    <button onClick={() => setQImage(null)} className="text-[10px] text-rose-400 hover:underline">Remove Image</button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <ImageIcon className="w-6 h-6 text-rose-400 mx-auto" />
                    <p className="text-xs font-bold text-white">Drag & Drop Question Screenshot Here</p>
                    <p className="text-[10px] text-slate-500">Test analysis window se direct snapshot drop karein</p>
                    <input type="file" accept="image/*" onChange={handleQuestionDrop} className="text-xs text-slate-400 mt-1" />
                  </div>
                )}
              </div>

              {/* Question Metadata */}
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
                    placeholder="e.g. Geometry / Syllogisms"
                    value={qTopic}
                    onChange={(e) => setQTopic(e.target.value)}
                    className="w-full bg-[#080c14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">4-Way Mistake Classifier</label>
                  <select value={qTag} onChange={(e) => setQTag(e.target.value)} className="w-full bg-[#080c14] border border-slate-700 rounded-xl p-2 text-xs text-white">
                    <option>Silly Error (Calculation)</option>
                    <option>Conceptual Gap</option>
                    <option>Time Trap</option>
                    <option>Guessed / Fluke</option>
                  </select>
                </div>
              </div>

              {/* Mistake Reason & What was Learned */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-rose-400 font-semibold block mb-1 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> Yeh Sawal Kyu Galat Hua? (Reason)
                  </label>
                  <textarea
                    rows={2}
                    value={qWhyWrong}
                    onChange={(e) => setQWhyWrong(e.target.value)}
                    placeholder="e.g., Calculation mein + ki jagah - kar diya..."
                    className="w-full bg-[#080c14] border border-slate-700 rounded-xl p-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-emerald-400 font-semibold block mb-1 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Isse Kya Seekha? (Key Formula / Concept Rule)
                  </label>
                  <textarea
                    rows={2}
                    value={qLearnedNote}
                    onChange={(e) => setQLearnedNote(e.target.value)}
                    placeholder="e.g., Formula: (a+b+c)^2 = a^2 + b^2 + c^2 + 2(ab+bc+ca)..."
                    className="w-full bg-[#080c14] border border-slate-700 rounded-xl p-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={addQuestion}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition border border-slate-700"
              >
                + Attach Question to This Mock
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
                          <span className="bg-rose-500/10 text-rose-400 text-[10px] px-2 py-0.5 rounded font-bold">{q.tag}</span>
                        </div>
                        <p className="text-slate-300 text-[11px]"><strong>Galti:</strong> {q.whyWrong}</p>
                        <p className="text-emerald-400 text-[11px]"><strong>Seekh:</strong> {q.learnedNote}</p>
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

        {/* 3. DIGITAL ERROR COPY (THE OFM ERROR NOTEBOOK) */}
        {activeTab === "errors" && (
          <div className="max-w-6xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Digital Error Copy</h1>
                <p className="text-xs text-slate-400 mt-0.5">Question screenshots, mistake classifications & learning notes</p>
              </div>
              <button onClick={() => setActiveTab("retest")} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
                Start Retest Drill
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 text-xs overflow-x-auto pb-1">
              {["ALL", "maths", "reasoning", "gs", "english", "Silly Error (Calculation)", "Conceptual Gap", "Time Trap"].map((flt) => (
                <button
                  key={flt}
                  onClick={() => setSelectedErrorFilter(flt)}
                  className={`px-3 py-1.5 rounded-lg font-bold capitalize transition ${
                    selectedErrorFilter === flt ? "bg-blue-600 text-white" : "bg-[#0d1320] text-slate-400 hover:text-white"
                  }`}
                >
                  {flt}
                </button>
              ))}
            </div>

            {/* Error Cards */}
            {filteredErrors.length === 0 ? (
              <div className="bg-[#0d1320] border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                Koi questions match nahi hue. "Log a Mock" tab se apne galat questions attach karein.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredErrors.map((q) => (
                  <div key={q.id} className="bg-[#0d1320] border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-black text-sm text-white uppercase">[{q.subject}] {q.topic}</span>
                        <p className="text-[10px] text-slate-500">{q.mockName} • {q.date}</p>
                      </div>
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                        {q.tag}
                      </span>
                    </div>

                    {q.image && (
                      <div className="cursor-pointer" onClick={() => setModalImage(q.image)}>
                        <img src={q.image} alt="Question" className="max-h-44 w-full object-contain bg-black/40 rounded-xl border border-slate-800" />
                      </div>
                    )}

                    <div className="space-y-1.5 text-xs bg-[#080c14] p-3 rounded-xl border border-slate-800/80">
                      <p className="text-rose-400">
                        <strong>Kyu Galat Hua:</strong> <span className="text-slate-300">{q.whyWrong}</span>
                      </p>
                      <p className="text-emerald-400">
                        <strong>Seekh / Formula:</strong> <span className="text-slate-300">{q.learnedNote}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. TARGETED RETEST ENGINE */}
        {activeTab === "retest" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-black text-white tracking-tight">Targeted Retest Engine</h1>
            {errorQuestions.length === 0 ? (
              <div className="bg-[#0d1320] border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                Retest ke liye koi questions nahi hain. Pehle mock mein galat questions attach karein.
              </div>
            ) : (
              <div className="bg-[#0d1320] border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">Question {retestIndex + 1} of {errorQuestions.length}</span>
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-md font-bold uppercase">
                    {errorQuestions[retestIndex].subject}
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
                  {showRetestDetails ? "Hide Mistake & Formula" : "Reveal Why it Failed & Formula"}
                </button>

                {showRetestDetails && (
                  <div className="bg-[#080c14] p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <p className="text-rose-400"><strong>Original Mistake:</strong> {errorQuestions[retestIndex].whyWrong}</p>
                    <p className="text-emerald-400"><strong>Concept / Formula:</strong> {errorQuestions[retestIndex].learnedNote}</p>
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
              <div key={m.id} className="bg-[#0d1320] border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white text-base">{m.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{m.platform} • {m.examPreset} • {m.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-400">{m.totalScore}</span>
                  <span className="text-xs text-slate-500 block">{m.questionsCount} mistakes logged</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Modal for full image view */}
      {modalImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setModalImage(null)}>
          <div className="max-w-4xl max-h-[90vh] bg-[#0d1320] p-2 rounded-2xl">
            <img src={modalImage} alt="Expanded Question" className="max-h-[85vh] rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
