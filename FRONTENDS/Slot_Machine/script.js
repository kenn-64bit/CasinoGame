const ICONS = [
    'Monkey', 'Coin', 'banana', 'Big Win', 'cherry', 'grapes', 'lemon', 'Gorilla', 'orange', 'pear', 'strawberry', 'watermelon',
];

const PAYTABLE = {
    'Monkey': { 2: 5, 3: 10, 4: 20, 5: 50 },
    'Coin': { 2: 5, 3: 10, 4: 20, 5: 50 },
    'banana': { 2: 5, 3: 10, 4: 20, 5: 50 },
    'Big Win': { 2: 50, 3: 100, 4: 200, 5: 500 },
    'cherry': { 2: 5, 3: 10, 4: 20, 5: 50 },
    'grapes': { 2: 5, 3: 10, 4: 20, 5: 50 },
    'lemon': { 2: 5, 3: 10, 4: 20, 5: 50 },
    'Gorilla': { 2: 25, 3: 50, 4: 100, 5: 200 },
    'orange': { 2: 5, 3: 10, 4: 20, 5: 50 },
    'pear': { 2: 5, 3: 10, 4: 20, 5: 50 },
    'strawberry': { 2: 5, 3: 10, 4: 20, 5: 50 },
    'watermelon': { 2: 5, 3: 10, 4: 20, 5: 50 },
};

const PAYLINES = [ 
    [0, 0, 0], // Top row
    [1, 1, 1], // Middle row
    [2, 2, 2], // Bottom row
    [0, 1, 2], // Diagonal top-left to bottom-right
    [2, 1, 0], // Diagonal bottom-left to top-right
];

/**
 * @type {number} The minimum spin time in seconds
 */
const BASE_SPINNING_DURATION = 2.7;

/**
 * @type {number} The additional duration to the base duration for each row (in seconds).
 * It makes the typical effect that the first reel ends, then the second, and so on...
 */
const COLUMN_SPINNING_DURATION = 0.3;

var cols;

window.addEventListener('DOMContentLoaded', function(event) {
    cols = document.querySelectorAll('.col');
    setInitialItems();
    fetchBalance(); // Re-fetch balance from server
});

function fetchBalance() {
    fetch('/get_balance')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('balance-amount').textContent = data.balance;
            } else {
                console.error('Error fetching balance:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching balance:', error);
        });
}

function updateBalance(amount, doDelay = true) {
    fetch('/update_balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (doDelay) {
                setTimeout(() => {
                    document.getElementById('balance-amount').textContent = data.new_balance;
                }, 1000); // Consistent 1 second delay for all updates
            } else {
                document.getElementById('balance-amount').textContent = data.new_balance;
            }
        } else {
            console.error('Error updating balance:', data.message);
        }
    })
    .catch(error => {
        console.error('Error updating balance:', error);
    });
}

function setInitialItems() {
    let baseItemAmount = 40;//

    for (let i = 0; i < cols.length; ++i) {
        let col = cols[i];
        let amountOfItems = baseItemAmount + (i * 3); // Increment the amount for each column
        let elms = '';
        let firstThreeElms = '';

        for (let x = 0; x < amountOfItems; x++) {
            let icon = getRandomIcon();
            let item = '<div class="icon" data-item="' + icon + '"><img src="/FRONTENDS/Slot_Machine/items/' + icon + '.png"></div>';
            elms += item;

            if (x < 3) firstThreeElms += item; // Backup the first three items because the last three must be the same
        }
        col.innerHTML = elms + firstThreeElms;
    }
}

/**
 * Called when the start-button is pressed.
 *
 * @param elem The button itself
 */
