const initCommentSystem = () => {
  const container = document.querySelector("[data-comment-root]");
  if (!container || container.dataset.loaded) return;
  container.dataset.loaded = "true";

  const articlePath = window.location.pathname;
  const apiBase = container.getAttribute("data-api-base") || "";
  const likeKey = `comment-like-${articlePath}`;

  const createEl = (tag, cls) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const renderTree = (nodes, parent) => {
    if (!nodes || nodes.length === 0) {
      if (parent.classList.contains("comment-tree")) {
         parent.innerHTML = '<div class="comment-empty">No comments yet. Be the first to share your thoughts!</div>';
      }
      return;
    }

    const list = createEl("ul", "comment-list");
    nodes.forEach((node) => {
      const item = createEl("li", "comment-item");
      
      const adminBadge = node.is_admin 
        ? '<span class="comment-admin-badge">Author</span>' 
        : "";
      
      const replyName = node.reply_to_name ? `<span class="comment-reply-name">@${escapeHtml(node.reply_to_name)}</span> ` : "";
      
      const avatarSrc = node.avatar_url || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
      const avatar = `<img class="comment-avatar" src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(node.author_name)}" />`;
      
      // Local time formatting
      let createdStr = node.created_at;
      if (createdStr && !createdStr.endsWith("Z") && !createdStr.includes("+")) {
          createdStr += "Z"; // Assume UTC if no offset
      }
      const date = new Date(createdStr);
      const dateStr = date.toLocaleDateString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric'
      });

      // Status badge for pending comments (if API returns them to the user)
      const statusBadge = node.status === 'pending' || node.status === 'spam' 
        ? '<span class="text-[10px] uppercase font-bold tracking-wider bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full ml-2">Pending Review</span>' 
        : "";

      const authorNameHtml = node.author_url 
        ? `<a href="${escapeHtml(node.author_url)}" target="_blank" rel="nofollow noopener" class="comment-author hover:text-primary transition-colors">${escapeHtml(node.author_name)}</a>`
        : `<strong class="comment-author">${escapeHtml(node.author_name)}</strong>`;

      item.innerHTML = `
        <div class="comment-header">
          <div class="comment-avatar-wrapper">${avatar}</div>
          <div class="comment-body">
            <div class="comment-meta">
              ${authorNameHtml}
              ${adminBadge}
              ${statusBadge}
              <span class="comment-date">• ${dateStr}</span>
            </div>
            <div class="comment-content">
              ${replyName}${escapeHtml(node.content)}
            </div>
            <button 
              class="comment-reply"
              data-reply-id="${node.id}" 
              data-parent-id="${node.parent_id || node.id}" 
              data-reply-name="${escapeHtml(node.author_name)}"
            >
              Reply
            </button>
          </div>
        </div>
      `;

      if (node.children && node.children.length) {
        const childrenContainer = createEl("div", "comment-children");
        renderTree(node.children, childrenContainer);
        item.appendChild(childrenContainer);
      }
      list.appendChild(item);
    });
    parent.appendChild(list);
  };

  const loadComments = async () => {
    try {
      const res = await fetch(`${apiBase}/articles/${encodeURIComponent(articlePath)}/comments`);
      if (!res.ok) {
         // If 404, it might just mean no comments yet or article not initialized in DB
         if (res.status === 404) {
             const target = container.querySelector(".comment-tree");
             if (target) target.innerHTML = '<div class="comment-empty">No comments yet.</div>';
             const countEl = container.querySelector("[data-comment-count]");
             if (countEl) countEl.textContent = "0";
             return;
         }
         throw new Error("Failed to load comments");
      }
      const data = await res.json();
      const tree = data.data || [];
      
      const target = container.querySelector(".comment-tree");
      if (target) {
        target.innerHTML = "";
        renderTree(tree, target);
      }

      // Update total count (use API-provided count)
      const countEl = container.querySelector("[data-comment-count]");
      if (countEl && typeof data.count === "number") {
        countEl.textContent = String(data.count);
      }

    } catch (e) {
      console.warn("Comments load error:", e);
      // Don't show error to user immediately, maybe just empty state
    }
  };

  const setupLike = async () => {
    const likeBtn = container.querySelector(".comment-like-btn");
    const likeCount = container.querySelector(".comment-like-count");
    if (!likeBtn) return;

    // Fetch initial like count
    try {
        const res = await fetch(`${apiBase}/articles/${encodeURIComponent(articlePath)}/likes`);
        if (res.ok) {
            const data = await res.json();
            if (likeCount) likeCount.textContent = data.likes ?? "0";
        }
    } catch(e) { /* ignore */ }

    const liked = localStorage.getItem(likeKey);
    if (liked) {
      likeBtn.setAttribute("disabled", "true");
      likeBtn.classList.add("is-liked");
    }

    likeBtn.addEventListener("click", async () => {
      if (localStorage.getItem(likeKey)) return;
      
      const fingerprint = navigator.userAgent + ":" + navigator.language;
      
      // Optimistic update
      let currentLikes = 0;
      if (likeCount) {
         currentLikes = parseInt(likeCount.textContent || "0");
         likeCount.textContent = currentLikes + 1;
      }
      likeBtn.setAttribute("disabled", "true");
      likeBtn.classList.add("is-liked");

      try {
        const res = await fetch(`${apiBase}/articles/${encodeURIComponent(articlePath)}/likes`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ fingerprint })
        });
        
        if (!res.ok) throw new Error("Like failed");
        
        const data = await res.json();
        localStorage.setItem(likeKey, "1");
        if (likeCount) likeCount.textContent = data.likes ?? (currentLikes + 1);

      } catch (e) {
         console.error("Like failed", e);
         // Revert on failure
         if (likeCount) likeCount.textContent = currentLikes;
         likeBtn.removeAttribute("disabled");
         likeBtn.classList.remove("is-liked");
         localStorage.removeItem(likeKey);
      }
    });
  };

  const setupForm = () => {
    const form = container.querySelector("form[data-comment-form]");
    if (!form) return;
    const submitBtn = form.querySelector("button[type='submit']");
    const originalBtnText = submitBtn ? submitBtn.textContent : "Submit";
    const authorNameInput = form.querySelector("input[name='authorName']");
    const authorEmailInput = form.querySelector("input[name='authorEmail']");
    const rememberInput = form.querySelector("input[name='rememberAuthor']");
    const authorStorageKey = "comment-author-info";
    
    // Check if Turnstile is enabled in config (placeholder exists)
    const turnstileContainer = form.querySelector(".cf-turnstile");
    const isTurnstileEnabled = !!turnstileContainer && !!turnstileContainer.dataset.sitekey;

    const replyToInput = () => {
      let input = form.querySelector("input[name='replyToId']");
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = "replyToId";
        form.appendChild(input);
      }
      return input;
    };

    const parentIdInput = () => {
      let input = form.querySelector("input[name='parentId']");
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = "parentId";
        form.appendChild(input);
      }
      return input;
    };

    const applyRememberedAuthor = () => {
      if (!authorNameInput || !authorEmailInput || !rememberInput) return;
      try {
        const raw = localStorage.getItem(authorStorageKey);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (typeof data?.name === "string") authorNameInput.value = data.name;
        if (typeof data?.email === "string") authorEmailInput.value = data.email;
        rememberInput.checked = true;
      } catch (e) {
        localStorage.removeItem(authorStorageKey);
      }
    };

    const persistRememberedAuthor = () => {
      if (!authorNameInput || !authorEmailInput || !rememberInput) return;
      if (!rememberInput.checked) {
        localStorage.removeItem(authorStorageKey);
        return;
      }
      const payload = {
        name: authorNameInput.value || "",
        email: authorEmailInput.value || ""
      };
      try {
        localStorage.setItem(authorStorageKey, JSON.stringify(payload));
      } catch (e) {
        // ignore storage failures (quota/private mode)
      }
    };

    if (rememberInput) {
      rememberInput.addEventListener("change", () => {
        if (!rememberInput.checked) {
          localStorage.removeItem(authorStorageKey);
        }
      });
    }

    applyRememberedAuthor();

    container.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains("comment-reply")) return;

      const replyId = target.getAttribute("data-reply-id");
      const parentId = target.getAttribute("data-parent-id");
      const replyName = target.getAttribute("data-reply-name") || "";
      replyToInput().value = replyId || "";
      parentIdInput().value = parentId || "";
      
      const content = form.querySelector("textarea[name='content']");
      if (content) {
        content.focus();
        content.placeholder = `Replying to @${replyName}...`;
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Submitting...";
      }

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      
      // Keep IDs as strings (backend now uses base64-style IDs)
      if (!payload.parentId) {
          payload.parentId = null;
      }
      
      if (!payload.replyToId) {
          payload.replyToId = null;
      }
      const fingerprint = navigator.userAgent + ":" + navigator.language;
      payload.fingerprint = fingerprint;
      
      // Handle Turnstile only if enabled and loaded
      if (isTurnstileEnabled && window.turnstile) {
        try {
            payload.turnstile = window.turnstile.getResponse();
        } catch (e) {
            console.warn("Turnstile error or not ready:", e);
            // If strictly required by backend, this might fail there.
        }
      }

      try {
        const res = await fetch(`${apiBase}/articles/${encodeURIComponent(articlePath)}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || "Failed to submit");
        }
        
        const responseData = await res.json();
        
        // Handle Status
        let successMsg = "Submitted";
        if (responseData.status === "pending" || responseData.status === "spam") {
            successMsg = "Submitted (Pending Review)";
            // Optionally append a fake pending comment to the list for immediate feedback
            // OR just alert the user.
            alert("Thank you! Your comment is awaiting moderation.");
        } else {
            // Approved immediately
             await loadComments();
        }

        if (submitBtn) {
            submitBtn.textContent = successMsg;
        }

        persistRememberedAuthor();
        form.reset();
        applyRememberedAuthor();
        replyToInput().value = "";
        parentIdInput().value = "";
        const content = form.querySelector("textarea[name='content']");
        if (content) content.placeholder = "Write a comment...";
        if (isTurnstileEnabled && window.turnstile) window.turnstile.reset();

      } catch (e) {
        console.error(e);
        if (submitBtn) {
            submitBtn.textContent = "Error: " + e.message;
        }
      } finally {
         setTimeout(() => {
             if (submitBtn) {
                 submitBtn.textContent = originalBtnText;
                 submitBtn.disabled = false;
             }
         }, 3000);
      }
    });
  };

  const init = async () => {
    await loadComments();
    await setupLike();
    setupForm();
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            init();
            observer.disconnect();
        }
    });
  }, { rootMargin: "200px" });

  observer.observe(container);
};

document.addEventListener('astro:page-load', initCommentSystem);
