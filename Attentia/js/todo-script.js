/**
 * todo-script.js
 * Handles the logic for the To-Do List page.
 */

document.addEventListener('DOMContentLoaded', () => {
    const inputBox = document.getElementById('input-box');
    const listContainer = document.getElementById('list-container');
    const addBtn = document.getElementById('add-btn');
    const submitBtn = document.getElementById('submit-btn');

    // Custom Select Elements
    const customSelectWrapper = document.querySelector('.custom-select-wrapper');
    const selectedOption = document.querySelector('.selected-option');
    const optionsList = document.querySelector('.options-list');
    const options = document.querySelectorAll('.options-list li');
    const hiddenSelect = document.getElementById('difficulty-select');

    // --- Custom Select Logic ---
    console.log('Initializing Custom Select Logic');
    if (selectedOption) {
        selectedOption.addEventListener('click', () => {
            console.log('Selected option clicked');
            customSelectWrapper.classList.toggle('active');
            console.log('Active class toggled:', customSelectWrapper.classList.contains('active'));
        });
    } else {
        console.error('selectedOption element not found');
    }

    options.forEach(option => {
        option.addEventListener('click', () => {
            console.log('Option clicked:', option.getAttribute('data-value'));
            const value = option.getAttribute('data-value');
            const text = option.textContent;

            // Update visible selection
            selectedOption.querySelector('span').textContent = text;
            selectedOption.setAttribute('data-value', value);

            // Update hidden select
            hiddenSelect.value = value;

            // Close dropdown
            customSelectWrapper.classList.remove('active');
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (customSelectWrapper && !customSelectWrapper.contains(e.target)) {
            customSelectWrapper.classList.remove('active');
        }
    });

    // --- Task Management ---

    function loadTasks() {
        const tasks = AttentiaCore.getTasks();
        listContainer.innerHTML = '';
        tasks.forEach(task => {
            renderTask(task);
        });
    }

    function renderTask(task) {
        const li = document.createElement('li');
        if (task.checked) {
            li.classList.add('checked');
        }

        // Difficulty Badge
        const badge = document.createElement('span');
        badge.classList.add('difficulty-badge', task.difficulty);
        badge.textContent = task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1);

        // Task Text
        const textSpan = document.createElement('span');
        textSpan.textContent = task.text;
        textSpan.classList.add('task-text');

        // Delete Button
        const span = document.createElement('span');
        span.innerHTML = '\u00d7'; // Multiplication sign (x)
        span.classList.add('close-btn');

        li.appendChild(badge);
        li.appendChild(textSpan);
        li.appendChild(span);
        listContainer.appendChild(li);
    }

    function addTask() {
        if (inputBox.value === '') {
            alert("You must write something!");
            return;
        }

        const taskText = inputBox.value;
        const difficulty = selectedOption.getAttribute('data-value');

        const task = {
            text: taskText,
            difficulty: difficulty,
            checked: false,
            id: Date.now() // Simple ID
        };

        renderTask(task);
        saveData();
        inputBox.value = '';
    }

    addBtn.addEventListener('click', addTask);

    // Allow Enter key to add task
    inputBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    listContainer.addEventListener('click', function (e) {
        // Check for delete button first
        if (e.target.tagName === 'SPAN' && e.target.classList.contains('close-btn')) {
            e.target.parentElement.remove();
            saveData();
            return;
        }

        // Check for difficulty badge toggle
        if (e.target.classList.contains('difficulty-badge')) {
            const badge = e.target;
            const currentDifficulty = badge.classList.contains('easy') ? 'easy' :
                badge.classList.contains('medium') ? 'medium' : 'hard';

            let nextDifficulty;
            if (currentDifficulty === 'easy') nextDifficulty = 'medium';
            else if (currentDifficulty === 'medium') nextDifficulty = 'hard';
            else nextDifficulty = 'easy';

            // Update classes
            badge.classList.remove('easy', 'medium', 'hard');
            badge.classList.add(nextDifficulty);

            // Update text
            badge.textContent = nextDifficulty.charAt(0).toUpperCase() + nextDifficulty.slice(1);

            saveData();
            return;
        }

        // Check for list item toggle
        if (e.target.tagName === 'LI' || e.target.closest('li')) {
            const li = e.target.tagName === 'LI' ? e.target : e.target.closest('li');
            li.classList.toggle('checked');

            if (li.classList.contains('checked')) {
                triggerConfetti();
            }

            saveData();
        }
    }, false);

    function saveData() {
        const tasks = [];
        const listItems = listContainer.querySelectorAll('li');

        listItems.forEach(li => {
            const text = li.querySelector('.task-text').textContent;
            const difficultyClass = li.querySelector('.difficulty-badge').classList[1]; // easy, medium, hard
            const isChecked = li.classList.contains('checked');

            tasks.push({
                text: text,
                difficulty: difficultyClass,
                checked: isChecked
            });
        });

        AttentiaCore.saveTasks(tasks);
    }

    function triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    // Submit button (Manual Save / Sync visual feedback)
    submitBtn.addEventListener('click', () => {
        saveData();
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saved!';
        submitBtn.style.backgroundColor = '#4caf50';

        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.backgroundColor = '';
        }, 2000);
    });

    // Initial Load
    loadTasks();
});
