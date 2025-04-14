// DOM Elements
const calendarTitle = document.getElementById('calendar-title');
const calendarGrid = document.getElementById('calendar-grid');
const overlay = document.getElementById('overlay');
const eventDetails = document.getElementById('event-details');
const eventTitle = document.getElementById('event-title');
const eventTime = document.getElementById('event-time');
const eventDescription = document.getElementById('event-description');
const closeEventBtn = document.getElementById('close-event');
const seasonIcon = document.getElementById('season-icon');
// Ensure yearSelect is correctly selected (add an ID="year-select" to your select element in HTML if missing)
// const yearSelect = document.getElementById('year-select'); // UNCOMMENT if you have the element
const printBtn = document.getElementById('print-btn');

// Constants
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Calendar State
let calendarData = null;

// Theme Configuration
const seasons = [
  { class: 'winter-theme', icon: '❄️', months: [0, 1, 11] },
  { class: 'spring-theme', icon: '🌸', months: [2, 3, 4] },
  { class: 'summer-theme', icon: '🌞', months: [5, 6, 7] },
  { class: 'fall-theme', icon: '🍂', months: [8, 9, 10] }
];

// Core Functions
function initializeCalendar() {
  fetchCalendarData(); // fetch data first
}

function setupApplication() {
    // Ensure calendarData is loaded before setting up listeners that depend on it
    if (!calendarData) {
        console.error("Calendar data not loaded, cannot setup application.");
        return;
    }
    setupEventListeners();
    // setupYearSelect(); // UNCOMMENT if you have the year select element
    setupKeyboardNavigation();
    renderCalendar(); // Initial render after setup
}

function setupEventListeners() {
  closeEventBtn.addEventListener('click', closeEventDetails);
  overlay.addEventListener('click', closeEventDetails);
  document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
  document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
  document.getElementById('today-btn').addEventListener('click', jumpToToday);
  printBtn.addEventListener('click', printCalendar); // Added this line
}

// Print Functionality
function printCalendar() {
  window.print();
}

// Keyboard Navigation
function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Avoid changing month if typing in an input/select
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
        return;
    }
    if (e.key === 'ArrowLeft') changeMonth(-1);
    if (e.key === 'ArrowRight') changeMonth(1);
    if (e.key === 'Escape' && overlay.style.display === 'block') closeEventDetails(); // Close modal with Esc
  });
}

// Week Numbers
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  // Return week number
  return weekNo;
}

// Year Select - UNCOMMENT and ensure HTML has id="year-select"
/*
function setupYearSelect() {
  const currentYear = new Date().getFullYear();
  yearSelect.innerHTML = ''; // Clear previous options
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.text = i;
    yearSelect.appendChild(option);
  }
  yearSelect.value = calendarData.year;
  yearSelect.addEventListener('change', () => {
    calendarData.year = parseInt(yearSelect.value);
    renderCalendar();
  });
}
*/

function changeMonth(offset) {
  let newMonth = calendarData.month + offset;
  let newYear = calendarData.year;

  if (newMonth < 0) {
    newMonth = 11;
    newYear--;
  } else if (newMonth > 11) {
    newMonth = 0;
    newYear++;
  }

  calendarData.month = newMonth;
  calendarData.year = newYear;
  renderCalendar();
}

function jumpToToday() {
  const today = new Date();
  calendarData.month = today.getMonth();
  calendarData.year = today.getFullYear();
  renderCalendar();
}

