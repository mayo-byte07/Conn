/* ═══════════════════════════════════════════════════════════
   CONN — AI-Based Interest Recommendation Engine
   ═══════════════════════════════════════════════════════════
   
   A lightweight, keyword-based interest suggestion system.
   Analyzes user bio and skills to recommend relevant interests.
   
   Key Features:
   - Keyword-based matching (no external APIs)
   - Real-time suggestions while typing
   - Duplicate detection and prevention
   - Debounced updates for performance
   - Handles paste events and rapid typing
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /**
   * Predefined interest categories with keywords
   * Format: { category: [keywords] }
   * Keywords are matched case-insensitively
   */
  const INTEREST_CATEGORIES = {
    // Tech & Development
    'AI & Machine Learning': ['ai', 'machine learning', 'ml', 'deep learning', 'neural', 'nlp', 'artificial intelligence'],
    'Web Development': ['web dev', 'frontend', 'backend', 'full stack', 'react', 'vue', 'angular', 'node', 'express'],
    'Data Science': ['data science', 'analytics', 'data analyst', 'statistics', 'dataset', 'data'],
    'Cloud & DevOps': ['cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes', 'ci/cd'],
    'Mobile Development': ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
    'Cybersecurity': ['security', 'hacking', 'penetration', 'infosec', 'cyber', 'encryption', 'privacy'],
    'Blockchain': ['blockchain', 'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'web3', 'nft'],
    'Game Development': ['game', 'gaming', 'game dev', 'unity', 'unreal', 'fps', 'rpg'],

    // Creative & Design
    'Photography': ['photo', 'photography', 'photographer', 'camera', 'lens', 'portrait', 'landscape'],
    'Graphic Design': ['design', 'graphic design', 'ui', 'ux', 'illustration', 'branding', 'logo'],
    'Video Production': ['video', 'videography', 'filmmaker', 'editing', 'production', 'cinema'],
    'Content Creation': ['content', 'creator', 'youtube', 'blog', 'writing', 'podcasting', 'streaming'],
    'Music & Audio': ['music', 'musician', 'audio', 'producer', 'beatmaker', 'dj', 'sound design'],
    'Animation': ['animation', 'animator', 'motion', '3d', 'cgi', 'vfx', 'special effects'],

    // Business & Marketing
    'Digital Marketing': ['marketing', 'seo', 'sem', 'social media', 'marketing', 'growth', 'acquisition'],
    'Entrepreneurship': ['startup', 'founder', 'entrepreneur', 'business', 'venture', 'investor'],
    'Sales & Networking': ['sales', 'b2b', 'b2c', 'networking', 'commerce', 'e-commerce'],
    'Product Management': ['product manager', 'pm', 'product', 'management', 'scrum'],
    'Consulting': ['consultant', 'consulting', 'strategy', 'advisor'],

    // Creative Writing & Storytelling
    'Writing': ['writer', 'writing', 'author', 'novelist', 'copywriting', 'journalism'],
    'Storytelling': ['storytelling', 'narrative', 'screenwriter', 'playwright'],

    // Lifestyle & Wellness
    'Fitness & Health': ['fitness', 'gym', 'workout', 'health', 'wellness', 'nutrition', 'diet', 'coach'],
    'Yoga & Meditation': ['yoga', 'meditation', 'mindfulness', 'spirituality', 'breathing'],
    'Nutrition': ['nutrition', 'dietitian', 'nutritionist', 'vegan', 'keto'],
    'Mental Health': ['psychology', 'mental health', 'therapy', 'counseling'],

    // Travel & Adventure
    'Travel': ['travel', 'traveler', 'explorer', 'backpacking', 'tourism', 'wanderlust', 'adventure'],
    'Outdoor Activities': ['hiking', 'camping', 'climbing', 'cycling', 'outdoor', 'nature'],

    // Education
    'Education': ['teacher', 'educator', 'tutor', 'teaching', 'education', 'learning', 'course'],
    'Online Learning': ['online course', 'online learning', 'udemy', 'coursera', 'training'],

    // General Interests
    'Entrepreneurship': ['entrepreneurship', 'startup', 'innovation', 'venture'],
    'Sustainability': ['sustainability', 'environment', 'green', 'eco', 'climate', 'renewable'],
    'Community': ['community', 'social impact', 'nonprofit', 'volunteer', 'charity'],
    'Technology': ['technology', 'tech', 'innovation', 'gadgets', 'tools'],
    'Science': ['science', 'research', 'stem', 'biology', 'chemistry', 'physics'],

    // Hobbies & Personal
    'Gaming': ['gaming', 'gamer', 'esports', 'streaming', 'twitch'],
    'Reading': ['reading', 'books', 'bookworm', 'literature'],
    'Art & Crafts': ['art', 'artist', 'crafts', 'painting', 'drawing', 'sculpture'],
    'Sports': ['sports', 'athlete', 'soccer', 'basketball', 'tennis', 'football'],
    'Fashion': ['fashion', 'style', 'clothing', 'designer', 'makeup'],
    'Food & Cooking': ['cooking', 'chef', 'food', 'culinary', 'recipes', 'foodie'],
  };

  /**
   * Convert input text to searchable tokens
   * @param {string} text - Input text
   * @returns {string[]} Array of lowercase words
   */
  function tokenizeInput(text) {
    if (!text || typeof text !== 'string') return [];
    
    return text
      .toLowerCase()
      .split(/[\s,\-\+\.\/]+/) // Split on whitespace, commas, hyphens, etc.
      .filter(token => token.length > 0);
  }

  /**
   * Calculate similarity score between input text and a category
   * @param {string} inputText - User input
   * @param {string} category - Interest category name
   * @param {string[]} keywords - Keywords for the category
   * @returns {number} Similarity score (0-100)
   */
  function calculateSimilarity(inputText, category, keywords) {
    const tokens = tokenizeInput(inputText);
    if (tokens.length === 0) return 0;

    let matchScore = 0;
    let totalComparisons = tokens.length;

    // Check token matches against all keywords
    tokens.forEach(token => {
      keywords.forEach(keyword => {
        // Exact match
        if (keyword === token) {
          matchScore += 3; // Highest priority
        }
        // Partial match (token is part of keyword or vice versa)
        else if (keyword.includes(token) || token.includes(keyword)) {
          matchScore += 2;
        }
        // Fuzzy match (first 3+ chars match)
        else if (token.length >= 3 && keyword.length >= 3) {
          if (keyword.startsWith(token.substring(0, 3)) || 
              token.startsWith(keyword.substring(0, 3))) {
            matchScore += 1;
          }
        }
      });

      // Also match category name directly
      const categoryTokens = tokenizeInput(category);
      categoryTokens.forEach(catToken => {
        if (catToken === token) {
          matchScore += 3;
        } else if (catToken.includes(token) || token.includes(catToken)) {
          matchScore += 2;
        }
      });
    });

    // Normalize score (0-100)
    return Math.round((matchScore / (totalComparisons * 6)) * 100);
  }

  /**
   * Generate interest suggestions from bio and skills
   * @param {string} bio - User bio text
   * @param {string} skills - User skills text
   * @returns {string[]} Array of recommended interest categories
   */
  function generateInterestSuggestions(bio = '', skills = '') {
    // Combine inputs for analysis
    const combinedText = `${bio} ${skills}`.trim();

    if (!combinedText || combinedText.length < 2) {
      return [];
    }

    // Calculate scores for all categories
    const scores = Object.entries(INTEREST_CATEGORIES).map(([category, keywords]) => ({
      category,
      score: calculateSimilarity(combinedText, category, keywords),
    }));

    // Filter and sort results
    return scores
      .filter(item => item.score > 0) // Only include matches
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, 8) // Limit to top 8 suggestions
      .map(item => item.category);
  }

  /**
   * Remove duplicate values while preserving order
   * @param {string[]} interests - Array of interests
   * @returns {string[]} Unique interests
   */
  function removeDuplicates(interests) {
    const seen = new Set();
    return interests.filter(interest => {
      const normalized = interest.toLowerCase().trim();
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }

  /**
   * Render interest suggestion chips
   * Displays suggestions as clickable, dismissible tags
   * @param {string[]} suggestions - Array of suggested interests
   * @param {HTMLElement} container - Container element for chips
   * @param {Function} onSelect - Callback when suggestion is accepted
   */
  function renderInterestSuggestions(suggestions, container, onSelect = null) {
    if (!container) return;

    // Clear previous suggestions
    container.innerHTML = '';

    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem; margin: 8px 0;">No suggestions yet. Add your bio or skills to get recommendations.</p>';
      return;
    }

    // Create suggestion chips
    const uniqueSuggestions = removeDuplicates(suggestions);
    
    uniqueSuggestions.forEach((suggestion) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'interest-suggestion-chip';
      chip.setAttribute('title', `Add "${suggestion}" to your interests`);
      
      chip.innerHTML = `
        <span class="chip-text">${escapeHtml(suggestion)}</span>
        <svg class="chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `;

      chip.addEventListener('click', (e) => {
        e.preventDefault();
        if (onSelect) {
          onSelect(suggestion);
        }
      });

      container.appendChild(chip);
    });
  }

  /**
   * Render selected interest tags
   * Displays user's selected interests with removal capability
   * @param {string[]} interests - Array of selected interests
   * @param {HTMLElement} container - Container element for tags
   * @param {Function} onRemove - Callback when tag is removed
   */
  function renderInterestTags(interests, container, onRemove = null) {
    if (!container) return;

    container.innerHTML = '';

    if (!interests || interests.length === 0) {
      return;
    }

    interests.forEach((interest) => {
      const tag = document.createElement('div');
      tag.className = 'interest-tag';
      tag.setAttribute('data-interest', escapeHtml(interest));
      
      tag.innerHTML = `
        <span class="tag-text">${escapeHtml(interest)}</span>
        <button type="button" class="tag-remove" title="Remove ${interest}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      const removeBtn = tag.querySelector('.tag-remove');
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (onRemove) {
          onRemove(interest);
        }
      });

      container.appendChild(tag);
    });
  }

  /**
   * Escape HTML special characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Initialize the interest recommendation system
   * Attaches listeners to bio and skills inputs
   * @param {Object} config - Configuration object
   * @param {HTMLElement} config.bioInput - Bio textarea element
   * @param {HTMLElement} config.skillsInput - Skills textarea element
   * @param {HTMLElement} config.suggestionsContainer - Container for suggestions
   * @param {HTMLElement} config.tagsContainer - Container for selected tags
   * @param {Function} config.onSuggestionSelect - Callback for accepting suggestion
   * @param {Function} config.onTagRemove - Callback for removing tag
   */
  function initInterestRecommender(config) {
    const {
      bioInput,
      skillsInput,
      suggestionsContainer,
      tagsContainer,
      onSuggestionSelect = null,
      onTagRemove = null,
    } = config;

    // Validate inputs
    if (!bioInput || !skillsInput || !suggestionsContainer) {
      console.error('InterestRecommender: Missing required configuration elements');
      return {
        getSuggestions: () => [],
        addInterest: () => {},
        removeInterest: () => {},
        getSelectedInterests: () => [],
      };
    }

    let debounceTimer = null;
    let selectedInterests = [];

    /**
     * Update suggestions based on current input
     */
    function updateSuggestions() {
      const bio = bioInput.value.trim();
      const skills = skillsInput.value.trim();

      const suggestions = generateInterestSuggestions(bio, skills);
      const suggestions2 = generateInterestSuggestions(bio, skills);
      
      // Filter out already selected interests
      const filtered = suggestions.filter(
        s => !selectedInterests.some(
          i => i.toLowerCase() === s.toLowerCase()
        )
      );

      renderInterestSuggestions(filtered, suggestionsContainer, addInterest);
    }

    /**
     * Add an interest to selected list
     */
    function addInterest(interest) {
      // Check for duplicates (case-insensitive)
      if (!selectedInterests.some(i => i.toLowerCase() === interest.toLowerCase())) {
        selectedInterests.push(interest);
        renderInterestTags(selectedInterests, tagsContainer, removeInterest);
        updateSuggestions();

        if (onSuggestionSelect) {
          onSuggestionSelect(interest, selectedInterests);
        }
      }
    }

    /**
     * Remove an interest from selected list
     */
    function removeInterest(interest) {
      selectedInterests = selectedInterests.filter(
        i => i.toLowerCase() !== interest.toLowerCase()
      );
      renderInterestTags(selectedInterests, tagsContainer, removeInterest);
      updateSuggestions();

      if (onTagRemove) {
        onTagRemove(interest, selectedInterests);
      }
    }

    /**
     * Debounced input handler
     */
    function handleInputChange() {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        updateSuggestions();
      }, 300); // 300ms debounce
    }

    // Attach event listeners
    bioInput.addEventListener('input', handleInputChange);
    skillsInput.addEventListener('input', handleInputChange);

    // Handle paste events
    bioInput.addEventListener('paste', () => {
      setTimeout(handleInputChange, 10);
    });
    skillsInput.addEventListener('paste', () => {
      setTimeout(handleInputChange, 10);
    });

    // Initial render
    renderInterestSuggestions([], suggestionsContainer);
    renderInterestTags([], tagsContainer);

    /**
     * Load interests from array
     */
    function loadInterests(interests) {
      selectedInterests = interests.map(i => String(i).trim()).filter(i => i.length > 0);
      renderInterestTags(selectedInterests, tagsContainer, removeInterest);
      updateSuggestions();
    }

    /**
     * Get selected interests
     */
    function getSelectedInterests() {
      return [...selectedInterests];
    }

    // Return public API
    return {
      getSuggestions: () => generateInterestSuggestions(bioInput.value, skillsInput.value),
      addInterest,
      removeInterest,
      getSelectedInterests,
      loadInterests,
      updateSuggestions,
    };
  }

  // Export to global scope
  window.InterestRecommender = {
    generateInterestSuggestions,
    renderInterestSuggestions,
    renderInterestTags,
    initInterestRecommender,
    removeDuplicates,
  };

})();
