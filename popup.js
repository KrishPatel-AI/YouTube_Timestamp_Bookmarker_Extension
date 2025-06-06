document.addEventListener("DOMContentLoaded", () => {
  const bookmarkButton = document.getElementById("bookmarkButton");
  const bookmarksDiv = document.getElementById("bookmarks");

  // Load bookmarks from storage and display them
  chrome.storage.local.get(["bookmarks"], (result) => {
    if (result.bookmarks) {
      result.bookmarks.forEach((bookmark) => {
        addBookmark(bookmark);
      });
    }
  });

  // Add a new bookmark when the button is clicked
  bookmarkButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const isYouTubeVideoPage = currentTab.url.includes("youtube.com/watch");

      if (isYouTubeVideoPage) {
        chrome.scripting.executeScript(
          {
            target: { tabId: currentTab.id },
            func: () => {
              const video = document.querySelector("video");
              const titleElement = document.querySelector(
                "h1.title yt-formatted-string"
              );
              const channelElement = document.querySelector("#channel-name a");
              const thumbnailElement = document.querySelector(
                "ytd-video-owner-renderer img"
              );

              const currentTime = video ? video.currentTime : 0;
              const title = titleElement
                ? titleElement.innerText
                : "Unknown Title";
              const channel = channelElement
                ? channelElement.innerText
                : "Unknown Channel";
              const thumbnail = thumbnailElement ? thumbnailElement.src : "";

              return { currentTime, title, channel, thumbnail };
            },
          },
          (results) => {
            if (results && results[0].result.currentTime != null) {
              const bookmark = {
                url: currentTab.url,
                time: results[0].result.currentTime,
                title: results[0].result.title,
                channel: results[0].result.channel,
                thumbnail: results[0].result.thumbnail,
              };

              chrome.storage.local.get(["bookmarks"], (result) => {
                const bookmarks = result.bookmarks || [];
                bookmarks.push(bookmark);
                chrome.storage.local.set({ bookmarks });
                addBookmark(bookmark);
              });
            }
          }
        );
      } else {
        alert("This extension only works on YouTube video pages.");
      }
    });
  });

  // Add a bookmark to the bookmarks list
  function addBookmark(bookmark) {
    const bookmarkElement = document.createElement("div");
    bookmarkElement.className = "bookmark";
    const time = new Date(bookmark.time * 1000).toISOString().substr(11, 8);
    bookmarkElement.innerHTML = `
      <div class="bookmark-thumbnail">
        <img src="${bookmark.thumbnail}" alt="Thumbnail">
      </div>
      <div class="bookmark-info">
        <a href="#" data-url="${bookmark.url}&t=${Math.floor(
      bookmark.time
    )}s">${bookmark.title}</a>
        <div class="channel">${bookmark.channel}</div>
        <div class="time">${time}</div>
      </div>
      <button class="go-to-video-button" title="Go to Video">
        <span class="material-icons">open_in_new</span>
      </button>
      <button class="delete-button" title="Delete">
        <span class="material-icons">delete</span>
      </button>`;
    bookmarksDiv.appendChild(bookmarkElement);

    // Handle the delete button click
    bookmarkElement
      .querySelector(".delete-button")
      .addEventListener("click", () => {
        chrome.storage.local.get(["bookmarks"], (result) => {
          const updatedBookmarks = result.bookmarks.filter(
            (b) => b.time !== bookmark.time
          );
          chrome.storage.local.set({ bookmarks: updatedBookmarks });
          bookmarkElement.remove();
        });
      });

    // Handle the "Go to Video" button click
    bookmarkElement
      .querySelector(".go-to-video-button")
      .addEventListener("click", () => {
        const url = `${bookmark.url}&t=${Math.floor(bookmark.time)}s`;
        chrome.tabs.create({ url: url });
      });
  }
});
