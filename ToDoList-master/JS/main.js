// Add this at the top of the file after the selectors
let activeReminders = new Map();
let shownReminders = new Set(); // Track shown reminders to prevent duplicates

// Selectors

const toDoInput = document.querySelector('.todo-input');
const toDoDate = document.querySelector('.todo-date');
const toDoStartTime = document.querySelector('.todo-start-time');
const toDoEndTime = document.querySelector('.todo-end-time');
const toDoBtn = document.querySelector('.todo-btn');
const toDoList = document.querySelector('.todo-list');
const standardTheme = document.querySelector('.standard-theme');
const lightTheme = document.querySelector('.light-theme');
const darkerTheme = document.querySelector('.darker-theme');

// Add these variables at the top of the file after the selectors
let startSound, endSound, notificationSound;
let canPlaySound = false;

// Event Listeners

toDoBtn.addEventListener('click', addToDo);
toDoList.addEventListener('click', deletecheck);
document.addEventListener("DOMContentLoaded", getTodos);
standardTheme.addEventListener('click', () => changeTheme('standard'));
lightTheme.addEventListener('click', () => changeTheme('light'));
darkerTheme.addEventListener('click', () => changeTheme('darker'));

// Enable sound playback after user interaction
document.addEventListener('click', initializeAudio, { once: true });

// Check if one theme has been set previously and apply it (or std theme if not found):
let savedTheme = localStorage.getItem('savedTheme');
savedTheme === null ?
    changeTheme('standard')
    : changeTheme(localStorage.getItem('savedTheme'));

// Functions;
function addToDo(event) {
    // Prevents form from submitting / Prevents form from relaoding;
    event.preventDefault();

    if (toDoInput.value === '') {
        alert("You must write something!");
        return;
    }

    if (!toDoDate.value || !toDoStartTime.value || !toDoEndTime.value) {
        alert("Please fill in all date and time fields!");
        return;
    }

    // toDo DIV;
    const toDoDiv = document.createElement("div");
    toDoDiv.classList.add('todo', `${savedTheme}-todo`);

    // Create LI
    const newToDo = document.createElement('li');
    newToDo.classList.add('todo-item');

    const taskText = document.createElement('span');
    taskText.classList.add('task-text');
    taskText.innerText = toDoInput.value;

    const taskDateTime = document.createElement('span');
    taskDateTime.classList.add('task-datetime');
    taskDateTime.innerText = `Date: ${toDoDate.value} | Time: ${toDoStartTime.value} - ${toDoEndTime.value}`;

    newToDo.appendChild(taskText);
    newToDo.appendChild(taskDateTime);
    toDoDiv.appendChild(newToDo);

    // Adding to local storage;
    const todoData = {
        text: toDoInput.value,
        date: toDoDate.value,
        startTime: toDoStartTime.value,
        endTime: toDoEndTime.value
    };
    savelocal(todoData);

    // check btn;
    const checked = document.createElement('button');
    checked.innerHTML = '<i class="fas fa-check"></i>';
    checked.classList.add('check-btn', `${savedTheme}-button`);
    toDoDiv.appendChild(checked);
    // delete btn;
    const deleted = document.createElement('button');
    deleted.innerHTML = '<i class="fas fa-trash"></i>';
    deleted.classList.add('delete-btn', `${savedTheme}-button`);
    toDoDiv.appendChild(deleted);

    // Append to list;
    toDoList.appendChild(toDoDiv);

    // CLearing the input;
    toDoInput.value = '';
    toDoDate.value = '';
    toDoStartTime.value = '';
    toDoEndTime.value = '';

    // Set reminders for start and end times
    setReminders(todoData);
}   


function deletecheck(event){

    // console.log(event.target);
    const item = event.target;

    // delete
    if(item.classList[0] === 'delete-btn')
    {
        // item.parentElement.remove();
        // animation
        item.parentElement.classList.add("fall");

        //removing local todos;
        removeLocalTodos(item.parentElement);

        item.parentElement.addEventListener('transitionend', function(){
            item.parentElement.remove();
        })
    }

    // check
    if(item.classList[0] === 'check-btn')
    {
        item.parentElement.classList.toggle("completed");
    }


}


// Saving to local storage:
function savelocal(todoData) {
    //Check: if item/s are there;
    let todos;
    if(localStorage.getItem('todos') === null) {
        todos = [];
    }
    else {
        todos = JSON.parse(localStorage.getItem('todos'));
    }

    todos.push(todoData);
    localStorage.setItem('todos', JSON.stringify(todos));
}



