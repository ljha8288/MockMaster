"use client";
import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, PlusCircle, CheckSquare, AlertCircle, 
  RotateCcw, Upload, Trash2, CheckCircle2, Image as ImageIcon,
  HelpCircle, Lightbulb, BookOpen, ChevronDown, ChevronUp, Eye
} from "lucide-react";

export default function OFMPlatform() {
  const [activeTab, setActiveTab] = useState("log");

  // Persistent storage
  const [mocks, setMocks] = useState<any[]>([]);
  const [errorQuestions, setErrorQuestions] = useState<any[]>([]);

  // 1. Mock Form State
  const [examPreset, setExamPreset] = useState("SSC CGL Tier 1");
  const [mockType, setMockType] = useState("Full Mock");
  const [platform, setPlatform] = useState("Testbook");
  const [mockName, setMockName] = useState("");
  const [scorecardImage, setScorecardImage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Section marks
  const [sections, setSections] = useState({
    reasoning: { correct: 0, wrong: 0, unattempted: 0, marks: 0 },
    gs: { correct: 0, wrong: 0, unattempted: 0, marks: 0 },
    maths: { correct: 0, wrong: 0, unattempted: 0, marks: 0 },
    english: { correct: 0, wrong: 0, unattempted: 0, marks: 0 },
  });

  // 2. Question Attachment / Error Copy State
  const [attachedQuestions, setAttachedQuestions] = useState<any[]>([]);
  const [qImage, setQImage] = useState<string | null>(null);
  const [qSubject, setQSubject] = useState("maths");
  const [qTopic, setQTopic] = useState("");
  const [qTag, setQTag] = useState("Silly Mistake");
  const [qWhyWrong, setQWhyWrong] = useState("");
  const [qLearnedNote, setQLearnedNote] = useState("");

  // Retest & Filter State
  const [selectedErrorFilter, setSelectedErrorFilter] = useState("ALL");
  const [retestIndex, setRetestIndex] = useState(0);
  const [showRetestAnswer, setShowRetestAnswer] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  // Load from Storage
  useEffect(() => {
    const m = localStorage.getItem("ofm_mocks");
    const e = localStorage.getItem("ofm_errors");
    if (m) setMocks(JSON.parse(m));
    if (e) setErrorQuestions(JSON.parse(e));
  }, []);

  const saveToDisk = (newMocks: any[], newErrors: any[]) => {
    setMocks(newMocks);
    setErrorQuestions(newErrors);
    localStorage.setItem("ofm_mocks", JSON.stringify(newMocks));
    localStorage.setItem("ofm_errors", JSON.stringify(newErrors));
  };

  // Drag & drop handlers
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

  // Run Scorecard AI Extraction
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
      alert("Scorecard data sections mein fill ho gaya!");
    } catch (err: any) {
      alert("AI Scan Error: " + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  // Add Question to List
  const handleAddQuestion = () => {
    if (!qTopic) return alert("Topic ya Chapter ka naam likhein!");
    if (!qWhyWrong) return alert("'Yeh sawal kyu galat hua?' likhna zaroori hai!");

    const newQuestion = {
      id: Date.now(),
      image: qImage,
      subject: qSubject,
      topic: qTopic,
      tag: qTag,
      whyWrong: qWhyWrong,
      learnedNote: qLearnedNote || "Revision needed.",
      date: new Date().toLocaleDateString("en-IN")
    };

    setAttachedQuestions([newQuestion, ...attachedQuestions]);
    // Reset Question Input
    setQImage(null);
    setQTopic("");
    setQWhyWrong("");
    setQLearnedNote("");
  };

  const removeAttachedQuestion = (id: number) => {
    setAttachedQuestions(attachedQuestions.filter(q => q.id !== id));
  };

  // Save Full Mock with Questions
  const handleSaveMock = () => {
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
      questionsCount: attachedQuestions.length,
      date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    };

    const questionsWithMockInfo = attachedQuestions.map(q => ({
      ...q,
      mockId,
      mockName: finalName
    }));

    const updatedMocks = [newMock, ...mocks];
    const updatedErrors = [...questionsWithMockInfo, ...errorQuestions];

    saveToDisk(updatedMocks, updatedErrors);
    alert("Mock aur saare Wrong Questions Error Copy mein save ho gaye!");

    // Reset Form
    setScorecardImage(null);
    setAttachedQuestions([]);
    setActiveTab("errors");
  };

  // Calculations for Dashboard
  const totalMocks = mocks.length;
  const avgScore = totalMocks ? (mocks.reduce((a, b) => a + Number(b.totalScore || 0), 0) / totalMocks).toFixed(1) : "0";
  const last3Avg = totalMocks >= 3 ? (mocks.slice(0, 3).reduce((a, b) => a + Number(b.totalScore || 0), 0) / 3).toFixed(1) : avgScore;

  const filteredErrors = selectedErrorFilter === "ALL" 
    ? errorQuestions 
    : errorQuestions.filter(q => q.subject === selectedErrorFilter || q.tag === selectedErrorFilter);

  return (
    <div className="flex h-screen bg-[#0a0e17] text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar - One Fight More Theme */}
      <aside className="w-64 bg-[#111726] border-r border-slate-800/80 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-600/30">
              OFM
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide text-white">One Fight More</h2>
              <p className="text-[11px] text-blue-400 font-medium">Personal Mock Studio</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: "log", label: "Log a Mock & Questions", icon: PlusCircle },
              { id: "dashboard", label: "Analytics Dashboard", icon: LayoutDashboard },
              { id: "errors", label: "Digital Error Copy", icon: AlertCircle },
              { id: "retest", label: "Retest Drill Session", icon: RotateCcw },
              { id: "attempted", label: "Attempted Mocks History", icon: CheckSquare },
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

        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Offline/Cloud Synced
          </span>
          <span className="text-[10px] text-slate-500 font-bold">{errorQuestions.length} Errors</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#0a0e17]">

        {/* 1. LOG A MOCK (FULL OFM WORKFLOW: SCORECARD + WRONG QUESTION ATTACHMENT) */}
        {activeTab === "log" && (
          <div className="max-w-5xl space-y-8 pb-16">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Log a Mock & Attach Questions</h1>
              <p className="text-xs text-slate-400 mt-1">Dual-tab workflow: Gallery/Explorer se scorecard aur galat questions seedhe drag karein</p>
            </div>

            {/* Top Meta Selectors */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Target Exam</label>
                <select value={examPreset} onChange={(e) => setExamPreset(e.target.value)} className="w-full bg-[#111726] border border-slate-700/70 rounded-xl p-2.5 text-xs text-white">
                  <option>SSC CGL Tier 1</option>
                  <option>SSC CGL Tier 2</option>
                  <option>SSC CHSL</option>
                  <option>SSC CPO</option>
                  <option>Banking / IBPS</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Mock Type</label>
                <select value={mockType} onChange={(e) => setMockType(e.target.value)} className="w-full bg-[#111726] border border-slate-700/70 rounded-xl p-2.5 text-xs text-white">
                  <option>Full Mock</option>
                  <option>Sectional Mock</option>
                  <option>Live Mock</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-[#111726] border border-slate-700/70 rounded-xl p-2.5 text-xs text-white">
                  <option>Testbook</option>
                  <option>Oliveboard</option>
                  <option>SuperProfs</option>
                  <option>Adda247</option>
                </select>
              </div>
            </div>

            {/* Step A: Scorecard Screenshot Drag & Drop */}
            <div className="bg-[#111726] border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span>Step 1:</span> Scorecard Screenshot Drop & AI Auto-Fill
              </h2>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleScorecardDrop}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center bg-[#0a0e17]/50 cursor-pointer transition"
              >
                {scorecardImage ? (
                  <div className="space-y-3">
                    <img src={scorecardImage} alt="Scorecard" className="max-h-48 mx-auto rounded-xl border border-slate-700 shadow-md" />
                    <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Scorecard Attached
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-blue-500 mx-auto" />
                    <p className="text-sm font-bold text-white">Drag & Drop Scorecard Screenshot Here</p>
                    <p className="text-xs text-slate-500">Doosre tab se score screenshot yahan drop karein</p>
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

              {/* Section Breakdown Inputs */}
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
                      className="bg-[#0a0e17] border border-slate-700 p-1.5 rounded-lg text-xs text-white"
                    />
                    <input
                      type="number"
                      value={sections[sec].wrong}
                      onChange={(e) => setSections({ ...sections, [sec]: { ...sections[sec], wrong: Number(e.target.value) } })}
                      className="bg-[#0a0e17] border border-slate-700 p-1.5 rounded-lg text-xs text-white"
                    />
                    <input
                      type="number"
                      value={sections[sec].marks}
                      onChange={(e) => setSections({ ...sections, [sec]: { ...sections[sec], marks: Number(e.target.value) } })}
                      className="bg-[#0a0e17] border border-slate-700 p-1.5 rounded-lg text-xs text-blue-400 font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Step B: Wrong / Skipped Question Attachment (THE CORE OFM FEATURE) */}
            <div className="bg-[#111726] border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    <span>Step 2:</span> Attach Wrong Questions (Digital Error Copy)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Question screenshot attach karein + galti kyu hui + kya seekha note karein</p>
                </div>
                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-3 py-1 rounded-full font-bold">
                  {attachedQuestions.length} Attached
                </span>
              </div>

              {/* Question Image Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleQuestionDrop}
                className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl p-5 text-center bg-[#0a0e17]/50 cursor-pointer transition"
              >
                {qImage ? (
                  <div className="space-y-2">
                    <img src={qImage} alt="Question" className="max-h-44 mx-auto rounded-lg border border-slate-700" />
                    <button onClick={() => setQImage(null)} className="text-[11px] text-rose-400 hover:underline">Remove Screenshot</button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <ImageIcon className="w-7 h-7 text-rose-400 mx-auto" />
                    <p className="text-xs font-bold text-white">Drag & Drop Question Screenshot Here</p>
                    <p className="text-[11px] text-slate-500">Test analysis window se galat question ka snapshot yahan drag karein</p>
                    <input type="file" accept="image/*" onChange={handleQuestionDrop} className="text-xs text-slate-400 mt-1" />
                  </div>
                )}
              </div>

              {/* Question Details Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Subject</label>
                  <select value={qSubject} onChange={(e) => setQSubject(e.target.value)} className="w-full bg-[#0a0e17] border border-slate-700 rounded-xl p-2 text-xs text-white">
                    <option value="maths">Quantitative Aptitude</option>
                    <option value="reasoning">Reasoning</option>
                    <option value="gs">General Awareness (GS)</option>
                    <option value="english">English Language</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Chapter / Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Mensuration / Syllogism"
                    value={qTopic}
                    onChange={(e) => setQTopic(e.target.value)}
                    className="w-full bg-[#0a0e17] border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Mistake Category (Tag)</label>
                  <select value={qTag} onChange={(e) => setQTag(e.target.value)} className="w-full bg-[#0a0e17] border border-slate-700 rounded-xl p-2 text-xs text-white">
                    <option>Silly Mistake (Calculation)</option>
                    <option>Conceptual Gap (Rule bhool gaya)</option>
                    <option>Question Not Read Carefully</option>
                    <option>Time Pressure Trap</option>
                    <option>Fluke / Guessed</option>
                  </select>
                </div>
              </div>

              {/* Why it went wrong & What was learned */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-rose-400 font-semibold block mb-1 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> Yeh Sawal Kyu Galat Hua? (Reason)
                  </label>
                  <textarea
                    rows={2}
                    value={qWhyWrong}
                    onChange={(e) => setQWhyWrong(e.target.value)}
                    placeholder="e.g., Question mein 'Incorrect' poocha tha aur maine 'Correct' mark kar diya..."
                    className="w-full bg-[#0a0e17] border border-slate-700 rounded-xl p-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-emerald-400 font-semibold block mb-1 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Isse Kya Seekha? (Key Formula / Rule Notes)
                  </label>
                  <textarea
                    rows={2}
                    value={qLearnedNote}
                    onChange={(e) => setQLearnedNote(e.target.value)}
                    placeholder="e.g., Formula: Area = 1/2 * d1 * d2. Always re-read the last line carefully."
                    className="w-full bg-[#0a0e17] border border-slate-700 rounded-xl p-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleAddQuestion}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition border border-slate-700"
              >
                + Attach This Question to Mock
              </button>

              {/* List of currently attached questions */}
              {attachedQuestions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-300">Ready to Save ({attachedQuestions.length} Questions):</span>
                  <div className="grid grid-cols-2 gap-3">
                    {attachedQuestions.map((q, idx) => (
                      <div key={q.id} className="bg-[#0a0e17] p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white uppercase">#{idx + 1} [{q.subject}] {q.topic}</span>
                          <button onClick={() => removeAttachedQuestion(q.id)} className="text-slate-500 hover:text-rose-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="inline-block bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                          {q.tag}
                        </span>
                        <p className="text-slate-300 text-[11px]"><strong>Mistake:</strong> {q.whyWrong}</p>
                        <p className="text-emerald-400 text-[11px]"><strong>Key Learn:</strong> {q.learnedNote}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Final Save Button */}
            <button
              onClick={handleSaveMock}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl transition text-sm shadow-xl shadow-emerald-600/20"
            >
              Confirm & Save Full Mock to Error Copy
            </button>
          </div>
        )}

        {/* 2. DIGITAL ERROR COPY (THE COMPLETE QUESTION NOTEBOOK) */}
        {activeTab === "errors" && (
          <div className="max-w-6xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Digital Error Notebook (Error Copy)</h1>
                <p className="text-xs text-slate-400 mt-0.5">Sawaal ke screenshots, galati ki wajah aur seekhe hue formulas</p>
              </div>
              <button onClick={() => setActiveTab("retest")} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
                Start Retest Drill
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 text-xs overflow-x-auto pb-1">
              {["ALL", "maths", "reasoning", "gs", "english", "Silly Mistake (Calculation)", "Conceptual Gap (Rule bhool gaya)"].map((flt) => (
                <button
                  key={flt}
                  onClick={() => setSelectedErrorFilter(flt)}
                  className={`px-3 py-1.5 rounded-lg font-bold capitalize transition ${
                    selectedErrorFilter === flt ? "bg-blue-600 text-white" : "bg-[#111726] text-slate-400 hover:text-white"
                  }`}
                >
                  {flt}
                </button>
              ))}
            </div>

            {/* Error Question Cards */}
            {filteredErrors.length === 0 ? (
              <div className="bg-[#111726] border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                Koi questions match nahi hue. "Log a Mock" par jakar apne galat questions attach karein!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredErrors.map((q) => (
                  <div key={q.id} className="bg-[#111726] border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-black text-sm text-white uppercase">[{q.subject}] {q.topic}</span>
                        <p className="text-[10px] text-slate-500">{q.mockName} • {q.date}</p>
                      </div>
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {q.tag}
                      </span>
                    </div>

                    {/* Screenshot view */}
                    {q.image && (
                      <div className="relative group cursor-pointer" onClick={() => setPreviewModalImage(q.image)}>
                        <img src={q.image} alt="Question" className="max-h-40 w-full object-contain bg-black/40 rounded-xl border border-slate-800" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-xl">
                          <span className="text-white text-xs font-bold flex items-center gap-1"><Eye className="w-4 h-4" /> Expand View</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 text-xs bg-[#0a0e17] p-3 rounded-xl border border-slate-800/80">
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

        {/* 3. RETEST SESSION (TEST ONLY WEAK QUESTIONS) */}
        {activeTab === "retest" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-black text-white tracking-tight">Interactive Retest Drill</h1>
            {errorQuestions.length === 0 ? (
              <div className="bg-[#111726] border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                Retest ke liye koi questions nahi hain. Pehle mock me galat questions attach karein.
              </div>
            ) : (
              <div className="bg-[#111726] border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">Question {retestIndex + 1} of {errorQuestions.length}</span>
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md font-bold uppercase">
                    {errorQuestions[retestIndex].subject}
                  </span>
                </div>

                {errorQuestions[retestIndex].image ? (
                  <img src={errorQuestions[retestIndex].image} alt="Retest Question" className="max-h-64 mx-auto rounded-xl border border-slate-700" />
                ) : (
                  <div className="p-8 text-center bg-[#0a0e17] rounded-xl text-slate-400 font-bold">
                    Topic: {errorQuestions[retestIndex].topic}
                  </div>
                )}

                <button
                  onClick={() => setShowRetestAnswer(!showRetestAnswer)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  {showRetestAnswer ? "Hide Mistake & Formula" : "Reveal Why it Failed & Formula"}
                </button>

                {showRetestAnswer && (
                  <div className="bg-[#0a0e17] p-4 rounded-xl border border-slate-800 space-y-2 text-xs animate-fadeIn">
                    <p className="text-rose-400"><strong>Original Mistake:</strong> {errorQuestions[retestIndex].whyWrong}</p>
                    <p className="text-emerald-400"><strong>Concept / Formula:</strong> {errorQuestions[retestIndex].learnedNote}</p>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    disabled={retestIndex === 0}
                    onClick={() => { setRetestIndex(retestIndex - 1); setShowRetestAnswer(false); }}
                    className="bg-slate-800 disabled:opacity-40 px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Previous
                  </button>
                  <button
                    disabled={retestIndex === errorQuestions.length - 1}
                    onClick={() => { setRetestIndex(retestIndex + 1); setShowRetestAnswer(false); }}
                    className="bg-blue-600 disabled:opacity-40 px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className="max-w-6xl space-y-6">
            <h1 className="text-2xl font-black text-white tracking-tight">Performance & Readiness Dashboard</h1>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#111726] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-bold">Mocks Logged</span>
                <p className="text-3xl font-black text-white mt-1">{totalMocks}</p>
              </div>
              <div className="bg-[#111726] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-bold">Overall Average</span>
                <p className="text-3xl font-black text-blue-400 mt-1">{avgScore} <span className="text-xs text-slate-500">/ 200</span></p>
              </div>
              <div className="bg-[#111726] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-bold">Total Bleeding Questions</span>
                <p className="text-3xl font-black text-rose-400 mt-1">{errorQuestions.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* 5. ATTEMPTED MOCKS HISTORY */}
        {activeTab === "attempted" && (
          <div className="max-w-5xl space-y-4">
            <h1 className="text-2xl font-black text-white tracking-tight">Attempted Mocks Log</h1>
            {mocks.map((m) => (
              <div key={m.id} className="bg-[#111726] border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white text-base">{m.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{m.platform} • {m.examPreset} • {m.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-400">{m.totalScore}</span>
                  <span className="text-xs text-slate-500 block">{m.questionsCount} questions tagged</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Image Modal for Full View */}
      {previewModalImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setPreviewModalImage(null)}>
          <div className="max-w-4xl max-h-[90vh] bg-[#111726] p-2 rounded-2xl">
            <img src={previewModalImage} alt="Expanded View" className="max-h-[85vh] rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
