from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['SECRET_KEY'] = 'super secret key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../mydatabase.db'
app.config['SQLALCHEMY_BINDS'] = {
    'basic': 'sqlite:///../basic.db'
}
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'mydatabase.db')
db = SQLAlchemy(app)

app.config.from_object(__name__)


from app import views
