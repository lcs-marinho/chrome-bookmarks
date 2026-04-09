document.addEventListener('DOMContentLoaded', function () {
  const listContainer = document.getElementById('bookmark-list');

  chrome.bookmarks.getChildren('1', function (bookmarks) {
    bookmarks.forEach(function (bookmark) {

      if (!bookmark.url) return;

      const btn = document.createElement('span');
      btn.className = 'bookmark-btn';

      const img = document.createElement('img');
      img.src = `https://www.google.com/s2/favicons?sz=32&domain_url=${bookmark.url}`;
      img.width = 18;
      img.height = 18;


      btn.appendChild(img);

      btn.onclick = function () {
        chrome.tabs.create({ url: bookmark.url });
      };

      listContainer.appendChild(btn);
    });
  });

});