import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// Define interface for feed data structure
interface Feed {
  id: string;
  feed_title: string;
  feed_url: string;
  website_url: string;
  favicon_url?: string; // Add favicon URL field
}

// Define interface for Papa Parse results
interface PapaParseResult {
  data: Record<string, string>[];
  errors: any[];
  meta: any;
}

const FeedDirectory = () => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Generate a favicon URL from a website URL
  const getFaviconUrl = (websiteUrl: string): string => {
    try {
      // Use Google's favicon service
      if (websiteUrl) {
        // Extract the domain from the URL
        const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
        return `https://www.google.com/s2/favicons?domain=${url.hostname}`;
      }
    } catch (e) {
      console.error("Error generating favicon URL:", e);
    }
    // Return a default favicon if we can't generate one
    return `${import.meta.env.BASE_URL}default-favicon.png`;
  };

  useEffect(() => {
    const loadFeeds = async () => {
      try {
        let fileData;
        const response = await fetch(`${import.meta.env.BASE_URL}feeds_deduped.csv`); // Use BASE_URL to get the correct path
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        fileData = await response.text();

        Papa.parse(fileData, {
          header: true,
          skipEmptyLines: true,
          complete: (results: PapaParseResult) => {
            const sanitizedFeeds = results.data.map((feed: Record<string, string>, index: number) => {
              const websiteUrl = feed.website_url || '';
              return {
                id: feed.feed_url || `feed-${index}`,
                feed_title: feed.feed_title || 'Untitled Feed',
                feed_url: feed.feed_url || '',
                website_url: websiteUrl,
                favicon_url: getFaviconUrl(websiteUrl)
              };
            }).filter((feed: Feed) => feed.feed_url);

            setFeeds(sanitizedFeeds);
            setLoading(false);
          },
          error: (error: Error) => {
            console.error("CSV Parsing Error:", error);
            setError(`Error parsing CSV: ${error.message}`);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Feed Loading Error:", err);
        setError(`Error loading or processing feeds: ${err instanceof Error ? err.message : 'Unknown error'}. Ensure 'feeds_deduped.csv' is accessible.`);
        setLoading(false);
      }
    };

    loadFeeds();
  }, []);

  const filteredFeeds = feeds.filter(feed =>
    feed.feed_title && typeof feed.feed_title === 'string' &&
    feed.feed_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInoreaderUrl = (feedUrl: string): string => {
    return `https://www.inoreader.com/search/feeds/${encodeURIComponent(String(feedUrl))}`;
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
    <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto my-8">
      <div className="p-6 bg-gradient-to-r from-purple-700 to-purple-900">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Local News + AI Feed Directory</h1>
        <p className="text-purple-100 mt-2 text-base md:text-lg font-medium">Browse and subscribe to {feeds.length} curated feeds</p>

        <div className="mt-4">
          <input
            type="text"
            aria-label="Search feeds"
            placeholder="Search feeds..."
            className="w-full p-3 rounded-lg border-2 border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-500 font-medium text-gray-700 placeholder-gray-400 transition duration-150 ease-in-out"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {filteredFeeds.length === 0 ? (
          <div className="p-6 text-center text-gray-500 font-medium italic">
            {searchTerm ? "No feeds found matching your search." : "No feeds available."}
          </div>
        ) : (
          filteredFeeds.map((feed) => (
            <div
              key={feed.id || feed.feed_url}
              className="p-4 md:p-5 hover:bg-gray-50 transition-colors duration-150 border-l-4 border-transparent hover:border-purple-600 border-b border-gray-200 group"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 sm:gap-4 min-w-0">
                <h2 className="text-lg font-semibold text-gray-800 group-hover:text-purple-800 transition-colors whitespace-nowrap overflow-hidden text-ellipsis min-w-0 flex-grow mr-4 flex items-center">
                  <img
                    src={feed.favicon_url}
                    alt=""
                    className="w-4 h-4 mr-2 flex-shrink-0"
                    onError={(e) => {
                      // Fallback if favicon fails to load
                      (e.target as HTMLImageElement).src = `${import.meta.env.BASE_URL}default-favicon.png`;
                    }}
                  />
                  {feed.feed_title}
                </h2>

                <div className="flex space-x-2 justify-end flex-shrink-0 self-end sm:self-center">
                  {feed.feed_url && (
                    <a
                      href={getInoreaderUrl(feed.feed_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Subscribe to ${feed.feed_title} in Inoreader`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 transition ease-in-out duration-150"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Subscribe
                    </a>
                  )}
                  {feed.website_url && (
                    <a
                      href={feed.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Visit website for ${feed.feed_title}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition ease-in-out duration-150"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-600 text-center sm:text-left">
          Showing: <span className="text-purple-700 font-bold">{filteredFeeds.length}</span> of <span className="text-purple-700 font-bold">{feeds.length}</span> feeds {searchTerm ? <span className="italic">(filtered)</span> : ''}
        </p>
      </div>
    </div>
  );
};

export default FeedDirectory;