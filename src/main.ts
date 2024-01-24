import { Tweet } from './content';
import { createTableRow } from './utils';
import "./styles.css"

export let show_deleted = false;

// Function to reset the table
function resetTable() {
  // Clear the stored tweets data
  chrome.storage.local.set({ tweetsData: [] });
  // Reload the page
  location.reload();
}

// Create a Map to store the unique tweets
const uniqueTweets = new Map<string, Tweet>();

// Function to check if a tweet is a duplicate
function isDuplicateTweet(url: string, tweet: Tweet): boolean {
  // Get the existing tweet for the URL
  const existingTweet = uniqueTweets.get(url);
  // Return true if the existing tweet's "added_at" is later than or equal to the current tweet's "added_at"
  return existingTweet !== undefined && new Date(tweet.added_at) <= new Date(existingTweet.added_at);
}

// Add an event listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get the table, tbody, and reset button elements
  const table = document.getElementById('linksTable') as HTMLTableElement;
  const tbody = table.querySelector('tbody') as HTMLTableSectionElement;
  const resetButton = document.getElementById('reset') as HTMLButtonElement;
  const switchButton = document.getElementById('switch') as HTMLButtonElement;

  // Add a click event listener to the reset button
  resetButton.addEventListener('click', resetTable);

  // Add a click event listener to the switch button
  switchButton.addEventListener('click', switchDisplayed)

  function switchDisplayed() {
    show_deleted = !show_deleted;
    switchButton.textContent = show_deleted ? "Hide Deleted" : "Show Deleted";
    updateTable(Array.from(uniqueTweets.values()));
  }

  let lastUpdateSize = 0;

  // Function to update the table with the tweets data
  function updateTable(tweetsData: Tweet[]) {
    // Clear the tbody
    tbody.innerHTML = '';

    // Iterate over the tweetsData array in reverse order
    for (let i = tweetsData.length - 1; i >= 0; i--) {
      const tweet = tweetsData[i];

      // Iterate over the tweet's URLs
      for (const url of tweet.urls) {
        // If the URL is not already in the Map, or if the current tweet's "added_at" is later than the stored tweet's "added_at", update the Map entry for the URL with the current tweet
        if (!isDuplicateTweet(url, tweet)) {
          uniqueTweets.set(url, tweet);
        }
      }
    }

    // Convert the Map values back into an array of tweets
    let newTweets = Array.from(uniqueTweets.values());

    // Sort the tweets by added_at in descending order
    newTweets = newTweets.sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());

    // Continue with the existing processing of the tweets
    newTweets.forEach((tweet, index) => {
      // If show_deleted is true, skip the tweet if it has not been deleted
      // If show_deleted is false, skip the tweet if it has been deleted
      if ((show_deleted && !tweet.deleted_at) || (!show_deleted && tweet.deleted_at)) {
        return;
      }
      const rows = createTableRow(tweet, index);
      rows.forEach(row => tbody.appendChild(row));
    });

    lastUpdateSize = newTweets.length;
  }

  // Listen for changes to the tweetsData item in chrome.storage.local
  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName === 'local' && changes.tweetsData) {
      const newTweets = changes.tweetsData.newValue;
      newTweets.forEach((tweet: Tweet) => {
        tweet.urls.forEach((url: string) => {
          uniqueTweets.set(url, tweet);
        });
      });
      updateTable(Array.from(uniqueTweets.values()));
    }
  });

  // Get the tweets data from chrome.storage.local initially
  chrome.storage.local.get('tweetsData', function (result) {
    const tweetsData: Tweet[] = result.tweetsData || [];
    updateTable(tweetsData);
  });
});

window.onload = function () {
  // Fetch the latest release from your GitHub repository
  fetch('https://api.github.com/repos/taroj1205/chrome-twitter-link/releases/latest')
    .then(response => response.json())
    .then(data => {
      const serverVersion = data.tag_name;

      const currentVersion = "1.1";

      // If the versions do not match, notify the user
      if (currentVersion !== serverVersion) {
        const noticeElement = document.getElementById('notice') as HTMLDivElement;
        const message = `A new version of this extension is available. Please update to the latest version.`
        const link = `https://github.com/taroj1205/chrome-twitter-link/releases/tag/${serverVersion}`
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messageElement.className = 'text-lg text-red-600';
        const linkElement = document.createElement('a');
        linkElement.href = link;
        linkElement.target = '_blank';
        linkElement.textContent = 'Click here to update';
        linkElement.className = 'text-blue-500 underline';
        noticeElement.appendChild(messageElement);
        noticeElement.appendChild(linkElement);
      }

    })
    .catch(error => console.error('Error:', error));
};