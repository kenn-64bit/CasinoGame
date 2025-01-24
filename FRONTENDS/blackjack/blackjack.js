class MoneyManager {
    constructor(initialBalance = this.balance) {
        this.balance = initialBalance;
        this.transactions = [];
    }

    placeBet(amount) {
        if (amount <= 0) return { success: false, message: "Bet amount must be positive" };
        if (amount > this.balance) return { success: false, message: "Insufficient funds" };

        this.balance -= amount;
        this.logTransaction('bet', amount);
        return { success: true, message: "Bet placed successfully" };
    }

    processWin(betAmount, isBlackjack = false) {
        const multiplier = isBlackjack ? 2.5 : 2.0;
        const winAmount = betAmount * multiplier;
        this.balance += winAmount;
        this.logTransaction(isBlackjack ? 'blackjack' : 'win', winAmount);
    }

    processPush(betAmount) {
        this.balance += betAmount;
        this.logTransaction('push', betAmount);
    }

    logTransaction(type, amount) {
        this.transactions.push({
            type,
            amount,
            balance: this.balance,
            timestamp: new Date().toISOString()
        });
        console.log(`Transaction: ${type}, Amount: $${amount}, New Balance: $${this.balance}`);
    }
}

// Card and Deck Classes
class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        this.name = `${value} of ${suit}`;
        this.score = typeof value === 'number' ? Math.min(value, 10) : 
                     value === 'A' ? 11 : 10;
        
        const valueMap = {
            'A': 'ace',
            'K': 'king',
            'Q': 'queen',
            'J': 'jack'
        };
        this.image = `${valueMap[value] || value}_of_${suit.toLowerCase()}.png`;
    }
}

class Deck {
    constructor() {
        this.reset();
    }

    reset() {
        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
        this.cards = suits.flatMap(suit => 
            values.map(value => new Card(suit, value))
        );
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.length > 0 ? this.cards.pop() : null;
    }
}

class BlackjackGame {
    constructor() {
        this.moneyManager = new MoneyManager(); // Initialize moneyManager
        this.deck = new Deck();
        this.currentBet = 0;
        this.playerHand = [];
        this.dealerHand = [];
        this.gameOver = false;
        this.setupSounds();
        this.setupEventListeners();
    }

    setupSounds() {
        this.dealSound = new Audio('/FRONTENDS/blackjack/sounds/sss.mp3');
        this.winSound = new Audio('/FRONTENDS/blackjack/sounds/win.mp3');
        this.loseSound = new Audio('/FRONTENDS/blackjack/sounds/l.mp3');
        this.betSound = new Audio('/FRONTENDS/blackjack/sounds/.mp3');
        this.hitSound = new Audio('/FRONTENDS/blackjack/sounds/cardDraw.wav');
        this.standSound = new Audio('/FRONTENDS/blackjack/sounds/cardDraw.wav');
    }

