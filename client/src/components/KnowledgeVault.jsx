import React, { useState } from 'react';
import {
  FolderKanban,
  UploadCloud,
  FileText,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Database,
  Sparkles,
  Layers
} from 'lucide-react';
import { uploadVaultFile, queryVault } from '../services/api';

export default function KnowledgeVault() {
  const [documents, setDocuments] = useState([
    { file_id: 'doc-1', filename: 'Dynamic_Programming_Patterns.pdf', chunks_ingested: 18, size_bytes: 245000, status: 'Indexed in ChromaDB' },
    { file_id: 'doc-2', filename: 'System_Design_Cheatsheet.txt', chunks_ingested: 12, size_bytes: 85000, status: 'Indexed in ChromaDB' },
    { file_id: 'doc-3', filename: 'LeetCode_Top_50_Solutions.pdf', chunks_ingested: 24, size_bytes: 512000, status: 'Indexed in ChromaDB' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // New Topic Form State
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [topicCategory, setTopicCategory] = useState('DSA');
  const [topicsList, setTopicsList] = useState([
    { id: 't1', name: 'Dynamic Programming', category: 'DSA', difficulty: 'Hard' },
    { id: 't2', name: 'System Architecture', category: 'System Design', difficulty: 'Medium' },
    { id: 't3', name: 'Graph Traversal (BFS/DFS)', category: 'DSA', difficulty: 'Medium' },
  ]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const result = await uploadVaultFile(file);
    setIsUploading(false);

    if (result) {
      setDocuments((prev) => [
        {
          file_id: result.file_id || `doc-${Date.now()}`,
          filename: result.filename || file.name,
          chunks_ingested: result.chunks_ingested || 10,
          size_bytes: file.size,
          status: 'Indexed in ChromaDB',
        },
        ...prev,
      ]);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const data = await queryVault(searchQuery);
    setIsSearching(false);
    setSearchResults(data);
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!topicName.trim()) return;

    setTopicsList((prev) => [
      ...prev,
      { id: `t-${Date.now()}`, name: topicName, category: topicCategory, difficulty: 'Medium' },
    ]);
    setTopicName('');
    setShowTopicModal(false);
  };

  const handleDeleteTopic = (id) => {
    setTopicsList((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1040px', margin: '20px auto', padding: '0 20px' }}>

      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="badge badge-cyan" style={{ marginBottom: '6px' }}>
              <Database size={14} /> Personal Knowledge Vault & RAG Engine
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
              Document Vault & Semantic Search
            </h2>
          </div>

          <button
            onClick={() => setShowTopicModal(!showTopicModal)}
            className="btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.9rem' }}
          >
            <Plus size={16} />
            Add Custom Topic
          </button>
        </div>
      </div>

      {/* Grid: Upload Box + Semantic Search Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>

        {/* Upload Box */}
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center', border: '2px dashed var(--border-color)', position: 'relative' }}>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileUpload}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
          />
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
            <UploadCloud size={24} color="var(--primary)" />
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>
            {isUploading ? 'Chunking & Embedding into ChromaDB...' : 'Upload Notes / PDF Documents'}
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Drag and drop or click to upload PDF or text study guides (Max 10MB)
          </p>
        </div>

        {/* Semantic Search Box */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Search size={18} color="var(--secondary)" /> Semantic RAG Search Engine
          </h4>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your notes (e.g. DP state transitions)..."
            />
            <button type="submit" className="btn-primary" disabled={isSearching}>
              {isSearching ? '...' : <Search size={16} />}
            </button>
          </form>

          {/* Search Results Display */}
          {searchResults && (
            <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>94% Relevance Match</span>
              <p style={{ color: 'var(--text-main)', margin: 0, fontStyle: 'italic' }}>
                "{searchResults.results?.[0]?.content || 'Found relevant match in your study notes.'}"
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Ingested Documents List Table */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <FileText size={20} color="var(--primary)" /> Indexed Study Documents ({documents.length})
      </h3>

      <div className="glass-panel" style={{ overflowX: 'auto', marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 20px' }}>File Name</th>
              <th style={{ padding: '14px 20px' }}>Chunks Ingested</th>
              <th style={{ padding: '14px 20px' }}>Size</th>
              <th style={{ padding: '14px 20px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.file_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '14px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={16} color="var(--secondary)" /> {doc.filename}
                </td>
                <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{doc.chunks_ingested} Chunks</td>
                <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{Math.round(doc.size_bytes / 1024)} KB</td>
                <td style={{ padding: '14px 20px' }}>
                  <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                    <CheckCircle2 size={12} /> {doc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Topic Manager Drawer / Modal */}
      {showTopicModal && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '32px', border: '1px solid var(--primary)' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Add Custom Topic Entry</h4>
          <form onSubmit={handleAddTopic} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Topic Name (e.g., Trie Data Structure)"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              style={{ flex: 1, minWidth: '220px' }}
              required
            />
            <select
              className="form-input"
              value={topicCategory}
              onChange={(e) => setTopicCategory(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="DSA">DSA</option>
              <option value="System Design">System Design</option>
              <option value="Core CS">Core CS</option>
              <option value="Aptitude">Aptitude</option>
            </select>
            <button type="submit" className="btn-primary">Save Topic</button>
          </form>

          {/* Current Custom Topics Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
            {topicsList.map((t) => (
              <span key={t.id} className="badge badge-purple" style={{ padding: '6px 12px', gap: '8px' }}>
                {t.name} ({t.category})
                <Trash2 size={12} style={{ cursor: 'pointer' }} onClick={() => handleDeleteTopic(t.id)} />
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
