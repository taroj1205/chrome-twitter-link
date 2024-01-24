import { Tweet } from './content';
import { show_deleted } from './main';

/**
 * Function to delete a specific tweet.
 * @param tweetUrl - The URL of the tweet to be deleted.
 */
export function deleteTweet(tweetUrl: string) {
  // Get the current date and time
  const currentTime = new Date();

  // Get the tweets data from chrome.storage.local initially
  chrome.storage.local.get('tweetsData', function (result) {
    const tweets: Tweet[] = result.tweetsData || [];

    // Find the tweet with the matching URL and set its deleted_at property
    tweets.forEach((tweet) => {
      if (tweet.urls.includes(tweetUrl)) {
        // If show_deleted is true, set deleted_at to null
        // If show_deleted is false, set deleted_at to the current time
        tweet.deleted_at = show_deleted ? undefined : currentTime.toISOString();
      }
    });

    // Update the tweets data in chrome.storage.local
    chrome.storage.local.set({ tweetsData: tweets }, function() {
      console.log('Tweets data updated');
    });
  });
}

// Function to calculate and return the relative time
export function relative(date: Date) {
  // Calculate the difference in seconds between the current time and the given date
  const seconds = Math.floor((Number(new Date()) - Number(date)) / 1000);

  // Function to create a time element with the dateTime attribute set to the date
  const createTimeElement = (text: string) => {
    const timeElement = document.createElement('time');
    timeElement.textContent = text;
    timeElement.dateTime = date.toISOString();
    return timeElement;
  };

  // Calculate the difference in weeks
  let interval = Math.floor(seconds / 604800);
  if (interval > 1) {
    // If the difference is more than 1 week, return the date
    return createTimeElement(date.toLocaleDateString());
  }

  // Calculate the difference in days
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    // If the difference is more than 1 day, return the number of days
    return createTimeElement(interval + " day" + (interval > 1 ? "s" : "") + " ago");
  }

  // Calculate the difference in hours
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    // If the difference is more than 1 hour, return the number of hours
    return createTimeElement(interval + " hour" + (interval > 1 ? "s" : "") + " ago");
  }

  // Calculate the difference in minutes
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    // If the difference is more than 1 minute, return the number of minutes
    return createTimeElement(interval + " minute" + (interval > 1 ? "s" : "") + " ago");
  }

  // If the difference is less than 1 minute, return the number of seconds
  return createTimeElement(Math.floor(seconds) + " second" + (seconds > 1 ? "s" : "") + " ago");
}

/**
 * Function to create a table cell with given content and colspan.
 * @param content - The content to be added to the cell. It can be a string or a Node.
 * @param colspan - The colspan attribute for the cell. Default is 1.
 * @returns The created table cell.
 */
export function createTableCell(content: string | Node, colspan = 1) {
  // Create a new table cell
  const cell = document.createElement('td');

  // If the content is a string, set it as the text content of the cell
  // If the content is a Node, append it as a child of the cell
  if (typeof content === 'string') {
    cell.textContent = content;
  } else {
    cell.appendChild(content);
  }

  // Add classes for padding
  cell.className = 'px-6 py-4';

  // Set the cell style
  cell.style.whiteSpace = 'normal';
  cell.style.overflow = 'hidden';
  cell.style.textOverflow = 'ellipsis';

  // Set the colspan attribute
  cell.colSpan = colspan;

  // Return the created cell
  return cell;
}

/**
 * Function to create a profile cell with given media sources and tag name.
 * @param mediaSrcs - The array of media sources to be added to the cell.
 * @param tagName - The tag name for the media elements.
 * @returns The created profile cell.
 */
export function createProfileCell(mediaSrcs: string[], tagName: string) {
  // Create a new table cell with no initial content and colspan of 1
  const cell = createTableCell('', 1);

  // Iterate over the media sources
  mediaSrcs.forEach((src) => {
    // Create a new media element with the given tag name
    const mediaElement = document.createElement(tagName) as HTMLImageElement;

    // Set the source of the media element
    mediaElement.src = src;

    // Set the class for the media element for styling
    mediaElement.className = 'w-10 h-10 rounded-full';

    // Append the media element to the cell
    cell.appendChild(mediaElement);
  });

  // Return the created cell
  return cell;
}

/**
 * Function to create a table row for a tweet.
 * @param tweet - The tweet object.
 * @returns An array of created table rows.
 */
export function createTableRow(tweet: Tweet, index: number) {
  // Create the row elements
  const rowHeaders = document.createElement('tr');
  const rowDescription = document.createElement('tr');
  const rowLink = document.createElement('tr');

  // Add alternating background color
  const bgColorClass = index % 2 === 0 ? 'bg-gray-100' : 'bg-white';
  rowHeaders.classList.add(bgColorClass);
  rowDescription.classList.add(bgColorClass);
  rowLink.classList.add(bgColorClass);

  // Headers
  // Create a cell for the profile picture
  const profilePicCell = createProfileCell([tweet.profilePicSrc], 'img');
  profilePicCell.rowSpan = 1;
  profilePicCell.className += ' max-w-[3rem]';
  rowHeaders.appendChild(profilePicCell);

  // Create cells for the headers
  [tweet.userName, tweet.id, relative((new Date(tweet.time))), relative(new Date(tweet.added_at))].forEach(header => {
    const th = document.createElement('th');
    th.className = 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider';
    if (header instanceof HTMLTimeElement) {
      th.appendChild(header);
    } else {
      th.textContent = header;
    }
    rowHeaders.appendChild(th);
  });

  // Description
  // Create a cell for the tweet text
  const tweetCell = createTableCell(tweet.tweet, 5);
  rowDescription.appendChild(tweetCell);

  // Media
  // Create a cell for the media
  const mediaCell = createTableCell('', 5);
  mediaCell.classList.add(bgColorClass);
  [...tweet.images].forEach((mediaSrc) => {
    const mediaElement = document.createElement(mediaSrc.endsWith('.mp4') ? 'video' : 'img') as HTMLImageElement | HTMLVideoElement;
    mediaElement.src = mediaSrc;
    mediaElement.style.width = '300px';

    const linkElement = document.createElement('a');
    linkElement.href = mediaSrc;
    linkElement.target = '_blank';
    linkElement.classList.add("w-fit", "h-fit", "inline-block");
    linkElement.appendChild(mediaElement);

    mediaCell.appendChild(linkElement);
  });

  // Link
  // Create a div for the link and delete button
  const linkDiv = document.createElement('div');
  linkDiv.className = 'flex justify-between items-center';

  // Create a cell for the link
  const linkElement = document.createElement('a') as HTMLAnchorElement;
  linkElement.href = tweet.urls[0];
  linkElement.target = '_blank';
  linkElement.classList.add("text-blue-500", "hover:underline");
  linkElement.textContent = tweet.urls[0];
  linkDiv.appendChild(linkElement);

  // Create a delete button
  const deleteButton = document.createElement('button');
  deleteButton.textContent = show_deleted ? 'Restore' : 'Delete';
  deleteButton.className = 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700';
  deleteButton.addEventListener('click', () => {
    deleteTweet(tweet.urls[0]);
  });
  linkDiv.appendChild(deleteButton);

  const linkCell = createTableCell('', 5);
  linkCell.appendChild(linkDiv);
  rowLink.appendChild(linkCell);

  // Append rows to tbody
  const rows = [rowHeaders, rowDescription, rowLink];


  const rowMedia = document.createElement('tr');
  if (mediaCell.children.length > 0) {
    mediaCell.colSpan = 5;
    rowMedia.appendChild(mediaCell);
    rows.splice(2, 0, rowMedia);
  }

  return rows;
}