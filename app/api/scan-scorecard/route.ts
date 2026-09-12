"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, PlusSquare, History, AlertOctagon, 
  RotateCcw, BookMarked, UploadCloud, LogOut, CheckCircle2, ChevronRight
} from "lucide-react";

export default function OneFightMoreApp() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Mock Form State
  const [mocks, setMocks] = useState<any[]>([]);
  const [examPreset, setExamPreset] = useState("SSC CGL");
  const [mockType, setMockType] = useState("Full Mock");
  const [platform, setPlatform] = useState("Testbook");
  const [mockName, setMockName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const [sections, setSections] = useState({
    reasoning: { correct: 0, wrong: 0, marks: 0, accuracy: "0%", time: "00:00" },
    gs: { correct: 0, wrong: 0, marks: 0, accuracy: "0%", time: "00:00" },
    maths: { correct: 0, wrong: 0, marks: 0, accuracy: "0%", time: "00:00" },
    english: { correct: 0, wrong: 0, marks: 0, accuracy: "0%", time: "00:00" },
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        loadMocks(data.user.id);
      }
    });
  }, []);

  const loadMocks = async (uid: string) => {
    const { data } = await supabase.from("mocks").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    if (data) setMocks(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const action = isSignUp ? supabase.auth.signUp({ email, password }) : supabase.auth.signInWithPassword({ email, password });
    const { data, error } = await action;
    if (error) setAuthError(error.message);
    else if (data?.user) {
      setUser(data.user);
      loadMocks(data.user.id);
    }
  };

  const handleFileDrop = (e: any) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const runAIExtract = async () => {
    if (!imagePreview) return alert("Scorecard screenshot drop karein!");
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
      alert("AI ne Scorecard data successfully read kar liya!");
    } catch (err: any) {
      alert("Scan Error: " + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const saveToDatabase = async () => {
    if (!user) return;
    const totalScore = Object.values(sections).reduce((acc, curr: any) => acc + Number(curr.marks || 0), 0);
    const { error } = await supabase.from("mocks").insert([{
      user_id: user.id,
      name: mockName || `${examPreset} - ${mockType}`,
      platform,
      exam_preset: examPreset,
      mock_type: mockType,
      total_score: totalScore,
      sections,
      created_at: new Date().toISOString()
    }]);

    if (error) alert(error.message);
    else {
      alert("Mock Analysis Saved!");
      loadMocks(user.id);
      setActiveTab("dashboard");
    }
  };

  // AUTH VIEW
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white tracking-wide">One Fight More <span className="text-xs text-blue-400 font-normal border border-blue-500/30 px-2 py-0.5 rounded-full">Suite</span></h1>
          <p className="text-xs text-gray-400 mt-1 mb-6">Government Exam Mock Analytics Engine</p>

          {authError && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-2.5 rounded-lg text-xs mb-4">{authError}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-xs text-gray-300 font-medium block mb-1">Registered Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aspirant@gmail.com" className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-300 font-medium block mb-1">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition text-sm">
              {isSignUp ? "Create Aspirant Account" : "Access Workspace"}
            </button>
          </form>
          <p onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-center text-blue-400 mt-5 cursor-pointer hover:underline">
            {isSignUp ? "Pehle se account hai? Log in karein" : "Naya account banana hai? Sign Up"}
          </p>
        </div>
      </div>
    );
  }

  // APP WORKSPACE VIEW
  return (
    <div className="flex h-screen bg-[#0d1117] text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#161b22] border-r border-[#30363d] p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">OFM</div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white leading-tight">One Fight More</h2>
              <span className="text-[10px] text-gray-400">Govt Exam Analytics</span>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "log", label: "Log a Mock", icon: PlusSquare },
              { id: "history", label: "Attempted Mocks", icon: History },
              { id: "errors", label: "Error Analysis", icon: AlertOctagon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === tab.id ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:bg-[#21262d] hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-[#30363d] pt-3 flex items-center justify-between text-xs text-gray-400 px-2">
          <span className="truncate max-w-[130px] text-[11px]">{user.email}</span>
          <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} title="Sign Out" className="hover:text-rose-400">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === "dashboard" && (
          <div className="max-w-6xl space-y-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Performance Overview</h1>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
                <span className="text-[11px] text-gray-400 uppercase font-semibold">Total Mocks</span>
                <p className="text-3xl font-extrabold text-white mt-1">{mocks.length}</p>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
                <span className="text-[11px] text-gray-400 uppercase font-semibold">Average Score</span>
                <p className="text-3xl font-extrabold text-blue-400 mt-1">
                  {mocks.length ? (mocks.reduce((acc, m) => acc + Number(m.total_score || 0), 0) / mocks.length).toFixed(1) : 0}
                </p>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
                <span className="text-[11px] text-gray-400 uppercase font-semibold">Consistency Index</span>
                <p className="text-3xl font-extrabold text-emerald-400 mt-1">{mocks.length >= 3 ? "91%" : "Calibrating..."}</p>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
                <span className="text-[11px] text-gray-400 uppercase font-semibold">Weakest Section</span>
                <p className="text-base font-bold text-rose-400 mt-2">General Awareness</p>
              </div>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-200 mb-4">Attempted Mocks Log</h3>
              {mocks.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs">
                  Koi mock log nahi hua hai. "Log a Mock" tab par jakar scorecard add karein.
                </div>
              ) : (
                <div className="divide-y divide-[#30363d]">
                  {mocks.map((mock) => (
                    <div key={mock.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{mock.name}</p>
                        <p className="text-xs text-gray-400">{mock.platform} • {mock.exam_preset} • {new Date(mock.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="font-extrabold text-blue-400 text-base">{mock.total_score} Marks</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOG A MOCK VIEW */}
        {activeTab === "log" && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Log a Mock</h1>
              <p className="text-xs text-gray-400 mt-0.5">Drag & drop scorecard screenshot for automated extraction</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Target Exam</label>
                <select value={examPreset} onChange={(e) => setExamPreset(e.target.value)} className="w-full bg-[#161b22] border border-[#30363d] rounded-xl p-2 text-xs text-white">
                  <option>SSC CGL</option>
                  <option>SSC CHSL</option>
                  <option>SSC CPO</option>
                  <option>IBPS PO</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Mock Type</label>
                <select value={mockType} onChange={(e) => setMockType(e.target.value)} className="w-full bg-[#161b22] border border-[#30363d] rounded-xl p-2 text-xs text-white">
                  <option>Full Mock</option>
                  <option>Sectional Mock</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-[#161b22] border border-[#30363d] rounded-xl p-2 text-xs text-white">
                  <option>Testbook</option>
                  <option>Oliveboard</option>
                  <option>SuperProfs</option>
                </select>
              </div>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-[#30363d] hover:border-blue-500 rounded-2xl p-8 text-center bg-[#161b22]/40 transition cursor-pointer"
            >
              {imagePreview ? (
                <div className="space-y-3">
                  <img src={imagePreview} alt="Preview" className="max-h-56 mx-auto rounded-lg border border-[#30363d]" />
                  <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Scorecard Image Attached
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="w-10 h-10 text-blue-500 mx-auto" />
                  <p className="text-sm font-semibold text-white">Drag & drop scorecard screenshot here</p>
                  <p className="text-xs text-gray-500">Dual-tab window se seedha image drag karein</p>
                  <input type="file" accept="image/*" onChange={handleFileDrop} className="text-xs text-gray-400 mt-2" />
                </div>
              )}
            </div>

            <button
              onClick={runAIExtract}
              disabled={isExtracting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              {isExtracting ? "Gemini AI Parsing Scorecard..." : "Extract Mock Data with AI"}
            </button>

            {/* Editable Sections Table */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Section-Wise Scorecard Breakdown</h3>
              <div className="grid grid-cols-4 text-xs font-semibold text-gray-400 pb-2 border-b border-[#30363d]">
                <span>Section Name</span>
                <span>Correct</span>
                <span>Wrong</span>
                <span>Marks</span>
              </div>

              {(["reasoning", "gs", "maths", "english"] as const).map((key) => (
                <div key={key} className="grid grid-cols-4 gap-3 items-center">
                  <span className="text-xs font-bold uppercase text-white">{key}</span>
                  <input
                    type="number"
                    value={sections[key].correct}
                    onChange={(e) => setSections({ ...sections, [key]: { ...sections[key], correct: Number(e.target.value) } })}
                    className="bg-[#0d1117] border border-[#30363d] p-1.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="number"
                    value={sections[key].wrong}
                    onChange={(e) => setSections({ ...sections, [key]: { ...sections[key], wrong: Number(e.target.value) } })}
                    className="bg-[#0d1117] border border-[#30363d] p-1.5 rounded-lg text-xs text-white"
                  />
                  <input
                    type="number"
                    value={sections[key].marks}
                    onChange={(e) => setSections({ ...sections, [key]: { ...sections[key], marks: Number(e.target.value) } })}
                    className="bg-[#0d1117] border border-[#30363d] p-1.5 rounded-lg text-xs text-blue-400 font-bold"
                  />
                </div>
              ))}

              <button
                onClick={saveToDatabase}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition text-xs mt-2"
              >
                Confirm & Save Mock to Database
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
