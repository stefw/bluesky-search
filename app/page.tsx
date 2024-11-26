"use client";

import { useState } from "react";
import { BskyAgent, AppBskyFeedDefs } from "@atproto/api";

interface Post extends AppBskyFeedDefs.PostView {
  record: {
    text: string;
    langs?: string[];
    $type: string;
    createdAt: string;
  };
}

interface Language {
  id: string;
  name: string;
}

const LANGUAGES: Language[] = [
  { id: "fr", name: "Français" },
  { id: "en", name: "Anglais" },
];

export default function Home() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["fr", "en"]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const agent = new BskyAgent({ service: "https://bsky.social" });
      await agent.login({ identifier, password });
      setIsLoggedIn(true);
    } catch (error) {
      setError("Erreur de connexion. Vérifiez vos identifiants.");
      console.error("Erreur de connexion:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError("");

    try {
      const agent = new BskyAgent({ service: "https://bsky.social" });
      await agent.login({ identifier, password });
      const response = await agent.app.bsky.feed.searchPosts({ 
        q: searchQuery, 
        limit: 30
      });
      
      const filteredPosts = response.data.posts.filter((post: AppBskyFeedDefs.PostView) => {
        const postLang = (post.record as any).langs?.[0] || "unknown";
        return selectedLanguages.includes(postLang);
      });
      
      setPosts(filteredPosts as Post[]);
    } catch (error) {
      setError("Erreur lors de la recherche.");
      console.error("Erreur de recherche:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = (langId: string) => {
    setSelectedLanguages(prev => 
      prev.includes(langId)
        ? prev.filter(id => id !== langId)
        : [...prev, langId]
    );
  };

  const getPostUrl = (uri: string) => {
    const parts = uri.split('/');
    return `https://bsky.app/profile/${parts[2]}/post/${parts[4]}`;
  };

  const downloadCSV = () => {
    if (posts.length === 0) return;

    const headers = [
      "Auteur",
      "Handle",
      "Texte",
      "Date",
      "Likes",
      "Reposts",
      "Réponses",
      "Langue",
      "URL"
    ];

    const csvData = posts.map(post => [
      post.author.displayName || "",
      post.author.handle,
      post.record.text.replace(/"/g, '""'),
      new Date(post.record.createdAt).toLocaleString(),
      post.likeCount || 0,
      post.repostCount || 0,
      post.replyCount || 0,
      post.record.langs?.[0] || "unknown",
      getPostUrl(post.uri)
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bluesky-search-${searchQuery}-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Recherche Bluesky</h1>
        
        {!isLoggedIn ? (
          <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Connexion</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Identifiant</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md mb-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 p-2 border rounded"
                    placeholder="Rechercher des posts..."
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    {loading ? "Recherche..." : "Rechercher"}
                  </button>
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Langues :</label>
                  <div className="flex gap-3">
                    {LANGUAGES.map(lang => (
                      <label key={lang.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedLanguages.includes(lang.id)}
                          onChange={() => handleLanguageToggle(lang.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>{lang.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            {posts.length > 0 && (
              <div className="mb-8 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {posts.length} résultat{posts.length > 1 ? 's' : ''} trouvé{posts.length > 1 ? 's' : ''}
                </div>
                <button
                  onClick={downloadCSV}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Télécharger en CSV
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <a 
              href={getPostUrl(post.uri)} 
              target="_blank" 
              rel="noopener noreferrer"
              key={post.uri} 
              className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div>
                  <p className="font-semibold">{post.author.displayName}</p>
                  <p className="text-gray-500">@{post.author.handle}</p>
                </div>
              </div>
              <p className="mb-4">{post.record.text}</p>
              <div className="text-sm text-gray-500 flex justify-between items-center">
                <div>
                  <span className="mr-4">❤️ {post.likeCount || 0}</span>
                  <span className="mr-4">🔄 {post.repostCount || 0}</span>
                  <span>💬 {post.replyCount || 0}</span>
                </div>
                <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {post.record.langs?.[0] || "unknown"}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
