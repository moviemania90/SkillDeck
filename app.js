/**
 * SkillDeck - Main Application Logic
 * Implements client-side state, tab navigation, local storage caching,
 * 3D card rendering, search/filtering, and interactive quiz mechanics.
 * 
 * Update details: 
 * - Cards start locked (hidden) and get unlocked/discovered when encountered in a quiz.
 * - Absolute counts are hidden; progress is shown in percentages.
 * - Timed quizzes pull 4 domain questions and 1 common question in a randomized position.
 * - Isolated "Common" category: it has its own progress bar, can be filtered in study deck,
 *   but cannot be selected for individual mock exams.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. Application State
  // ==========================================
  const state = {
    activeTab: "dashboard",
    selectedCategory: "software", // Default
    customCards: [],
    cardProgress: {}, // cardId -> 'mastered' | 'reviewing' | 'weak'
    bookmarks: [], // array of cardIds
    searchQuery: "",
    activeFilter: "all",
    quiz: {
      questions: [],
      currentIndex: 0,
      score: 0,
      timerInterval: null,
      timeLeft: 45,
      answers: {
        easy: 0,
        medium: 0,
        hard: 0
      }
    }
  };

  // ==========================================
  // 2. DOM Elements Selection
  // ==========================================
  const body = document.body;
  const pageTitle = document.getElementById("pageTitle");
  const pageDescription = document.getElementById("pageDescription");
  const categoryDropdown = document.getElementById("categoryDropdown");

  // Navigation links
  const navLinks = {
    dashboard: document.getElementById("navDashboard"),
    study: document.getElementById("navStudy"),
    bookmarks: document.getElementById("navBookmarks"),
    quiz: document.getElementById("navQuiz")
  };

  // View sections
  const views = {
    dashboard: document.getElementById("viewDashboard"),
    study: document.getElementById("viewStudy"),
    bookmarks: document.getElementById("viewBookmarks"),
    quiz: document.getElementById("viewQuiz")
  };

  // Dashboard components
  const statTotalCount = document.getElementById("statTotalCount");
  const statMasteryRate = document.getElementById("statMasteryRate");
  const statStarredCount = document.getElementById("statStarredCount");
  const sectorProgressList = document.getElementById("sectorProgressList");
  const dailyQuoteHeader = document.getElementById("dailyQuoteHeader");
  const dailyQuoteText = document.getElementById("dailyQuoteText");
  const dailyQuoteCard = document.getElementById("dailyQuoteCard");

  // Study Deck components
  const searchInput = document.getElementById("searchInput");
  const filtersGroup = document.getElementById("filtersGroup");
  const studyCardsGrid = document.getElementById("studyCardsGrid");

  // Bookmark view components
  const bookmarkCardsGrid = document.getElementById("bookmarkCardsGrid");

  // Mock Quiz components
  const quizWelcomePanel = document.getElementById("quizWelcomePanel");
  const quizArenaPanel = document.getElementById("quizArenaPanel");
  const quizResultsPanel = document.getElementById("quizResultsPanel");
  const quizFieldSpan = document.getElementById("quizFieldSpan");
  const quizIndexIndicator = document.getElementById("quizIndexIndicator");
  const quizTimerText = document.getElementById("quizTimerText");
  const quizProgressBar = document.getElementById("quizProgressBar");
  const quizCardTopic = document.getElementById("quizCardTopic");
  const quizCardQuestion = document.getElementById("quizCardQuestion");
  const quizCardAnswer = document.getElementById("quizCardAnswer");
  const btnRevealQuizAnswer = document.getElementById("btnRevealQuizAnswer");
  const quizRatingsContainer = document.getElementById("quizRatingsContainer");
  const quizScoreNum = document.getElementById("quizScoreNum");
  const quizFeedbackTitle = document.getElementById("quizFeedbackTitle");
  const quizFeedbackMessage = document.getElementById("quizFeedbackMessage");
  const resEasyCount = document.getElementById("resEasyCount");
  const resMediumCount = document.getElementById("resMediumCount");
  const resHardCount = document.getElementById("resHardCount");

  // Modal components
  const addCardModal = document.getElementById("addCardModal");
  const btnOpenAddModal = document.getElementById("btnOpenAddModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnCancelAdd = document.getElementById("btnCancelAdd");
  const btnSaveCard = document.getElementById("btnSaveCard");
  const formCategory = document.getElementById("formCategory");
  const formSubtopic = document.getElementById("formSubtopic");
  const formQuestion = document.getElementById("formQuestion");
  const formAnswer = document.getElementById("formAnswer");

  // Interactive buttons
  const btnStartQuiz = document.getElementById("btnStartQuiz");
  const btnRetryQuiz = document.getElementById("btnRetryQuiz");

  // Categories metadata
  const categories = {
    office: { title: "사무/행정", theme: "theme-office", desc: "공문서, 회계, 기획, 노무, 공통 경영 실무 지식 학습" },
    mechanical: { title: "기계", theme: "theme-mechanical", desc: "3대 역학, 금속재료, 배관 및 유체설비 전공 학습" },
    electrical: { title: "전기", theme: "theme-electrical", desc: "송배전, 회로이론, 전기기기 및 전기안전 전공 학습" },
    electronics: { title: "전자", theme: "theme-electronics", desc: "반도체소자, 회로설계, 디지털 신호 및 피드백 제어 학습" },
    software: { title: "ICT/SW", theme: "theme-software", desc: "자료구조, OS, 알고리즘, 웹 아키텍처 기술 면접 학습" },
    chemical: { title: "화학", theme: "theme-chemical", desc: "유기화학, 화학평형, 촉매 및 고분자화학 전공 학습" },
    common: { title: "공통 분야", theme: "theme-common", desc: "인성, 협업, 의사소통 등 공통 면접 지식 학습" }
  };

  // ==========================================
  // 3. State & Cache Management
  // ==========================================

  // Load state from localStorage
  function loadFromCache() {
    try {
      const cachedProgress = localStorage.getItem("skilldeck_progress");
      if (cachedProgress) state.cardProgress = JSON.parse(cachedProgress);

      const cachedBookmarks = localStorage.getItem("skilldeck_bookmarks");
      if (cachedBookmarks) state.bookmarks = JSON.parse(cachedBookmarks);

      const cachedCustom = localStorage.getItem("skilldeck_custom_cards");
      if (cachedCustom) state.customCards = JSON.parse(cachedCustom);

      const cachedCategory = localStorage.getItem("skilldeck_selected_category");
      if (cachedCategory && categories[cachedCategory]) {
        state.selectedCategory = cachedCategory;
        categoryDropdown.value = cachedCategory;
      }
    } catch (e) {
      console.error("Error reading localStorage caches:", e);
    }
  }

  // Save progress stats to cache
  function saveProgress() {
    localStorage.setItem("skilldeck_progress", JSON.stringify(state.cardProgress));
  }

  // Save bookmarks list to cache
  function saveBookmarks() {
    localStorage.setItem("skilldeck_bookmarks", JSON.stringify(state.bookmarks));
  }

  // Combine static and custom cards
  function getAllCards() {
    return [...interviewDataset, ...state.customCards];
  }

  // ==========================================
  // 4. Navigation & Theme Switching
  // ==========================================

  function switchTab(tabId) {
    state.activeTab = tabId;

    // Toggle active link
    Object.keys(navLinks).forEach(k => {
      if (k === tabId) navLinks[k].classList.add("active");
      else navLinks[k].classList.remove("active");
    });

    // Toggle active section view
    Object.keys(views).forEach(k => {
      if (k === tabId) views[k].classList.add("active-view");
      else views[k].classList.remove("active-view");
    });

    // Adjust title/desc based on tab
    const selectedTitle = categories[state.selectedCategory].title;
    if (tabId === "dashboard") {
      pageTitle.textContent = `${selectedTitle} 대시보드`;
      pageDescription.textContent = "목표 분야의 학습 성숙도와 전체 진행률을 검토합니다.";
      renderDashboard();
    } else if (tabId === "study") {
      pageTitle.textContent = `${selectedTitle} 학습된 카드`;
      pageDescription.textContent = "모의 면접을 진행하며 해금된 질문 카드들을 한눈에 복습합니다.";
      renderStudyDeck();
    } else if (tabId === "bookmarks") {
      pageTitle.textContent = `${selectedTitle} 중요 노트`;
      pageDescription.textContent = "별표 체크한 질문과 직접 작성해둔 오답 카드를 집중적으로 점검합니다.";
      renderBookmarks();
    } else if (tabId === "quiz") {
      pageTitle.textContent = `${selectedTitle} 모의 면접`;
      pageDescription.textContent = "랜덤 엄선된 5개 문항을 시간 내에 답변하며 강점과 취약을 파악해 보세요.";
      resetQuizUI();
    }
  }

  // Update dynamic CSS theme variables on body
  function updateBodyTheme(categoryKey) {
    // Remove other theme classes
    Object.values(categories).forEach(c => body.classList.remove(c.theme));
    // Add current
    body.classList.add(categories[categoryKey].theme);
    state.selectedCategory = categoryKey;
    localStorage.setItem("skilldeck_selected_category", categoryKey);

    // Refresh header title and current tab elements
    switchTab(state.activeTab);
  }

  // ==========================================
  // 5. Dashboard Rendering
  // ==========================================

  function renderDashboard() {
    const allCards = getAllCards();
    const activeCategoryCards = allCards.filter(c => c.category === state.selectedCategory);

    // 1. Compute discovery stats (percentages only, based on category preset count)
    const presetActive = interviewDataset.filter(c => c.category === state.selectedCategory);
    const discoveredPresetActive = presetActive.filter(c => state.cardProgress[c.id]);
    const discoveryPercentage = presetActive.length > 0
      ? Math.round((discoveredPresetActive.length / presetActive.length) * 100)
      : 0;

    statTotalCount.textContent = `${discoveryPercentage}%`;

    // 2. Compute mastery rate based on discovered cards
    const discoveredActive = activeCategoryCards.filter(c =>
      state.cardProgress[c.id] || c.id.startsWith("cust-")
    );
    const masteredActive = discoveredActive.filter(c => state.cardProgress[c.id] === "mastered");

    const masteryPercentage = discoveredActive.length > 0
      ? Math.round((masteredActive.length / discoveredActive.length) * 100)
      : 0;
    statMasteryRate.textContent = `${masteryPercentage}%`;

    const activeCategoryBookmarked = activeCategoryCards.filter(c =>
      state.bookmarks.includes(c.id)
    );
    statStarredCount.textContent = activeCategoryBookmarked.length;

    // 3. Recommended Random Discovered Card
    if (discoveredActive.length > 0) {
      const randIndex = Math.floor(Math.random() * discoveredActive.length);
      const randomCard = discoveredActive[randIndex];
      const categoryTitle = categories[randomCard.category] ? categories[randomCard.category].title : "공통";

      dailyQuoteHeader.textContent = `${categoryTitle} — ${randomCard.subtopic}`;
      dailyQuoteText.textContent = randomCard.question;

      dailyQuoteCard.onclick = () => {
        switchTab("study");
        state.activeFilter = "all";
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        document.getElementById("btnFilterAll").classList.add("active");
        searchInput.value = randomCard.question;
        renderStudyDeck();
      };
    } else {
      dailyQuoteHeader.textContent = "도감 미해금";
      dailyQuoteText.textContent = "아직 발견된 질문이 없습니다. 모의 면접을 통해 첫 번째 카드를 해금해 보세요!";
      dailyQuoteCard.onclick = null;
    }

    // 4. Render Sector Progress List
    sectorProgressList.innerHTML = "";
    Object.keys(categories).forEach(catKey => {
      const presetCat = interviewDataset.filter(c => c.category === catKey);
      const discoveredPresetCat = presetCat.filter(c => state.cardProgress[c.id]);
      const catPercent = presetCat.length > 0
        ? Math.round((discoveredPresetCat.length / presetCat.length) * 100)
        : 0;

      const itemHTML = `
        <div class="sector-progress-item">
          <div class="sector-progress-header">
            <span class="sector-name-badge">
              <span class="sector-dot" style="background-color: var(--theme-color);"></span>
              ${categories[catKey].title}
            </span>
            <span>질문 발견율 ${catPercent}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${catPercent}%; background-color: var(--theme-color);"></div>
          </div>
        </div>
      `;

      const wrapperDiv = document.createElement("div");
      wrapperDiv.className = `theme-${catKey}`;
      wrapperDiv.innerHTML = itemHTML;
      sectorProgressList.appendChild(wrapperDiv);
    });
  }

  // ==========================================
  // 6. Study Deck Rendering (Flashcards)
  // ==========================================

  function renderStudyDeck() {
    studyCardsGrid.innerHTML = "";
    const allCards = getAllCards();

    // Filter only discovered cards in active category (completely isolated)
    let filtered = allCards.filter(c =>
      c.category === state.selectedCategory &&
      (state.cardProgress[c.id] || c.id.startsWith("cust-"))
    );

    // Apply Search Query
    if (state.searchQuery.trim() !== "") {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.question.toLowerCase().includes(query) ||
        c.answer.toLowerCase().includes(query) ||
        c.subtopic.toLowerCase().includes(query)
      );
    }

    // Apply Filter Chips
    if (state.activeFilter !== "all") {
      filtered = filtered.filter(c => {
        const prog = state.cardProgress[c.id];
        if (state.activeFilter === "new") return !prog;
        return prog === state.activeFilter;
      });
    }

    // Render cards
    if (filtered.length === 0) {
      renderEmptyState(studyCardsGrid, "아직 발견된 질문이 없습니다. 모의 면접을 먼저 시작하여 카드를 획득해 보세요!");
      return;
    }

    filtered.forEach(card => {
      const isStarred = state.bookmarks.includes(card.id);
      const isCustom = card.id.startsWith("cust-");
      const prog = state.cardProgress[card.id];
      const categoryTitle = categories[card.category] ? categories[card.category].title : "공통";

      // Build card status text
      let statusClass = "status-new";
      let statusText = "미학습";
      if (prog === "mastered") { statusClass = "status-mastered"; statusText = "숙달됨"; }
      else if (prog === "reviewing") { statusClass = "status-reviewing"; statusText = "검토중"; }
      else if (prog === "weak") { statusClass = "status-weak"; statusText = "취약함"; }

      const cardContainer = document.createElement("div");
      cardContainer.className = `card-container theme-${card.category}`;
      cardContainer.id = `card-container-${card.id}`;

      const cardInnerHTML = `
        <div class="flashcard">
          <!-- FRONT FACE -->
          <div class="card-face card-front">
            <div class="card-header">
              <span class="subtopic-badge">${categoryTitle} — ${card.subtopic}</span>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${isCustom ? '<span class="custom-card-indicator">커스텀</span>' : ''}
                <button class="bookmark-toggle ${isStarred ? 'active' : ''}" data-id="${card.id}" title="북마크 토글">
                  <svg viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                </button>
              </div>
            </div>
            
            <div class="card-body">
              <h4 class="card-question">${card.question}</h4>
            </div>
            
            <div class="card-footer">
              <span class="card-status-badge ${statusClass}">${statusText}</span>
              <span>카드 클릭 시 답안 보기</span>
            </div>
          </div>
          
          <!-- BACK FACE -->
          <div class="card-face card-back">
            <div class="card-header">
              <span class="subtopic-badge">${categoryTitle} — ${card.subtopic}</span>
              <button class="bookmark-toggle ${isStarred ? 'active' : ''}" data-id="${card.id}">
                <svg viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              </button>
            </div>
            
            <div class="card-body" style="align-items: flex-start; overflow: hidden;">
              <div class="card-answer-scroll">
                ${formatAnswerHTML(card.answer)}
              </div>
            </div>
            
            <div class="card-footer" style="border-top: none; padding-top: 0;">
              <div class="rating-bar">
                <button class="rating-btn rate-easy" data-id="${card.id}" data-rate="mastered">😀 암기됨</button>
                <button class="rating-btn rate-medium" data-id="${card.id}" data-rate="reviewing">😐 가물함</button>
                <button class="rating-btn rate-hard" data-id="${card.id}" data-rate="weak">😰 모르겠음</button>
              </div>
            </div>
          </div>
        </div>
      `;

      cardContainer.innerHTML = cardInnerHTML;
      studyCardsGrid.appendChild(cardContainer);

      // Event listener for 3D flip
      cardContainer.addEventListener("click", (e) => {
        if (e.target.closest(".bookmark-toggle") || e.target.closest(".rating-btn") || e.target.closest(".card-answer-scroll")) {
          return;
        }
        cardContainer.classList.toggle("flipped");
      });
    });

    attachCardButtonEvents(studyCardsGrid, renderStudyDeck);
  }

  // ==========================================
  // 7. Bookmarks / Review Rendering
  // ==========================================

  function renderBookmarks() {
    bookmarkCardsGrid.innerHTML = "";
    const allCards = getAllCards();

    // Starred or User-created, filtered by the currently selected category
    const filtered = allCards.filter(c =>
      c.category === state.selectedCategory &&
      (state.bookmarks.includes(c.id) || c.id.startsWith("cust-"))
    );

    if (filtered.length === 0) {
      renderEmptyState(bookmarkCardsGrid, "이 분야의 중요 노트가 비어 있습니다. 중요 표시(★)한 카드나 직접 생성한 카드들이 모이는 공간입니다.");
      return;
    }

    filtered.forEach(card => {
      const isStarred = state.bookmarks.includes(card.id);
      const isCustom = card.id.startsWith("cust-");
      const prog = state.cardProgress[card.id];
      const categoryTitle = categories[card.category] ? categories[card.category].title : "공통";

      let statusClass = "status-new";
      let statusText = "미학습";
      if (prog === "mastered") { statusClass = "status-mastered"; statusText = "숙달됨"; }
      else if (prog === "reviewing") { statusClass = "status-reviewing"; statusText = "검토중"; }
      else if (prog === "weak") { statusClass = "status-weak"; statusText = "취약함"; }

      const cardContainer = document.createElement("div");
      cardContainer.className = `card-container theme-${card.category}`; // Force respective category style
      cardContainer.id = `bookmark-container-${card.id}`;

      const cardInnerHTML = `
        <div class="flashcard">
          <!-- FRONT -->
          <div class="card-face card-front" style="border-color: var(--border-glass-focused);">
            <div class="card-header">
              <span class="subtopic-badge">${categoryTitle} — ${card.subtopic}</span>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${isCustom ? '<span class="custom-card-indicator">커스텀</span>' : ''}
                <button class="bookmark-toggle ${isStarred ? 'active' : ''}" data-id="${card.id}">
                  <svg viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                </button>
              </div>
            </div>
            
            <div class="card-body">
              <h4 class="card-question">${card.question}</h4>
            </div>
            
            <div class="card-footer">
              <span class="card-status-badge ${statusClass}">${statusText}</span>
              <span>카드 클릭 시 답안 보기</span>
            </div>
          </div>
          
          <!-- BACK -->
          <div class="card-face card-back">
            <div class="card-header">
              <span class="subtopic-badge">${categoryTitle} — ${card.subtopic}</span>
              <button class="bookmark-toggle ${isStarred ? 'active' : ''}" data-id="${card.id}">
                <svg viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              </button>
            </div>
            
            <div class="card-body" style="align-items: flex-start; overflow: hidden;">
              <div class="card-answer-scroll">
                ${formatAnswerHTML(card.answer)}
              </div>
            </div>
            
            <div class="card-footer" style="border-top: none; padding-top: 0;">
              <div class="rating-bar">
                <button class="rating-btn rate-easy" data-id="${card.id}" data-rate="mastered">😀 암기됨</button>
                <button class="rating-btn rate-medium" data-id="${card.id}" data-rate="reviewing">😐 가물함</button>
                <button class="rating-btn rate-hard" data-id="${card.id}" data-rate="weak">😰 모르겠음</button>
              </div>
            </div>
          </div>
        </div>
      `;

      cardContainer.innerHTML = cardInnerHTML;
      bookmarkCardsGrid.appendChild(cardContainer);

      cardContainer.addEventListener("click", (e) => {
        if (e.target.closest(".bookmark-toggle") || e.target.closest(".rating-btn") || e.target.closest(".card-answer-scroll")) {
          return;
        }
        cardContainer.classList.toggle("flipped");
      });
    });

    attachCardButtonEvents(bookmarkCardsGrid, renderBookmarks);
  }

  // ==========================================
  // Helper for rendering empty states
  // ==========================================
  function renderEmptyState(targetGrid, message) {
    targetGrid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M19 11H5v2h14v-2zm0-4H5v2h14V7zm0 8H5v2h14v-2z"/></svg>
        <h4>등록된 데이터가 없습니다</h4>
        <p>${message}</p>
      </div>
    `;
  }

  // Parse markdown-like newlines and lists to html
  function formatAnswerHTML(text) {
    if (!text) return "";
    return text
      .split("\n\n")
      .map(p => {
        if (p.startsWith("- ") || p.startsWith("* ")) {
          const listItems = p.split("\n").map(li => `<li>${li.replace(/^[-*]\s+/, "")}</li>`).join("");
          return `<ul>${listItems}</ul>`;
        }
        if (/^\d+\.\s+/.test(p)) {
          const listItems = p.split("\n").map(li => `<li>${li.replace(/^\d+\.\s+/, "")}</li>`).join("");
          return `<ol>${listItems}</ol>`;
        }
        let formatted = p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        return `<p>${formatted}</p>`;
      })
      .join("");
  }

  // Attach ratings & bookmark clicks
  function attachCardButtonEvents(gridContainer, reloadFunc) {
    // Starred Toggles
    gridContainer.querySelectorAll(".bookmark-toggle").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const cid = btn.getAttribute("data-id");
        if (state.bookmarks.includes(cid)) {
          state.bookmarks = state.bookmarks.filter(id => id !== cid);
        } else {
          state.bookmarks.push(cid);
        }
        saveBookmarks();

        gridContainer.querySelectorAll(`.bookmark-toggle[data-id="${cid}"]`).forEach(b => {
          b.classList.toggle("active");
        });

        if (state.activeTab === "bookmarks") {
          reloadFunc();
        }
      };
    });

    // Progress Ratings
    gridContainer.querySelectorAll(".rating-btn").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const cid = btn.getAttribute("data-id");
        const rating = btn.getAttribute("data-rate");

        state.cardProgress[cid] = rating;
        saveProgress();

        const cardBox = gridContainer.querySelector(`#card-container-${cid}`) || gridContainer.querySelector(`#bookmark-container-${cid}`);
        if (cardBox) {
          cardBox.classList.remove("flipped");
          setTimeout(() => {
            reloadFunc();
          }, 350);
        } else {
          reloadFunc();
        }
      };
    });
  }

  // ==========================================
  // 8. Mock Interview Timed Quiz Logic
  // ==========================================

  function resetQuizUI() {
    quizWelcomePanel.style.display = "flex";
    quizArenaPanel.style.display = "none";
    quizResultsPanel.style.display = "none";
    quizFieldSpan.textContent = categories[state.selectedCategory].title;

    // Disable quiz setup if current category is common
    const startBtn = document.getElementById("btnStartQuiz");
    if (state.selectedCategory === "common") {
      startBtn.style.display = "none";
      let warningMsg = document.getElementById("quizCommonWarning");
      if (!warningMsg) {
        warningMsg = document.createElement("p");
        warningMsg.id = "quizCommonWarning";
        warningMsg.style.color = "var(--danger)";
        warningMsg.style.marginTop = "1rem";
        warningMsg.style.fontWeight = "600";
        warningMsg.textContent = "※ 공통 분야는 단독으로 모의 면접을 진행할 수 없습니다. 상단 또는 대시보드 메뉴에서 직무 분야(사무, 기계, SW 등)를 선택한 뒤 모의 면접을 시작해 주세요.";
        quizWelcomePanel.appendChild(warningMsg);
      } else {
        warningMsg.style.display = "block";
      }
    } else {
      startBtn.style.display = "block";
      const warningMsg = document.getElementById("quizCommonWarning");
      if (warningMsg) warningMsg.style.display = "none";
    }

    if (state.quiz.timerInterval) {
      clearInterval(state.quiz.timerInterval);
    }
  }

  function startQuiz() {
    const allCards = getAllCards();

    // Prevent taking quiz for common category
    if (state.selectedCategory === "common") {
      alert("공통 분야는 단독으로 모의 면접을 진행할 수 없습니다. 직무 분야(사무, 기계, SW 등)를 선택해 주세요.");
      return;
    }

    // 1. Get Domain-specific questions
    const domainPool = allCards.filter(c => c.category === state.selectedCategory);
    // 2. Get Common questions
    const commonPool = allCards.filter(c => c.category === "common");

    if (domainPool.length < 4) {
      alert("이 카테고리 내 질문 수가 너무 부족합니다. (최소 4개 질문이 필요합니다)");
      return;
    }
    if (commonPool.length < 1) {
      alert("공통 질문 데이터가 소실되었습니다.");
      return;
    }

    // Draw 4 random domain questions
    const selectedDomain = selectRandom(domainPool, 4);
    // Draw 1 random common question
    const selectedCommon = selectRandom(commonPool, 1)[0];

    // Splice common question at a completely random index [0-4] in the quiz list
    const randomInsertIndex = Math.floor(Math.random() * 5);
    selectedDomain.splice(randomInsertIndex, 0, selectedCommon);

    // Set quiz questions state
    state.quiz.questions = selectedDomain;
    state.quiz.currentIndex = 0;
    state.quiz.score = 0;
    state.quiz.answers.easy = 0;
    state.quiz.answers.medium = 0;
    state.quiz.answers.hard = 0;

    // Adjust panels visibility
    quizWelcomePanel.style.display = "none";
    quizResultsPanel.style.display = "none";
    quizArenaPanel.style.display = "flex";

    loadQuizQuestion();
  }

  function loadQuizQuestion() {
    if (state.quiz.timerInterval) clearInterval(state.quiz.timerInterval);

    const card = state.quiz.questions[state.quiz.currentIndex];

    // Core discovery trigger: Mark card as seen in progress if not already present
    if (!state.cardProgress[card.id]) {
      state.cardProgress[card.id] = "weak"; // Marks as discovered in database (defaults to weak until self-graded)
      saveProgress();
    }

    // UI Updates
    const categoryTitle = categories[card.category] ? categories[card.category].title : "공통";
    quizIndexIndicator.textContent = `질문 ${state.quiz.currentIndex + 1} / 5`;
    quizCardTopic.textContent = `${categoryTitle} — ${card.subtopic}`;
    quizCardQuestion.textContent = card.question;

    // Inject answer
    quizCardAnswer.innerHTML = formatAnswerHTML(card.answer);
    quizCardAnswer.style.display = "none";

    // Toggle action controls
    btnRevealQuizAnswer.style.display = "block";
    quizRatingsContainer.style.display = "none";

    // Progress Bar (out of 5 questions)
    const progressPercent = (state.quiz.currentIndex / 5) * 100;
    quizProgressBar.style.width = `${progressPercent}%`;

    // Timer start
    state.quiz.timeLeft = 45;
    quizTimerText.textContent = `${state.quiz.timeLeft}s`;
    document.getElementById("quizTimerBox").style.background = "rgba(239, 68, 68, 0.1)";
    document.getElementById("quizTimerBox").style.color = "var(--danger)";

    state.quiz.timerInterval = setInterval(() => {
      state.quiz.timeLeft--;
      quizTimerText.textContent = `${state.quiz.timeLeft}s`;

      if (state.quiz.timeLeft <= 10) {
        document.getElementById("quizTimerBox").style.background = "var(--danger)";
        document.getElementById("quizTimerBox").style.color = "#ffffff";
      }

      if (state.quiz.timeLeft <= 0) {
        clearInterval(state.quiz.timerInterval);
        revealQuizAnswer();
        alert("시간이 초과되었습니다! 답변 포인트를 검토해 보세요.");
      }
    }, 1000);
  }

  // Reveal answer handler
  function revealQuizAnswer() {
    if (state.quiz.timerInterval) clearInterval(state.quiz.timerInterval);

    quizCardAnswer.style.display = "block";
    btnRevealQuizAnswer.style.display = "none";
    quizRatingsContainer.style.display = "flex";
  }

  function submitQuizRating(rate) {
    const cardId = state.quiz.questions[state.quiz.currentIndex].id;

    // Record score
    if (rate === "easy") {
      state.quiz.score += 20;
      state.quiz.answers.easy++;
      state.cardProgress[cardId] = "mastered";
    } else if (rate === "medium") {
      state.quiz.score += 10;
      state.quiz.answers.medium++;
      state.cardProgress[cardId] = "reviewing";
    } else {
      state.quiz.answers.hard++;
      state.cardProgress[cardId] = "weak";
    }

    saveProgress();
    state.quiz.currentIndex++;

    if (state.quiz.currentIndex < 5) {
      loadQuizQuestion();
    } else {
      endQuiz();
    }
  }

  function endQuiz() {
    if (state.quiz.timerInterval) clearInterval(state.quiz.timerInterval);

    quizArenaPanel.style.display = "none";
    quizResultsPanel.style.display = "flex";

    quizProgressBar.style.width = "100%";

    // Display scores
    quizScoreNum.textContent = state.quiz.score;
    resEasyCount.textContent = state.quiz.answers.easy;
    resMediumCount.textContent = state.quiz.answers.medium;
    resHardCount.textContent = state.quiz.answers.hard;

    // Custom feedback comments
    if (state.quiz.score === 100) {
      quizFeedbackTitle.textContent = "완벽합니다! 직무 역량 종결자 🏆";
      quizFeedbackMessage.textContent = "모의 면접에 출제된 모든 질문에 암기 완료 판정을 받았습니다. 좋은 결과가 있을 것입니다!";
    } else if (state.quiz.score >= 70) {
      quizFeedbackTitle.textContent = "합격 안정권 수준 👍";
      quizFeedbackMessage.textContent = "직무 핵심 이론을 탄탄히 학습해 가고 계십니다. 새로 해금된 오답 카드들은 [학습된 카드]에서 정독해 보세요.";
    } else if (state.quiz.score >= 40) {
      quizFeedbackTitle.textContent = "보충 학습이 요구됩니다 📝";
      quizFeedbackMessage.textContent = "개념이 흔들리는 카드가 있습니다. 해금된 카드 목록을 보며 반복 학습하는 것을 추천합니다.";
    } else {
      quizFeedbackTitle.textContent = "기초 개념 집중 보강 필요 ⚠️";
      quizFeedbackMessage.textContent = "전공 키워드에 대한 이해가 낮습니다. 해금된 핵심 이론 카드들을 오답 노트에 즐겨찾기하여 다시 정독하세요.";
    }
  }

  // Shuffle array and grab limit size
  function selectRandom(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // ==========================================
  // 9. Modal Management: Add custom notes
  // ==========================================

  function openAddModal() {
    formCategory.value = state.selectedCategory;
    formSubtopic.value = "";
    formQuestion.value = "";
    formAnswer.value = "";

    addCardModal.classList.add("active-modal");
  }

  function closeAddModal() {
    addCardModal.classList.remove("active-modal");
  }

  function saveCustomCard() {
    const category = formCategory.value;
    const subtopic = formSubtopic.value.trim() || "일반";
    const question = formQuestion.value.trim();
    const answer = formAnswer.value.trim();

    if (!question || !answer) {
      alert("질문과 모범 해답은 공백으로 비워둘 수 없습니다.");
      return;
    }

    const newCard = {
      id: `cust-${Date.now()}`,
      category,
      subtopic,
      question,
      answer
    };

    state.customCards.push(newCard);
    localStorage.setItem("skilldeck_custom_cards", JSON.stringify(state.customCards));

    closeAddModal();
    alert("중요 노트 및 해당 카테고리에 카드가 등록되었습니다. 커스텀 카드는 자동으로 발견됨 상태가 됩니다!");

    if (state.activeTab === "study") {
      renderStudyDeck();
    } else if (state.activeTab === "bookmarks") {
      renderBookmarks();
    } else {
      renderDashboard();
    }
  }

  // ==========================================
  // 10. Event Listeners Attaching
  // ==========================================

  Object.keys(navLinks).forEach(k => {
    navLinks[k].addEventListener("click", () => switchTab(k));
  });

  categoryDropdown.addEventListener("change", (e) => {
    updateBodyTheme(e.target.value);
  });

  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderStudyDeck();
  });

  filtersGroup.addEventListener("click", (e) => {
    const filterBtn = e.target.closest(".filter-btn");
    if (!filterBtn) return;

    filtersGroup.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    filterBtn.classList.add("active");

    state.activeFilter = filterBtn.getAttribute("data-filter");
    renderStudyDeck();
  });

  btnOpenAddModal.addEventListener("click", openAddModal);
  btnCloseModal.addEventListener("click", closeAddModal);
  btnCancelAdd.addEventListener("click", closeAddModal);
  btnSaveCard.addEventListener("click", saveCustomCard);

  addCardModal.addEventListener("click", (e) => {
    if (e.target === addCardModal) closeAddModal();
  });

  btnStartQuiz.addEventListener("click", startQuiz);
  btnRevealQuizAnswer.addEventListener("click", revealQuizAnswer);

  btnQuizRateEasy.addEventListener("click", () => submitQuizRating("easy"));
  btnQuizRateMedium.addEventListener("click", () => submitQuizRating("medium"));
  btnQuizRateHard.addEventListener("click", () => submitQuizRating("hard"));

  btnRetryQuiz.addEventListener("click", resetQuizUI);

  // ==========================================
  // 11. Initial Entry Point Launch
  // ==========================================
  loadFromCache();
  updateBodyTheme(state.selectedCategory);
});
