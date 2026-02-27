"use client";

import { useState } from "react";
import styles from "./page.module.css";
import LoadingState from "../components/LoadingState";
import SlideViewer from "../components/SlideViewer";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Professional");
  const [file, setFile] = useState(null);

  // UI State: 'form' | 'loading' | 'results'
  const [viewState, setViewState] = useState("form");
  const [generatedSlides, setGeneratedSlides] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setViewState("loading");

    try {
      const formData = new FormData();
      formData.append("topic", topic);
      formData.append("audience", audience);
      formData.append("tone", tone);
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate slides");
      }

      const data = await res.json();
      setGeneratedSlides(data.slides || []);
      setViewState("results");
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      setViewState("form");
    }
  };

  const handleBack = () => {
    setViewState("form");
    setGeneratedSlides([]);
  };

  return (
    <div className={styles.container}>
      {/* Background Orbs */}
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
      <div className={styles.bgGlow3} />

      {viewState === "form" && (
        <main className={styles.glassCard}>
          <h1 className={styles.title}>Instantly Generate Presentation Slides.</h1>
          <p className={styles.subtitle}>
            Transform your ideas or documents into structured, ready-to-present slide outlines with speaker notes — powered by Amazon Bedrock AI.
          </p>

          <form className={styles.formGroup} onSubmit={handleGenerate}>
            <div className={styles.inputWrapper}>
              <label className={styles.label} htmlFor="topic">
                What is your presentation about?
              </label>
              <textarea
                id="topic"
                className={styles.textarea}
                placeholder="e.g. The impact of artificial intelligence on modern architecture..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.inputWrapper}>
                <label className={styles.label} htmlFor="audience">
                  Target Audience
                </label>
                <input
                  type="text"
                  id="audience"
                  className={styles.input}
                  placeholder="e.g. College Students, Executives..."
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputWrapper}>
                <label className={styles.label} htmlFor="tone">
                  Tone
                </label>
                <select
                  id="tone"
                  className={styles.input}
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option value="Professional">Professional</option>
                  <option value="Academic">Academic</option>
                  <option value="Persuasive">Persuasive</option>
                  <option value="Humorous">Humorous</option>
                  <option value="Inspirational">Inspirational</option>
                </select>
              </div>
            </div>

            <div className={styles.inputWrapper}>
              <label className={styles.label}>
                Or Upload a Reference Document (Optional)
              </label>
              <label className={styles.fileUploadArea}>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <div className={styles.fileIcon}>📄</div>
                <div className={styles.fileText}>
                  {file ? file.name : "Click to attach a PDF or Text file"}
                </div>
              </label>
            </div>

            <button type="submit" className={styles.generateBtn}>
              Generate Slides ✨
            </button>
          </form>
        </main>
      )}

      {viewState === "loading" && <LoadingState />}

      {viewState === "results" && (
        <SlideViewer slides={generatedSlides} onBack={handleBack} />
      )}
    </div>
  );
}
