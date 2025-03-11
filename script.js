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
const yearSelect = document.getElementById('year-select');
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
  fetchCalendarData();
  setupEventListeners();
  setupYearSelect();
  setupKeyboardNavigation();
}

function setupEventListeners() {
  closeEventBtn.addEventListener('click', closeEventDetails);
  overlay.addEventListener('click', closeEventDetails);
  document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
  document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
  document.getElementById('today-btn').addEventListener('click', jumpToToday);
}

printBtn.addEventListener('click', printCalendar);

// Keyboard Navigation
function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') changeMonth(-1);
    if (e.key === 'ArrowRight') changeMonth(1);
  });
}

// Print Functionality
function printCalendar() {
  window.print();
}

// Week Numbers
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay()||7));
  const yearStart = new Date(d.getFullYear(),0,1);
  return Math.ceil(((d - yearStart) / 86400000 + 1)/7);
}

// Year Select
function setupYearSelect() {
  const currentYear = new Date().getFullYear();
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

// Updated createActiveDay function
function createActiveDay(cell, date, year, month, today) {
  const dateObj = new Date(year, month, date);
  const isToday = dateObj.toDateString() === today.toDateString();
  const weekNumber = getWeekNumber(dateObj);
  
  cell.innerHTML = `
    <div class="week-number">W${weekNumber}</div>
    <div class="day-number">${date}</div>
  `;
  
  if (isToday) cell.classList.add('today');
  
  const dateString = formatDate(dateObj);
  const events = calendarData.events.filter(e => e.date === dateString);
  
  // Event count badge
  if (events.length > 0) {
    const badge = document.createElement('div');
    badge.className = 'event-count';
    badge.textContent = events.length;
    cell.appendChild(badge);
  }
  
  events.forEach(event => createEventElement(cell, event));
}

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
    calendarData = await response.json();
  } catch (error) {
    console.error('Using sample data:', error);
    calendarData = getSampleData();
  }
  renderCalendar();
}

function getSampleData() {
  return {
    calendarName: "Sample Calendar",
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    events: [
      {
        id: "1",
        title: "Team Meeting",
        date: formatDate(new Date()),
        time: "10:00 AM",
        description: "Weekly team sync-up"
      }
    ]
  };
}

function renderCalendar() {
  applySeasonalTheme();
  updateCalendarHeader();
  buildCalendarGrid();
  yearSelect.value = calendarData.year; // Keep dropdown in sync
}

function applySeasonalTheme() {
  const currentMonth = calendarData.month;
  const calendarContainer = document.querySelector('.calendar-container');
  
  // Remove existing themes
  calendarContainer.classList.forEach(className => {
    if (className.endsWith('-theme')) {
      calendarContainer.classList.remove(className);
    }
  });

  // Apply new theme
  const currentSeason = seasons.find(s => s.months.includes(currentMonth));
  if (currentSeason) {
    calendarContainer.classList.add(currentSeason.class);
    seasonIcon.textContent = currentSeason.icon;
  }
}

function updateCalendarHeader() {
  calendarTitle.innerHTML = `
    ${calendarData.calendarName} - ${months[calendarData.month]} ${calendarData.year}
  `;
}

function buildCalendarGrid() {
  calendarGrid.innerHTML = '';
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
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  for (let i = 0; i < 42; i++) { // 6 weeks
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    
    if (i < firstDay || i >= firstDay + daysInMonth) {
      createInactiveDay(dayCell, i, firstDay, daysInMonth, year, month);
    } else {
      createActiveDay(dayCell, i - firstDay + 1, year, month, today);
    }
    
    calendarGrid.appendChild(dayCell);
  }
}

function createInactiveDay(cell, index, firstDay, daysInMonth, year, month) {
  cell.classList.add('inactive');
  const prevMonthDays = new Date(year, month, 0).getDate();
  const dayNumber = index < firstDay 
    ? prevMonthDays - (firstDay - index - 1)
    : index - (firstDay + daysInMonth) + 1;
  cell.innerHTML = `<div class="day-number">${dayNumber}</div>`;
}

function createActiveDay(cell, date, year, month, today) {
  const dateObj = new Date(year, month, date);
  const isToday = dateObj.toDateString() === today.toDateString();
  
  if (isToday) cell.classList.add('today');
  cell.innerHTML = `<div class="day-number">${date}</div>`;
  
  const dateString = formatDate(dateObj);
  const events = calendarData.events.filter(e => e.date === dateString);
  events.forEach(event => createEventElement(cell, event));
}

function createEventElement(cell, event) {
  const eventEl = document.createElement('div');
  eventEl.className = 'event';
  if (event.title === "🎂" || event.title === "💸") {
    eventEl.classList.add('event-icon');
  } 
  eventEl.textContent = event.title;
  eventEl.addEventListener('click', () => showEventDetails(event));
  cell.appendChild(eventEl);
}

// Utility Functions
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function showEventDetails(event) {
  eventTitle.textContent = event.title;
  eventTime.textContent = event.time || 'All day';
  eventDescription.textContent = event.description || 'No description';
  overlay.style.display = 'block';
  eventDetails.style.display = 'block';
}

function closeEventDetails() {
  overlay.style.display = 'none';
  eventDetails.style.display = 'none';
}


// Initialize
initializeCalendar();