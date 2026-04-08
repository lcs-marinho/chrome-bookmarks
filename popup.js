document.addEventListener('DOMContentLoaded', function () {
  const listContainer = document.getElementById('bookmark-list');

  chrome.bookmarks.getRecent(30, function (bookmarks) {
    bookmarks.forEach(function (bookmark) {
      const btn = document.createElement('button');
      btn.innerText = bookmark.title || 'Sem título';
      btn.className = 'bookmark-btn';
      
      btn.onclick = function () {
        chrome.tabs.create({ url: bookmark.url });
      };

      listContainer.appendChild(btn);
    });
  });
});