function getTodos() {
    //Check: if item/s are there;
    let todos;
    if(localStorage.getItem('todos') === null) {
        todos = [];
    }
    else {
        todos = JSON.parse(localStorage.getItem('todos'));
    }

    todos.forEach(function(todoData) {
        // toDo DIV;
        const toDoDiv = document.createElement("div");
        toDoDiv.classList.add("todo", `${savedTheme}-todo`);

        // Create LI
        const newToDo = document.createElement('li');
        newToDo.classList.add('todo-item');
        
        const taskText = document.createElement('span');
        taskText.classList.add('task-text');
        taskText.innerText = todoData.text;

        const taskDateTime = document.createElement('span');
        taskDateTime.classList.add('task-datetime');
        taskDateTime.innerText = `Date: ${todoData.date} | Time: ${todoData.startTime} - ${todoData.endTime}`;

        newToDo.appendChild(taskText);
        newToDo.appendChild(taskDateTime);
        toDoDiv.appendChild(newToDo);

        // check btn;
        const checked = document.createElement('button');
        checked.innerHTML = '<i class="fas fa-check"></i>';
        checked.classList.add("check-btn", `${savedTheme}-button`);
        toDoDiv.appendChild(checked);
        // delete btn;
        const deleted = document.createElement('button');
        deleted.innerHTML = '<i class="fas fa-trash"></i>';
        deleted.classList.add("delete-btn", `${savedTheme}-button`);
        toDoDiv.appendChild(deleted);

        // Append to list;
        toDoList.appendChild(toDoDiv);

        // Set reminders for start and end times for existing todos
        setReminders(todoData);
    });
}


function removeLocalTodos(todo){
    //Check: if item/s are there;
    let todos;
    if(localStorage.getItem('todos') === null) {
        todos = [];
    }
    else {
        todos = JSON.parse(localStorage.getItem('todos'));
    }

    const todoText = todo.querySelector('.task-text').innerText;
    const todoIndex = todos.findIndex(todo => todo.text === todoText);
    // console.log(todoIndex);
    
    // Clear the reminders if they exist
    clearReminders(todoText);
    
    todos.splice(todoIndex, 1);
    // console.log(todos);
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Function to clear both start and end reminders
function clearReminders(todoText) {
    // Clear start reminder
    if (activeReminders.has(`start_${todoText}`)) {
        clearTimeout(activeReminders.get(`start_${todoText}`));
        activeReminders.delete(`start_${todoText}`);
    }
    
    // Clear end reminder
    if (activeReminders.has(`end_${todoText}`)) {
        clearTimeout(activeReminders.get(`end_${todoText}`));
        activeReminders.delete(`end_${todoText}`);
    }
}

// Change theme function:
function changeTheme(color) {
    localStorage.setItem('savedTheme', color);
    savedTheme = localStorage.getItem('savedTheme');

    document.body.className = color;
    // Change blinking cursor for darker theme:
    color === 'darker' ? 
        document.getElementById('title').classList.add('darker-title')
        : document.getElementById('title').classList.remove('darker-title');

    document.querySelector('input').className = `${color}-input`;
    // Change todo color without changing their status (completed or not):
    document.querySelectorAll('.todo').forEach(todo => {
        Array.from(todo.classList).some(item => item === 'completed') ? 
            todo.className = `todo ${color}-todo completed`
            : todo.className = `todo ${color}-todo`;
    });
    // Change buttons color according to their type (todo, check or delete):
    document.querySelectorAll('button').forEach(button => {
        Array.from(button.classList).some(item => {
            if (item === 'check-btn') {
              button.className = `check-btn ${color}-button`;  
            } else if (item === 'delete-btn') {
                button.className = `delete-btn ${color}-button`; 
            } else if (item === 'todo-btn') {
                button.className = `todo-btn ${color}-button`;
            }
        });
    });
}

// Updated to handle both start and end time reminders
function setReminders(todoData) {
    // Clear any existing reminders for this todo
    clearReminders(todoData.text);
    
    // Set start time reminder
    const startTime = new Date(`${todoData.date}T${todoData.startTime}`);
    const now = new Date();
    const timeUntilStart = startTime - now;

    if (timeUntilStart > 0) {
        // Store the start reminder ID
        const startReminderId = setTimeout(() => {
            showReminder(todoData, 'start');
            // Remove from active reminders after showing
            activeReminders.delete(`start_${todoData.text}`);
        }, timeUntilStart);
        
        // Store the reminder with unique key
        activeReminders.set(`start_${todoData.text}`, startReminderId);
    }
    
    // Set end time reminder
    const endTime = new Date(`${todoData.date}T${todoData.endTime}`);
    const timeUntilEnd = endTime - now;
    
    if (timeUntilEnd > 0) {
        // Store the end reminder ID
        const endReminderId = setTimeout(() => {
            showReminder(todoData, 'end');
            // Remove from active reminders after showing
            activeReminders.delete(`end_${todoData.text}`);
        }, timeUntilEnd);
        
        // Store the reminder with unique key
        activeReminders.set(`end_${todoData.text}`, endReminderId);
    }
}

function showReminder(todoData, reminderType) {
    // Create a unique key for this reminder
    const reminderKey = `${reminderType}_${todoData.text}_${todoData.date}_${todoData.startTime}`;
    
    // Check if this reminder has already been shown
    if (shownReminders.has(reminderKey)) {
        return;
    }
    
    let message = '';
    
    if (reminderType === 'start') {
        message = `It's time to start your task: ${todoData.text}`;
    } else if (reminderType === 'end') {
        message = `Time's up for your task: ${todoData.text}`;
    }
    
    // Play sound notification
    playReminderSound(reminderType);
    
    // Try to show notification first
    if (Notification.permission === "granted") {
        new Notification('Task Reminder', {
            body: message,
            icon: 'assets/favicon.png'
        });
    } else {
        // Fallback to alert
        alert(`Reminder: ${message}`);
    }
    
    // Mark this reminder as shown
    shownReminders.add(reminderKey);
    
    // Remove from shown reminders after 1 minute to allow future reminders
    setTimeout(() => {
        shownReminders.delete(reminderKey);
    }, 60000);
}

function playReminderSound(reminderType) {
    if (!canPlaySound) {
        console.log('Sound playback not yet enabled');
        return;
    }
    
    try {
        let soundToPlay;
        
        // Choose the appropriate sound based on reminder type
        if (reminderType === 'start') {
            soundToPlay = startSound.cloneNode();
        } else if (reminderType === 'end') {
            soundToPlay = endSound.cloneNode();
        } else {
            soundToPlay = notificationSound.cloneNode();
        }
        
        // Reset the sound to the beginning
        soundToPlay.currentTime = 0;
        
        // Play the sound
        const playPromise = soundToPlay.play();
        
        // Handle play() promise to avoid uncaught errors
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Sound playback failed:', error);
                // Try to play the notification sound as fallback
                if (reminderType !== 'notification') {
                    notificationSound.cloneNode().play().catch(e => console.log('Fallback sound failed:', e));
                }
            });
        }
    } catch (e) {
        console.log('Error playing sound:', e);
    }
}