async function fetchCalendarData() {
  try {
    const response = await fetch('calendar-data.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    calendarData = await response.json();

    // Set initial month/year to current date ONLY if not specified or invalid in JSON
    const today = new Date();
    if (calendarData.month === undefined || calendarData.month < 0 || calendarData.month > 11) {
      calendarData.month = today.getMonth();
    }
     if (calendarData.year === undefined || isNaN(parseInt(calendarData.year))) {
       calendarData.year = today.getFullYear();
     }

  } catch (error) {
    console.error('Error fetching calendar data, using sample:', error);
    calendarData = getSampleData(); // Fallback to sample data
  } finally {
      // Ensure setup runs after data is available (either fetched or sample)
      setupApplication();
  }
}


function getSampleData() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

  return {
    calendarName: "Sample Calendar",
    month: today.getMonth(),
    year: today.getFullYear(),
    events: [
      {
        id: "S-1",
        title: "Team Meeting",
        date: formatDate(today),
        time: "10:00 AM",
        description: "Weekly team sync-up"
      },
      {
        id: "S-2",
        title: "Project Deadline",
        date: formatDate(tomorrow),
        time: "ALL DAY",
        description: "Finalize Q1 report"
      },
      {
        id: "S-B1",
        title: "🎂", // Use emoji directly
        date: formatDate(new Date(today.getFullYear(), today.getMonth(), 15)), // Example birthday
        time: "ALL DAY",
        description: "Happy Birthday!"
      }
    ]
  };
}

function renderCalendar() {
  if (!calendarData) return; // Don't render if data isn't loaded
  applySeasonalTheme();
  updateCalendarHeader();
  buildCalendarGrid();
  // if (yearSelect) yearSelect.value = calendarData.year; // Keep dropdown in sync - UNCOMMENT if using year select
}

function applySeasonalTheme() {
  const currentMonth = calendarData.month;
  const calendarContainer = document.querySelector('.calendar-container');

  // Remove existing themes
  seasons.forEach(s => calendarContainer.classList.remove(s.class));

  // Apply new theme
  const currentSeason = seasons.find(s => s.months.includes(currentMonth));
  if (currentSeason) {
    calendarContainer.classList.add(currentSeason.class);
    seasonIcon.textContent = currentSeason.icon;
  } else {
      seasonIcon.textContent = '📅'; // Default icon if no season matches
  }
}

function updateCalendarHeader() {
  calendarTitle.innerHTML = `
    ${calendarData.calendarName} - ${months[calendarData.month]} ${calendarData.year}
  `;
}

function buildCalendarGrid() {
  calendarGrid.innerHTML = ''; // Clear previous grid
  createDayHeaders();
  createCalendarDays();
}

function createDayHeaders() {
  daysOfWeek.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = day;
    calendarGrid.appendChild(dayHeader);
  });
}

function createCalendarDays() {
  const { year, month } = calendarData;
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon,...
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); // Get today's date for highlighting

  // Calculate the date of the first cell (might be from the previous month)
  const firstCellDate = new Date(year, month, 1);
  firstCellDate.setDate(1 - firstDayOfMonth);

  // Create 6 weeks (42 days)
  for (let i = 0; i < 42; i++) {
    const currentCellDate = new Date(firstCellDate);
    currentCellDate.setDate(firstCellDate.getDate() + i);

    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';

    if (currentCellDate.getMonth() !== month) {
      // Inactive day (previous or next month)
      dayCell.classList.add('inactive');
      dayCell.innerHTML = `<div class="day-number">${currentCellDate.getDate()}</div>`;
    } else {
      // Active day (current month)
      createActiveDay(dayCell, currentCellDate, today);
    }
    calendarGrid.appendChild(dayCell);
  }
}

const singleEmojiRegex = /^\p{Emoji}$/u;

