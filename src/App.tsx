import { useState, useEffect } from "react";
import { open, ask } from "@tauri-apps/plugin-dialog";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { mkdir, copyFile, readFile, writeFile, rename, remove } from "@tauri-apps/plugin-fs";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import "./App.css";

// --- Icons Component ---
const Icons = {
  Files: ({ style }: { style?: any }) => (
    <svg style={style} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
  ),
  Folders: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
  ),
  Lock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  ),
  Clock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  Back: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
  ),
  Trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
  ),
  Unlock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
  )
};

type ViewState = "LOGIN" | "SIGNUP" | "DASHBOARD";

interface User {
  username: string;
  passwordHash: string;
  pin: string;
}

interface AssetFile {
  name: string;
  size: string;
  category: string;
  time: string;
  isLocked?: boolean;
}

function App() {
  const [view, setView] = useState<ViewState>("LOGIN");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vaultFiles, setVaultFiles] = useState<AssetFile[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [previewData, setPreviewData] = useState<{ name: string; type: string; url: string; category: string } | null>(null);
  const [pendingOpenFile, setPendingOpenFile] = useState<AssetFile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const dataDir = await appLocalDataDir();
        await mkdir(dataDir, { recursive: true });
        console.log("Storage initialized at:", dataDir);
      } catch (err) {
        console.error("Storage init error:", err);
      }
    };
    initStorage();
  }, []);

  const folderCategories = [
    { id: "Documents", name: "Documents / PDFs", icon: "📄", subfolders: ["Reports", "Bills", "Notes"], color: "bg-blue" },
    { id: "Images", name: "Images", icon: "🖼️", subfolders: ["Personal", "Work", "Screenshots"], color: "bg-green" },
    { id: "Videos", name: "Videos", icon: "🎬", subfolders: ["Movies", "Projects", "Personal"], color: "bg-purple" },
    { id: "Locked", name: "Locked Files", icon: "🔒", subfolders: ["Highly Sensitive"], color: "bg-red" },
    { id: "Trash", name: "Trash", icon: "🗑️", subfolders: ["Deleted"], color: "bg-gray" },
    { id: "Custom", name: "Custom Folder", icon: "✨", subfolders: ["Add your own"], color: "bg-amber" },
  ];

  const getCategoryId = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return "Documents";
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return "Images";
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return "Videos";
    return "Custom";
  };

  const loadUsers = async (): Promise<User[]> => {
    try {
      const dataDir = await appLocalDataDir();
      const usersPath = await join(dataDir, "users.json");
      const raw = await readFile(usersPath);
      const content = new TextDecoder().decode(raw);
      if (!content.trim()) return [];
      return JSON.parse(content);
    } catch { return []; }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const users = await loadUsers();
      if (users.find(u => u.username === username)) {
        alert("Username already exists!");
        return;
      }
      const newUser: User = { username, passwordHash: password, pin: securityPin };
      const updatedUsers = [...users, newUser];
      const dataDir = await appLocalDataDir();
      const usersPath = await join(dataDir, "users.json");
      await mkdir(dataDir, { recursive: true });
      await writeFile(usersPath, new TextEncoder().encode(JSON.stringify(updatedUsers)));
      alert("Account created successfully!");
      setView("LOGIN");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) { alert("Signup error: " + (err.message || err)); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const users = await loadUsers();
      const user = users.find(u => u.username === username && u.passwordHash === password);
      if (user) {
        setCurrentUser(user);
        setView("DASHBOARD");
      } else {
        alert("Invalid credentials.");
      }
    } catch (err: any) { alert("Login error: " + (err.message || err)); }
  };

  const loadVault = async () => {
    if (!currentUser) return;
    try {
      const dataDir = await appLocalDataDir();
      const metadataPath = await join(dataDir, `vault_${currentUser.username}.json`);
      try {
        const metadataRaw = await readFile(metadataPath);
        const metadata = JSON.parse(new TextDecoder().decode(metadataRaw));
        setVaultFiles(metadata.files || []);
        setActivities(metadata.activities || []);
      } catch (e) {
        setVaultFiles([]);
        setActivities([]);
      }
    } catch (err) { console.error("Load error:", err); }
  };

  useEffect(() => {
    if (view === "DASHBOARD") loadVault();
  }, [view]);

  const saveMetadata = async (files: AssetFile[], logs: string[]) => {
    if (!currentUser) return;
    try {
      const dataDir = await appLocalDataDir();
      const metadataPath = await join(dataDir, `vault_${currentUser.username}.json`);
      await writeFile(metadataPath, new TextEncoder().encode(JSON.stringify({ files, activities: logs })));
    } catch (err) { console.error("Save error:", err); }
  };

  const handleLockFile = async (file: AssetFile) => {
    if (file.isLocked) return;
    try {
      const dataDir = await appLocalDataDir();
      const vaultPath = await join(dataDir, "vault");
      const categoryPath = await join(vaultPath, "Locked");
      await mkdir(categoryPath, { recursive: true });
      await rename(await join(vaultPath, file.category, file.name), await join(categoryPath, file.name));
      const updatedFiles = vaultFiles.map(f => f.name === file.name ? { ...f, isLocked: true, category: "Locked" } : f);
      const updatedActivities = [`Locked "${file.name}"`, ...activities];
      setVaultFiles(updatedFiles);
      setActivities(updatedActivities);
      saveMetadata(updatedFiles, updatedActivities);
      alert(`${file.name} locked!`);
    } catch (err: any) { alert("Lock failed: " + err.message); }
  };

  const handleUnlockFile = async (file: AssetFile) => {
    try {
      const dataDir = await appLocalDataDir();
      const vaultPath = await join(dataDir, "vault");
      const categoryId = getCategoryId(file.name);
      const categoryPath = await join(vaultPath, categoryId);
      await mkdir(categoryPath, { recursive: true });

      const srcPath = await join(vaultPath, "Locked", file.name);
      const destPath = await join(categoryPath, file.name);
      await rename(srcPath, destPath);

      const updatedFiles = vaultFiles.map(f => 
        f.name === file.name && f.isLocked ? { ...f, isLocked: false, category: categoryId } : f
      );
      const updatedActivities = [`Unlocked "${file.name}"`, ...activities];

      setVaultFiles(updatedFiles);
      setActivities(updatedActivities);
      saveMetadata(updatedFiles, updatedActivities);
      alert(`${file.name} is now unlocked.`);
    } catch (err: any) {
      alert("Unlock failed: " + err.message);
    }
  };

  const handleDeleteFile = async (file: AssetFile) => {
    try {
      const confirm = await ask(`Are you sure you want to permanently delete "${file.name}"?`, {
        title: "Delete File",
        kind: "warning"
      });
      if (!confirm) return;

      const dataDir = await appLocalDataDir();
      const filePath = await join(dataDir, "vault", file.category, file.name);
      await remove(filePath);
      
      const updatedFiles = vaultFiles.filter(f => !(f.name === file.name && f.category === file.category));
      setVaultFiles(updatedFiles);
      setActivities([`Deleted "${file.name}"`, ...activities]);
      saveMetadata(updatedFiles, [`Deleted "${file.name}"`, ...activities]);
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleVerifyPin = async () => {
    if (!currentUser) return;
    if (!currentUser.pin) {
      if (pinInput.length !== 4) { alert("PIN must be 4 digits!"); return; }
      const updatedUser = { ...currentUser, pin: pinInput };
      const users = await loadUsers();
      const newUsersList = users.map(u => u.username === updatedUser.username ? updatedUser : u);
      const dataDir = await appLocalDataDir();
      await writeFile(await join(dataDir, "users.json"), new TextEncoder().encode(JSON.stringify(newUsersList)));
      setCurrentUser(updatedUser);
      setIsPinModalOpen(false);
      setPinInput("");
      alert("PIN set!");
      return;
    }
    if (pinInput === currentUser.pin) {
      if (pendingOpenFile) {
        handleOpenFile(pendingOpenFile);
        setPendingOpenFile(null);
      } else {
        setSelectedCategory("Locked");
      }
      setIsPinModalOpen(false);
      setPinInput("");
    } else {
      alert("Incorrect PIN.");
    }
  };

  const handleOpenFile = async (file: AssetFile) => {
    if (file.isLocked && selectedCategory !== "Locked") {
      setPendingOpenFile(file);
      setIsPinModalOpen(true);
      return;
    }
    try {
      const dataDir = await appLocalDataDir();
      const filePath = await join(dataDir, "vault", file.category, file.name);
      const raw = await readFile(filePath);
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let mime = "application/octet-stream";
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) mime = `image/${ext === 'svg' ? 'svg+xml' : ext}`;
      else if (ext === 'pdf') mime = "application/pdf";
      else if (['mp4', 'webm', 'ogg'].includes(ext)) mime = "video/mp4";
      else if (['mp3', 'wav', 'ogg'].includes(ext)) mime = "audio/mpeg";
      else if (['txt', 'md', 'js', 'ts', 'json', 'css'].includes(ext)) mime = "text/plain";
      setPreviewData({ name: file.name, type: mime, url: URL.createObjectURL(new Blob([raw], { type: mime })), category: file.category });
    } catch (err) {
      const dataDir = await appLocalDataDir();
      await revealItemInDir(await join(dataDir, "vault", file.category, file.name));
    }
  };

  const handleUpload = async () => {
    try {
      const selected = await open({ multiple: true });
      if (!selected) return;
      const paths = Array.isArray(selected) ? selected : [selected];
      const dataDir = await appLocalDataDir();
      const vaultPath = await join(dataDir, "vault");
      const newAssets: AssetFile[] = [];
      for (const p of paths) {
        const filename = p.replace(/\\/g, '/').split('/').pop() || "unknown";
        const categoryId = getCategoryId(filename);
        await mkdir(await join(vaultPath, categoryId), { recursive: true });
        await copyFile(p, await join(vaultPath, categoryId, filename));
        newAssets.push({ name: filename, size: "2.1 MB", category: categoryId, time: new Date().toLocaleTimeString() });
      }
      const updated = [...newAssets, ...vaultFiles];
      setVaultFiles(updated);
      setActivities([`Uploaded ${newAssets.length} files`, ...activities]);
      saveMetadata(updated, [`Uploaded ${newAssets.length} files`, ...activities]);
    } catch (err: any) { alert("Upload error: " + err); }
  };

  return (
    <div className="app-container">
      {view !== "DASHBOARD" ? (
        <section className="left-section">
          <div className="top-logo">Beyond.</div>
          <div className="blob blob-1"></div><div className="blob blob-2"></div>
          {view === "LOGIN" ? (
            <div className="signin-card">
              <header className="signin-header"><h1 className="signin-title">Sign in</h1></header>
              <form onSubmit={handleLogin}>
                <div className="form-group"><label className="form-label">Username</label><input type="text" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Password</label><input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <button type="submit" className="submit-btn">Sign in</button>
              </form>
              <div className="signup-prompt">No account? <button className="signup-link" onClick={() => setView("SIGNUP")}>Sign up</button></div>
            </div>
          ) : (
            <div className="signin-card">
              <header className="signin-header"><h1 className="signin-title">Sign up</h1></header>
              <form onSubmit={handleSignup}>
                <div className="form-group"><label className="form-label">Username</label><input type="text" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Password</label><input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Confirm Password</label><input type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Security PIN (4-digits)</label><input type="text" maxLength={4} className="form-input" value={securityPin} onChange={(e) => setSecurityPin(e.target.value)} required /></div>
                <button type="submit" className="submit-btn">Create Account</button>
                <button className="signup-link" onClick={() => setView("LOGIN")} style={{ marginTop: "10px", width: "100%" }}>Back to Login</button>
              </form>
            </div>
          )}
        </section>
      ) : (
        <div className="dashboard-container">
          <header className="dashboard-header">
            <div><h1>Welcome, {currentUser?.username}!</h1><p>Your digital vault is secured.</p></div>
            <div className="profile-section">
              <div className="avatar">{currentUser?.username[0].toUpperCase()}</div>
              <button className="google-btn" onClick={() => { setView("LOGIN"); setCurrentUser(null); }}>Logout</button>
            </div>
          </header>
          <div className="stats-grid">
            <div className="stat-card"><h3>Vault Files</h3><p>{vaultFiles.length}</p></div>
            <div className="stat-card"><h3>Locked Items</h3><p>{vaultFiles.filter(f => f.isLocked).length}</p></div>
            <div className="stat-card"><h3>Categories</h3><p>6</p></div>
          </div>
          <div className="folders-section" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
            <div className={`folder-card ${!selectedCategory ? "active-folder" : ""}`} onClick={() => setSelectedCategory(null)} style={{ border: !selectedCategory ? "2px solid var(--accent-blue)" : "none" }}>
              <div className="folder-icon-box bg-blue" style={{ fontSize: "24px", marginBottom: "12px" }}>📂</div>
              <h4>All Files</h4>
              <span>{vaultFiles.filter(f => !f.isLocked).length} items</span>
            </div>
            {folderCategories.map((f, i) => (
              <div key={i} className="folder-card" onClick={() => f.id === "Locked" ? setIsPinModalOpen(true) : setSelectedCategory(f.id)} style={{ border: selectedCategory === f.id ? `2px solid var(--accent-blue)` : "none" }}>
                <div className={`folder-icon-box ${f.color}`} style={{ fontSize: "24px", marginBottom: "12px" }}>{f.icon}</div>
                <h4>{f.name}</h4>
                <span>{vaultFiles.filter(val => val.category === f.id).length} items</span>
              </div>
            ))}
          </div>
          <div className="dashboard-main" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "32px" }}>
            <div className="section-card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2>{selectedCategory === "Locked" ? "Locked Private Files" : (selectedCategory || "Recent Vault Files")}</h2>
                <div style={{ display: "flex", gap: "10px" }}>
                  {selectedCategory && <button className="action-btn secondary" onClick={() => setSelectedCategory(null)}>View All</button>}
                  <button className="action-btn" onClick={handleUpload}>Upload</button>
                </div>
              </div>
              <div className="activity-list">
                {vaultFiles
                  .filter(f => selectedCategory ? f.category === selectedCategory : !f.isLocked)
                  .map((file, i) => (
                  <div key={i} className="activity-item">
                    <div style={{ flex: 1 }}><strong>{file.name}</strong><br/><small>{file.category} • {file.time}</small></div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="google-btn" title="View" onClick={() => handleOpenFile(file)}><Icons.Eye /></button>
                      {file.isLocked ? (
                        <button className="google-btn" title="Unlock" onClick={() => handleUnlockFile(file)} style={{ color: "var(--accent-green)" }}><Icons.Unlock /></button>
                      ) : (
                        <button className="google-btn" title="Lock" onClick={() => handleLockFile(file)} style={{ color: "var(--accent-purple)" }}><Icons.Shield /></button>
                      )}
                      <button className="google-btn" title="Delete" onClick={() => handleDeleteFile(file)} style={{ color: "#ef4444" }}><Icons.Trash /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="section-card">
              <h2>Recent Logs</h2>
              <div className="activity-list">
                {activities.slice(0, 10).map((a, i) => <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #eee", fontSize: "13px" }}>{a}</div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {isPinModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="signin-card" style={{ width: "350px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <h2>Security PIN Required</h2>
            <p style={{ marginBottom: "20px" }}>{!currentUser?.pin ? "Create your 4-digit PIN now." : "Verify your identity."}</p>
            <input type="password" maxLength={4} className="form-input" style={{ textAlign: "center", fontSize: "32px", letterSpacing: "10px" }} value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleVerifyPin()} autoFocus />
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="action-btn secondary" onClick={() => { setIsPinModalOpen(false); setPinInput(""); }}>Cancel</button>
              <button className="submit-btn" onClick={handleVerifyPin} style={{ margin: 0 }}>{!currentUser?.pin ? "Set PIN" : "Verify"}</button>
            </div>
          </div>
        </div>
      )}

      {previewData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", zIndex: 10000 }}>
          <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
            <h3>{previewData.name} ({previewData.category})</h3>
            <button className="google-btn" style={{ background: "#444" }} onClick={() => { URL.revokeObjectURL(previewData.url); setPreviewData(null); }}>Close</button>
          </header>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
            {previewData.type.startsWith("image/") && <img src={previewData.url} alt="preview" style={{ maxWidth: "100%", maxHeight: "100%" }} />}
            {previewData.type === "application/pdf" && <iframe src={previewData.url} style={{ width: "100%", height: "100%" }} />}
            {previewData.type.startsWith("video/") && <video src={previewData.url} controls autoPlay style={{ maxWidth: "100%", maxHeight: "100%" }} />}
            {previewData.type.startsWith("audio/") && <audio src={previewData.url} controls autoPlay />}
            {previewData.type === "text/plain" && <iframe src={previewData.url} style={{ width: "100%", height: "100%", background: "#fff", padding: "20px" }} />}
          </div>
        </div>
      )}

      {/* Hero section duplication for LOGIN/SIGNUP */}
      {view !== "DASHBOARD" && (
        <section className="right-section">
          <div className="bg-sphere sphere-1"></div><div className="bg-sphere sphere-2"></div>
          <div className="hero-image-container"><img src="/hero.png" alt="Beyond Illustration" className="hero-image" /></div>
        </section>
      )}
    </div>
  );
}

export default App;
