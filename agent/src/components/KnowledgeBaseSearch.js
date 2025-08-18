import React, { useState, useEffect } from 'react';
import useStore from '../store/store';

const KnowledgeBaseSearch = () => {
  const [query, setQuery] = useState('');
  const articles = useStore((state) => state.articles);
  const selectedArticle = useStore((state) => state.selectedArticle);
  const searchArticles = useStore((state) => state.searchArticles);
  const fetchArticleById = useStore((state) => state.fetchArticleById);
  const setSelectedArticle = useStore((state) => state.setSelectedArticle);

  const handleSearch = (e) => {
    e.preventDefault();
    searchArticles(query);
  };

  useEffect(() => {
    return () => {
      setSelectedArticle(null);
    };
  }, [setSelectedArticle]);

  return (
    <div>
      <h2 className="p-4 text-lg font-bold border-b">KB Suggestions</h2>
      <div className="p-4">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-2 border"
            placeholder="Search KB..."
          />
        </form>
        <div>
          {articles.map((article) => (
            <div
              key={article._id}
              className="p-2 border-b cursor-pointer"
              onClick={() => fetchArticleById(article._id)}
            >
              <h3 className="font-bold">{article.title}</h3>
            </div>
          ))}
        </div>
        {selectedArticle && (
          <div className="p-4 mt-4 border-t">
            <h3 className="text-lg font-bold">{selectedArticle.title}</h3>
            <p className="mt-2">{selectedArticle.content}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseSearch;
