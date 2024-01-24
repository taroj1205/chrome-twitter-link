// Define the structure of a Tweet
export type Tweet = {
  userName: string;
  id: string;
  time: string;
  tweet: string;
  images: string[];
  profilePicSrc: string;
  urls: string[];
  added_at: string;
  deleted_at?: string;
};

console.log('Twitter Route Change Extension is active.');

// Add scroll event listener to the window
window.addEventListener('scroll', handleScroll);

// Add DOMContentLoaded event listener to the window
window.addEventListener('DOMContentLoaded', handleScroll);

// Function to extract the username from a tweet element
function getUserName(tweetElement: Element) {
  const userNameElement = tweetElement.querySelector('[data-testid="User-Name"]');
  return userNameElement ? userNameElement.textContent : 'User name not found';
}

// Function to extract the time from a tweet element
function getTime(tweetElement: Element) {
  const timeElement = tweetElement.querySelector('time');
  return timeElement ? timeElement.dateTime : 'Time not found';
}

// Function to extract the tweet text from a tweet element
function getTweet(tweetElement: Element) {
  const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]');
  return String(tweetTextElement ? tweetTextElement.textContent : 'Tweet text not found');
}

// Function to extract the media from a tweet element
function getMedia(tweetElement: Element) {
  const imgElements = Array.from(tweetElement.querySelectorAll('img'));
  let profilePicSrc = 'Profile picture not found';
  const images = imgElements.map((imgElement: HTMLImageElement) => {
    const src = imgElement.src;
    if (src.startsWith('https://pbs.twimg.com/profile_images/')) {
      profilePicSrc = src;
      return null;
    } else if (src.startsWith('https://pbs.twimg.com/media/')) {
      return src;
    }
  }).filter(Boolean);
  return { images, profilePicSrc } as { images: string[], profilePicSrc: string };
}

// Function to extract the URLs from a tweet element
function getURLs(tweetElement: Element) {
  const linkElements = tweetElement.querySelectorAll('a');
  const urls = Array.from(linkElements).map((linkElement: HTMLAnchorElement) => {
    const urlFormat = /^https:\/\/twitter\.com\/\w+\/status\/\d+$/;
    return urlFormat.test(linkElement.href) ? linkElement.href : null;
  }).filter(Boolean);
  return urls as string[];
}

// Function to handle the scroll event
function handleScroll() {
  console.log(window.location.pathname);
  if (window.location.pathname !== '/home') {
    return;
  }

  // Select all tweet elements on the page
  const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');

  // Create an Intersection Observer to observe when tweets become visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const tweetElement = entry.target as Element;
        const newTweetData = getTweetData(tweetElement);

        // Save the currently visible tweet
        saveTweetData(newTweetData);

        // Get the next tweet element
        const nextTweetElement = tweetElement.nextElementSibling as Element;

        if (nextTweetElement) {
          const nextTweetData = getTweetData(nextTweetElement);

          // Save the next tweet
          saveTweetData(nextTweetData);
        }
      }
    });
  }, { threshold: 0 });

  // Function to save a tweet's data to chrome.storage.local
  function saveTweetData(tweetData: Tweet) {
    // Get the existing data from chrome.storage.local
    chrome.storage.local.get('tweetsData', function (result) {
      const existingTweetsData = result.tweetsData || [];

      // Append the new data to the existing data
      const updatedTweetsData = [...existingTweetsData, tweetData];

      // Save the updated data back to chrome.storage.local
      chrome.storage.local.set({ 'tweetsData': updatedTweetsData });
    });
  }

  // Start observing each tweet element
  tweetElements.forEach(tweetElement => observer.observe(tweetElement));
}

// Function to extract the tweet data from a tweet element
function getTweetData(tweetElement: Element): Tweet {
  const userName = getUserName(tweetElement);
  const time = getTime(tweetElement);
  const tweet = getTweet(tweetElement);
  const { images, profilePicSrc } = getMedia(tweetElement);
  const urls = getURLs(tweetElement);
  const parts = userName ? userName.split(/(@[^·]+)/) : ['', ''];
  const name = parts[0].trim();
  const id = parts[1].replace('@', '').trim();
  const added_at = new Date().toISOString();
  return {
    userName: name,
    id,
    time,
    tweet,
    images,
    profilePicSrc,
    urls,
    added_at
  };
}