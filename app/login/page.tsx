"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@/lib/supabase/client";
import PageLayout from "@/components/ui/PageLayout";
import AuthButton from "@/components/ui/AuthButton";

export default function LoginPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true);

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setLoading(false);
      return setError("Invalid email or password.");
    }

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
              Welcome Back
            </h1>
            <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", letterSpacing: "0.08em" }}>
              Log in to your Soft17 account
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                placeholder="Your password"
                style={inputStyle(passwordFocused)}
              />
            </div>
            {error && (
              <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#ff2d78", textShadow: isDark ? "0 0 8px rgba(255,45,120,0.4)" : "none" }}>
                ✦ {error}
              </p>
            )}
            <AuthButton
              label={loading ? "Logging in..." : "Log In"}
              disabled={loading}
              color={isDark ? "#ff2d78" : undefined}
              isDark={isDark}
            />
          </form>

          <div className="flex justify-center mt-6">
            <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/signup")}
                style={{ background: "none", border: "none", cursor: "pointer", color: isDark ? "rgba(0,245,255,0.7)" : "rgba(107,77,6,0.7)", fontFamily: "DM Mono, monospace", fontSize: "11px", textDecoration: "underline" }}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}