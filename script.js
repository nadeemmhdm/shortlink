// DOM Elements
const longUrlInput = document.getElementById('longUrl');
const shortenBtn = document.getElementById('shortenBtn');
const pasteBtn = document.getElementById('pasteBtn');
const resultContainer = document.getElementById('resultContainer');
const shortUrlLink = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');
const errorDiv = document.getElementById('error');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Load history from localStorage
let urlHistory = JSON.parse(localStorage.getItem('urlHistory')) || [];
renderHistory();

// Event Listeners
pasteBtn.addEventListener('click', pasteFromClipboard);
copyBtn.addEventListener('click', copyToClipboard);
clearHistoryBtn.addEventListener('click', clearHistory);
longUrlInput.addEventListener('input', validateUrl);

// Auto-fill http:// if user starts typing without it
longUrlInput.addEventListener('focus', function() {
  if (!this.value.startsWith('http://') && !this.value.startsWith('https://')) {
    this.value = 'https://';
  }
});

// Validate URL on blur
longUrlInput.addEventListener('blur', function() {
  if (this.value === 'https://') {
    this.value = '';
  }
});

// Enter key shortcut
longUrlInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    shortenUrl();
  }
});

// Main function to shorten URL
async function shortenUrl() {
  const longUrl = longUrlInput.value.trim();
  
  if (!validateUrl()) return;

  try {
    // Show loading state
    shortenBtn.innerHTML = '<i class="bx bx-loader-circle bx-spin"></i> Shortening...';
    shortenBtn.disabled = true;

    const response = await fetch('https://t.ly/api/v1/link/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer AcSJ7b0nHr0bUIYVTvRYmBmcdvJ8inXDWcnAAA92w3SZvv1gS5GHaRg1GiiT'
      },
      body: JSON.stringify({ 
        long_url: longUrl,
        domain: 'https://t.ly/'
      })
    });

    const data = await response.json();

    if (data.short_url) {
      // Display result
      shortUrlLink.textContent = data.short_url;
      shortUrlLink.href = data.short_url;
      resultContainer.classList.add('show');
      
      // Add to history
      addToHistory(longUrl, data.short_url);
      
      // Hide error if any
      errorDiv.classList.remove('show');
      
      // Scroll to result
      resultContainer.scrollIntoView({ behavior: 'smooth' });
    } else {
      showError(data.message || 'Failed to shorten the URL. Please try again.');
    }
  } catch (error) {
    console.error('Shortening error:', error);
    showError('Network error occurred. Please check your connection.');
  } finally {
    // Reset button state
    shortenBtn.innerHTML = '<i class="bx bx-compress"></i> Shorten';
    shortenBtn.disabled = false;
  }
}

// Validate URL input
function validateUrl() {
  const url = longUrlInput.value.trim();
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  
  if (!url) {
    showError('Please enter a URL');
    return false;
  }
  
  if (!urlPattern.test(url)) {
    showError('Please enter a valid URL (e.g., https://example.com)');
    return false;
  }
  
  // If validation passes
  errorDiv.classList.remove('show');
  return true;
}

// Show error message
function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
}

// Paste from clipboard
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      longUrlInput.value = text;
      validateUrl();
    }
  } catch (err) {
    console.error('Failed to read clipboard:', err);
    showError('Clipboard access denied. Please paste manually.');
  }
}

// Copy to clipboard
function copyToClipboard() {
  const url = shortUrlLink.textContent;
  
  navigator.clipboard.writeText(url).then(() => {
    copyBtn.innerHTML = '<i class="bx bx-check"></i> Copied!';
    copyBtn.classList.add('copied');
    
    setTimeout(() => {
      copyBtn.innerHTML = '<i class="bx bx-copy"></i> Copy';
      copyBtn.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
  });
}

// Add URL to history
function addToHistory(longUrl, shortUrl) {
  // Check if this URL already exists in history
  const existingIndex = urlHistory.findIndex(item => item.longUrl === longUrl);
  
  if (existingIndex >= 0) {
    // Update existing entry
    urlHistory[existingIndex].shortUrl = shortUrl;
    urlHistory[existingIndex].timestamp = new Date().toISOString();
  } else {
    // Add new entry
    urlHistory.unshift({
      longUrl,
      shortUrl,
      timestamp: new Date().toISOString()
    });
    
    // Keep only the last 10 items
    if (urlHistory.length > 10) {
      urlHistory.pop();
    }
  }
  
  // Save to localStorage
  localStorage.setItem('urlHistory', JSON.stringify(urlHistory));
  
  // Update UI
  renderHistory();
}

// Render history list
function renderHistory() {
  if (urlHistory.length === 0) {
    historySection.classList.remove('show');
    return;
  }
  
  historySection.classList.add('show');
  historyList.innerHTML = '';
  
  urlHistory.forEach((item, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item perspective';
    
    historyItem.innerHTML = `
      <div class="history-item-info">
        <div class="history-item-long">${truncate(item.longUrl, 50)}</div>
        <div class="history-item-short">${item.shortUrl}</div>
      </div>
      <div class="history-item-actions">
        <button class="history-item-btn" title="Copy" onclick="copyHistoryUrl(${index})">
          <i class='bx bx-copy'></i>
        </button>
        <button class="history-item-btn" title="Delete" onclick="deleteHistoryItem(${index})">
          <i class='bx bx-trash'></i>
        </button>
      </div>
    `;
    
    historyList.appendChild(historyItem);
  });
}

// Copy URL from history
function copyHistoryUrl(index) {
  const url = urlHistory[index].shortUrl;
  navigator.clipboard.writeText(url).then(() => {
    const copyButtons = document.querySelectorAll('.history-item-actions button');
    copyButtons[index * 2].innerHTML = '<i class="bx bx-check"></i>';
    
    setTimeout(() => {
      copyButtons[index * 2].innerHTML = '<i class="bx bx-copy"></i>';
    }, 2000);
  });
}

// Delete item from history
function deleteHistoryItem(index) {
  urlHistory.splice(index, 1);
  localStorage.setItem('urlHistory', JSON.stringify(urlHistory));
  renderHistory();
  
  if (urlHistory.length === 0) {
    historySection.classList.remove('show');
  }
}

// Clear all history
function clearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    urlHistory = [];
    localStorage.removeItem('urlHistory');
    historySection.classList.remove('show');
  }
}

// Helper function to truncate text
function truncate(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
