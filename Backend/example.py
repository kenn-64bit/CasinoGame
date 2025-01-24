from flask import Flask
import sqlite3

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect('example.db') # db na file
    cursor = conn.cursor() # cursor na magagamit para mag-execute ng SQL commands para maka query sa db
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE
        )
    ''')
    conn.commit() # commit the changes
    conn.close() # ewan ko HAHAAHAH di gumagana nung wala to eh

@app.route('/')
def index():
    return "Hello, World!"

if __name__ == '__main__':
    init_db()
    app.run(debug=True)