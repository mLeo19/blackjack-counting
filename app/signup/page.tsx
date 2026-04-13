"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@/lib/supabase/client";
import PageLayout from "@/components/ui/PageLayout";
import AuthButton from "@/components/ui/AuthButton";

export default function SignupPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";

  const [step, setStep] = useState<"credentials" | "profile">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [bankroll, setBankroll] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [bankrollFocused, setBankrollFocused] = useState(false);

  const inputStyle = (focused: boolean) => ({
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    border: `1px solid ${focused
      ? isDark ? "rgba(0,245,255,0.5)" : "rgba(107,77,6,0.5)"
      : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
    color: isDark ? "#e8f5e8" : "#1a1200",
    fontFamily: "DM Mono, monospace",
    fontSize: "13px",
    outline: "none",
    boxShadow: focused
      ? isDark ? "0 0 12px rgba(0,245,255,0.15)" : "0 0 12px rgba(107,77,6,0.1)"
      : "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  });

  const labelStyle = {
    fontFamily: "DM Mono, monospace",
    fontSize: "10px",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.6)",
    marginBottom: "6px",
    display: "block",
  };

  const handleCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Please fill in all fields.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setStep("profile");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || username.length < 3) return setError("Username must be at least 3 characters.");
    if (username.length > 20) return setError("Username must be at most 20 characters.");
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return setError("Username can only contain letters, numbers and underscores.");

    const bankrollNum = parseInt(bankroll);
    if (!bankroll || isNaN(bankrollNum) || bankrollNum < 100) return setError("Starting bankroll must be at least $100.");

    setLoading(true);
    const supabase = createClient();

    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .single();

    if (existingUser) {
      setLoading(false);
      return setError("Username is already taken.");
    }

    const { data, error: signupError } = await supabase.auth.signUp({ email, password });

    if (signupError || !data.user) {
      setLoading(false);
      return setError(signupError?.message ?? "Signup failed.");
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: data.user.id,
      username,
      bankroll: bankrollNum,
    });

    if (profileError) {
      setLoading(false);
      return setError("Failed to create profile.");
    }

    await supabase.from("lifetime_stats").insert({ user_id: data.user.id });
    await supabase.from("session_stats").insert({
      user_id: data.user.id,
      starting_bankroll: bankrollNum,
    });

    router.push("/game");
  };

  return (
    <PageLayout>
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div style={{
          width: "100%",
          maxWidth: "400px",
          padding: "40px",
          borderRadius: "24px",
          backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.6)",
          border: `1px solid ${isDark ? "rgba(0,245,255,0.12)" : "rgba(107,77,6,0.15)"}`,
          backdropFilter: "blur(12px)",
          boxShadow: isDark ? "0 0 60px rgba(0,0,0,0.4)" : "0 20px 60px rgba(0,0,0,0.08)",
        }}>

          <div className="flex flex-col items-center gap-2 mb-8">
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "28px", fontWeight: 700, color: isDark ? "#ffffff" : "#1a1200" }}>
              {step === "credentials" ? "Create Account" : "Set Up Profile"}
            </h1>
            <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", letterSpacing: "0.08em" }}>
              {step === "credentials" ? "Step 1 of 2 — Credentials" : "Step 2 of 2 — Profile"}
            </p>
            <div className="flex gap-2 mt-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  style={{
                    width: i === (step === "credentials" ? 0 : 1) ? "24px" : "8px",
                    height: "4px",
                    borderRadius: "999px",
                    backgroundColor: i === (step === "credentials" ? 0 : 1)
                      ? isDark ? "#00f5ff" : "#8b6508"
                      : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          </div>

          {step === "credentials" && (
            <form onSubmit={handleCredentials} className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="you@example.com"
                  style={inputStyle(emailFocused)}
                />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Min. 6 characters"
                  style={inputStyle(passwordFocused)}
                />
              </div>
              {error && (
                <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#ff2d78", textShadow: isDark ? "0 0 8px rgba(255,45,120,0.4)" : "none" }}>
                  ✦ {error}
                </p>
              )}
              <AuthButton label="Continue →" isDark={isDark} />
            </form>
          )}

          {step === "profile" && (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  placeholder="CardShark42"
                  maxLength={20}
                  style={inputStyle(usernameFocused)}
                />
                <p style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", marginTop: "4px" }}>
                  3–20 characters, letters, numbers and underscores only
                </p>
              </div>
              <div>
                <label style={labelStyle}>Starting Bankroll</label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontFamily: "DM Mono, monospace",
                    fontSize: "13px",
                    color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                    pointerEvents: "none",
                  }}>$</span>
                  <input
                    type="number"
                    value={bankroll}
                    onChange={(e) => setBankroll(e.target.value)}
                    onFocus={() => setBankrollFocused(true)}
                    onBlur={() => setBankrollFocused(false)}
                    placeholder="1000"
                    min={100}
                    style={{ ...inputStyle(bankrollFocused), paddingLeft: "28px" }}
                  />
                </div>
                <p style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", marginTop: "4px" }}>
                  Minimum $100
                </p>
              </div>
              {error && (
                <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#ff2d78", textShadow: isDark ? "0 0 8px rgba(255,45,120,0.4)" : "none" }}>
                  ✦ {error}
                </p>
              )}
              <div className="flex gap-3">
                <div style={{ flex: 1 }}>
                  <AuthButton
                    label="← Back"
                    type="button"
                    isDark={isDark}
                    color={isDark ? "rgba(255,255,255,0.4)" : undefined}
                    onClick={() => { setStep("credentials"); setError(""); }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <AuthButton
                    label={loading ? "Creating..." : "Create Account"}
                    disabled={loading}
                    isDark={isDark}
                  />
                </div>
              </div>
            </form>
          )}

          <div className="flex justify-center mt-6">
            <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                style={{ background: "none", border: "none", cursor: "pointer", color: isDark ? "rgba(0,245,255,0.7)" : "rgba(107,77,6,0.7)", fontFamily: "DM Mono, monospace", fontSize: "11px", textDecoration: "underline" }}
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}