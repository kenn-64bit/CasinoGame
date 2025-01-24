from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import sqlite3
from datetime import datetime, date

class flaskapp:
    def __init__(self):
        self.app = Flask(__name__, template_folder='../FRONTENDS', static_folder='../FRONTENDS')
        self.app.secret_key = 'Ojac'
        self.register_routes()

    @staticmethod
    def get_db_connection():
        conn = sqlite3.connect('instance/users.db')
        conn.row_factory = sqlite3.Row
        return conn

    def register_routes(self):
        @self.app.route('/')
        def home():
            return render_template('Website/index.html')

        @self.app.route('/signup', methods=['GET', 'POST'])
        def signup():
            if request.method == 'POST':
                username = request.form['username']
                password = request.form['password']
                birthdate_str = request.form['birthdate']
                birthdate = datetime.strptime(birthdate_str, '%Y-%m-%d').date()
                if len(password) < 5:
                    flash('Password must be at least 5 characters long.', 'danger')
                    return redirect(url_for('signup'))
                if birthdate > date(2010, 1, 1):
                    flash('You must be at least 15 years old to sign up.', 'danger')
                    return redirect(url_for('signup'))
                if birthdate < date(1900, 1, 1):
                    flash('You must be at most 122 years old to sign up?', 'danger')
                    return redirect(url_for('signup'))

                conn = self.get_db_connection()
                existing_user = conn.execute('SELECT * FROM user WHERE username = ?', (username,)).fetchone()
                if existing_user:
                    flash('Username already taken.', 'danger')
                    conn.close()
                    return redirect(url_for('signup'))

                conn.execute('INSERT INTO user (username, password, birthdate, money) VALUES (?, ?, ?, ?)',
                             (username, password, birthdate, 1000))
                conn.commit()
                conn.close()
                flash('Signup successful!', 'success')
                return redirect(url_for('login'))
            return render_template('signup.html')

        @self.app.route('/login', methods=['GET', 'POST'])
        def login():
            if request.method == 'POST':
                username = request.form['username']
                password = request.form['password']
                conn = self.get_db_connection()
                user = conn.execute('SELECT * FROM user WHERE username = ? AND password = ?', (username, password)).fetchone()
                conn.close()
                if username == 'admin' and password == '123':
                    session['admin'] = True
                    return redirect(url_for('admin_page'))
                if user:
                    session['user_id'] = user['id']
                    flash('Login successful!', 'success')
                    return redirect(url_for('dashboard'))
                else:
                    flash('Invalid credentials.', 'danger')
            else:
                session.clear()
            return render_template('login.html')

        @self.app.route('/logout')
        def logout():
            session.clear()
            flash('You have been logged out.', 'success')
            return redirect(url_for('login'))

        @self.app.route('/dashboard')
        def dashboard():
            if 'user_id' not in session:
                flash('Please log in to access this page.', 'danger')
                return redirect(url_for('login'))
            user_id = session['user_id']
            conn = self.get_db_connection()
            user = conn.execute('SELECT * FROM user WHERE id = ?', (user_id,)).fetchone()
            conn.close()
            return render_template('dashboard.html', user=user)

        @self.app.route('/userList')
        def userList():
            conn = self.get_db_connection()
            users = conn.execute('SELECT * FROM user').fetchall()
            conn.close()
            return render_template('userList.html', users=users)

        @self.app.route('/admin_page')
        def admin_page():
            if 'admin' not in session:
                flash('Please log in as admin to access this page.', 'danger')
                return redirect(url_for('login'))
            conn = self.get_db_connection()
            users = conn.execute('SELECT * FROM user').fetchall()
            conn.close()
            return render_template('admin.html', users=users)

        @self.app.route('/slot_machine')
        def slot_machine():
            if 'user_id' not in session:
                flash('Please log in to access this page.', 'danger')
                return redirect(url_for('login'))
            user_id = session['user_id']
            conn = self.get_db_connection()
            user = conn.execute('SELECT * FROM user WHERE id = ?', (user_id,)).fetchone()
            conn.close()
            return render_template('Slot_Machine/Slot.html', user=user)

        @self.app.route('/profile')
        def profile():
            if 'user_id' not in session:
                flash('Please log in to access this page.', 'danger')
                return redirect(url_for('login'))
            user_id = session['user_id']
            conn = self.get_db_connection()
            user = conn.execute('SELECT * FROM user WHERE id = ?', (user_id,)).fetchone()
            conn.close()
            return render_template('profile.html', user=user)

        @self.app.route('/blackjack')
        def blackjack():
            if 'user_id' not in session:
                flash('Please log in to access this page.', 'danger')
                return redirect(url_for('login'))
            user_id = session['user_id']
            conn = self.get_db_connection()
            user = conn.execute('SELECT * FROM user WHERE id = ?', (user_id,)).fetchone()
            conn.close()
            return render_template('blackjack/index.html', user=user)

        @self.app.route('/delete_user/<int:id>', methods=['POST'])
        def delete_user(id):
            conn = self.get_db_connection()
            conn.execute('DELETE FROM user WHERE id = ?', (id,))  # Corrected table name
            conn.commit()
            return redirect(url_for('userList'))  # Corrected redirect route

        @self.app.route('/roulette')
        def roulette():
            if 'user_id' not in session:
                flash('Please log in to access this page.', 'danger')
                return redirect(url_for('login'))
            user_id = session['user_id']
            conn = self.get_db_connection()
            user = conn.execute('SELECT * FROM user WHERE id = ?', (user_id,)).fetchone()
            conn.close()
            return render_template('Roulette/roulette.html', user=user)
        
        @self.app.route('/color_game')
        def color_game():
            if 'user_id' not in session:
                flash('Please log in to access this page.', 'danger')
                return redirect(url_for('login'))
            user_id = session['user_id']
            conn = self.get_db_connection()
            user = conn.execute('SELECT * FROM user WHERE id = ?', (user_id,)).fetchone()
            conn.close()
            return render_template('ColorGame/v1.1/v1.1/ColorShowdown.html', user=user)
        
        
        @self.app.route('/get_balance')
        def get_balance():
            if 'user_id' not in session:
                return jsonify(success=False, message="Forbidden"), 403
            user_id = session['user_id']
            conn = self.get_db_connection()
            user = conn.execute('SELECT money FROM user WHERE id = ?', (user_id,)).fetchone()
            conn.close()
            if user:
                return jsonify(success=True, balance=user['money']), 200
            else:
                return jsonify(success=False, message="User not found"), 404

        @self.app.route('/update_balance', methods=['POST'])
        def update_balance():
            if 'user_id' not in session:
                return jsonify(success=False, message="Forbidden"), 403
            user_id = session['user_id']
            conn = self.get_db_connection()
            user = conn.execute('SELECT * FROM user WHERE id = ?', (user_id,)).fetchone()
            amount = int(request.json.get('amount', 0))
            is_win = request.json.get('is_win', False)
            is_topup = request.json.get('is_topup', False)
            if not is_topup and user['money'] + amount < 0:
                conn.close()
                return jsonify(success=False, message="Insufficient funds"), 400
            new_balance = user['money'] + amount
            new_total_winnings = user['total_winnings'] + amount if is_win else user['total_winnings']
            conn.execute('UPDATE user SET money = ?, total_winnings = ? WHERE id = ?', (new_balance, new_total_winnings, user_id))
            conn.commit()
            conn.close()
            return jsonify(success=True, new_balance=new_balance, total_winnings=new_total_winnings), 200

        @self.app.route('/update_roulette_balance', methods=['POST'])
        def update_roulette_balance():
            if 'user_id' not in session:
                return jsonify(success=False, message="Forbidden"), 403
            
            user_id = session['user_id']
            amount = int(request.json.get('amount', 0))
            is_win = request.json.get('is_win', False)
            
            conn = self.get_db_connection()
            user = conn.execute('SELECT money, total_winnings FROM user WHERE id = ?', (user_id,)).fetchone()
            
            if user:
                new_balance = user['money'] + amount
                new_total_winnings = user['total_winnings'] + amount if is_win else user['total_winnings']
                if new_balance >= 0:
                    conn.execute('UPDATE user SET money = ?, total_winnings = ? WHERE id = ?', (new_balance, new_total_winnings, user_id))
                    conn.commit()
                    conn.close()
                    return jsonify(success=True, new_balance=new_balance, total_winnings=new_total_winnings), 200
                else:
                    conn.close()
                    return jsonify(success=False, message="Insufficient funds"), 400
            else:
                conn.close()
                return jsonify(success=False, message="User not found"), 404

        @self.app.route('/update_color_game_balance', methods=['POST'])
        def update_color_game_balance():
            if 'user_id' not in session:
                return jsonify(success=False, message="Forbidden"), 403
            
            user_id = session['user_id']
            amount = int(request.json.get('amount', 0))
            is_win = request.json.get('is_win', False)
            
            conn = self.get_db_connection()
            user = conn.execute('SELECT money, total_winnings FROM user WHERE id = ?', (user_id,)).fetchone()
            
            if user:
                new_balance = user['money'] + amount
                new_total_winnings = user['total_winnings'] + amount if is_win else user['total_winnings']
                if new_balance >= 0:
                    conn.execute('UPDATE user SET money = ?, total_winnings = ? WHERE id = ?', (new_balance, new_total_winnings, user_id))
                    conn.commit()
                    conn.close()
                    return jsonify(success=True, new_balance=new_balance, total_winnings=new_total_winnings), 200
                else:
                    conn.close()
                    return jsonify(success=False, message="Insufficient funds"), 400
            else:
                conn.close()
                return jsonify(success=False, message="User not found"), 404

        @self.app.route('/leaderboard')
        def leaderboard():
            conn = self.get_db_connection()
            rank = conn.execute('SELECT username, total_winnings FROM user ORDER BY total_winnings DESC LIMIT 5').fetchall()
            conn.close()
            return jsonify(success=True, rank=[dict(row) for row in rank])

        @self.app.route('/update_profile', methods=['POST'])
        def update_profile():
            if 'user_id' not in session:
                return jsonify(success=False, message="Forbidden"), 403
            user_id = session['user_id']
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
            birthdate = data.get('birthdate')

            # Validate password length
            if len(password) < 5:
                return jsonify(success=False, message="Password must be at least 5 characters long."), 400

            # Validate birthdate
            try:
                birthdate_obj = datetime.strptime(birthdate, '%Y-%m-%d').date()
            except ValueError:
                return jsonify(success=False, message="Invalid birthdate format."), 400

            today = date.today()
            age = today.year - birthdate_obj.year - ((today.month, today.day) < (birthdate_obj.month, birthdate_obj.day))
            if age < 15:
                return jsonify(success=False, message="You must be at least 15 years old to sign up."), 400
            if age > 122:
                return jsonify(success=False, message="You must be at most 122 years old to sign up."), 400

            conn = self.get_db_connection()
            existing_user = conn.execute(
                'SELECT * FROM user WHERE username = ? AND id != ?', 
                (username, user_id)
            ).fetchone()
            if existing_user:
                conn.close()
                return jsonify(success=False, message="Username already taken."), 400

            conn.execute(
                'UPDATE user SET username = ?, password = ?, birthdate = ? WHERE id = ?',
                (username, password, birthdate, user_id)
            )
            conn.commit()
            conn.close()
            return jsonify(success=True, message="Profile updated successfully")

        @self.app.route('/get_user/<int:id>')
        def get_user(id):
            if 'admin' not in session:
                return jsonify(success=False, message="Forbidden"), 403
            conn = self.get_db_connection()
            user = conn.execute('SELECT * FROM user WHERE id = ?', (id,)).fetchone()
            conn.close()
            if user:
                return jsonify(success=True, user=dict(user)), 200
            else:
                return jsonify(success=False, message="User not found"), 404

        @self.app.route('/admin/update_user/<int:id>', methods=['POST'])
        def update_user(id):
            if 'admin' not in session:
                return jsonify(success=False, message="Forbidden"), 403
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
            birthdate = data.get('birthdate')

            # Validate password length
            if len(password) < 5:
                return jsonify(success=False, message="Password must be at least 5 characters long."), 400

            # Validate birthdate
            try:
                birthdate_obj = datetime.strptime(birthdate, '%Y-%m-%d').date()
            except ValueError:
                return jsonify(success=False, message="Invalid birthdate format."), 400

            today = date.today()
            age = today.year - birthdate_obj.year - ((today.month, today.day) < (birthdate_obj.month, birthdate_obj.day))
            if age < 15:
                return jsonify(success=False, message="User must be at least 15 years old."), 400
            if age > 122:
                return jsonify(success=False, message="User must be at most 122 years old."), 400

            conn = self.get_db_connection()
            existing_user = conn.execute(
                'SELECT * FROM user WHERE username = ? AND id != ?', 
                (username, id)
            ).fetchone()
            if existing_user:
                conn.close()
                return jsonify(success=False, message="Username already taken."), 400

            conn.execute(
                'UPDATE user SET username = ?, password = ?, birthdate = ? WHERE id = ?',
                (username, password, birthdate, id)
            )
            conn.commit()
            conn.close()
            return jsonify(success=True, message="User updated successfully"), 200

def main():
    app_instance = flaskapp()
    with app_instance.app.app_context():
        conn = app_instance.get_db_connection()
        conn.execute('''
            CREATE TABLE IF NOT EXISTS user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                birthdate DATE NOT NULL,
                money INTEGER NOT NULL DEFAULT 1000,
                total_winnings INTEGER NOT NULL DEFAULT 0
            )
        ''')
        conn.commit()
        conn.close()
    app_instance.app.run(debug=True)

if __name__ == '__main__':
    main()