    updateBalance(amount, isWin = false) {
        fetch('/update_balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                amount: amount,
                is_win: isWin  // To track if it's a win for total_winnings
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('money').textContent = data.new_balance;
                if (data.total_winnings) {
                    // Update total winnings display if it exists
                    const winningsElement = document.querySelector('.total-winnings');
                    if (winningsElement) {
                        winningsElement.textContent = data.total_winnings;
                    }
                }
            }
        })
        .catch(console.error);
    }

    setupEventListeners() {
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.placeBet(parseInt(chip.dataset.amount));
                this.betSound.play();
            });
        });

        document.getElementById('hit-button').addEventListener('click', () => {
            this.hit();
            this.hitSound.play();
        });
        document.getElementById('stand-button').addEventListener('click', () => {
            this.stand();
            this.standSound.play();
        });
    }

    placeBet(amount) {
        const result = this.moneyManager.placeBet(amount);
        if (result.success) {
            this.currentBet = amount;
            this.updateBalance(-amount); // Deduct the bet amount from the balance
            this.startNewGame();
            this.dealSound.play();
        } else {
            this.showMessage(result.message, 'error');
        }
        this.updateUI();
    }

    startNewGame() {
        this.deck.reset();
        this.playerHand = [this.deck.draw(), this.deck.draw()];
        this.dealerHand = [this.deck.draw(), this.deck.draw()];
        this.gameOver = false;
        
        // Clear and set up initial cards
        const playerCardsDiv = document.getElementById('player-cards');
        const dealerCardsDiv = document.getElementById('dealer-cards');
        
        playerCardsDiv.innerHTML = '';
        dealerCardsDiv.innerHTML = '';
        
        // Add initial cards with animations
        this.playerHand.forEach((card, index) => {
            playerCardsDiv.appendChild(this.createCardElement(card, index));
        });
        
        this.dealerHand.forEach((card, index) => {
            dealerCardsDiv.appendChild(this.createCardElement(card, index, true));
        });
        
        const playerScore = this.calculateScore(this.playerHand);
        document.getElementById('player-score').textContent = playerScore;
        document.getElementById('dealer-score').textContent = this.calculateScore([this.dealerHand[0]]);
        
        if (playerScore === 21) {
            this.moneyManager.processWin(this.currentBet, true);
            this.updateBalance(this.currentBet * 2.5, true); // Update balance with winnings
            this.gameOver = true;
            this.showMessage('Blackjack! You win!', 'win');
            this.winSound.play();
            this.currentBet = 0;
        }
        
        document.getElementById('game-area').classList.remove('hidden');
        document.getElementById('betting-ui').classList.add('hidden');
        document.getElementById('game-message').classList.add('hidden');
    }

    hit() {
        if (this.gameOver) return;
        
        const card = this.deck.draw();
        if (card) {
            this.playerHand.push(card);
            const score = this.calculateScore(this.playerHand);
            
            // Add only the new card with animation
            const playerCardsDiv = document.getElementById('player-cards');
            const cardElement = this.createCardElement(card, this.playerHand.length - 1);
            playerCardsDiv.appendChild(cardElement);
            
            // Update the score
            document.getElementById('player-score').textContent = score;
            
            if (score === 21) {
                this.moneyManager.processWin(this.currentBet, true);
                this.updateBalance(this.currentBet * 2.5, true); // Update balance with winnings
                this.gameOver = true;
                this.showMessage('Blackjack! You win!', 'win');
                this.winSound.play();
                this.currentBet = 0;
                this.updateUI();
            } else if (score > 21) {
                this.gameOver = true;
                this.showMessage('Bust! You lose!', 'lose');
                this.loseSound.play();
                this.currentBet = 0;
                this.updateUI(); 
            }
        }
    }

    stand() {
        if (this.gameOver) return;

        // Reveal dealer's hidden card first
        const dealerCardsDiv = document.getElementById('dealer-cards');
        dealerCardsDiv.innerHTML = '';
        this.dealerHand.forEach((card, index) => {
            dealerCardsDiv.appendChild(this.createCardElement(card, index, false));
        });

        // Draw new cards for dealer 
        while (this.calculateScore(this.dealerHand) < 17) {
            const card = this.deck.draw();
            if (card) {
                this.dealerHand.push(card);
                const cardElement = this.createCardElement(card, this.dealerHand.length - 1, false);
                dealerCardsDiv.appendChild(cardElement);
            }
        }

        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand);
        
        document.getElementById('dealer-score').textContent = dealerScore;

        if (dealerScore > 21) {
            this.moneyManager.processWin(this.currentBet);
            this.updateBalance(this.currentBet * 2, true); // Update balance with winnings
            this.showMessage('Dealer busts! You win!', 'win');
            this.winSound.play();
        } else if (dealerScore > playerScore) {
            this.showMessage('Dealer wins!', 'lose');
            this.loseSound.play();
        } else if (dealerScore < playerScore) {
            this.moneyManager.processWin(this.currentBet);
            this.updateBalance(this.currentBet * 2, true); // Update balance with winnings
            this.showMessage('You win!', 'win');
            this.winSound.play();
        } else {
            this.moneyManager.processPush(this.currentBet);
            this.updateBalance(this.currentBet); // Return the bet amount
            this.showMessage('Push! It\'s a tie!', 'tie');
        }

        this.gameOver = true;
        this.currentBet = 0;
        this.updateUI();
    }

    calculateScore(hand) {
        let score = 0;
        let aces = 0;

        for (const card of hand) {
            if (card.value === 'A') {
                aces += 1;
            } else {
                score += card.score;
            }
        }

        for (let i = 0; i < aces; i++) {
            if (score + 11 <= 21) {
                score += 11;
            } else {
                score += 1;
            }
        }

        return score;
    }

    createCardElement(card, index, isDealer = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        const img = document.createElement('img');
        if (!this.gameOver && isDealer && index === 1) {
            // Fix card back path - using absolute path from FRONTENDS
            img.src = 'FRONTENDS/blackjack/cards/back.png';
            img.alt = 'Card back';
        } else {
            // Fix card images path - using absolute path from FRONTENDS
            img.src = `FRONTENDS/blackjack/cards/${card.image}`;
            img.alt = card.name;
        }
        
        cardDiv.appendChild(img);
        
        
        setTimeout(() => {
            cardDiv.classList.add('dealt');
        }, index * 200);
        
        return cardDiv;
    }

    showMessage(message, type) {
        const modal = document.getElementById('resultModal');
        const content = document.getElementById('resultContent');
        const messageEl = document.getElementById('resultMessage');
        
        // Remove all previous classes
        content.className = 'result-content';
        
        // Add appropriate class based on type
        content.classList.add(`${type}-modal`);
        messageEl.textContent = message;
        
        // Show modal
        modal.style.display = 'block';
        
        // Hide modal after 2 seconds
        setTimeout(() => {
            modal.style.display = 'none';
        }, 2000);
    }

    updateUI() {
        document.getElementById('money').textContent = this.moneyManager.balance;
        
        const currentBetDisplay = document.getElementById('current-bet-display');
        if (this.currentBet > 0) {
            currentBetDisplay.classList.remove('hidden');
            document.getElementById('current-bet').textContent = this.currentBet;
        } else {
            currentBetDisplay.classList.add('hidden');
        }

        if (this.gameOver) {
            document.getElementById('betting-ui').classList.remove('hidden');
            document.getElementById('game-buttons').classList.add('hidden');
        } else if (this.currentBet > 0) {
            document.getElementById('betting-ui').classList.add('hidden');
            document.getElementById('game-area').classList.remove('hidden');
            document.getElementById('game-buttons').classList.remove('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BlackjackGame();
});
