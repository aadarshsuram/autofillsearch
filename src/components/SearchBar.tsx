import React, { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { dummyData } from "../data/dummyData";
import { LRUCache } from "../utils/LRUCache";
import { Search, X } from "lucide-react";

const cache = new LRUCache<string, string[]>(10);
const recentSearches = new LRUCache<string, string>(10);

export function SearchBar() {
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 300);
  const [results, setResults] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showRecent, setShowRecent] = useState(false);
  const [triggerRecentUpdate, setTriggerRecentUpdate] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setSelectedIndex(-1);
    setShowRecent(val === "");
    if (val === "") setResults([]);
  };

  useEffect(() => {
    if (!debouncedInput) {
      setShowRecent(true);
      return;
    }

    const key = debouncedInput.toLowerCase();
    const cached = cache.get(key);

    if (cached) {
      setResults(cached);
    } else {
      const filtered = dummyData
        .filter((item) => item.name.toLowerCase().includes(key))
        .map((item) => item.name);
      cache.set(key, filtered);
      setResults(filtered);
    }
  }, [debouncedInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        const selected = results[selectedIndex];
        handleSelect(selected);
      }
    }
  };

  const handleSelect = (term: string) => {
    setInput(term);
    recentSearches.set(term, term);
    setResults([]);
    setSelectedIndex(-1);
    setShowRecent(false);
    setTriggerRecentUpdate((prev) => prev + 1);
  };

  const handleClearRecent = () => {
    recentSearches.clear();
    setShowRecent(false);
    setTriggerRecentUpdate((prev) => prev + 1);
  };

  const handleRemoveRecent = (term: string) => {
    recentSearches.delete(term);
    setTriggerRecentUpdate((prev) => prev + 1);
  };

  const highlightMatch = (text: string, query: string) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);
    return (
      <span>
        {before}
        <strong>{match}</strong>
        {after}
      </span>
    );
  };

  const recentTerms = Array.from(recentSearches.keys());

  return (
    <div className="search-container">
      <div className="search-bar">
        <Search size={20} strokeWidth={2} />
        <input
          type="text"
          placeholder="Search..."
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (input === "") setShowRecent(true);
          }}
        />

        {input && (
          <button
            onClick={() => {
              setInput("");
              setResults([]);
              setSelectedIndex(-1);
              setShowRecent(true);
            }}
            className="clear-button"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {(results.length > 0 || showRecent) && (
        <ul className="search-suggestions">
          {showRecent &&
            recentTerms.map((term, idx) => (
              <li
                key={`recent-${idx}`}
                className="search-suggestion flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer"
              >
                <span onClick={() => handleSelect(term)} className="flex-1 italic text-gray-600">
                  Recent: {term}
                </span>
                <X
                  size={16}
                  className="text-gray-400 hover:text-red-600 ml-2"
                  onClick={() => handleRemoveRecent(term)}
                />
              </li>
            ))}

          {!showRecent &&
            results.map((result, idx) => (
              <li
                key={idx}
                className={`search-suggestion p-2 flex items-center gap-2 cursor-pointer ${
                  selectedIndex === idx ? "bg-gray-200" : ""
                }`}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelect(result)}
              >
                <Search size={16} strokeWidth={2} />
                {highlightMatch(result, debouncedInput)}
              </li>
            ))}

          {showRecent && recentTerms.length > 0 && (
            <li
              className="clear-recent"
              onClick={handleClearRecent}
            >
              Clear all recent searches
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
