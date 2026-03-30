import { useState, useEffect, useMemo } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { mkdir, copyFile, readFile, writeFile, rename, remove } from "@tauri-apps/plugin-fs";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import "./App.css";

// --- Icons Component ---
const Icons = {
  Home: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  ),
  Folder: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
  ),
  File: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
  ),
  Image: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
  ),
  Video: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
  ),
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
  ),
  Lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
  ),
  More: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  Filter: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
  ),
  Sort: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18H3M21 12H3M18 6H3"></path></svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  ),
  EyeOff: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
  ),
  Trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
  ),
  Unlock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
  ),
  Sun: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  ),
  Alert: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
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
  deletedAt?: string;
  originalCategory?: string;
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
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState("Date-Newest");
  const [notifications, setNotifications] = useState<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" || 
           (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);
  const showNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

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
      showNotification("Passwords do not match!");
      return;
    }
    try {
      const users = await loadUsers();
      if (users.find(u => u.username === username)) {
        showNotification("Username already exists!");
        return;
      }
      const newUser: User = { username, passwordHash: password, pin: securityPin };
      const updatedUsers = [...users, newUser];
      const dataDir = await appLocalDataDir();
      const usersPath = await join(dataDir, "users.json");
      await mkdir(dataDir, { recursive: true });
      await writeFile(usersPath, new TextEncoder().encode(JSON.stringify(updatedUsers)));
      showNotification("Account created successfully!");
      setView("LOGIN");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) { showNotification("Signup error: " + (err.message || err)); }
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
        showNotification("Invalid credentials.");
      }
    } catch (err: any) { showNotification("Login error: " + (err.message || err)); }
  };

  const loadVault = async () => {
    if (!currentUser) return;
    try {
      const dataDir = await appLocalDataDir();
      const metadataPath = await join(dataDir, `vault_${currentUser.username}.json`);
      try {
        const metadataRaw = await readFile(metadataPath);
        const metadata = JSON.parse(new TextDecoder().decode(metadataRaw));
        const loadedFiles: AssetFile[] = metadata.files || [];
        
        // Auto-delete Trash older than 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        const vaultPath = await join(dataDir, "vault");
        const validFiles: AssetFile[] = [];
        let metadataChanged = false;

        for (const file of loadedFiles) {
          if (file.category === "Trash" && file.deletedAt) {
            if (new Date(file.deletedAt) < thirtyDaysAgo) {
              try {
                const filePath = await join(vaultPath, "Trash", file.name);
                await remove(filePath);
                metadataChanged = true;
                continue; // Skip adding to validFiles
              } catch (e) { console.error("Auto-delete IO error:", e); }
            }
          }
          validFiles.push(file);
        }

        setVaultFiles(validFiles);
        setActivities(metadata.activities || []);
        if (metadataChanged) {
          saveMetadata(validFiles, metadata.activities || []);
        }
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
      showNotification(`${file.name} locked!`);
    } catch (err: any) { showNotification("Lock failed: " + err.message); }
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
      showNotification(`${file.name} is now unlocked.`);
    } catch (err: any) {
      showNotification("Unlock failed: " + err.message);
    }
  };

  const handleDeleteFile = async (file: AssetFile) => {
    try {
      const dataDir = await appLocalDataDir();
      const vaultPath = await join(dataDir, "vault");

      if (file.category === "Trash") {
        if (!confirm(`This will permanently delete ${file.name}. Continue?`)) return;
        const filePath = await join(vaultPath, "Trash", file.name);
        await remove(filePath);
        const updated = vaultFiles.filter(f => f.name !== file.name || f.category !== "Trash");
        setVaultFiles(updated);
        setActivities([`Permanently deleted ${file.name}`, ...activities]);
        saveMetadata(updated, [`Permanently deleted ${file.name}`, ...activities]);
        return;
      }

      // Move to Trash
      await mkdir(await join(vaultPath, "Trash"), { recursive: true });
      const oldPath = await join(vaultPath, file.category, file.name);
      const newPath = await join(vaultPath, "Trash", file.name);
      await rename(oldPath, newPath);

      const updated = vaultFiles.map(f => {
        if (f.name === file.name && f.category === file.category) {
          return { ...f, originalCategory: f.category, category: "Trash", deletedAt: new Date().toISOString() };
        }
        return f;
      });

      setVaultFiles(updated);
      setActivities([`Moved ${file.name} to Trash`, ...activities]);
      saveMetadata(updated, [`Moved ${file.name} to Trash`, ...activities]);
    } catch (err) {
      console.error("Delete error:", err);
      showNotification("Error moving file to Trash");
    }
  };

  const handleRestoreFile = async (file: AssetFile) => {
    try {
      const dataDir = await appLocalDataDir();
      const vaultPath = await join(dataDir, "vault");
      const targetCategory = file.originalCategory || "Custom";

      await mkdir(await join(vaultPath, targetCategory), { recursive: true });
      const oldPath = await join(vaultPath, "Trash", file.name);
      const newPath = await join(vaultPath, targetCategory, file.name);
      await rename(oldPath, newPath);

      const updated = vaultFiles.map(f => {
        if (f.name === file.name && f.category === "Trash") {
          return { ...f, category: targetCategory, deletedAt: undefined, originalCategory: undefined };
        }
        return f;
      });

      setVaultFiles(updated);
      setActivities([`Restored ${file.name} from Trash`, ...activities]);
      saveMetadata(updated, [`Restored ${file.name} from Trash`, ...activities]);
    } catch (err) {
      console.error("Restore error:", err);
      showNotification("Error restoring file");
    }
  };

  const handleVerifyPin = async () => {
    if (!currentUser) return;
    if (!currentUser.pin) {
      if (pinInput.length !== 4) { showNotification("PIN must be 4 digits!"); return; }
      const updatedUser = { ...currentUser, pin: pinInput };
      const users = await loadUsers();
      const newUsersList = users.map(u => u.username === updatedUser.username ? updatedUser : u);
      const dataDir = await appLocalDataDir();
      await writeFile(await join(dataDir, "users.json"), new TextEncoder().encode(JSON.stringify(newUsersList)));
      setCurrentUser(updatedUser);
      setIsPinModalOpen(false);
      setPinInput("");
      showNotification("PIN set!");
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
      showNotification("Incorrect PIN.");
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

  const filteredAssets = useMemo(() => {
    return (vaultFiles || []).filter((asset) => {
      const matchesSearch = asset.name.toLowerCase().includes((searchQuery || "").toLowerCase());
      
      // When no category is selected, hide files in Trash
      if (!selectedCategory && asset.category === "Trash") return false;
      
      // When a category is selected, only show files THAT match that category
      if (selectedCategory && asset.category !== selectedCategory) return false;

      const matchesFilter = filterType === "All" || asset.category === filterType;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      if (sortBy === "Name-AZ") return a.name.localeCompare(b.name);
      if (sortBy === "Name-ZA") return b.name.localeCompare(a.name);
      if (sortBy === "Date-Newest") return new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime();
      if (sortBy === "Date-Oldest") return new Date(a.time || 0).getTime() - new Date(b.time || 0).getTime();
      if (sortBy === "Size-Largest") return parseFloat(b.size) - parseFloat(a.size);
      if (sortBy === "Size-Smallest") return parseFloat(a.size) - parseFloat(b.size);
      return 0;
    });
  }, [vaultFiles, searchQuery, selectedCategory, filterType, sortBy]);

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

        const sizeStr = "2.5 MB";
        const timeStr = new Date().toLocaleString();

        const newAsset: AssetFile = {
            name: filename,
            size: sizeStr,
            category: categoryId,
            time: timeStr,
            isLocked: false
        };

        await mkdir(await join(vaultPath, categoryId), { recursive: true });
        await copyFile(p, await join(vaultPath, categoryId, filename));
        newAssets.push(newAsset);
      }
      const updatedFiles = [...vaultFiles, ...newAssets];
      setVaultFiles(updatedFiles);
      if (currentUser) {
        await saveMetadata(updatedFiles, [`Uploaded ${newAssets.length} files`, ...activities]);
      }
      setActivities([`Uploaded ${newAssets.length} files`, ...activities]);
      showNotification(`Uploaded ${newAssets.length} files`);
    } catch (err) {
      console.error("Upload error:", err);
      showNotification("Upload failed: " + err);
    }
  };

  return (
    <div className={`app-container auth-bg ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
      <div className="bg-sphere sphere-1"></div>
      <div className="bg-sphere sphere-2"></div>
      <div className="bg-sphere sphere-3"></div>
      {view !== "DASHBOARD" ? (
        <section className="left-section">
          <div className="auth-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'absolute', top: '40px', padding: '0 40px', zIndex: 100 }}>
            <div className="top-logo" style={{ position: 'static' }}>DigiSafe</div>
            <button 
              className="icon-btn" 
              onClick={() => {
                console.log("Setting Dark Mode:", !isDarkMode);
                setIsDarkMode(!isDarkMode);
              }}
              title="Toggle Theme"
            >
              {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
            </button>
          </div>
          {view === "LOGIN" ? (
            <div className="signin-card">
              <header className="signin-header"><h1 className="signin-title">Sign in</h1></header>
              <form onSubmit={handleLogin}>
                <div className="form-group"><label className="form-label">Username</label><input type="text" className="form-input" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <input type={showPassword ? "text" : "password"} className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="submit-btn">Sign in</button>
              </form>
              <div className="signup-prompt">No account? <button className="signup-link" onClick={() => setView("SIGNUP")}>Sign up</button></div>
            </div>
          ) : (
            <div className="signin-card">
              <header className="signin-header"><h1 className="signin-title">Sign up</h1></header>
              <form onSubmit={handleSignup}>
                <div className="form-group"><label className="form-label">Username</label><input type="text" className="form-input" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <input type={showSignupPassword ? "text" : "password"} className="form-input" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" className="password-toggle" onClick={() => setShowSignupPassword(!showSignupPassword)}>
                      {showSignupPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-wrapper">
                    <input type={showConfirmPassword ? "text" : "password"} className="form-input" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Security PIN (4-digits)</label><input type="text" maxLength={4} className="form-input" placeholder="1234" value={securityPin} onChange={(e) => setSecurityPin(e.target.value)} required /></div>
                <button type="submit" className="submit-btn">Create Account</button>
                <button className="signup-link" onClick={() => setView("LOGIN")} style={{ marginTop: "10px", width: "100%" }}>Back to Login</button>
              </form>
            </div>
          )}
        </section>
      ) : (
        <div className="dashboard-container">
          <header className="dashboard-header">
            <div className="welcome-msg">
              <h1>Welcome, {currentUser?.username}!</h1>
              <p>Your digital vault is secured.</p>
            </div>
            <div className="search-filter-bar">
              <div className="search-box">
                <Icons.Search />
                <input 
                  type="text" 
                  placeholder="Search files..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-controls">
                <div className="select-wrapper">
                  <Icons.Filter />
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="All">All Types</option>
                    <option value="Images">Images</option>
                    <option value="Documents">Documents</option>
                    <option value="Videos">Videos</option>
                  </select>
                </div>
                <div className="select-wrapper">
                  <Icons.Sort />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="Date-Newest">Newest First</option>
                    <option value="Date-Oldest">Oldest First</option>
                    <option value="Name-AZ">Name (A-Z)</option>
                    <option value="Name-ZA">Name (Z-A)</option>
                    <option value="Size-Largest">Largest Size</option>
                    <option value="Size-Smallest">Smallest Size</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="profile-section">
              <div className="avatar">{currentUser?.username[0].toUpperCase()}</div>
              <button 
                className="icon-btn" 
                onClick={() => {
                  console.log("Setting Dark Mode:", !isDarkMode);
                  setIsDarkMode(!isDarkMode);
                }}
                title="Toggle Theme"
              >
                {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
              </button>
              <button className="action-btn secondary" onClick={() => { setCurrentUser(null); setView("LOGIN"); }}>Logout</button>
            </div>
          </header>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon bg-blue"><Icons.File /></div>
              <div className="stat-info"><h3>Vault Files</h3><p>{vaultFiles.length}</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-purple"><Icons.Lock /></div>
              <div className="stat-info"><h3>Locked Items</h3><p>{vaultFiles.filter(f => f.isLocked).length}</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-green"><Icons.Folder /></div>
              <div className="stat-info"><h3>Categories</h3><p>6</p></div>
            </div>
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
                {filteredAssets
                  .filter(f => selectedCategory ? f.category === selectedCategory : !f.isLocked)
                  .length > 0 ? (
                  filteredAssets
                    .filter(f => selectedCategory ? f.category === selectedCategory : !f.isLocked)
                    .map((file, i) => (
                    <div key={i} className="activity-item">
                      <div style={{ flex: 1 }}><strong>{file.name}</strong><br/><small>{file.category} • {file.time} • {file.size}</small></div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {file.category === "Trash" ? (
                          <button className="icon-btn" title="Restore" onClick={() => handleRestoreFile(file)} style={{ color: "var(--accent-blue)" }}><Icons.Upload /></button>
                        ) : (
                          <>
                            <button className="google-btn" title="View" onClick={() => handleOpenFile(file)}><Icons.Eye /></button>
                            {file.isLocked ? (
                              <button className="google-btn" title="Unlock" onClick={() => handleUnlockFile(file)} style={{ color: "var(--accent-green)" }}><Icons.Unlock /></button>
                            ) : (
                              <button className="google-btn" title="Lock" onClick={() => handleLockFile(file)} style={{ color: "var(--accent-purple)" }}><Icons.Shield /></button>
                            )}
                          </>
                        )}
                        <button className="google-btn" title={file.category === "Trash" ? "Delete Permanently" : "Move to Trash"} onClick={() => handleDeleteFile(file)} style={{ color: "#ef4444" }}><Icons.Trash /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <Icons.Search />
                    <p>No files found matching your criteria.</p>
                  </div>
                )}
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
          <div className="hero-image-container"><img src="/login.png" alt="Beyond Illustration" className="hero-image" /></div>
        </section>
      )}
      {/* Notifications Toast Container */}
      <div className="notifications-container">
        {notifications.map(n => (
          <div key={n.id} className={`toast toast-${n.type}`}>
            <span className="toast-icon">
              {n.type === "success" ? <Icons.Check /> : <Icons.Alert />}
            </span>
            <span className="toast-message">{n.message}</span>
            <button className="toast-close" onClick={() => setNotifications(prev => prev.filter(nn => nn.id !== n.id))}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
