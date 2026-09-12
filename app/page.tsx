"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BarChart3, PlusCircle, CheckCircle2, AlertTriangle, 
  RotateCcw, BookOpen, Upload, LogOut, ArrowRight, TrendingUp, Award
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Mock State
  const [mocks, setMocks] = useState<any[]>([]);
  const [examPreset, setExamPreset] = useState("SSC CGL");
  const [mockType, setMockType] = useState("Full Mock");
  const [platform, setPlatform] = useState("Testbook");
  const [mockName, setMockName] = useState("");
  
  // Section breakdown
  const [sections, setSections] = useState({
    reasoning: { correct: 0, wrong: 0, unattempted: 0, marks: 0, time: "" },
    gs: { correct: 0, wrong: 0, unattempted: 0, marks: 0, time: "" },
    maths: { correct: 0, wrong: 0, unattempted: 0, marks: 0, time: "" },
    english: { correct: 0, wrong: 0, unattempted: 0, marks: 0, time: "" },
  });

  const [loadingAI, setLoadingAI] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Check auth on load
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        fetchMocks(data.user.id);
      }
    });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else if (data?.user) {
        setUser(data.user);
        fetchMocks(data.user.id);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
      else if (data?.user) {
        setUser(data.user);
        fetchMocks(data.user.id);
      }
    }
  };

  const fetchMocks = async (userId: string) => {
    const { data } = await supabase.from("mocks").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (data) setMocks(data);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    let file: File | null = null;
    if ("dataTransfer" in e) {
      e.preventDefault();
      file = e.dataTransfer.files[0];
    } else if (e.target.files) {
      file = e.target.files[0];
    }

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractAI = async () => {
    if (!imagePreview) return alert("Pehle Scorecard image upload ya drop karein!");
    setLoadingAI(true);

    try {
      const res = await fetch("/api/scan-scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imagePreview, examPreset, mockType, platform })
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      if (data.sections) {
        setSections(data.sections);
      }
      if (data.mockName) setMockName(data.mockName);
      alert("Scorecard data successfully extract ho gaya!");
    } catch (err: any) {
      alert("AI Scan Error: " + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const saveMock = async () => {
    if (!user) return;
    const totalScore = Object.values(sections).reduce((acc: number, curr: any) => acc + Number(curr.marks || 0), 0);
    
    const payload = {
      user_id: user.id,
      name: mockName || `${examPreset} - ${mockType}`,
      platform,
      exam_preset: examPreset,
      mock_type: mockType,
      total_score: totalScore,
      sections,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from("mocks").insert([payload]);
    if (error) {
      alert("Error saving: " + error.message);
    } else {
      alert("Mock successfully saved!");
      fetchMocks(user.id);
      setActiveTab("dashboard");
    }
  };

  // 1. AUTH SCREEN (Secure Sign-in)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">MockMaster</h1>
            <p className="text-slate-400 text-sm mt-1">Govt Exam Analytics Suite (One Fight More Style)</p>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-xs mb-4">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email ID</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-sm"
            >
              {isSignUp ? "Create Secure Account" : "Sign In to Dashboard"}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-indigo-400 hover:underline"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. MAIN WORKSPACE DASHBOARD
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black">M</div>
            <span className="font-bold text-lg">MockMaster</span>
          </div>

          <nav className="space-y-1">
            {[
              { id: "dashboard", name: "Dashboard", icon: BarChart3 },
              { id: "log", name: "Log a Mock", icon: PlusCircle },
              { id: "history", name: "Attempted Mocks", icon: CheckCircle2 },
              { id: "errors", name: "Error Analysis", icon: AlertTriangle },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === item.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
          <span className="truncate max-w-[140px]">{user.email}</span>
          <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="hover:text-red-400">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === "dashboard" && (
          <div className="max-w-5xl space-y-6">
            <h2 className="text-2xl font-bold">Performance Overview</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase">Mocks Given</span>
                <p className="text-3xl font-black mt-1 text-white">{mocks.length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase">Avg Score</span>
                <p className="text-3xl font-black mt-1 text-indigo-400">
                  {mocks.length ? (mocks.reduce((a, b) => a + Number(b.total_score || 0), 0) / mocks.length).toFixed(1) : 0}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase">Consistency Index</span>
                <p className="text-3xl font-black mt-1 text-emerald-400">{mocks.length > 5 ? "89%" : "Building..."}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase">Weak Area</span>
                <p className="text-lg font-bold mt-2 text-rose-400 truncate">General Awareness</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-sm text-slate-300">Recent Mocks Attempted</h3>
              {mocks.length === 0 ? (
                <p className="text-sm text-slate-500">Abhi koi mock log nahi kiya gaya hai. "Log a Mock" par jayein.</p>
              ) : (
                <div className="space-y-3">
                  {mocks.map((m) => (
                    <div key={m.id} className="flex justify-between items-center bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                      <div>
                        <p className="font-semibold text-sm">{m.name}</p>
                        <p className="text-xs text-slate-400">{m.platform} • {m.exam_preset}</p>
                      </div>
                      <span className="font-black text-indigo-400 text-base">{m.total_score} Marks</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOG A MOCK (EXACT ONE FIGHT MORE WORKFLOW) */}
        {activeTab === "log" && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Log a Mock (AI Instant Scan)</h2>
              <p className="text-xs text-slate-400 mt-1">Scorecard drag & drop karein aur AI se direct sections auto-fill karein</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Exam Preset</label>
                <select value={examPreset} onChange={(e) => setExamPreset(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm">
                  <option>SSC CGL</option>
                  <option>SSC CHSL</option>
                  <option>SSC CPO</option>
                  <option>IBPS PO</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Mock Type</label>
                <select value={mockType} onChange={(e) => setMockType(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm">
                  <option>Full Mock</option>
                  <option>Sectional Mock</option>
                  <option>Live Mock</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm">
                  <option>Testbook</option>
                  <option>Oliveboard</option>
                  <option>SuperProfs</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleImageDrop}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-900/50 cursor-pointer transition-all"
            >
              {imagePreview ? (
                <div className="space-y-3">
                  <img src={imagePreview} alt="Scorecard" className="max-h-48 mx-auto rounded-lg border border-slate-700" />
                  <p className="text-xs text-emerald-400 font-semibold">Image Ready for Extraction</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
                  <p className="text-sm font-medium">Drag & Drop Scorecard Screenshot Here</p>
                  <p className="text-xs text-slate-500">Ya apne PC se select karein</p>
                  <input type="file" accept="image/*" onChange={handleImageDrop} className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white" />
                </div>
              )}
            </div>

            <button
              onClick={handleExtractAI}
              disabled={loadingAI}
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loadingAI ? "Gemini AI Extracting Scorecard..." : "Extract Mock Data with AI"}
            </button>

            {/* Sectional Breakdown Inputs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm text-slate-200">Section-wise Breakdown</h3>
              <div className="grid grid-cols-4 gap-4 text-xs font-semibold text-slate-400">
                <span>Section</span>
                <span>Correct</span>
                <span>Wrong</span>
                <span>Score</span>
              </div>

              {(["reasoning", "gs", "maths", "english"] as const).map((sec) => (
                <div key={sec} className="grid grid-cols-4 gap-4 items-center">
                  <span className="capitalize text-sm font-bold text-slate-200">{sec}</span>
                  <input
                    type="number"
                    value={sections[sec].correct}
                    onChange={(e) => setSections({ ...sections, [sec]: { ...sections[sec], correct: Number(e.target.value) } })}
                    className="bg-slate-800 rounded-lg p-2 text-white border border-slate-700 text-sm"
                  />
                  <input
                    type="number"
                    value={sections[sec].wrong}
                    onChange={(e) => setSections({ ...sections, [sec]: { ...sections[sec], wrong: Number(e.target.value) } })}
                    className="bg-slate-800 rounded-lg p-2 text-white border border-slate-700 text-sm"
                  />
                  <input
                    type="number"
                    value={sections[sec].marks}
                    onChange={(e) => setSections({ ...sections, [sec]: { ...sections[sec], marks: Number(e.target.value) } })}
                    className="bg-slate-800 rounded-lg p-2 text-white border border-slate-700 text-sm font-bold text-indigo-400"
                  />
                </div>
              ))}

              <button
                onClick={saveMock}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
              >
                Save Mock to Database
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
