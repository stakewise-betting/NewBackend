import axios from "axios";
import NodeCache from "node-cache";

// Cache instance - 5 minutes TTL, check period every 2 minutes
const newsCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 120, // 2 minutes
});

// Rate limiting configuration
const RATE_LIMITS = {
  twitter: { calls: 0, resetTime: Date.now() + 15 * 60 * 1000 }, // 15 minutes
  crypto: { calls: 0, resetTime: Date.now() + 60 * 60 * 1000 }, // 1 hour
};

// Helper function to check rate limits
const checkRateLimit = (source, maxCalls) => {
  const now = Date.now();
  const limit = RATE_LIMITS[source];

  if (now > limit.resetTime) {
    limit.calls = 0;
    limit.resetTime =
      now + (source === "twitter" ? 15 * 60 * 1000 : 60 * 60 * 1000);
  }

  if (limit.calls >= maxCalls) {
    return false;
  }

  limit.calls++;
  return true;
};

// Mock data generators for development/fallback
const generateMockTwitterNews = () => {
  const mockTweets = [
    {
      id: "1234567890123456789",
      text: "Breaking: Major cryptocurrency exchange announces new security features to protect user assets. Enhanced 2FA and cold storage implementation coming soon. #CryptoSecurity #BlockchainNews",
      author_id: "987654321",
      created_at: new Date(
        Date.now() - Math.random() * 24 * 60 * 60 * 1000
      ).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=300&fit=crop", // Added image URL
      public_metrics: {
        like_count: Math.floor(Math.random() * 1000),
        retweet_count: Math.floor(Math.random() * 500),
      },
    },
    {
      id: "1234567890123456791",
      text: "DeFi protocol launches innovative yield farming strategy. Users can now stake multiple tokens for higher APY. Early adopters report impressive returns. #DeFi #YieldFarming",
      author_id: "765432109",
      created_at: new Date(
        Date.now() - Math.random() * 6 * 60 * 60 * 1000
      ).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop", // Added image URL
      public_metrics: {
        like_count: Math.floor(Math.random() * 500),
        retweet_count: Math.floor(Math.random() * 250),
      },
    },
    {
      id: "1234567890123456792",
      text: "New blockchain gaming platform introduces play-to-earn mechanics with NFT rewards. Beta testing shows promising user engagement and token economics. #GameFi #NFT",
      author_id: "543210987",
      created_at: new Date(
        Date.now() - Math.random() * 3 * 60 * 60 * 1000
      ).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=400&h=300&fit=crop", // Added image URL
      public_metrics: {
        like_count: Math.floor(Math.random() * 750),
        retweet_count: Math.floor(Math.random() * 300),
      },
    },
  ];

  return mockTweets;
};

const generateMockCryptoNews = () => {
  const mockNews = [
    {
      id: "crypto-news-1",
      title: "Ethereum 2.0 Staking Rewards Reach All-Time High",
      body: "Ethereum validators are seeing unprecedented returns as network activity surges. The latest upgrade has improved transaction speeds while maintaining security. Analysts predict continued growth in staking participation.",
      published_on: Math.floor(
        (Date.now() - Math.random() * 12 * 60 * 60 * 1000) / 1000
      ),
      imageurl:
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop",
      url: "https://example-crypto-news.com/ethereum-staking-ath",
      source_info: {
        name: "CryptoDaily",
      },
    },
    {
      id: "crypto-news-2",
      title: "Major Bank Announces Cryptocurrency Trading Services",
      body: "Traditional banking meets digital assets as one of the world's largest banks launches crypto trading for institutional clients. This marks a significant step in mainstream adoption of digital currencies.",
      published_on: Math.floor(
        (Date.now() - Math.random() * 8 * 60 * 60 * 1000) / 1000
      ),
      imageurl:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop",
      url: "https://example-crypto-news.com/bank-crypto-trading",
      source_info: {
        name: "Financial Times Crypto",
      },
    },
    {
      id: "crypto-news-3",
      title: "Bitcoin Mining Goes Green with Renewable Energy Initiative",
      body: "Mining companies are increasingly adopting solar and wind power to reduce environmental impact. This shift could address one of the main criticisms of cryptocurrency mining operations.",
      published_on: Math.floor(
        (Date.now() - Math.random() * 6 * 60 * 60 * 1000) / 1000
      ),
      imageurl:
        "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=300&fit=crop",
      url: "https://example-crypto-news.com/bitcoin-green-mining",
      source_info: {
        name: "Green Crypto Today",
      },
    },
  ];

  return mockNews;
};

