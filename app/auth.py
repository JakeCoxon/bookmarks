from flask import Blueprint, render_template, request, url_for, flash
from . import db, app
from app.htmx_integration import htmx_optional, htmx_redirect, Toast
from app import forms
from app.models import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, login_user, current_user

auth = Blueprint('auth', __name__)

login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.init_app(app)

from .models import User

@login_manager.user_loader
def load_user(user_id):
    # since the user_id is just the primary key of our user table, use it in the query for the user
    return User.query.get(user_id)

@login_manager.unauthorized_handler
def unauth():
    return htmx_redirect(url_for('auth.login'))

@auth.route('/login', methods=['POST', 'GET'])
@htmx_optional
def login():

    if current_user.is_authenticated:
        return htmx_redirect(url_for('home'))

    form = forms.LoginForm()

    if request.form:
        email = request.form.get('email')
        password = request.form.get('password')

        user = User.query.filter_by(email=email).first()

        # check if the user actually exists
        # take the user-supplied password, hash it, and compare it to the hashed password in the database
        if not user or not check_password_hash(user.password, password):
            flash(Toast.error("Incorrect username/password"))
            return htmx_redirect(url_for('auth.login')) # if the user doesn't exist or password is wrong, reload the page

        login_user(user, remember=True)
        return htmx_redirect(url_for('home'))
    
    return render_template('login.html', form=form, confirm_url=url_for('auth.login'))

@auth.route('/signup', methods=['POST'])
def signup():
    email = request.form.get('email')
    name = request.form.get('name')
    password = request.form.get('password')

    user = User.query.filter_by(email=email).first()

    if user:
        return htmx_redirect(url_for('auth.signup'))

    password = generate_password_hash(password, method='sha256')
    new_user = User(email=email, name=name, password=password)

    db.session.add(new_user)
    db.session.commit()
    return "Done"

@auth.route('/logout')
@htmx_optional
def logout():
    return 'Logout'