function createActiveDay(cell, dateObj, today) {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const date = dateObj.getDate();
  const isToday = dateObj.toDateString() === today.toDateString();
  // const weekNumber = getWeekNumber(dateObj);

  // Create day number and week number elements
  // const weekNumEl = document.createElement('div');
  // weekNumEl.className = 'week-number';
  // weekNumEl.textContent = `W${weekNumber}`;
  // cell.appendChild(weekNumEl);

  const dayNumEl = document.createElement('div');
  dayNumEl.className = 'day-number';
  dayNumEl.textContent = date;
  cell.appendChild(dayNumEl);

  // Create a container for events
  const eventsList = document.createElement('div');
  eventsList.className = 'events-list';
  cell.appendChild(eventsList);

  if (isToday) {
      cell.classList.add('today');
  }

  const dateString = formatDate(dateObj);
  const events = calendarData.events.filter(e => e.date === dateString);

  // Add event count badge if there are events
   // --- Event Count Badge (Counts ALL events) ---
   if (events.length > 0) {
    const badge = document.createElement('div');
    badge.className = 'event-count';
    badge.textContent = events.length;
    cell.appendChild(badge); // Append badge to the cell itself
}

const centeredEmojiTitles = ["🏳️", "✊🏾", "🎆", "🛠️", "🌎", "🎃", "🎖️", "🦃", "🎄", "🎉", "🎂", "💸", "🐰", "📜"];

// --- Process Events: Separate Emojis from Regular ---
events.forEach(event => {

    const isKnownCenteredEmoji = event.title && centeredEmojiTitles.includes(event.title);
    // Check if the title is a single emoji
    if (isKnownCenteredEmoji /* || isSimpleEmojiViaRegex */ ) { // Decide if you need the regex fallback
      // Create CENTERED EMOJI ELEMENT
      const emojiEl = document.createElement('div');
      emojiEl.className = 'centered-emoji-event';
      emojiEl.textContent = event.title;
      emojiEl.setAttribute('title', `${event.description || event.title}\nTime: ${event.time || 'ALL DAY'}`);
      emojiEl.addEventListener('click', (e) => {
          e.stopPropagation();
          showEventDetails(event);
      });
      cell.appendChild(emojiEl);
  } else {
      // Create REGULAR BOXED EVENT (for titles like "Team Meeting")
      createEventElement(eventsList, event);
  }
});
}

// Modified to append events to a specific container within the day cell
function createEventElement(container, event) {
  const eventEl = document.createElement('div');
  eventEl.className = 'event'; // Base class for the box style

    // Add other type checks here if needed based on ID prefix or a new 'type' field
    // else if (event.id.startsWith('H-')) {
    //     eventEl.classList.add('holiday'); // Example
    // }

  // Set text content (handle potential missing title)
  // For icon-based events, the text might be redundant if the icon is clear
  eventEl.textContent = event.title || 'Unnamed Event';
  // Optionally hide text if it's just an icon:
  // if (eventEl.classList.contains('birthday') || eventEl.classList.contains('payday')) {
  //     // eventEl.textContent = ''; // Keep text for accessibility or remove if icon is enough
  // }


  // Add tooltip for full title/description on hover
  eventEl.setAttribute('title', `${event.description || event.title}\nTime: ${event.time || 'ALL DAY'}`);

  eventEl.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent click bubbling to the day cell if needed
      showEventDetails(event);
  });

  // Append to the provided container (the eventsList div)
  container.appendChild(eventEl);
}


// Utility Functions
function formatDate(date) {
    // Ensure date is a Date object
    if (!(date instanceof Date)) {
        date = new Date(date); // Try to parse if it's a string
    }
    if (isNaN(date.getTime())) { // Check if the date is valid
        console.error("Invalid date provided to formatDate:", date);
        return null; // Or return a default/error string
    }
    // Use UTC methods to avoid timezone issues if dates are meant to be timezone-agnostic
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;

    // Original simpler version (can have timezone issues):
    // return date.toISOString().split('T')[0];
}

function showEventDetails(event) {
  eventTitle.textContent = event.title;
  eventTime.textContent = `Time: ${event.time || 'ALL DAY'}`;
  eventDescription.textContent = event.description || 'No description available.';
  overlay.style.display = 'block';
  eventDetails.style.display = 'block';
  // Focus the close button for accessibility
  setTimeout(() => closeEventBtn.focus(), 50);
}

function closeEventDetails() {
  overlay.style.display = 'none';
  eventDetails.style.display = 'none';
}


// Initialize
initializeCalendar();
