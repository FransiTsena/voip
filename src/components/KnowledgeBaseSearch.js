import React, { useState } from 'react';
import useStore from '../store/store';

const KnowledgeBaseSearch = () => {
  const [query, setQuery] = useState('');
  const articles = useStore((state) => state.articles);
  const searchArticles = useStore((state) => state.searchArticles);

  const handleSearch = (e) => {
    e.preventDefault();
    searchArticles(query);
  };

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
            <div key={article._id} className="p-2 border-b">
              <h3 className="font-bold">{article.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseSearch;