// Twitter News Fetcher
export const getTwitterNews = async (req, res) => {
  try {
    const cacheKey = "twitter_news";
    let cachedNews = newsCache.get(cacheKey);

    if (cachedNews) {
      console.log("Returning cached Twitter news");
      return res.status(200).json(cachedNews);
    }

    let twitterNews = [];

    if (process.env.TWITTER_BEARER_TOKEN && checkRateLimit("twitter", 100)) {
      try {
        console.log("Fetching Twitter news from API...");
        
        const response = await axios.get(
          "https://api.twitter.com/2/tweets/search/recent",
          {
            headers: {
              Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
              "Content-Type": "application/json",
            },
            params: {
              query: "(stock market OR economy OR bitcoin OR ethereum OR defi) -is:retweet lang:en has:images",
              max_results: 10,
              "tweet.fields": "created_at,author_id,public_metrics,attachments,context_annotations",
              "expansions": "attachments.media_keys,author_id",
              "media.fields": "url,preview_image_url,type,width,height",
              "user.fields": "username,name,profile_image_url",
            },
            timeout: 15000,
          }
        );

        if (response.data && response.data.data) {
          console.log(`Found ${response.data.data.length} tweets from Twitter API`);
          
          // Create lookup maps for includes data
          const mediaMap = {};
          const userMap = {};
          
          if (response.data.includes?.media) {
            response.data.includes.media.forEach(media => {
              mediaMap[media.media_key] = media;
            });
          }
          
          if (response.data.includes?.users) {
            response.data.includes.users.forEach(user => {
              userMap[user.id] = user;
            });
          }

          // Process tweets and add image URLs and user info
          twitterNews = response.data.data.map(tweet => {
            let imageUrl = null;
            let authorName = `User ${tweet.author_id}`;
            
            // Get media if available
            if (tweet.attachments && tweet.attachments.media_keys) {
              const mediaKey = tweet.attachments.media_keys[0]; // Get first media
              const media = mediaMap[mediaKey];
              if (media && media.type === 'photo') {
                imageUrl = media.url;
              }
            }
            
            // Get author info if available
            const user = userMap[tweet.author_id];
            if (user) {
              authorName = user.name || user.username || authorName;
            }

            return {
              id: tweet.id,
              text: tweet.text,
              author_id: tweet.author_id,
              created_at: tweet.created_at,
              imageUrl: imageUrl,
              public_metrics: tweet.public_metrics || {
                like_count: 0,
                retweet_count: 0,
              },
              authorName: authorName,
            };
          });
          
          // Filter out tweets without images if we want only image tweets
          // twitterNews = twitterNews.filter(tweet => tweet.imageUrl);
          
        } else {
          console.log("No data received from Twitter API, using mock data");
          twitterNews = generateMockTwitterNews();
        }
      } catch (apiError) {
        console.error("Twitter API error:", {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data
        });
        
        // Check if it's a rate limiting error
        if (apiError.response?.status === 429) {
          console.log("Twitter API rate limited, using cached data or mock data");
        }
        
        twitterNews = generateMockTwitterNews();
      }
    } else {
      console.log("Using mock Twitter data (API key missing or rate limited)");
      twitterNews = generateMockTwitterNews();
    }

    console.log(`Caching ${twitterNews.length} Twitter news items`);
    newsCache.set(cacheKey, twitterNews);
    res.status(200).json(twitterNews);
  } catch (error) {
    console.error("Error fetching Twitter news:", error);
    const fallbackNews = generateMockTwitterNews();
    res.status(200).json(fallbackNews);
  }
};

