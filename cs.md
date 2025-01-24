# SQLite and Flask Cheat Sheet

This cheat sheet summarizes the common SQLite and Flask commands used in your project, explaining what each command does. Use it to understand the purpose of various operations and to quickly reference commonly used commands.

---

## **Database Connection and Setup**

### 1. **Connect to Database**
```python
conn = sqlite3.connect('instance/users.db')
```
- Establishes a connection to the SQLite database file (`users.db`).
- If the file does not exist, it creates it.

### 2. **Set Row Factory**
```python
conn.row_factory = sqlite3.Row
```
- Ensures the results from queries are returned as dictionary-like rows for easier access (`row['column_name']`).

### 3. **Cursor Object**
```python
cursor = conn.cursor()
```
- Creates a cursor object used to execute SQL commands.

### 4. **Commit Changes**
```python
conn.commit()
```
- Saves (commits) any changes made to the database (e.g., `INSERT`, `UPDATE`, `DELETE` commands).

### 5. **Close Connection**
```python
conn.close()
```
- Closes the database connection to free up resources.

---

## **CRUD Operations**

### 1. **Create Table**
```python
conn.execute('''
    CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        birthdate DATE NOT NULL,
        money INTEGER NOT NULL DEFAULT 1000
    )
''')
```
- Creates a table named `user` with the specified columns and constraints.
- `IF NOT EXISTS` ensures the table is only created if it doesn’t already exist.

---

### 2. **Insert Data**
```python
conn.execute('INSERT INTO user (username, password, birthdate, money) VALUES (?, ?, ?, ?)', (username, password, birthdate, 1000))
```
- Adds a new row into the `user` table.
- `?` is a placeholder for values passed as a tuple.

### 3. **Retrieve Data (SELECT)**
#### Fetch One Record:
```python
user = conn.execute('SELECT * FROM user WHERE username = ?', (username,)).fetchone()
```
- Retrieves the first row that matches the query.

#### Fetch All Records:
```python
users = conn.execute('SELECT * FROM user').fetchall()
```
- Retrieves all rows from the `user` table.

---

### 4. **Update Data**
```python
conn.execute('UPDATE user SET money = ? WHERE id = ?', (new_balance, user_id))
```
- Updates the `money` column for a specific user (`id = user_id`).

---

### 5. **Delete Data**
```python
conn.execute('DELETE FROM user WHERE username = ?', (username,))
```
- Deletes a user from the `user` table where the username matches.

---

## **Flask-Specific Features**

### 1. **Flask Routes**
#### Basic Route:
```python
@app.route('/')
def home():
    return render_template('home.html')
```
- Defines a route (`/`) for the home page.
- Returns an HTML template (`home.html`).

#### Route with Methods:
```python
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    # Handle GET and POST requests
```
- Allows both `GET` and `POST` requests for the `/signup` route.

---

### 2. **Session Management**
#### Set Session:
```python
session['user_id'] = user['id']
```
- Stores `user_id` in the session, enabling the app to track logged-in users.

#### Check Session:
```python
if 'user_id' not in session:
    return redirect(url_for('login'))
```
- Redirects users to the login page if they’re not logged in.

#### Clear Session:
```python
session.clear()
```
- Logs out the user by clearing all session data.

---

### 3. **Flash Messages**
```python
flash('You must be at least 18 years old to sign up.', 'danger')
```
- Displays a flash message with a specific category (`danger`, `success`, etc.).

#### Display Flash Messages in Templates:
```html
{% with messages = get_flashed_messages(with_categories=true) %}
  {% if messages %}
    {% for category, message in messages %}
      <div class="alert alert-{{ category }}">{{ message }}</div>
    {% endfor %}
  {% endif %}
{% endwith %}
```
- Loops through and displays all flash messages.

---

## **Common Python Utility Functions**

### Convert String to Date:
```python
birthdate = datetime.strptime(birthdate_str, '%Y-%m-%d').date()
```
- Converts a string (e.g., `2000-01-01`) into a Python `date` object.

---



### **SQL and HTTP Error Handling**
#### Handle SQL Integrity Error:
```python
try:
    conn.execute('INSERT INTO user (username, password) VALUES (?, ?)', (username, password))
except sqlite3.IntegrityError:
    flash('Username already exists.', 'danger')
```
- Prevents the app from crashing if an SQL constraint (e.g., unique username) is violated.

#### Handle Unauthorized Access:
```python
if 'user_id' not in session:
    return jsonify(success=False), 403
```
- Returns a 403 HTTP status code if the user is not logged in.

---

## **Database Schema Used**
```sql
CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    birthdate DATE NOT NULL,
    money INTEGER NOT NULL DEFAULT 1000
);
```

---

## **Common Flask-SQLite Workflow**
1. Connect to the database:
   ```python
   conn = get_db_connection()
   ```
2. Execute a query:
   ```python
   conn.execute('SELECT * FROM user')
   ```
3. Fetch results:
   ```python
   users = conn.fetchall()
   ```
4. Commit changes:
   ```python
   conn.commit()
   ```
5. Close connection:
   ```python
   conn.close()
   ```

---