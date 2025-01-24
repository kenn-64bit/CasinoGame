from flask import Flask, render_template, session, redirect, url_for, flash
import random
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Tuple
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

# Money Management System
class TransactionType(Enum):
    BET = "bet"
    WIN = "win"
    BLACKJACK = "blackjack"
    PUSH = "push"

@dataclass
class Transaction:
    amount: float
    type: TransactionType
    current_balance: float
    timestamp: str

class MoneyManager:
    def __init__(self, initial_balance: float = 1000.0):
        self.balance = initial_balance
        self.transactions = []
        self._setup_logging()

    def _setup_logging(self):
        self.logger = logging.getLogger('money_manager')
        self.logger.setLevel(logging.INFO)
        if not self.logger.handlers:
            handler = logging.FileHandler('money_transactions.log')
            formatter = logging.Formatter('%(asctime)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

    def place_bet(self, amount: float) -> Tuple[bool, str]:
        if amount <= 0:
            return False, "Bet amount must be positive"
        
        if amount > self.balance:
            return False, "Insufficient funds"
        
        self.balance -= amount
        self._log_transaction(amount, TransactionType.BET)
        return True, "Bet placed successfully"

    def process_win(self, bet_amount: float, is_blackjack: bool = False) -> None:
        multiplier = 2.5 if is_blackjack else 2.0
        win_amount = bet_amount * multiplier
        self.balance += win_amount
        
        transaction_type = TransactionType.BLACKJACK if is_blackjack else TransactionType.WIN
        self._log_transaction(win_amount, transaction_type)

    def process_push(self, bet_amount: float) -> None:
        self.balance += bet_amount
        self._log_transaction(bet_amount, TransactionType.PUSH)

    def get_balance(self) -> float:
        return self.balance

    def _log_transaction(self, amount: float, transaction_type: TransactionType) -> None:
        transaction = Transaction(
            amount=amount,
            type=transaction_type,
            current_balance=self.balance,
            timestamp=datetime.utcnow().isoformat()
        )
        
        self.transactions.append(transaction)
        self.logger.info(
            f"Transaction: {transaction_type.value}, Amount: ${amount:.2f}, "
            f"New Balance: ${self.balance:.2f}"
        )

# Initialize money manager
money_manager = MoneyManager()

class Card:
    def __init__(self, suit, value):
        self.suit = suit
        self.value = value
        self.name = f"{value} of {suit}"
        self.score = min(value if isinstance(value, int) else 10 if value != 'A' else 11, 10)
      
        value_map = {
            'A': 'ace',
            'K': 'king',
            'Q': 'queen',
            'J': 'jack'
        }
        self.image = f"{value_map.get(str(value), str(value)).lower()}_of_{suit.lower()}.png"

class Deck:
    def __init__(self):
        suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades']
        values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A']
        self.cards = [Card(suit, value) for suit in suits for value in values]
        random.shuffle(self.cards)

    def draw(self):
        if len(self.cards) > 0:
            return self.cards.pop()
        return None

def calculate_score(cards):
    score = 0
    aces = 0
    
    for card in cards:
        if card.value == 'A':
            aces += 1
        else:
            score += card.score
    
    for _ in range(aces):
        if score + 11 <= 21:
            score += 11
        else:
            score += 1
    
    return score

@app.route('/')
def index():
    return render_template('blackjack.html', 
                         game_state=session.get('game_state', None),
                         money=money_manager.get_balance(),
                         current_bet=session.get('current_bet', 0))

@app.route('/place_bet/<int:amount>')
def place_bet(amount):
    success, message = money_manager.place_bet(float(amount))
    
    if not success:
        flash(message)
        return redirect(url_for('index'))
    
    session['current_bet'] = amount
    return redirect(url_for('new_game'))

@app.route('/new_game')
def new_game():
    if 'current_bet' not in session or session['current_bet'] <= 0:
        flash('Please place a bet first!')
        return redirect(url_for('index'))
    
    deck = Deck()
    session['deck'] = [(card.suit, card.value, card.image) for card in deck.cards]
    
    player_cards = [deck.draw(), deck.draw()]
    dealer_cards = [deck.draw(), deck.draw()]
    
    session['game_state'] = {
        'player_cards': [(card.suit, card.value, card.image) for card in player_cards],
        'dealer_cards': [(card.suit, card.value, card.image) for card in dealer_cards],
        'deck': [(card.suit, card.value, card.image) for card in deck.cards],
        'game_over': False,
        'message': '',
        'player_score': calculate_score(player_cards),
        'dealer_score': calculate_score([dealer_cards[0]])
    }
    
    if calculate_score(player_cards) == 21:
        money_manager.process_win(session['current_bet'], is_blackjack=True)
        session['game_state']['message'] = 'Blackjack! You win!'
        session['game_state']['game_over'] = True
        session['current_bet'] = 0
        
    return redirect(url_for('index'))

@app.route('/hit')
def hit():
    if 'game_state' not in session or session['game_state']['game_over']:
        return redirect(url_for('new_game'))
    
    game_state = session['game_state']
    
    deck = Deck()
    deck.cards = []
    for suit, value, _ in game_state['deck']:
        card = Card(suit, value)
        deck.cards.append(card)
    
    player_cards = []
    for suit, value, _ in game_state['player_cards']:
        card = Card(suit, value)
        player_cards.append(card)
    
    new_card = deck.draw()
    if new_card:
        player_cards.append(new_card)
        player_score = calculate_score(player_cards)
        
        if player_score > 21:
            game_state['game_over'] = True
            game_state['message'] = 'Bust! You lose!'
            session['current_bet'] = 0
        
        game_state['player_cards'] = [(card.suit, card.value, card.image) for card in player_cards]
        game_state['deck'] = [(card.suit, card.value, card.image) for card in deck.cards]
        game_state['player_score'] = player_score
        session['game_state'] = game_state
    
    return redirect(url_for('index') + '?action=hit')

@app.route('/stand')
def stand():
    if 'game_state' not in session or session['game_state']['game_over']:
        return redirect(url_for('new_game'))
    
    game_state = session['game_state']
    
    deck = Deck()
    deck.cards = []
    for suit, value, _ in game_state['deck']:
        card = Card(suit, value)
        deck.cards.append(card)
    
    dealer_cards = []
    for suit, value, _ in game_state['dealer_cards']:
        card = Card(suit, value)
        dealer_cards.append(card)
    
    dealer_score = calculate_score(dealer_cards)
    while dealer_score < 17:
        new_card = deck.draw()
        if new_card:
            dealer_cards.append(new_card)
            dealer_score = calculate_score(dealer_cards)
    
    player_score = game_state['player_score']
    
    if dealer_score > 21:
        game_state['message'] = 'Dealer busts! You win!'
        money_manager.process_win(session['current_bet'])
    elif dealer_score > player_score:
        game_state['message'] = 'Dealer wins!'
    elif dealer_score < player_score:
        game_state['message'] = 'You win!'
        money_manager.process_win(session['current_bet'])
    else:
        game_state['message'] = 'Push! It\'s a tie!'
        money_manager.process_push(session['current_bet'])
    
    game_state['game_over'] = True
    game_state['dealer_cards'] = [(card.suit, card.value, card.image) for card in dealer_cards]
    game_state['dealer_score'] = dealer_score
    game_state['deck'] = [(card.suit, card.value, card.image) for card in deck.cards]
    session['game_state'] = game_state
    session['current_bet'] = 0
    
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
