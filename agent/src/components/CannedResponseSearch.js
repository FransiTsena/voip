import React, { useState, useEffect } from 'react';
import useStore from '../store/store';

const CannedResponseSearch = () => {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const cannedResponses = useStore((state) => state.cannedResponses);
  const fetchCannedResponses = useStore((state) => state.fetchCannedResponses);

  useEffect(() => {
    fetchCannedResponses();
  }, [fetchCannedResponses]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCannedResponses(query);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <h2 className="p-4 text-lg font-bold border-b">Canned Responses</h2>
      <div className="p-4">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-2 border"
            placeholder="Search responses..."
          />
        </form>
        <div className="mt-4">
          {cannedResponses.map((response) => (
            <div key={response._id} className="p-2 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">{response.title}</h3>
                <button
                  onClick={() => handleCopy(response.body)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">{response.body}</p>
            </div>
          ))}
        </div>
        {copied && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg">
            Copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
};

export default CannedResponseSearch;
