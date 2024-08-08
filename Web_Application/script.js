document.getElementById('send-button').addEventListener('click', function() {
    sendMessage();
});

document.getElementById('graph-button').addEventListener('click', function() {
    requestEquation();
});

document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (document.getElementById('chat-input').getAttribute('data-mode') === 'equation') {
            graphEquation('user');
        } else {
            sendMessage();
        }
    }
});

function sendMessage() {
    const inputField = document.getElementById('chat-input');
    const message = inputField.value.trim();
    
    if (message) {
        displayMessage(message, 'user');
        inputField.value = '';

        // Make API request to backend
        fetch('http://127.0.0.1:5000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            displayMessage(data.response, 'bot');
        })
        .catch(error => {
            console.error('Error:', error);
            displayMessage('An error occurred while processing your request.', 'bot');
        });
    }
}

function displayMessage(message, sender) {
    const chatWindow = document.getElementById('chat-window');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    
    // Split the message by newlines and create paragraph elements
    const paragraphs = message.split('\n').filter(line => line.trim() !== '');
    paragraphs.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        messageElement.appendChild(p);
    });

    chatWindow.appendChild(messageElement);
    
    // Scroll to the bottom of the chat window
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function requestEquation() {
    displayMessage("Please enter an equation to graph (e.g., y = 2x):", 'bot');
    document.getElementById('chat-input').setAttribute('data-mode', 'equation');
}

function graphEquation(sender) {
    const inputField = document.getElementById('chat-input');
    const equation = inputField.value.trim();
    
    if (equation) {
        displayMessage(`Graphing equation: ${equation}`, sender);
        inputField.value = '';

        // Create graph container
        const graphContainer = document.createElement('div');
        graphContainer.classList.add('graph-container', sender);
        const canvas = document.createElement('canvas');
        graphContainer.appendChild(canvas);

        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender, 'graph');
        messageElement.appendChild(graphContainer);
        document.getElementById('chat-window').appendChild(messageElement);

        // Scroll to the bottom of the chat window
        const chatWindow = document.getElementById('chat-window');
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // Generate data points and create the graph
        try {
            const data = generateDataPoints(equation);
            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: data.map(point => point.x),
                    datasets: [{
                        label: equation,
                        data: data.map(point => point.y),
                        borderColor: 'rgb(75, 192, 192)',
                        fill: false,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom'
                        },
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            displayMessage(`Error: ${error.message}`, 'bot');
        }

        // Reset input mode
        inputField.removeAttribute('data-mode');
    }
}

function generateDataPoints(equation) {
    const points = [];
    const parsedEquation = equation.split('=');
    
    if (parsedEquation.length !== 2) {
        throw new Error("Invalid equation format. Use the format 'y = expression'.");
    }
    
    const expression = math.parse(parsedEquation[1]);
    const compiledExpression = expression.compile();

    for (let x = -10; x <= 10; x += 0.25) {
        try {
            const y = compiledExpression.evaluate({x});
            points.push({x, y});
        } catch (error) {
            console.error('Error calculating point:', error);
            throw new Error("Failed to calculate points for the equation.");
        }
    }

    return points;
}