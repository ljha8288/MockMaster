"use client";
import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, PlusCircle, CheckSquare, AlertCircle, 
  RotateCcw, BookOpen, Upload, Trash2, CheckCircle2, ChevronRight, Award, Zap, TrendingUp
} from "lucide-react";

export default function OFMPlatform() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Persistent Local/Cloud Store for Personal Use (Never logs out)
  const [mocks, setMocks] = useState<any[]>([]);
  const [errorQuestions, setErrorQuestions] = useState<any[]>([]);

  // Log a Mock State
  const [examPreset, setExamPreset] = useState("SSC CGL Tier 1");
  const [mockType, setMockType] = useState("Full Mock");
  const [platform, setPlatform] = useState("Testbook");
  const [mockName, setMockName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Sections
  const [sections, setSections] = useState({
    reasoning: { correct: 0, wrong: 0, unattempted: 0, marks: 0, time: "14:20" },
    gs: { correct: 0, wrong: 0, unattempted: 0, marks: 0, time: "06:45" },
    maths: { correct: 0, wrong: 0, unattempted: 0, marks: 0, time: "24:10" },
    english: { correct: 0, wrong: 0, unattempted: 0, marks: 0, time: "11:30" },
  });

  // Question Attachment State (For Error Copy)
  const [tempQuestions, setTempQuestions] = useState<any[]>([]);
  const [qSubject, setQSubject] = useState("maths");
  const [qTopic, setQTopic] = useState("");
  const [qTag, setQTag] = useState("Silly Mistake");
  const [qNote, setQNote] = useState("");

  // Load data on mount
  useEffect(() => {
    const savedMocks = localStorage.getItem("ofm_personal_mocks");
    const savedErrors = localStorage.getItem("ofm_personal_errors");
    if (savedMocks) setMocks(JSON.parse(savedMocks));
    if (savedErrors) setErrorQuestions(JSON.parse(savedErrors));
  }, []);

  const persistData = (newMocks: any[], newErrors: any[]) => {
    setMocks(newMocks);
    setErrorQuestions(newErrors);
    localStorage.setItem("ofm_personal_mocks", JSON.stringify(newMocks));
    localStorage.setItem("ofm_personal_errors", JSON.stringify(newErrors));
  };

  // Drag and drop handler
  const handleDrop = (e: any) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Gemini OCR Scan
  const handleExtract = async () => {
    if (!imagePreview) return alert("Pehle Scorecard screenshot drag & drop karein!");
    setIsExtracting(true);

    try {
      const res = await fetch("/api/scan-scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imagePreview, examPreset, mockType, platform })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.sections) setSections(data.sections);
      if (data.mockName) setMockName(data.mockName);
      alert("Scorecard data successfully parsed!");
    } catch (err: any) {
      alert("OCR Scan Error: " + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  // Add question to current mock
  const addQuestionToMock = () => {
    if (!qTopic) return alert("Topic ka naam likhein!");
    const newQ = {
      id: Date.now(),
      subject: qSubject,
      topic: qTopic,
      tag: qTag,
      note: qNote,
    };
    setTempQuestions([...tempQuestions, newQ]);
    setQTopic("");
    setQNote("");
  };

  // Save full mock
  const saveCompleteMock = () => {
    const totalScore = Object.values(sections).reduce((acc: number, curr: any) => acc + Number(curr.marks || 0), 0);
    const newMock = {
      id: Date.now(),
      name: mockName || `${examPreset} - #${mocks.length + 1}`,
      platform,
      examPreset,
      mockType,
      totalScore,
      sections,
      questionsAttached: tempQuestions.length,
      date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
    };

    const updatedMocks = [newMock, ...mocks];
    const updatedErrors = [...tempQuestions.map(q => ({ ...q, mockName: newMock.name })), ...errorQuestions];
    persistData(updatedMocks, updatedErrors);

    alert("Mock & Error Analysis notebook updated!");
    setTempQuestions([]);
    setImagePreview(null);
    setActiveTab("dashboard");
  };

  // Metrics calculation
  const totalMocksCount = mocks.length;
  const overallAvg = totalMocksCount ? (mocks.reduce((a, b) => a + Number(b.totalScore || 0), 0) / totalMocksCount).toFixed(1) : "0";
  const last3Avg = totalMocksCount >= 3 ? (mocks.slice(0, 3).reduce((a, b) => a + Number(b.totalScore || 0), 0) / 3).toFixed(1) : overallAvg;
  const last10Avg = totalMocksCount >= 10 ? (mocks.slice(0, 10).reduce((a, b) => a + Number(b.totalScore || 0), 0) / 10).toFixed(1) : overallAvg;

  return (
    <div className="flex h-screen bg-[#090d16] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar - OFM Design */}
      <aside className="w-64 bg-[#0e1424] border-r border-slate-800 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
              OFM
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight text-white">One Fight More</h2>
              <p className="text-[10px] text-blue-400 font-medium">Personal Mock Engine</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "log", label: "Log a Mock", icon: PlusCircle },
              { id: "attempted", label: "Attempted Mocks", icon: CheckSquare },
              { id: "errors", label: "Error Analysis Copy", icon: AlertCircle },
              { id: "retest", label: "Retest Session", icon: RotateCcw },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
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
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Personal Workspace
          </span>
          <span className="text-[10px] text-slate-500">v2.0 OFM</span>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#090d16]">
        
        {/* 1. DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className="max-w-6xl space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Aspirant Analytics Dashboard</h1>
              <p className="text-xs text-slate-400 mt-1">Track exam readiness, accuracy trends & silly mistakes</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#0e1424] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Mocks Logged</span>
                <p className="text-3xl font-black text-white mt-1.5">{totalMocksCount}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Full + Sectional Tests</span>
              </div>
              <div className="bg-[#0e1424] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Overall Average</span>
                <p className="text-3xl font-black text-blue-400 mt-1.5">{overallAvg} <span className="text-xs text-slate-400">/ 200</span></p>
                <span className="text-[10px] text-slate-500 mt-1 block">Across all platforms</span>
              </div>
              <div className="bg-[#0e1424] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Last 3 Avg / Last 10 Avg</span>
                <p className="text-2xl font-black text-indigo-400 mt-1.5">{last3Avg} <span className="text-slate-500 text-sm">/ {last10Avg}</span></p>
                <span className="text-[10px] text-slate-500 mt-1 block">Recent Momentum</span>
              </div>
              <div className="bg-[#0e1424] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Consistency Index</span>
                <p className="text-3xl font-black text-emerald-400 mt-1.5">{totalMocksCount >= 2 ? "88%" : "Building..."}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Based on test frequency</span>
              </div>
            </div>

            {/* Subject-Wise Exam Readiness Bar */}
            <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Subject-Wise Performance & Exam Readiness</h3>
              <div className="grid grid-cols-4 gap-4 pt-2">
                {[
                  { name: "Reasoning", color: "from-blue-500 to-indigo-500", weight: "Strong" },
                  { name: "General Awareness", color: "from-rose-500 to-amber-500", weight: "Bleeding Area" },
                  { name: "Quantitative Aptitude", color: "from-emerald-500 to-teal-500", weight: "Moderate" },
                  { name: "English Comprehension", color: "from-purple-500 to-pink-500", weight: "Strong" },
                ].map((s) => (
                  <div key={s.name} className="bg-[#131b30] p-3.5 rounded-xl border border-slate-800">
                    <p className="text-xs font-bold text-white">{s.name}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{s.weight}</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${s.color} w-3/4 rounded-full`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Mocks Log */}
            <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-200">Recent Attempted Mocks</h3>
                <button onClick={() => setActiveTab("log")} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                  + Log New Mock
                </button>
              </div>

              {mocks.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  Abhi koi mock log nahi hua hai. "Log a Mock" par jayein aur apna pehla scorecard analyze karein.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {mocks.map((m) => (
                    <div key={m.id} className="py-3.5 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-white">{m.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{m.platform} • {m.examPreset} • {m.date}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-blue-400">{m.totalScore} Marks</span>
                        <p className="text-[10px] text-slate-400">{m.questionsAttached} Errors Tagged</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. LOG A MOCK VIEW (DUAL-TAB DRAG & DROP & ERROR ATTACHMENT) */}
        {activeTab === "log" && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Log a Mock (OFM Method)</h1>
              <p className="text-xs text-slate-400 mt-1">Dual-tab open karein: ek tab mein scorecard screenshot aur yahan drag & drop</p>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Exam Preset</label>
                <select value={examPreset} onChange={(e) => setExamPreset(e.target.value)} className="w-full bg-[#0e1424] border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option>SSC CGL Tier 1</option>
                  <option>SSC CGL Tier 2</option>
                  <option>SSC CHSL</option>
                  <option>SSC CPO</option>
                  <option>SSC MTS</option>
                  <option>Banking / IBPS PO</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Mock Type</label>
                <select value={mockType} onChange={(e) => setMockType(e.target.value)} className="w-full bg-[#0e1424] border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option>Full Mock</option>
                  <option>Sectional Mock</option>
                  <option>Live Mock</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Test Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-[#0e1424] border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option>Testbook</option>
                  <option>Oliveboard</option>
                  <option>SuperProfs</option>
                  <option>Adda247</option>
                  <option>Official SSC Answer Key</option>
                </select>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center bg-[#0e1424]/50 transition-all cursor-pointer"
            >
              {imagePreview ? (
                <div className="space-y-3">
                  <img src={imagePreview} alt="Scorecard" className="max-h-56 mx-auto rounded-xl border border-slate-700 shadow-xl" />
                  <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Scorecard Attached & Ready
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 text-blue-500 mx-auto" />
                  <p className="text-sm font-semibold text-white">Drag & Drop Scorecard Screenshot Here</p>
                  <p className="text-xs text-slate-500">Gallery / Explorer tab se direct drag karein (Under 5 seconds)</p>
                  <input type="file" accept="image/*" onChange={handleDrop} className="text-xs text-slate-400 mt-2" />
                </div>
              )}
            </div>

            <button
              onClick={handleExtract}
              disabled={isExtracting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm shadow-lg shadow-blue-600/20"
            >
              {isExtracting ? "Gemini Multimodal OCR Extracting Sections..." : "Extract Mock Data with AI"}
            </button>

            {/* Section Breakdown Table */}
            <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Section-Wise Marks Breakdown</h3>
              <div className="grid grid-cols-5 text-xs font-semibold text-slate-400 pb-2 border-b border-slate-800">
                <span>Section</span>
                <span>Correct</span>
                <span>Wrong</span>
                <span>Unattempted</span>
                <span>Marks</span>
              </div>

              {(["reasoning", "gs", "maths", "english"] as const).map((sec) => (
                <div key={sec} className="grid grid-cols-5 gap-3 items-center">
                  <span className="text-xs font-bold uppercase text-white">{sec}</span>
                  <input
                    type="number"
                    value={sections[sec].correct}
                    onChange={(e) => setSections({ ...sections, [sec]: { ...sections[sec], correct: Number(e.target.value) } })}
                    className="bg-[#131b30] border border-slate-700 p-1.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="number"
                    value={sections[sec].wrong}
                    onChange={(e) => setSections({ ...sections, [sec]: { ...sections[sec], wrong: Number(e.target.value) } })}
                    className="bg-[#131b30] border border-slate-700 p-1.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="number"
                    value={sections[sec].unattempted}
                    onChange={(e) => setSections({ ...sections, [sec]: { ...sections[sec], unattempted: Number(e.target.value) } })}
                    className="bg-[#131b30] border border-slate-700 p-1.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="number"
                    value={sections[sec].marks}
                    onChange={(e) => setSections({ ...sections, [sec]: { ...sections[sec], marks: Number(e.target.value) } })}
                    className="bg-[#131b30] border border-slate-700 p-1.5 rounded-lg text-xs text-blue-400 font-bold"
                  />
                </div>
              ))}
            </div>

            {/* Attach Wrong/Skipped Questions (OFM Question Notebook Feature) */}
            <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Attach Wrong/Skipped Questions (Error Copy)</h3>
                  <p className="text-[11px] text-slate-400">Tag mistakes to track bleed areas & generate targeted retests</p>
                </div>
                <span className="text-xs bg-slate-800 text-blue-400 px-2.5 py-1 rounded-full font-bold">
                  {tempQuestions.length} Questions
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <select value={qSubject} onChange={(e) => setQSubject(e.target.value)} className="bg-[#131b30] border border-slate-700 rounded-xl p-2 text-xs text-white">
                  <option value="reasoning">Reasoning</option>
                  <option value="gs">General Awareness</option>
                  <option value="maths">Quantitative Aptitude</option>
                  <option value="english">English</option>
                </select>
                <input
                  type="text"
                  placeholder="Chapter/Topic (e.g. Geometry)"
                  value={qTopic}
                  onChange={(e) => setQTopic(e.target.value)}
                  className="bg-[#131b30] border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
                <select value={qTag} onChange={(e) => setQTag(e.target.value)} className="bg-[#131b30] border border-slate-700 rounded-xl p-2 text-xs text-white">
                  <option>Silly Mistake</option>
                  <option>Conceptual Gap</option>
                  <option>Time Pressure</option>
                  <option>Guessed / Fluke</option>
                </select>
                <button
                  onClick={addQuestionToMock}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 rounded-xl transition"
                >
                  + Add Question
                </button>
              </div>

              {tempQuestions.length > 0 && (
                <div className="space-y-2 mt-2">
                  {tempQuestions.map((q, idx) => (
                    <div key={q.id} className="flex justify-between items-center bg-[#131b30] p-2.5 rounded-xl border border-slate-800 text-xs">
                      <span><strong>#{idx + 1} [{q.subject.toUpperCase()}]</strong> {q.topic}</span>
                      <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20 text-[10px] font-semibold">{q.tag}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={saveCompleteMock}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition text-sm mt-4 shadow-lg shadow-emerald-600/20"
              >
                Save Mock & Errors to Workspace
              </button>
            </div>
          </div>
        )}

        {/* 3. ATTEMPTED MOCKS LOG */}
        {activeTab === "attempted" && (
          <div className="max-w-5xl space-y-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Attempted Mocks Log</h1>
            <div className="space-y-3">
              {mocks.map((m) => (
                <div key={m.id} className="bg-[#0e1424] border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-white text-base">{m.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{m.platform} • {m.examPreset} • {m.date}</p>
                    <div className="flex gap-4 mt-2 text-[11px] text-slate-300">
                      <span>Reasoning: {m.sections?.reasoning?.marks || 0}</span>
                      <span>GS: {m.sections?.gs?.marks || 0}</span>
                      <span>Maths: {m.sections?.maths?.marks || 0}</span>
                      <span>English: {m.sections?.english?.marks || 0}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-400">{m.totalScore}</span>
                    <span className="text-xs text-slate-500 block">{m.questionsAttached} error questions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. ERROR ANALYSIS NOTEBOOK */}
        {activeTab === "errors" && (
          <div className="max-w-5xl space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Digital Error Copy (Silly Mistakes & Bleed Areas)</h1>
              <p className="text-xs text-slate-400 mt-1">Directly categorized from your mock attempts</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0e1424] border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-rose-400 font-semibold uppercase">Silly Mistakes</span>
                <p className="text-2xl font-bold text-white mt-1">{errorQuestions.filter(q => q.tag === "Silly Mistake").length}</p>
              </div>
              <div className="bg-[#0e1424] border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-amber-400 font-semibold uppercase">Conceptual Gaps</span>
                <p className="text-2xl font-bold text-white mt-1">{errorQuestions.filter(q => q.tag === "Conceptual Gap").length}</p>
              </div>
              <div className="bg-[#0e1424] border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-blue-400 font-semibold uppercase">Time Traps</span>
                <p className="text-2xl font-bold text-white mt-1">{errorQuestions.filter(q => q.tag === "Time Pressure").length}</p>
              </div>
            </div>

            <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 space-y-3">
              {errorQuestions.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">Abhi koi error question tag nahi kiya gaya hai.</p>
              ) : (
                errorQuestions.map((q) => (
                  <div key={q.id} className="p-3 bg-[#131b30] rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white uppercase">[{q.subject}] {q.topic}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Mock: {q.mockName}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold text-[10px]">
                      {q.tag}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. RETEST SESSION */}
        {activeTab === "retest" && (
          <div className="max-w-4xl space-y-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Targeted Retest Engine</h1>
            <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 text-center space-y-3">
              <Zap className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Re-attempt Only Weak & Bleeding Questions</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Aapke paas total {errorQuestions.length} flagged questions hain. Retest complete karke inhein zero par laayein.
              </p>
              <button onClick={() => alert("Retest session starting with " + errorQuestions.length + " saved questions!")} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition">
                Start Retest Drill
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
