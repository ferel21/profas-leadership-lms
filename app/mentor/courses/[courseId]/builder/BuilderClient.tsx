"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, GripVertical, FileText, PlayCircle, Folder, ChevronRight, ChevronDown, Save, Upload, Link2, HelpCircle, Loader2, Sparkles, Megaphone, CheckCircle2, FileUp, X } from "lucide-react";

export type NodeType = "FOLDER" | "VIDEO" | "PDF" | "DOCUMENT" | "IMAGE" | "LINK" | "QUIZ" | "ASSIGNMENT" | "TEXT";

export type CourseNode = {
  id: string;
  parentId: string | null;
  title: string;
  type: NodeType;
  order: number;
  children: CourseNode[];
  isNew?: boolean;
  assessmentId?: string | null;
};

function typeIcon(type: NodeType) {
  switch (type) {
    case "FOLDER": return <Folder size={16} style={{ color: 'var(--teal)' }} />;
    case "VIDEO": return <PlayCircle size={16} style={{ color: '#3b82f6' }} />;
    case "PDF": return <FileText size={16} style={{ color: '#ef4444' }} />;
    case "LINK": return <Link2 size={16} style={{ color: '#8b5cf6' }} />;
    case "QUIZ": return <HelpCircle size={16} style={{ color: '#f59e0b' }} />;
    default: return <FileText size={16} style={{ color: 'var(--teal)' }} />;
  }
}

function typeBadge(type: NodeType) {
  const colors: Record<NodeType, { bg: string; text: string }> = {
    FOLDER: { bg: "#e0f2fe", text: "#0369a1" },
    VIDEO: { bg: "#dbeafe", text: "#1d4ed8" },
    PDF: { bg: "#fee2e2", text: "#b91c1c" },
    DOCUMENT: { bg: "#fef3c7", text: "#b45309" },
    IMAGE: { bg: "#dcfce7", text: "#15803d" },
    LINK: { bg: "#f3e8ff", text: "#6b21a8" },
    QUIZ: { bg: "#ffedd5", text: "#c2410c" },
    ASSIGNMENT: { bg: "#e0e7ff", text: "#4338ca" },
    TEXT: { bg: "#ccfbf1", text: "#0f766e" }
  };
  const c = colors[type] || { bg: "#f1f5f9", text: "#475569" };
  return <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", background: c.bg, color: c.text, letterSpacing: "0.5px" }}>{type}</span>;
}

