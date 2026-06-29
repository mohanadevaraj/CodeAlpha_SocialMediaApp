/* ===========================
   POST RENDERING & ACTIONS
   =========================== */

function renderPost(post) {
  const me = getUser();
  const isLiked = post.likes.includes(me._id);
  const isOwner = post.author._id === me._id || post.author._id?.toString() === me._id;
  const commentsHtml = post.comments.map(c => renderComment(c, post._id)).join('');

  return `
  <div class="post-card" data-id="${post._id}">
    <div class="post-header">
      <a href="profile.html?u=${post.author.username}">${avatarEl(post.author, 42)}</a>
      <div class="post-author">
        <div class="name">
          <a href="profile.html?u=${post.author.username}" style="color:inherit;font-weight:600">${post.author.fullName || post.author.username}</a>
        </div>
        <div class="username">@${post.author.username}</div>
      </div>
      <span class="post-time">${timeAgo(post.createdAt)}</span>
      ${isOwner ? `<button class="btn btn-ghost btn-sm delete-post" data-id="${post._id}">✕</button>` : ''}
    </div>

    <div class="post-content">${escapeHtml(post.content)}</div>
    ${post.image ? `<img src="${post.image}" class="post-image" loading="lazy">` : ''}

    <div class="post-actions">
      <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-id="${post._id}" data-liked="${isLiked}">
        ${isLiked ? '❤️' : '🤍'} <span class="like-count">${post.likes.length}</span>
      </button>
      <button class="action-btn toggle-comments" data-id="${post._id}">
        💬 <span>${post.comments.length}</span>
      </button>
    </div>

    <div class="comments-section" id="comments-${post._id}" style="display:none">
      <div class="comments-list" id="clist-${post._id}">
        ${commentsHtml}
      </div>
      <div class="comment-input-row">
        ${avatarEl(getUser(), 32)}
        <input class="input" type="text" placeholder="Add a comment…" id="cinput-${post._id}" maxlength="500">
        <button class="btn btn-primary btn-sm comment-submit" data-id="${post._id}">→</button>
      </div>
    </div>
  </div>`;
}

function renderComment(c, postId) {
  const me = getUser();
  const isOwner = c.user._id === me._id || c.user._id?.toString() === me._id;
  return `
  <div class="comment" id="comment-${c._id}">
    <a href="profile.html?u=${c.user.username}">${avatarEl(c.user, 32)}</a>
    <div class="comment-body">
      <div class="comment-author">@${c.user.username}</div>
      <div class="comment-text">${escapeHtml(c.text)}</div>
      <div class="comment-time">
        ${timeAgo(c.createdAt)}
        ${isOwner ? `<button class="btn btn-ghost btn-sm del-comment" data-post="${postId}" data-comment="${c._id}" style="margin-left:8px;padding:2px 8px;font-size:11px">Delete</button>` : ''}
      </div>
    </div>
  </div>`;
}

function escapeHtml(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function attachPostEvents() {
  // Like
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        const res = await apiPost(`/posts/${id}/like`);
        btn.classList.toggle('liked', res.liked);
        btn.dataset.liked = res.liked;
        btn.querySelector('.like-count').textContent = res.likesCount;
        btn.firstChild.nodeValue = res.liked ? '❤️ ' : '🤍 ';
        btn.innerHTML = `${res.liked ? '❤️' : '🤍'} <span class="like-count">${res.likesCount}</span>`;
        btn.className = `action-btn like-btn ${res.liked ? 'liked' : ''}`;
      } catch (err) { toast(err.message, 'error'); }
    });
  });

  // Toggle comments
  document.querySelectorAll('.toggle-comments').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = document.getElementById(`comments-${btn.dataset.id}`);
      if (section) {
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
      }
    });
  });

  // Submit comment
  document.querySelectorAll('.comment-submit').forEach(btn => {
    btn.addEventListener('click', () => submitComment(btn.dataset.id));
  });

  document.querySelectorAll('[id^="cinput-"]').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const id = input.id.replace('cinput-', '');
        submitComment(id);
      }
    });
  });

  // Delete post
  document.querySelectorAll('.delete-post').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this post?')) return;
      try {
        await apiDelete(`/posts/${btn.dataset.id}`);
        btn.closest('.post-card').remove();
        toast('Post deleted');
      } catch (err) { toast(err.message, 'error'); }
    });
  });

  // Delete comment
  document.querySelectorAll('.del-comment').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await apiDelete(`/posts/${btn.dataset.post}/comment/${btn.dataset.comment}`);
        document.getElementById(`comment-${btn.dataset.comment}`)?.remove();
        toast('Comment deleted');
      } catch (err) { toast(err.message, 'error'); }
    });
  });
}

async function submitComment(postId) {
  const input = document.getElementById(`cinput-${postId}`);
  const text = input.value.trim();
  if (!text) return;
  try {
    const comment = await apiPost(`/posts/${postId}/comment`, { text });
    const list = document.getElementById(`clist-${postId}`);
    list.insertAdjacentHTML('beforeend', renderComment(comment, postId));
    input.value = '';

    // Re-attach del-comment for new comment
    list.querySelectorAll('.del-comment').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiDelete(`/posts/${btn.dataset.post}/comment/${btn.dataset.comment}`);
          document.getElementById(`comment-${btn.dataset.comment}`)?.remove();
          toast('Comment deleted');
        } catch (err) { toast(err.message, 'error'); }
      });
    });

    // Scroll comments into view
    const section = document.getElementById(`comments-${postId}`);
    section.style.display = 'block';
  } catch (err) {
    toast(err.message, 'error');
  }
}