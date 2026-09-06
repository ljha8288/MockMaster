"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  PlusCircle,
  CheckSquare,
  Target,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Camera,
  Loader2,
  Trash2,
  Crown,
  LogOut,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function MockMasterApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanningAI, setScanningAI] = useState(false);

  // Real Mock state
  const [mocks, setMocks] = useState<any[]>([]);
  const [formMockTitle, setFormMockTitle] = useState("");
  const [formPlatform, setFormPlatform] = useState("Oliveboard");
  const [formScore, setFormScore] = useState<number | string>("");
  const [formAccuracy, setFormAccuracy] = useState<number | string>("");
  const [formAttempted, setFormAttempted] = useState<number | string>("");
  const [formCorrect, setFormCorrect] = useState<number | string>("");
  const [formWrong, setFormWrong] = useState<number | string>("");
  const [formTimeSpent, setFormTimeSpent] = useState("");

  const [questions, setQuestions] = useState<any[]>([
    {
      section: "Reasoning Ability",
      chapter: "Analogy",
      reason: "Calculation",
      status: "Wrong",
      note: "Trick formula pending",
    },
  ]);

  // Check user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        loadUserMocks(session.user.id);
      }
    });
  }, []);

  async function loadUserMocks(userId: string) {
    const { data } = await supabase
      .from("mocks")
      .select("*, mock_questions(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (data) setMocks(data);
  }

  // Auth Handler
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    let { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });
    if (error) {
      const res = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      data = res.data;
      error = res.error;
    }
    setLoading(false);
    if (error) {
      alert(error.message);
    } else if (data?.user) {
      setUserEmail(data.user.email || authEmail);
      loadUserMocks(data.user.id);
    }
  }

  // AI Screenshot Upload & Parse
  async function handleScreenshotUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningAI(true);
    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/scan-scorecard", {
        method: "POST",
        body: fd,
      });
      const result = await res.json();

      if (result.success && result.data) {
        const d = result.data;
        setFormMockTitle(d.mockTitle || "Scanned Mock Test");
        setFormPlatform(d.platform || "Oliveboard");
        setFormScore(d.score ?? 0);
        setFormAccuracy(d.accuracy ?? 0);
        setFormAttempted(d.attempted ?? 0);
        setFormCorrect(d.correct ?? 0);
        setFormWrong(d.wrong ?? 0);
        setFormTimeSpent(d.timeSpent || "45m 00s");
        alert("✓ AI ने स्कोरकार्ड सफलता से स्कैन कर लिया!");
      } else {
        alert("AI scan error: " + (result.error || "Please check image"));
      }
    } catch (err: any) {
      alert("Error scanning image: " + err.message);
    } finally {
      setScanningAI(false);
    }
  }

  // Save Full Mock
  async function handleSaveMock() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return alert("Please login first");

    setLoading(true);
    const { data: mockData, error: mockErr } = await supabase
      .from("mocks")
      .insert({
        user_id: session.user.id,
        title: formMockTitle || "Full Mock Test",
        platform: formPlatform,
        score: parseFloat(String(formScore)) || 0,
        accuracy: parseFloat(String(formAccuracy)) || 0,
        attempted: parseInt(String(formAttempted)) || 0,
        correct: parseInt(String(formCorrect)) || 0,
        wrong: parseInt(String(formWrong)) || 0,
        time_spent: formTimeSpent,
      })
      .select()
      .single();

    if (mockErr) {
      setLoading(false);
      return alert(mockErr.message);
    }

    // Save Questions
    const questionsToInsert = questions.map((q, i) => ({
      mock_id: mockData.id,
      user_id: session.user.id,
      q_no: i + 1,
      section: q.section,
      chapter: q.chapter || "General",
      mistake_reason: q.reason,
      status: q.status,
      learning_note: q.note,
    }));

    await supabase.from("mock_questions").insert(questionsToInsert);
    await loadUserMocks(session.user.id);
    setLoading(false);
    alert("✓ Mock Analysis Successfully Saved!");
    setActiveTab("dashboard");
  }

  // Derived Analytics
  const totalMocks = mocks.length;
  const avgScore = totalMocks
    ? (mocks.reduce((a, b) => a + Number(b.score), 0) / totalMocks).toFixed(1)
    : "0.0";
  const bestScore = totalMocks
    ? Math.max(...mocks.map((m) => Number(m.score))).toFixed(1)
    : "0.0";
  const ofmIndex = totalMocks
    ? Math.round((Number(avgScore) / 200) * 60 + 35)
    : 0;

  // Render Login Modal if not logged in
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xl">M</div>
            <h1 className="text-2xl font-black text-slate-900">MockMaster</h1>
          </div>
          <p className="text-xs text-slate-500 mb-6">Government Exam Mock Analysis Platform (Free Access)</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Email Address</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="your-email@gmail.com"
                className="w-full mt-1 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Password</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 sticky top-0 h-screen overflow-y-auto shrink-0">
        <div>
          <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-100 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-base">M</div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight block leading-tight">MockMaster</span>
              <span className="text-[10px] text-slate-400 font-medium">Govt Exam Analytics</span>
            </div>
          </div>

          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-[10px] font-black text-blue-900 uppercase">Current Plan</p>
                <p className="text-xs font-bold text-blue-950">Free Tier</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 mb-2">Mock Analysis Tools</div>
          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "logMock", label: "Log a Mock", icon: PlusCircle },
              { id: "attempted", label: "Attempted", icon: CheckSquare },
              { id: "weakTopics", label: "Weak Topics", icon: Target },
              { id: "errorAnalysis", label: "Error Analysis", icon: AlertTriangle },
              { id: "retest", label: "Retest Session", icon: RotateCcw },
              { id: "pyq", label: "PYQ Tracker", icon: BookOpen },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === item.id
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-xs font-bold text-slate-800 truncate">{userEmail}</p>
            <span className="text-[10px] text-emerald-600 font-bold">● Active Session</span>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => setUserEmail(null))}
            title="Logout"
            className="text-slate-400 hover:text-rose-600 p-1.5"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 capitalize">{activeTab}</h1>
            <p className="text-xs text-slate-500">Track your exam readiness, accuracy trends & errors</p>
          </div>
          <button
            onClick={() => setActiveTab("logMock")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            + Log New Mock
          </button>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-xs font-bold text-slate-400 uppercase">OFM Index</span>
                <div className="my-3 inline-flex items-center justify-center w-24 h-24 rounded-full border-8 border-blue-500/20 border-t-blue-600">
                  <span className="text-3xl font-black text-slate-900">{ofmIndex}</span>
                </div>
                <p className="text-xs font-bold text-emerald-600">
                  {ofmIndex > 70 ? "Good Readiness" : "Log Mocks to Build Score"}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Mocks Logged</span>
                <div>
                  <p className="text-4xl font-black text-slate-900">{totalMocks}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Last: {mocks[totalMocks - 1]?.created_at?.slice(0, 10) || "None"}
                  </p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, totalMocks * 10)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Average Mock Score</span>
                <div>
                  <p className="text-4xl font-black text-slate-900">{avgScore}</p>
                  <p className="text-xs text-slate-400 mt-1">Out of 200 Marks</p>
                </div>
                <p className="text-[11px] text-slate-400">Target Cutoff: ~150+</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Best Mock Score</span>
                <div>
                  <p className="text-4xl font-black text-emerald-600">{bestScore}</p>
                  <p className="text-xs text-slate-500 mt-1">Top Score Logged</p>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-center">
                  Score Tracker Active
                </span>
              </div>
            </div>

            {/* REAL ACCURACY GRAPH */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Chronological Score & Accuracy Trend</h2>
              {mocks.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mocks}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="title" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 200]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No mock data yet. Go to "Log a Mock" tab or upload a scorecard screenshot to render your trend graph.
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOG A MOCK TAB */}
        {activeTab === "logMock" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            {/* AI Auto-Fill Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-blue-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  AI Result Screenshot Auto-Fill (Gemini Vision)
                </h3>
                <p className="text-xs text-blue-700 mt-0.5">
                  Testbook ya Oliveboard ka scorecard image upload karein. AI auto-read karke exact score aur accuracy bhar dega!
                </p>
              </div>
              <div>
                <input
                  type="file"
                  id="screenshotUpload"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />
                <button
                  disabled={scanningAI}
                  onClick={() => document.getElementById("screenshotUpload")?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  {scanningAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {scanningAI ? "Scanning Image with AI..." : "Upload Scorecard Screenshot"}
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Mock Title</label>
                <input
                  value={formMockTitle}
                  onChange={(e) => setFormMockTitle(e.target.value)}
                  placeholder="e.g. SSC CGL Tier 1 Mock 05"
                  className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Platform</label>
                <select
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white outline-none"
                >
                  <option>Oliveboard</option>
                  <option>Testbook</option>
                  <option>RBE Revolution</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Score (Marks)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formScore}
                  onChange={(e) => setFormScore(e.target.value)}
                  placeholder="152.5"
                  className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Accuracy (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formAccuracy}
                  onChange={(e) => setFormAccuracy(e.target.value)}
                  placeholder="88.5"
                  className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white outline-none font-bold text-emerald-600"
                />
              </div>
            </div>

            {/* Error Questions */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Question Mistake Log (Enter incorrect & skipped questions)
              </h4>
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-md border text-slate-800">
                        Question #{idx + 1}
                      </span>
                      <button
                        onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                        className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Section</label>
                        <select
                          value={q.section}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[idx].section = e.target.value;
                            setQuestions(updated);
                          }}
                          className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-xs bg-white"
                        >
                          <option>Reasoning Ability</option>
                          <option>Quantitative Aptitude</option>
                          <option>English Language</option>
                          <option>General Awareness</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Chapter / Topic</label>
                        <input
                          value={q.chapter}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[idx].chapter = e.target.value;
                            setQuestions(updated);
                          }}
                          placeholder="e.g. Analogy / Trigonometry"
                          className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Mistake Reason</label>
                        <select
                          value={q.reason}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[idx].reason = e.target.value;
                            setQuestions(updated);
                          }}
                          className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-xs bg-white"
                        >
                          <option>Calculation</option>
                          <option>Concept Missing</option>
                          <option>Silly Mistake</option>
                          <option>Time Rush</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Learning Note</label>
                      <input
                        value={q.note}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].note = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder="Formula ya shortcut trick jo revise karni hai..."
                        className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-xs bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() =>
                  setQuestions([
                    ...questions,
                    {
                      section: "Quantitative Aptitude",
                      chapter: "",
                      reason: "Calculation",
                      status: "Wrong",
                      note: "",
                    },
                  ])
                }
                className="mt-3 w-full py-3 border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-2xl text-xs font-bold text-slate-600 hover:text-blue-600 transition"
              >
                + Add Another Question Log
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                disabled={loading}
                onClick={handleSaveMock}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-md shadow-emerald-600/20"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Mock & Build Mastery Radar
              </button>
            </div>
          </div>
        )}

        {/* ATTEMPTED TAB */}
        {activeTab === "attempted" && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Attempted Full Mocks Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Mock Test</th>
                    <th className="py-2.5 px-3">Platform</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {mocks.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 px-3 font-bold text-slate-900">{m.title}</td>
                      <td className="py-3 px-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{m.platform}</span></td>
                      <td className="py-3 px-3 font-black text-blue-600">{m.score} / 200</td>
                      <td className="py-3 px-3 font-bold text-emerald-600">{m.accuracy}%</td>
                      <td className="py-3 px-3 text-slate-500">{m.created_at.slice(0, 10)}</td>
                    </tr>
                  ))}
                  {mocks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No mocks attempted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WEAK TOPICS TAB */}
        {activeTab === "weakTopics" && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Traffic Light Performance Zones</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-2.5">
                <span className="text-xs font-black text-rose-700 uppercase">● Red Zone (&lt; 50% Acc)</span>
                <p className="text-xs text-slate-500">Chapters with high calculation or concept errors appear here.</p>
              </div>
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2.5">
                <span className="text-xs font-black text-amber-700 uppercase">● Yellow Zone (50%-80%)</span>
                <p className="text-xs text-slate-500">Borderline accuracy topics.</p>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                <span className="text-xs font-black text-emerald-700 uppercase">● Green Zone (&gt; 80%)</span>
                <p className="text-xs text-slate-500">Mastered chapters with zero repeat mistakes.</p>
              </div>
            </div>
          </div>
        )}

        {/* ERROR ANALYSIS TAB */}
        {activeTab === "errorAnalysis" && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Subject Error Classification Table</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Errors Logged</th>
                    <th className="py-2.5 px-3">Top Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {["Reasoning Ability", "Quantitative Aptitude", "English Language", "General Awareness"].map((sec) => (
                    <tr key={sec}>
                      <td className="py-3 px-3 font-bold text-slate-900">{sec}</td>
                      <td className="py-3 px-3 font-black text-rose-600">Active Tracking</td>
                      <td className="py-3 px-3 text-slate-600">Calculation / Concept</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RETEST TAB */}
        {activeTab === "retest" && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Configure Retest Test Session</h2>
            <p className="text-xs text-slate-500">Filter your logged mistakes and start targeted practice.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                <select className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50">
                  <option>Quantitative Aptitude</option>
                  <option>Reasoning Ability</option>
                  <option>English Language</option>
                  <option>General Awareness</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Mistake Reason</label>
                <select className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50">
                  <option>All Mistakes</option>
                  <option>Calculation</option>
                  <option>Concept Missing</option>
                  <option>Silly Mistake</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Questions</label>
                <input type="number" defaultValue={10} className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50" />
              </div>
            </div>
            <button
              onClick={() => alert("Starting Retest with your selected error questions...")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition"
            >
              Start Retest Test Session
            </button>
          </div>
        )}

        {/* PYQ TAB */}
        {activeTab === "pyq" && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 mb-2">Previous Year Question (PYQ) Tracker</h2>
            <div className="p-3 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">SSC CGL 2023 Tier 1 - 14 July Shift 1</p>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">Unattempted</span>
              </div>
              <button
                onClick={() => setActiveTab("logMock")}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold"
              >
                Log Mock
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
