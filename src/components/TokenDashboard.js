import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Theme Toggle Component
const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Effect to apply theme class to body and content-wrapper
  useEffect(() => {
    const contentWrapper = document.querySelector('.content-wrapper');
    
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      if (contentWrapper) contentWrapper.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
      if (contentWrapper) contentWrapper.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Toggle theme function
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    // Save preference in localStorage
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // Check for saved theme preference on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  return (
    <button 
      className="theme-toggle-button" 
      onClick={toggleTheme}
    >
      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
};

// Currency Formatting Utility
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  
  // Handle large numbers
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(2)}B`;
  } else if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  
  // Format based on value size
  if (num >= 1) {
    return `$${num.toFixed(2)}`;
  } else if (num >= 0.01) {
    return `$${num.toFixed(4)}`;
  } else {
    return `$${num.toFixed(8)}`;
  }
};

// Token Card Component
function TokenCard({ token, highlight = false }) {
  const navigate = useNavigate();
  const dexScreenerLink = `https://dexscreener.com/base/${token.contractAddress}`;

  const handleCardClick = (e) => {
    // Prevent navigation if DexScreener link is clicked
    if (e.target.closest('.dexscreener-link')) return;
    navigate(`/token/${token.contractAddress}`);
  };

  return (
    <div 
      className={`token-card ${highlight ? 'highlight-card' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="token-card-header">
        <h3>{token.name}</h3>
        <a 
          href={dexScreenerLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="dexscreener-link"
          onClick={(e) => e.stopPropagation()}
        >
          DexScreener
        </a>
      </div>
      <p>Symbol: {token.symbol}</p>
      <p>Price: {formatCurrency(token.price_usd)}</p>
      <p>Market Cap: {formatCurrency(token.fdv_usd)}</p>
      <p>24h Volume: {formatCurrency(token.volume_usd)}</p>
      <small>Contract: {token.contractAddress}</small>
    </div>
  );
}

// Main Token Dashboard Component
function TokenDashboard() {
  const [tokens, setTokens] = useState([]);
  const [highestMarketCapToken, setHighestMarketCapToken] = useState(null);
  const [highestVolumeToken, setHighestVolumeToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('marketCap');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // Track if we're on mobile for spacing
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Banner text for scrolling banner
  const bannerText = "WELCOME TO THE JUNGLE • WELCOME TO THE JUNGLE • WELCOME TO THE JUNGLE • ";

  // Check for mobile screen size on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchGlobalTopTokens = useCallback(async () => {
    try {
      const response = await axios.get('https://website-4g84.onrender.com/api/global-top-tokens');
      
      setHighestMarketCapToken(response.data.topMarketCapToken);
      setHighestVolumeToken(response.data.topVolumeToken);
    } catch (err) {
      console.error('Failed to fetch global top tokens', err);
    }
  }, []);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const fetchTokens = useCallback(async (field, direction, page) => {
    try {
      setLoading(true);
      const response = await axios.get('https://website-4g84.onrender.com/api/tokens', {
        params: {
          sort: field === 'marketCap' ? 'marketCap' : 'volume',
          direction: direction,
          page: page
        }
      });
      
      setTokens(response.data.tokens);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError('Failed to fetch tokens');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  }, []);

  useEffect(() => {
    fetchGlobalTopTokens();
    fetchTokens(sortField, sortDirection, currentPage);
  }, [fetchGlobalTopTokens, fetchTokens, sortField, sortDirection, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="app-container">
      {/* Theme Toggle Component */}
      <ThemeToggle />

      <div className="static-top-section">
        {/* Logo positioned absolutely over the background */}
        <div className="logo-container">
          <img 
            src="/images/logo.png" 
            alt="Logo" 
          />
        </div>

        <div className="token-dashboard">
          {/* Sorting Controls */}
          <div className="sorting-controls">
            <button 
              onClick={() => handleSort('marketCap')}
              className={sortField === 'marketCap' ? 'active' : ''}
            >
              Sort by Market Cap {sortField === 'marketCap' && (sortDirection === 'desc' ? '▼' : '▲')}
            </button>
            <button 
              onClick={() => handleSort('volume')}
              className={sortField === 'volume' ? 'active' : ''}
            >
              Sort by Volume {sortField === 'volume' && (sortDirection === 'desc' ? '▼' : '▲')}
            </button>
          </div>

          {/* Top Tokens Section with updated titles */}
          {highestMarketCapToken && highestVolumeToken && (
            <div className="top-tokens-section">
              <div className="top-tokens-titles">
                <h2 className="top-token-title">KING OF THE MOUNTAIN</h2>
                <h2 className="top-token-title">KING OF THE JUNGLE</h2>
              </div>
              <div className="top-tokens-grid">
                <TokenCard token={highestMarketCapToken} highlight={true} />
                <TokenCard token={highestVolumeToken} highlight={true} />
              </div>
            </div>
          )}
        </div>

        {/* Monkey Divider with center monkeys removed */}
        <div className="monkey-divider">
          {/* First set of monkeys (left side) */}
          {[...Array(4)].map((_, index) => (
            <img 
              key={`left-${index}`} 
              src="/images/7.png" 
              alt="Monkey divider" 
            />
          ))}
          
          {/* Empty space for the 4 center positions */}
          {[...Array(4)].map((_, index) => (
            <div key={`empty-${index}`} style={{ width: '213px' }}></div>
          ))}
          
          {/* Second set of monkeys (right side) */}
          {[...Array(4)].map((_, index) => (
            <img 
              key={`right-${index}`} 
              src="/images/7.png" 
              alt="Monkey divider" 
            />
          ))}
        </div>
      </div>

      <div className="content-wrapper">
        {/* Scrolling banner directly integrated at the top */}
        <div className="scrolling-banner-container">
          <div className="scrolling-banner">
            <div className="scrolling-banner-content">
              {bannerText.repeat(5)}
            </div>
          </div>
        </div>

        {loading && tokens.length > 0 ? (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        ) : null}

        {loading ? (
          <div className="loading-message">Loading tokens...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="token-grid">
              {tokens.map((token) => (
                <TokenCard key={token.contractAddress} token={token} />
              ))}
            </div>

            {/* Mobile spacer - will only show on mobile */}
            <div className="mobile-spacer"></div>
            
            {/* Extra spacing div with inline style for mobile */}
            {isMobile && (
              <div style={{ height: '80px', width: '100%' }}></div>
            )}

            {/* Pagination Controls */}
            <div 
              className="pagination-controls"
              style={{ 
                marginTop: isMobile ? '80px' : '20px'
              }}
            >
              <button 
                onClick={() => handlePageChange(1)} 
                disabled={currentPage === 1}
              >
                First
              </button>
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              <button 
                onClick={() => handlePageChange(totalPages)} 
                disabled={currentPage === totalPages}
              >
                Last
              </button>
            </div>

            {/* Logo above social button */}
            <div className="logo-above-socials">
              <img src="/images/logo.png" alt="Logo" />
            </div>
            
            {/* Social Button - added below pagination controls */}
            <div className="social-button-container">
              <a 
                href="https://linktr.ee/kingofapesbase" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-button"
              >
                SOCIALS
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TokenDashboard;