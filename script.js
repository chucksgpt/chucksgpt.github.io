document.addEventListener("DOMContentLoaded", () => {
    // Get references to the HTML elements
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatWindow = document.getElementById('chat-window');
    const sendButton = chatForm.querySelector('button');

    // --- State Variables ---
    let queryCount = 0;
    // REVISED: New random range from 3 to 10
    const chatLimit = Math.floor(Math.random() * 8) + 3; // (0-7) + 3 = 3 to 10

    // Local banks for both APIs to prevent rate-limiting
    let triviaQuestionBank = [];
    let catFactBank = [];

    const harmlessLinks = [
        'https://pointerpointer.com/',
        'https://cat-bounce.com/',
        'https://longdogechallenge.com/',
        'https://checkboxrace.com/',
        'https://pixelsfighting.com/',
        'https://puginarug.com/'
    ];

    // Helper function to pick a random link
    function getRandomLink() {
        return harmlessLinks[Math.floor(Math.random() * harmlessLinks.length)];
    }

    // Helper function to decode HTML entities
    function decodeHtml(html) {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

    // Listen for the user to submit the form
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = userInput.value.trim();
        if (userMessage === '') return;

        appendMessageAsText(userMessage, 'user');
        queryCount++;
        userInput.value = '';
        showTypingIndicator();

        await generateBotResponse();
    });

    // --- Core Bot Logic ---

    async function generateBotResponse() {
        removeTypingIndicator();
        showTypingIndicator();

        if (queryCount >= chatLimit) {
            await endChatSession();
        } else {
            generateNormalResponse();
        }

        removeTypingIndicator();
    }

    function generateNormalResponse() {
        if (Math.random() > 0.5) {
            fetchCatFact();
        } else {
            fetchRandomQuestion();
        }
    }

    // --- API & Data Functions ---

    /**
     * Function 1: Pulls a pre-fetched fact from our local cat bank
     */
    function fetchCatFact() {
        try {
            if (catFactBank.length > 0) {
                const factData = catFactBank.pop(); 
                appendMessageAsText(factData.fact, 'bot');
                setTimeout(() => {
                    appendSourceMessage("The Cat's Meow", getRandomLink());
                }, 600);
            } else { 
                console.error('Cat fact bank is empty.');
                appendMessageAsText("My cat-fact-retriever is napping. Here's one: Cats are liquid.", 'bot');
            }
        } catch (error) { 
            console.error('Error in fetchCatFact:', error);
            appendMessageAsText("My cat-fact-retriever is napping. Here's one: Cats are liquid.", 'bot');
        }
    }

    /**
     * Function 2: Pulls a pre-fetched question from our local bank
     */
    function fetchRandomQuestion() {
        try {
            if (triviaQuestionBank.length > 0) {
                const questionData = triviaQuestionBank.pop(); 
                const questionText = decodeHtml(questionData.question);
                
                appendMessageAsText(questionText, 'bot');
                setTimeout(() => {
                    appendSourceMessage(`Category: ${questionData.category}`, getRandomLink());
                }, 600);
            } else { 
                console.error('Trivia question bank is empty.');
                appendMessageAsText("My question-generator is on strike. Is a hotdog a sandwich? Debate.", 'bot');
            }
        } catch (error) { 
            console.error('Error in fetchRandomQuestion:', error);
            appendMessageAsText("My question-generator is on strike. Is a hotdog a sandwich? Debate.", 'bot');
        }
    }

    /**
     * REVISED - API Function 3: Fetches a random "On This Day" event
     */
    async function endChatSession() {
        try {
            // Generate a random date
            const month = Math.floor(Math.random() * 12) + 1;
            const day = Math.floor(Math.random() * 28) + 1; // Use 28 to be safe for all months

            // NEW API: "On This Day"
            const response = await fetch(`https://byabbe.se/on-this-day/${month}/${day}/events.json`);
            if (!response.ok) throw new Error(`API returned status ${response.status}`);

            const data = await response.json();
            
            // Pick a random event from the list for that day
            const event = data.events[Math.floor(Math.random() * data.events.length)];

            // Build the new excuse
            const excuseText = `Session Terminated. Try again when ${event.description}.`; 

            appendMessageAsText(excuseText, 'bot');
            setTimeout(() => {
                // Use the year of the event as the source
                appendSourceMessage(`Source: The Year ${event.year}`, getRandomLink());
            }, 600);

        } catch (error) {
            console.error('On This Day API failed:', error);
            // Fallback message
            appendMessageAsText("SESSION TERMINATED. Try again when the singularity occurs. Goodbye.", 'bot');
        }

        // Disable the form
        userInput.disabled = true;
        userInput.placeholder = "Session terminated. Try again later.";
        sendButton.disabled = true;
        sendButton.style.backgroundColor = '#aaa';
        sendButton.style.cursor = 'not-allowed';
    }

    // --- Utility Functions (Appending Messages) ---

    function appendMessageAsText(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = message;
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function appendSourceMessage(sourceText, sourceLink) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('bot-source-message');
        messageDiv.innerHTML = `Source: <a href="${sourceLink}" target="_blank" rel="noopener noreferrer">${decodeHtml(sourceText)}</a>`;
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // --- Utility Functions (Typing Indicator) ---

    function showTypingIndicator() {
        if (document.getElementById('typing-indicator')) return;
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.classList.add('message', 'bot-message');
        typingDiv.textContent = 'Processing...';
        chatWindow.appendChild(typingDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingDiv = document.getElementById('typing-indicator');
        if (typingDiv) {
            chatWindow.removeChild(typingDiv);
        }
    }

    // --- Function to pre-load cat facts ---
    async function loadCatFacts() {
        try {
            const response = await fetch('https://catfact.ninja/facts?limit=10');
            if (!response.ok) throw new Error(`API returned status ${response.status}`);
            
            const data = await response.json();
            catFactBank = data.data;
            console.log("Cat fact bank loaded:", catFactBank);

        } catch (error) {
            console.error('Cat Fact API failed on initial load:', error);
        }
    }

// --- Function to pre-load trivia questions ---
    async function loadTriviaQuestions() {
        try {
            const response = await fetch('https://opentdb.com/api.php?amount=10');
            if (!response.ok) throw new Error(`API returned status ${response.status}`);
            
            const data = await response.json();
            triviaQuestionBank = data.results;
            console.log("Trivia question bank loaded:", triviaQuestionBank);

        } catch (error) {
            console.error('Trivia API failed on initial load:', error);
        }
    }

    // --- SCRIPT START ---
    loadTriviaQuestions();
    loadCatFacts();
});