// Initialize audio context and sounds after user interaction
function initializeAudio() {
    console.log('Audio initialized after user interaction');
    canPlaySound = true;
    
    try {
        // Create the notification sounds with correct paths
        startSound = new Audio('./assets/start-sound.mp3');
        endSound = new Audio('./assets/end-sound.mp3');
        notificationSound = new Audio('./assets/notification-sound.wav');
        
        // Preload the sounds
        startSound.load();
        endSound.load();
        notificationSound.load();
        
        // Add error handling for sound loading
        [startSound, endSound, notificationSound].forEach(sound => {
            sound.onerror = (e) => {
                console.error('Error loading sound:', e);
                canPlaySound = false;
            };
        });
    } catch (e) {
        console.error('Error initializing audio:', e);
        canPlaySound = false;
    }
}

// Add this at the beginning of the file, after the selectors
document.addEventListener("DOMContentLoaded", () => {
    // Request notification permission
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
    
    // Initialize audio on first user interaction
    document.addEventListener('click', function initAudio() {
        initializeAudio();
        document.removeEventListener('click', initAudio);
    }, { once: true });
    
    // Check for reminders every minute
    setInterval(() => {
        const now = new Date();
        let todos = JSON.parse(localStorage.getItem('todos') || '[]');
        
        todos.forEach(todo => {
            // Check for start time reminders
            const startTime = new Date(`${todo.date}T${todo.startTime}`);
            const timeUntilStart = startTime - now;
            
            // If the start time is within the last minute and hasn't been shown
            if (timeUntilStart > -60000 && timeUntilStart <= 0 && 
                !activeReminders.has(`start_${todo.text}_shown`)) {
                showReminder(todo, 'start');
                // Mark as shown
                activeReminders.set(`start_${todo.text}_shown`, true);
            }
            
            // Check for end time reminders
            const endTime = new Date(`${todo.date}T${todo.endTime}`);
            const timeUntilEnd = endTime - now;
            
            // If the end time is within the last minute and hasn't been shown
            if (timeUntilEnd > -60000 && timeUntilEnd <= 0 && 
                !activeReminders.has(`end_${todo.text}_shown`)) {
                showReminder(todo, 'end');
                // Mark as shown
                activeReminders.set(`end_${todo.text}_shown`, true);
            }
        });
    }, 60000); // Check every minute
});

// Function to preload audio files - simplified to avoid browser autoplay restrictions
function preloadAudioFiles() {
    // We'll create and load audio only after user interaction
    console.log('Audio will be enabled after user interaction');
}