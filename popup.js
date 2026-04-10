document.addEventListener('DOMContentLoaded', function () {
  const listContainer = document.getElementById('bookmark-list');
  const labelCounts = {};

  function makeLabel(bookmark) {
    const rawTitle = (bookmark.title || '').trim();
    if (rawTitle) return rawTitle;
    try {
      const url = new URL(bookmark.url);
      let label = url.hostname.replace(/^www\./, '');
      if (labelCounts[label]) {
        labelCounts[label] += 1;
        label = `${label}-${labelCounts[label]}`;
      } else {
        labelCounts[label] = 1;
      }
      return label;
    } catch (e) {
      return bookmark.url;
    }
  }

  // Recursive rendering: handles folders and bookmarks
  function ensureVisible(container, element) {
    const cRect = container.getBoundingClientRect();
    const eRect = element.getBoundingClientRect();
    // scroll down if bottom of element is below container visible area
    if (eRect.bottom > cRect.bottom) {
      const diff = eRect.bottom - cRect.bottom + 8;
      container.scrollBy({ top: diff, behavior: 'smooth' });
    }
    // scroll up if top of element is above container visible area
    else if (eRect.top < cRect.top) {
      const diff = eRect.top - cRect.top - 8;
      container.scrollBy({ top: diff, behavior: 'smooth' });
    }
  }

  function renderNode(nodeId, container) {
    chrome.bookmarks.getChildren(nodeId, function (children) {
      if (!children || children.length === 0) return;
      children.forEach(function (node) {
        if (node.url) {
          const item = document.createElement('div');
          item.className = 'bookmark-item';
          item.setAttribute('data-url', node.url);

          const img = document.createElement('img');
          img.className = 'favicon';
          // try chrome internal favicon (matches bookmarks bar), fall back to Google service, then bundle icon
          img.src = `chrome://favicon/size/32@${node.url}`;
          img.width = 18;
          img.height = 18;
          img.onerror = function () {
            // fallback to Google favicon service
            img.onerror = function () {
              // final fallback to extension icon
              img.src = 'icons/128.png';
            };
            img.src = `https://www.google.com/s2/favicons?sz=32&domain_url=${node.url}`;
          };

          const title = document.createElement('span');
          title.className = 'bookmark-title';
          title.textContent = makeLabel(node);

          item.appendChild(img);
          item.appendChild(title);

          item.onclick = function () {
            chrome.tabs.create({ url: node.url });
          };

          container.appendChild(item);
        } else {
          // folder
          const folder = document.createElement('div');
          folder.className = 'folder';

          const header = document.createElement('div');
          header.className = 'folder-header';
          header.setAttribute('role', 'button');
          header.setAttribute('tabindex', '0');

          const chevron = document.createElement('span');
          chevron.className = 'chevron';
          const closedFolderSVG = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z"/>
            </svg>`;
          const openFolderSVG = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M3 6H9L11 8H21C22.1 8 23 8.9 23 10V18C23 19.1 22.1 20 21 20H3V6Z"/>
            </svg>`;
          chevron.innerHTML = closedFolderSVG;

          const title = document.createElement('span');
          title.className = 'bookmark-title';
          title.textContent = node.title || 'Folder';

          header.appendChild(chevron);
          header.appendChild(title);

          const childrenContainer = document.createElement('div');
          childrenContainer.className = 'folder-children';

          // start closed
          folder.classList.remove('expanded');
          header.setAttribute('aria-expanded', 'false');

          header.onclick = function () {
            const willExpand = !folder.classList.contains('expanded');
            folder.classList.toggle('expanded', willExpand);
            header.setAttribute('aria-expanded', String(willExpand));
            // swap folder icon
            chevron.innerHTML = willExpand ? openFolderSVG : closedFolderSVG;
            if (willExpand) {
              // ensure folder children are visible inside the list container
              requestAnimationFrame(function () {
                ensureVisible(listContainer, folder);
              });
            }
          };

          header.onkeydown = function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              header.onclick();
            }
          };

          folder.appendChild(header);
          folder.appendChild(childrenContainer);
          container.appendChild(folder);

          // recurse into folder
          renderNode(node.id, childrenContainer);
        }
      });
    });
  }

  renderNode('1', listContainer);

});