var regular = document.getElementById('regularBtn');
var double = document.getElementById('doubleBtn');
var back = document.getElementById('back-button');
function spin(elem) {
    fetchBalance(); // Re-fetch balance from server
    let balance = parseInt(document.getElementById('balance-amount').textContent);
    if (balance < 50 && elem.id === 'regularBtn') {
        alert('You do not have enough balance to spin!');
        regular.setAttribute('disabled', true);
        regular.classList.add('button-disabled');
        return;
    }
    
        if (balance < 100 && elem.id === 'doubleBtn') {
            alert('You do not have enough balance to double your winnings!');
            double.setAttribute('disabled', true);
            double.classList.add('button-disabled');
            return;
        } 

    // Remove old highlights immediately)


    // Play rolling sound
    const rollingSound = document.getElementById('rolling-sound');
    rollingSound.play();
    rollingSound.volume = 0.1;

    let duration = BASE_SPINNING_DURATION + randomDuration();

    // Deduct spin cost via server
    if (elem.id === 'doubleBtn') {
        updateBalance(-100, false);  // Changed to false to update immediately
    } else if (elem.id === 'regularBtn') {
        updateBalance(-50, false);   // Changed to false to update immediately
    }


    for (let col of cols) { // set the animation duration for each column
        duration += COLUMN_SPINNING_DURATION + randomDuration();
        col.style.animationDuration = duration + "s";
    }

    // disable the start-button
    double.setAttribute('disabled', true);
    double.classList.add('button-disabled');
    regular.setAttribute('disabled', true);
    regular.classList.add('button-disabled');
    back.setAttribute('disabled', true);
    back.classList.add('button-disabled');
    
    // set the spinning class so the css animation starts to play
    document.getElementById('container').classList.add('spinning');


    // set the result delayed
    // this would be the right place to request the combination from the server
    window.setTimeout(function() {
        setResult(elem.id);
    }, BASE_SPINNING_DURATION * 1000 / 2);

    window.setTimeout(function () {
        // after the spinning is done, remove the class and enable the button again
        document.getElementById('container').classList.remove('spinning');
        double.removeAttribute('disabled', true);
        double.classList.remove('button-disabled');
        regular.removeAttribute('disabled', true);
        regular.classList.remove('button-disabled');
        back.removeAttribute('disabled', true);
        back.classList.remove('button-disabled');
    }.bind(elem), duration * 1000);
}

function setResult(clickedId) {
    let results = [];
    for (let col of cols) {
        // generate 3 random items
        let colResults = [
            getRandomIcon(),
            getRandomIcon(),
            getRandomIcon()
        ];
        results.push(colResults);

        let icons = col.querySelectorAll('.icon img');
        // replace the first and last three items of each column with the generated items
        for (let x = 0; x < 3; x++) {
            icons[x].setAttribute('src', '/FRONTENDS/Slot_Machine/items/' + colResults[x] + '.png');
            icons[(icons.length - 3) + x].setAttribute('src', '/FRONTENDS/Slot_Machine/items/' + colResults[x] + '.png');
        }
    }

    // Determine winnings
    let { totalWinnings, winningCombos, winningPositions } = calculateWinnings(results, clickedId);  // Pass clickedId

    // Calculate final winnings and update balance only ONCE
    let finalWinnings = (clickedId === 'doubleBtn') ? totalWinnings * 2 : totalWinnings;
    // Remove this line since we're already deducting the cost in spin()
    // if (finalWinnings > 0) updateBalance(finalWinnings, true);

    displayMessage(finalWinnings, winningCombos, clickedId);
    highlightWins(winningPositions, totalWinnings);
}

