import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const FeedDirectory = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadFeeds = async () => {
      try {
        // Assuming window.fs is available (e.g., in Electron)
        // If running in a standard browser, you'd fetch this differently
        let fileData;
        if (typeof window !== 'undefined' && window.fs) { // Added check for window existence
          fileData = await window.fs.readFile('feeds_deduped.csv', { encoding: 'utf8' });
        } else {
          // Fallback for browser environment (replace with your actual path)
          const response = await fetch('/feeds_deduped.csv'); // Adjust path if needed relative to public folder
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          fileData = await response.text();
        }


        Papa.parse(fileData, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Ensure feed_title and feed_url exist, provide defaults if not
            const sanitizedFeeds = results.data.map((feed, index) => ({
              id: feed.feed_url || `feed-${index}`, // Add a unique key source if possible, fallback to URL/index
              feed_title: feed.feed_title || 'Untitled Feed',
              feed_url: feed.feed_url || '',
              website_url: feed.website_url || ''
            })).filter(feed => feed.feed_url); // Filter out feeds without a feed_url as it's crucial

            setFeeds(sanitizedFeeds);
            setLoading(false);
          },
          error: (error) => {
            console.error("CSV Parsing Error:", error); // Log detailed error
            setError(`Error parsing CSV: ${error.message}`);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Feed Loading Error:", err); // Log detailed error
        // Provide more context for fetch errors
        setError(`Error loading or processing feeds: ${err.message}. Ensure 'feeds_deduped.csv' is accessible.`);
        setLoading(false);
      }
    };

    loadFeeds();
  }, []); // Empty dependency array means this runs once on mount

  const filteredFeeds = feeds.filter(feed =>
    // Check if feed_title exists and is a string before calling toLowerCase
    feed.feed_title && typeof feed.feed_title === 'string' &&
    feed.feed_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to handle URL encoding for Inoreader
  const getInoreaderUrl = (feedUrl) => {
    // Ensure feedUrl is a string before encoding
    return `https://www.inoreader.com/search/feeds/${encodeURIComponent(String(feedUrl))}`;
  };

  // Function to get favicon URL from website URL
  const getFaviconUrl = (websiteUrl) => {
    if (!websiteUrl) return null;

    try {
      // Extract domain from website URL
      const url = new URL(websiteUrl);
      const domain = url.hostname;

      // Use DuckDuckGo's favicon service which has fewer CORS issues
      return `https://external-content.duckduckgo.com/ip3/${domain}.ico`;
    } catch (error) {
      console.error("Error generating favicon URL:", error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg font-medium text-gray-700">Loading feeds...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-4xl mx-auto my-4" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto my-8"> {/* Added my-8 for margin */}
      <div className="p-6 bg-gradient-to-r from-purple-700 to-purple-900">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Local News + AI Feed Directory</h1>
        <p className="text-purple-100 mt-2 text-base md:text-lg font-medium">Browse and subscribe to {feeds.length} curated feeds</p>

        <div className="mt-4">
          <input
            type="text"
            aria-label="Search feeds" // Added aria-label
            placeholder="Search feeds..."
            className="w-full p-3 rounded-lg border-2 border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-500 font-medium text-gray-700 placeholder-gray-400 transition duration-150 ease-in-out" // Enhanced focus state
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Use overflow-y-auto if list can get very long */}
      <div className="divide-y divide-gray-200 max-h-[60vh] overflow-y-auto"> {/* Added max-height and scroll */}
        {filteredFeeds.length === 0 ? (
          <div className="p-6 text-center text-gray-500 font-medium italic">
            {searchTerm ? "No feeds found matching your search." : "No feeds available."}
          </div>
        ) : (
          filteredFeeds.map((feed) => ( // Use feed.id for key if available and stable
            // --- BORDER FIX APPLIED HERE ---
            <div
              key={feed.id || feed.feed_url} // Use a stable unique key
              className="p-4 md:p-5 hover:bg-gray-50 transition-colors duration-150 border-l-4 border-transparent hover:border-purple-600 group" // Added group for potential group-hover usage
            >
              {/* --- END OF BORDER FIX --- */}
              {/* Use min-w-0 on the container div to help flexbox handle potential overflow */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 sm:gap-4 min-w-0">
                {/* Title takes remaining space, handles overflow */}
                <h2 className="text-lg font-semibold text-gray-800 group-hover:text-purple-800 transition-colors whitespace-nowrap overflow-hidden text-ellipsis min-w-0 flex-grow mr-4"> {/* Added group-hover, flex-grow */}
                  {feed.feed_title}
                </h2>

                {/* Buttons container: prevent shrinking, align items */}
                <div className="flex space-x-2 justify-end flex-shrink-0 self-end sm:self-center"> {/* Align buttons properly on small screens */}
                  {/* Conditionally render subscribe button only if feed_url exists */}
                  {feed.feed_url && (
                    <a
                      href={getInoreaderUrl(feed.feed_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Subscribe to ${feed.feed_title} in Inoreader`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 transition ease-in-out duration-150" // Adjusted padding slightly
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> {/* Adjusted icon margin */}
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /> {/* Simpler Plus Icon */}
                      </svg>
                      Subscribe
                    </a>
                  )}
                  {/* Conditionally render visit button only if website_url exists */}
                  {feed.website_url && (
                    <a
                      href={feed.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Visit website for ${feed.feed_title}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition ease-in-out duration-150" // Adjusted padding slightly
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> {/* Adjusted icon margin */}
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Visit Site
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-t border-gray-200"> {/* Adjusted padding */}
        <p className="text-sm font-medium text-gray-600 text-center sm:text-left"> {/* Centered on small screens */}
          Showing: <span className="text-purple-700 font-bold">{filteredFeeds.length}</span> of <span className="text-purple-700 font-bold">{feeds.length}</span> feeds {searchTerm ? <span className="italic">(filtered)</span> : ''}
        </p>
      </div>
    </div>
  );
};

export default FeedDirectory;