export function BuilderClient({ course }: { course: { id: string; nodes: CourseNode[] } }) {
  const [nodes, setNodes] = useState<CourseNode[]>(course.nodes);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Modals state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedNodeId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetParentId: string | null, targetOrder: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedNodeId || draggedNodeId === targetParentId) return;

    let movedNode: CourseNode | null = null;
    const removeNode = (list: CourseNode[]): CourseNode[] => {
      return list.filter(n => {
        if (n.id === draggedNodeId) {
          movedNode = n;
          return false;
        }
        n.children = removeNode(n.children);
        return true;
      });
    };

    const newNodes = removeNode([...nodes]);
    if (!movedNode) return;
    (movedNode as CourseNode).parentId = targetParentId;
    
    const insertNode = (list: CourseNode[], parentId: string | null) => {
      if (parentId === null) {
        list.splice(targetOrder, 0, movedNode as CourseNode);
        list.forEach((n, i) => n.order = i);
        return;
      }
      list.forEach(n => {
        if (n.id === parentId) {
          n.children.splice(targetOrder, 0, movedNode as CourseNode);
          n.children.forEach((c, i) => c.order = i);
          setExpanded(prev => ({ ...prev, [parentId]: true }));
        } else {
          insertNode(n.children, parentId);
        }
      });
    };

    insertNode(newNodes, targetParentId);
    setNodes(newNodes);
    setDraggedNodeId(null);
  };

  const deleteNodeRecursive = (list: CourseNode[], idToDelete: string): CourseNode[] => {
    return list.filter(n => {
      if (n.id === idToDelete) {
        if (!n.isNew) setDeletedIds(prev => [...prev, n.id]);
        return false;
      }
      n.children = deleteNodeRecursive(n.children, idToDelete);
      return true;
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus item ini beserta seluruh isinya?")) {
      setNodes(deleteNodeRecursive([...nodes], id));
    }
  };

  const flattenNodes = (list: CourseNode[]): Array<{ id: string, parentId: string | null, title: string, type: NodeType, order: number, isNew?: boolean }> => {
    let result: Array<{ id: string, parentId: string | null, title: string, type: NodeType, order: number, isNew?: boolean }> = [];
    list.forEach(n => {
      result.push({
        id: n.id, parentId: n.parentId, title: n.title, type: n.type, order: n.order, isNew: n.isNew
      });
      result = result.concat(flattenNodes(n.children));
    });
    return result;
  };

  const saveStructure = async () => {
    setSaving(true);
    try {
      const flat = flattenNodes(nodes);
      const res = await fetch(`/api/courses/${course.id}/nodes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: flat, deletedIds })
      });
      if (res.ok) {
        alert("Kurikulum berhasil disimpan!");
        setDeletedIds([]);
        const markNotNew = (list: CourseNode[]): CourseNode[] => {
          return list.map(n => ({ ...n, isNew: false, children: markNotNew(n.children) }));
        };
        setNodes(markNotNew(nodes));
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Gagal menyimpan: ${errData.message || errData.error || res.statusText}`);
      }
    } catch (e: any) {
      alert(`Terjadi kesalahan: ${e?.message || "Koneksi jaringan gagal"}`);
    } finally {
      setSaving(false);
    }
  };

  const addFolder = (title: string) => {
    const newNode: CourseNode = { id: generateId(), parentId: activeParentId, title, type: "FOLDER", order: 999, children: [], isNew: true };
    insertIntoTree(newNode);
    setShowFolderModal(false);
  };

  const addFile = (title: string, type: NodeType) => {
    const newNode: CourseNode = { id: generateId(), parentId: activeParentId, title, type, order: 999, children: [], isNew: true };
    insertIntoTree(newNode);
    setShowUploadModal(false);
  };

  const handleAiGenerate = () => {
    setAiLoading(true);
    setTimeout(() => {
      const bab1Id = generateId();
      const bab2Id = generateId();
      const newChapters: CourseNode[] = [
        {
          id: bab1Id, parentId: null, title: `Bab: Strategi Eksekusi ${aiTopic || "Kepemimpinan"}`, type: "FOLDER", order: nodes.length, isNew: true,
          children: [
            { id: generateId(), parentId: bab1Id, title: "Video: Fondasi & Mindset Eksekutif", type: "VIDEO", order: 0, children: [], isNew: true },
            { id: generateId(), parentId: bab1Id, title: "Modul Bacaan: Studi Kasus PROFAS", type: "PDF", order: 1, children: [], isNew: true },
          ]
        },
        {
          id: bab2Id, parentId: null, title: `Bab: Evaluasi & Pengukuran ${aiTopic || "Kinerja"}`, type: "FOLDER", order: nodes.length + 1, isNew: true,
          children: [
            { id: generateId(), parentId: bab2Id, title: "Kuis: Pemetaan Pemahaman Strategis", type: "QUIZ", order: 0, children: [], isNew: true },
            { id: generateId(), parentId: bab2Id, title: "Tugas Action Plan 30 Hari", type: "ASSIGNMENT", order: 1, children: [], isNew: true },
          ]
        }
      ];
      setNodes([...nodes, ...newChapters]);
      setExpanded(prev => ({ ...prev, [bab1Id]: true, [bab2Id]: true }));
      setAiLoading(false);
      setShowAiModal(false);
      setAiTopic("");
    }, 1200);
  };

  const insertIntoTree = (newNode: CourseNode) => {
    if (!newNode.parentId) {
      newNode.order = nodes.length;
      setNodes([...nodes, newNode]);
      return;
    }
    const updateTree = (list: CourseNode[]): CourseNode[] => {
      return list.map(n => {
        if (n.id === newNode.parentId) {
          newNode.order = n.children.length;
          return { ...n, children: [...n.children, newNode] };
        }
        return { ...n, children: updateTree(n.children) };
      });
    };
    setNodes(updateTree([...nodes]));
    setExpanded(prev => ({ ...prev, [newNode.parentId as string]: true }));
  };

  const renderNode = (node: CourseNode, level = 0) => {
    const isFolder = node.type === "FOLDER";
    const isExpanded = expanded[node.id];

    return (
      <div key={node.id} style={{ marginLeft: level > 0 ? '24px' : '0', marginTop: '0.5rem' }}>
        <div 
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, node.parentId, node.order)}
          className="hover-lift glass" 
          style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            padding: '14px 18px', background: isFolder ? 'rgba(13, 148, 136, 0.08)' : 'rgba(255, 255, 255, 0.85)', 
            borderRadius: '12px', border: isFolder ? '1px solid var(--teal)' : '1px solid var(--line)', 
            marginBottom: '0.5rem',
            opacity: draggedNodeId === node.id ? 0.4 : 1,
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GripVertical size={18} style={{ color: 'var(--muted)', cursor: 'grab' }} />
            {isFolder ? (
              <button onClick={() => toggleExpand(node.id)} className="btn btn-ghost btn-small" style={{ padding: 4, height:'auto' }}>
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            ) : <div style={{width: 24}}></div>}
            {typeIcon(node.type)}
            <span style={{ fontSize: '15px', fontWeight: isFolder ? 700 : 500, color: 'var(--ink)' }}>{node.title}</span>
            {!isFolder && typeBadge(node.type)}
            {node.isNew && <span style={{fontSize:'10px', background:'var(--teal)', color:'white', padding:'2px 8px', borderRadius:'10px', fontWeight:700}}>BARU</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {((node.type === 'QUIZ' || node.type === 'ASSIGNMENT') && node.assessmentId) && (
              <a href={`/mentor/courses/${course.id}/assessments/${node.assessmentId}/edit`} className="btn btn-ghost btn-small" style={{ color: '#0369a1', background: '#e0f2fe', borderRadius: '8px' }}>
                <Edit2 size={14}/> Edit Soal
              </a>
            )}
            <button onClick={() => handleDelete(node.id)} className="btn btn-ghost btn-small hover-lift" style={{ color: 'var(--error)', padding: '6px' }}><Trash2 size={16}/></button>
          </div>
        </div>

        {isFolder && isExpanded && (
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, node.id, node.children.length)}
            style={{ 
              minHeight: '45px', 
              borderLeft: '2px dashed rgba(13, 148, 136, 0.4)',
              marginLeft: '14px',
              paddingLeft: '14px',
              paddingBottom: '8px'
            }}
          >
            {node.children.map(child => renderNode(child, level + 1))}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button onClick={() => { setActiveParentId(node.id); setShowUploadModal(true); }} className="btn btn-outline btn-small hover-lift" style={{ color: 'var(--teal-dark)', borderColor: 'var(--teal)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileUp size={14} /> Upload Materi / Bab Ini
              </button>
              <button onClick={() => { setActiveParentId(node.id); setShowFolderModal(true); }} className="btn btn-ghost btn-small hover-lift" style={{ color: 'var(--teal-dark)' }}>
                <Plus size={14} /> Subfolder
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="builder-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* AI Curriculum Generator Banner */}
      <div style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)", padding: "18px 24px", borderRadius: "16px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", boxShadow: "0 4px 12px rgba(13, 148, 136, 0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.2)", padding: "10px", borderRadius: "12px", display: "flex" }}>
            <Sparkles size={24} style={{ color: "#fef08a" }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Asisten Kurikulum AI (Claude AI Style)</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.9 }}>Belum punya draf materi? Buat struktur bab, video, bacaan, dan kuis secara otomatis!</p>
          </div>
        </div>
        <button
          onClick={() => setShowAiModal(true)}
          className="btn hover-lift"
          style={{ background: "#fff", color: "#0f766e", fontWeight: 700, padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Sparkles size={16} style={{ color: "#f59e0b" }} /> Generate Kurikulum Otomatis
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>Struktur Kurikulum & Materi</h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Tarik dan lepas (drag & drop) untuk menyusun urutan materi dengan bebas.</p>
        </div>
        <button onClick={saveStructure} disabled={saving} className="btn btn-primary hover-lift" style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--teal)' }}>
          {saving ? <Loader2 className="spin" size={18}/> : <Save size={18} />} Simpan Kurikulum Sekarang
        </button>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, null, nodes.length)}
        style={{ minHeight: '320px', border: '2px dashed var(--teal)', borderRadius: '16px', padding: '1.5rem', background: 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}
      >
        {nodes.map(n => renderNode(n))}
        {nodes.length === 0 && (
          <div style={{ color: 'var(--muted)', textAlign: 'center', margin: '4rem 0', display: 'flex', flexDirection:'column', alignItems:'center', gap:'1rem' }}>
            <Folder size={56} style={{opacity:0.3, color: 'var(--teal)'}}/>
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Belum ada struktur kurikulum. Klik tombol di bawah atau gunakan AI Generator!</p>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { setActiveParentId(null); setShowFolderModal(true); }} className="btn btn-primary glass hover-lift" style={{ padding: '14px 28px', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Folder size={18} /> Tambah Bab / Folder Utama
        </button>
        <button onClick={() => { setActiveParentId(null); setShowUploadModal(true); }} className="btn btn-outline glass hover-lift" style={{ padding: '14px 28px', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'var(--teal)', color: 'var(--teal)' }}>
          <FileUp size={18} /> Unggah Materi / Berkas Utama
        </button>
      </div>

      {showFolderModal && (
        <FolderModal onClose={() => setShowFolderModal(false)} onSave={addFolder} />
      )}
      
      {showUploadModal && (
        <UploadModal parentId={activeParentId} onClose={() => setShowUploadModal(false)} onSave={addFile} />
      )}

      {showAiModal && (
        <div className="completion-overlay fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="data-card scale-in" style={{ width: '100%', maxWidth: '450px', padding: '2rem', borderRadius: '20px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <Sparkles size={24} style={{ color: "#f59e0b" }} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>AI Curriculum Generator</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.2rem' }}>
              Masukkan topik khusus atau biarkan AI menyusun silabus kepemimpinan eksekutif standar PROFAS secara otomatis.
            </p>
            <input
              type="text"
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
              placeholder="Contoh: Komunikasi Asertif & Negosiasi..."
              className="form-input"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAiModal(false)} disabled={aiLoading} className="btn btn-outline" style={{ borderRadius: '10px' }}>Batal</button>
              <button onClick={handleAiGenerate} disabled={aiLoading} className="btn btn-primary" style={{ borderRadius: '10px', background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {aiLoading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                {aiLoading ? "Menyusun Silabus..." : "Buat Kurikulum Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderModal({ onClose, onSave }: { onClose: () => void; onSave: (title: string) => void }) {
  const [title, setTitle] = useState("");
  return (
    <div className="completion-overlay fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div className="data-card scale-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: '20px', background: '#fff' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Tambah Folder/Bab Baru</h3>
        <input 
          autoFocus
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          className="form-input" 
          placeholder="Nama Bab (contoh: Bab 1. Pengenalan)" 
          style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}
        />
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-outline" style={{ borderRadius: '10px' }}>Batal</button>
          <button onClick={() => title.trim() && onSave(title)} className="btn btn-primary" style={{ borderRadius: '10px', background: 'var(--teal)', color: '#fff' }}>Simpan</button>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ parentId, onClose, onSave }: { parentId: string|null; onClose: () => void; onSave: (title: string, type: NodeType) => void }) {
  const [type, setType] = useState<NodeType>("VIDEO");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async () => {
    if (!title) return alert("Judul materi harus diisi.");
    if (type === "LINK" && !link) return alert("URL Tautan harus diisi.");
    if (type !== "LINK" && type !== "QUIZ" && type !== "ASSIGNMENT" && !file) return alert("Silakan pilih atau tarik file terlebih dahulu.");

    if (type === "QUIZ" || type === "ASSIGNMENT") {
       onSave(title, type);
       return;
    }

    setUploading(true);
    setTimeout(() => {
      onSave(title, type);
      setUploading(false);
    }, 600);
  };

  return (
    <div className="completion-overlay fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div className="data-card scale-in" style={{ width: '100%', maxWidth: '520px', padding: '2.2rem', borderRadius: '20px', background: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: 'var(--ink)' }}>Unggah Materi Pembelajaran</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20}/></button>
        </div>
        
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>Jenis Materi</label>
        <select className="form-input" value={type} onChange={(e) => setType(e.target.value as NodeType)} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '1.2rem', fontWeight: 600 }}>
          <option value="VIDEO">🎬 Video Pembelajaran (.mp4 / link video)</option>
          <option value="PDF">📑 Dokumen Modul / Bacaan (.pdf)</option>
          <option value="LINK">🔗 Tautan Luar (Web / Google Drive / Zoom)</option>
          <option value="QUIZ">❓ Kuis / Evaluasi Pre-Test</option>
          <option value="ASSIGNMENT">📝 Tugas Praktik Action Plan</option>
        </select>

        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>Judul Materi</label>
        <input 
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          className="form-input" 
          placeholder="Contoh: Studi Kasus Kepemimpinan Situasional..." 
          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '1.2rem' }}
        />

        {type === "LINK" ? (
           <>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>URL Tautan</label>
            <input type="url" value={link} onChange={e=>setLink(e.target.value)} className="form-input" placeholder="https://..." style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}/>
           </>
        ) : type !== "QUIZ" && type !== "ASSIGNMENT" ? (
          <>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>Berkas / File Materi</label>
            <div 
              className={`upload-zone ${dragOver ? 'dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
              }}
              style={{ 
                padding: '2rem', 
                border: `2px dashed ${dragOver ? '#0d9488' : '#cbd5e1'}`, 
                textAlign: 'center', 
                borderRadius: '16px', 
                marginBottom: '1.5rem',
                background: dragOver ? 'rgba(13, 148, 136, 0.05)' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => document.getElementById('hidden-file-input')?.click()}
            >
              <input 
                id="hidden-file-input"
                type="file" 
                style={{ display: 'none' }}
                onChange={e => setFile(e.target.files?.[0] || null)} 
              />
              <FileUp size={36} style={{ color: file ? '#0d9488' : '#94a3b8', margin: '0 auto 10px' }} />
              {file ? (
                <div>
                  <b style={{ color: '#0d9488', fontSize: '0.95rem', display: 'block' }}>{file.name}</b>
                  <small style={{ color: '#64748b' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB • Klik untuk ganti berkas</small>
                </div>
              ) : (
                <div>
                  <b style={{ fontSize: '0.95rem', color: '#334155', display: 'block' }}>Tarik & Lepas Berkas di Sini</b>
                  <small style={{ color: '#64748b' }}>Atau klik untuk menjelajah komputer (Maks 50MB: PDF, MP4, PPTX, DOCX)</small>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            💡 <b>Catatan Evaluasi:</b> Anda dapat mengatur butir soal kuis atau instruksi tugas praktik secara mendetail setelah menyimpan struktur kurikulum ini.
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={uploading} className="btn btn-outline" style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 600 }}>Batal</button>
          <button onClick={handleSubmit} disabled={uploading} className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '10px', background: 'var(--teal)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {uploading && <Loader2 size={16} className="spin" />}
            {uploading ? "Memproses..." : "Tambahkan ke Kurikulum"}
          </button>
        </div>
      </div>
    </div>
  );
}