function calculateWinnings(results, clickedId) {
    let totalWinnings = 0;
    let winningCombos = [];
    let winningPositions = [];


    for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 3; row++) {
            let symbol = results[col][row];
            
            if (col + 1 < 5 && results[col + 1][row] === symbol) {
                // At least a pair
                let count = 2;
                if (col + 2 < 5 && results[col + 2][row] === symbol) {
                    count = 3;
                }
                if (PAYTABLE[symbol] && PAYTABLE[symbol][count]) {
                    let amount = PAYTABLE[symbol][count];
                    totalWinnings += amount;
                    winningCombos.push(`Found ${count} of ${symbol} horizontally for $${amount}`);
                    let positions = [];
                    for (let i = 0; i < count; i++) {
                        positions.push({ col: col + i, row });
                    }
                    winningPositions.push(...positions);
                }
            }

            // Down check (row+1, row+2)
            if (row + 1 < 3 && results[col][row + 1] === symbol) {
                let count = 2;
                if (row + 2 < 3 && results[col][row + 2] === symbol) {
                    count = 3;
                }
                if (PAYTABLE[symbol] && PAYTABLE[symbol][count]) {
                    let amount = PAYTABLE[symbol][count];
                    totalWinnings += amount;
                    winningCombos.push(`Found ${count} of ${symbol} vertically for $${amount}`);
                    let positions = [];
                    for (let i = 0; i < count; i++) {
                        positions.push({ col, row: row + i });
                    }
                    winningPositions.push(...positions);
                }
            }

            // Diagonal down-right check
            if (col + 1 < 5 && row + 1 < 3 && results[col + 1][row + 1] === symbol) {
                let count = 2;
                if (col + 2 < 5 && row + 2 < 3 && results[col + 2][row + 2] === symbol) {
                    count = 3;
                }
                if (PAYTABLE[symbol] && PAYTABLE[symbol][count]) {
                    let amount = PAYTABLE[symbol][count];
                    totalWinnings += amount;
                    winningCombos.push(`Found ${count} of ${symbol} diagonally for $${amount}`);
                    let positions = [];
                    for (let i = 0; i < count; i++) {
                        positions.push({ col: col + i, row: row + i });
                    }
                    winningPositions.push(...positions);
                }
            }

            // Diagonal down-left check
            if (col - 1 >= 0 && row + 1 < 3 && results[col - 1][row + 1] === symbol) {
                let count = 2;
                if (col - 2 >= 0 && row + 2 < 3 && results[col - 2][row + 2] === symbol) {
                    count = 3;
                }
                if (PAYTABLE[symbol] && PAYTABLE[symbol][count]) {
                    let amount = PAYTABLE[symbol][count];
                    totalWinnings += amount;
                    winningCombos.push(`Found ${count} of ${symbol} diagonally for $${amount}`);
                    let positions = [];
                    for (let i = 0; i < count; i++) {
                        positions.push({ col: col - i, row: row + i });
                    }
                    winningPositions.push(...positions);
                }
            }
        }
    }

    if (totalWinnings > 0) {
        let finalAmount = (clickedId === 'doubleBtn') ? totalWinnings * 2 : totalWinnings;
        
        fetch('/update_balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: finalAmount })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setTimeout(() => {
                    document.getElementById('balance-amount').textContent = data.new_balance;
                }, 2700); // Delay only the winning update
            }
        })
        .catch(console.error);
    }

    return { totalWinnings, winningCombos, winningPositions };
}

// Display the win/loss message in the sidebar
function displayMessage(winnings, combos, napindot) {
    const messagesEl = document.getElementById('messages');
    if (!messagesEl) return;
    setTimeout(() => {
        if (winnings > 0) {
            if (napindot === 'doubleBtn') {
                messagesEl.innerHTML = `You won $${winnings}! (x2)<br>`;
            } else {
                messagesEl.innerHTML = `You won $${winnings}!<br>`;
            }
            if (combos.length) {
                messagesEl.innerHTML += '<ul>';
                combos.forEach(c => {
                    messagesEl.innerHTML += `<li>${c}</li>`;
                });
                messagesEl.innerHTML += '</ul>';
            }
        } else {
            messagesEl.textContent = "No winning combination this time.";
        }
    }, 2700); // Delay the message display by 1 second
}

function getRandomIcon() {
    return ICONS[Math.floor(Math.random() * ICONS.length)];
}

/**
 * @returns {number} 0.00 to 0.09 inclusive 
 */
function randomDuration() {
    return Math.floor(Math.random() * 10) / 100;
}

// Highlight each winning icon
function highlightWins(winningPositions, totalWinnings) {
    // Remove old highlights (removed from here)
    setTimeout(() => {
        winningPositions.forEach(pos => {
            let colEl = document.querySelectorAll('.outer-col')[pos.col];
            if (!colEl) return;
            let iconEls = colEl.querySelectorAll('.icon');
            if (iconEls[pos.row]) {
                iconEls[pos.row].classList.add('highlight');
            }
        });
    }, 1000); // Add a slight delay before applying the highlight class

    // Play different parts of the winning sound based on the value of the winnings
    setTimeout(() => {
        const winningSound = document.getElementById('winning-sound');
        if (totalWinnings <= 0) {
            winningSound.currentTime = 15; // 0sec
        } else if (totalWinnings < 10) {
            winningSound.currentTime = 0; // 0sec
        } else if (totalWinnings < 20) {
            winningSound.currentTime = 2.5; // 2sec
        } else if (totalWinnings < 30) {
            winningSound.currentTime = 4.5; // 5sec
        } else if (totalWinnings < 50) {
            winningSound.currentTime = 7.5; // 5sec
        } else {
            winningSound.currentTime = 10; // n10sec
        }
        winningSound.play();
        // WAITING SA SOUND
        setTimeout(() => {
            winningSound.pause();
        }, 2200);
    }, 2000);


    // Ensure highlights stay for 5 seconds
    setTimeout(() => {
        document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
    }, 10000);
}