// Crypto News Fetcher
export const getCryptoNews = async (req, res) => {
  try {
    const cacheKey = "crypto_news";
    let cachedNews = newsCache.get(cacheKey);

    if (cachedNews) {
      console.log("Returning cached crypto news");
      return res.status(200).json(cachedNews);
    }

    let cryptoNews = [];

    // Try to fetch from CryptoCompare API if configured and rate limit allows
    if (process.env.CRYPTO_API_KEY && checkRateLimit("crypto", 50)) {
      try {
        console.log("Fetching crypto news from API...");
        
        const response = await axios.get(
          "https://min-api.cryptocompare.com/data/v2/news/",
          {
            params: {
              lang: "EN",
              sortOrder: "latest",
              api_key: process.env.CRYPTO_API_KEY,
            },
            timeout: 15000, // 15 second timeout
          }
        );

        if (response.data && response.data.Data) {
          console.log(`Found ${response.data.Data.length} articles from CryptoCompare API`);
          cryptoNews = response.data.Data.slice(0, 5); // Limit to 10 articles
        } else {
          console.log("No data received from CryptoCompare API, using mock data");
          cryptoNews = generateMockCryptoNews();
        }
      } catch (apiError) {
        console.error("CryptoCompare API error:", {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText
        });
        
        // Fall back to mock data
        cryptoNews = generateMockCryptoNews();
      }
    } else {
      // Use mock data if no API key or rate limited
      console.log("Using mock crypto data (API key missing or rate limited)");
      cryptoNews = generateMockCryptoNews();
    }

    // Cache the results
    console.log(`Caching ${cryptoNews.length} crypto news items`);
    newsCache.set(cacheKey, cryptoNews);

    res.status(200).json(cryptoNews);
  } catch (error) {
    console.error("Error fetching crypto news:", error);

    // Return mock data as ultimate fallback
    const fallbackNews = generateMockCryptoNews();
    res.status(200).json(fallbackNews);
  }
};

// Cache Management
export const clearNewsCache = async (req, res) => {
  try {
    const { source } = req.params;

    if (source === "all") {
      newsCache.flushAll();
      res.status(200).json({ message: "All caches cleared successfully" });
    } else if (["twitter", "crypto"].includes(source)) {
      const cacheKey = `${source}_news`;
      newsCache.del(cacheKey);
      res.status(200).json({ message: `${source} cache cleared successfully` });
    } else {
      res
        .status(400)
        .json({ error: 'Invalid source. Use "twitter", "crypto", or "all"' });
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({ error: "Failed to clear cache" });
  }
};

// Cache Status
export const getCacheStatus = async (req, res) => {
  try {
    const keys = newsCache.keys();
    const stats = newsCache.getStats();

    const cacheInfo = {
      keys: keys,
      stats: stats,
      ttl: 300, // 5 minutes
      rateLimits: {
        twitter: {
          calls: RATE_LIMITS.twitter.calls,
          resetTime: new Date(RATE_LIMITS.twitter.resetTime).toISOString(),
        },
        crypto: {
          calls: RATE_LIMITS.crypto.calls,
          resetTime: new Date(RATE_LIMITS.crypto.resetTime).toISOString(),
        },
      },
      environment: {
        twitterConfigured: !!process.env.TWITTER_BEARER_TOKEN,
        cryptoConfigured: !!process.env.CRYPTO_API_KEY,
        nodeEnv: process.env.NODE_ENV || "development",
      },
    };

    res.status(200).json(cacheInfo);
  } catch (error) {
    console.error("Error getting cache status:", error);
    res.status(500).json({ error: "Failed to get cache status" });
  }
};