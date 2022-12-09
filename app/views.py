"""
Flask Documentation:     http://flask.pocoo.org/docs/
Jinja2 Documentation:    http://jinja.pocoo.org/2/documentation/
Werkzeug Documentation:  http://werkzeug.pocoo.org/documentation/
This file creates your application.
"""

import json
from app import app, db
from flask import render_template, request, redirect, url_for, flash, make_response
from app.forms import UserForm
from app.models import User, Collection, Block, Bookmark
from app.controller import create_bookmark
from app import controller
from datetime import datetime

# from sqlalchemy.orm import select, select_from, join
# import sqlite3

###
# Routing for your application.
###

@app.route('/')
def home():
    return show_collection("cl_home")

@app.route('/about/')
def about():
    return render_template('about.html', name="Mary Jane")

@app.route('/users')
def show_users():
    users = db.session.query(User).all() # or you could have used User.query.all()

    return render_template('show_users.html', users=users)

@app.route('/create', methods=['POST'])
def create_bookmark_view():

    data = request.json

    title = data.get('title') or "Untitled"
    bk = create_bookmark(title=title, description=data['desc'], 
        url=data['url'], collection=col)

    bl = bk.block
    db.session.flush()

    bk.block.set_reference(bk)
    db.session.commit()

    return render_template('bookmark.html', block=bk.block)

@app.route('/save', methods=['POST'])
def save_bookmark_view():

    data = request.json

    query = (
        db.session.query(Block).
        filter_by(id=data['id']).
        outerjoin(Bookmark, Bookmark.id == Block.id)
    )
    bl = query.first()

    title = data.get('title') or "Untitled"
    bl.bookmark.title = title
    bl.bookmark.description = data['desc']

    db.session.commit()

    return render_template('bookmark.html', block=bl)

@app.route('/sidebar', methods=['POST'])
def sidebar():

    ids = request.json['ids']

    query = (
        db.session.query(Block).
        filter(Block.id.in_(ids)).
        outerjoin(Collection, Collection.id == Block.id).
        outerjoin(Bookmark, Bookmark.id == Block.id)
    )
    blocks = query.all()
    if len(blocks) == 1:
        return render_template('sidebar_single.html', block=blocks[0])
    return render_template('sidebar_multi.html', blocks=blocks)

@app.route('/collection/<collection_id>')
def show_collection(collection_id):
    collection = db.session.query(Collection).get(collection_id)

    query = (
        db.session.query(Block).
        filter_by(ancestor_collection_id=collection_id).
        outerjoin(Collection, Collection.id == Block.id).
        outerjoin(Bookmark, Bookmark.id == Block.id).
        order_by(Block.created_at.desc())
    )

    blocks = query.all()

    groups = [(group, group_to_label(group), list(blocks)) 
        for group, blocks in group_by_date(query)]
    print(groups)

    return render_template('show_collection.html', 
        collection=collection, blocks=blocks, groups=groups, query=query)

def group_to_label(group):
    return {'day': "Today", 'week': "This week", 'month': "This month", '3month': "A few months ago", 'year': "This year", 'other': "Older than a year"}[group]

def group_by_date(blocks):
    now = datetime.now()
    from itertools import groupby

    day = 60 * 60 * 24
    def groupfunc(block):
        diff = (now - block.created_at).total_seconds()
        print(diff)

        if diff < day: return "day"
        elif diff < day * 7: return "week"
        elif diff < day * 30: return "month"
        elif diff < day * 30 * 3: return "3month"
        elif diff < day * 365: return "year"

        return "other"

    return groupby(blocks, key=groupfunc)


def model_to_dict(self):
    keys = self.__mapper__.columns.keys()
    attrs = vars(self)
    return { k : attrs[k] for k in keys if k in attrs}
    
# @app.route('/collection/<collection_id>/api')
# def show_page_api(collection_id):
#     page = db.session.query(Page).filter_by(id=collection_id).one()

#     query = (
#         db.session.query(Block).
#         filter_by(ancestor_collection_id=collection_id)
#         # outerjoin(Page, Page.id == Block.id).
#         # outerjoin(Bookmark, Bookmark.id == Block.id)
#     )
#     sidebar_pages = (
#         db.session.query(Page)
#         .filter_by(parent_collection_id=None)
#         .outerjoin(Page.block)
#         .all()
#     )

#     blocks = query.all()

#     pages = [page] 
#     pages += [x.page for x in blocks if x.page]
#     pages += sidebar_pages

#     response = {}
#     response['blocks'] = {x.id: model_to_dict(x) for x in blocks}
#     response['pages'] = {page.id: model_to_dict(page) for page in pages}
#     response['bookmarks'] = {x.bookmark.id: model_to_dict(x.bookmark) for x in blocks if x.bookmark}
#     response['galleries'] = {x.gallery.id: model_to_dict(x.gallery) for x in blocks if x.gallery}
#     response['sidebar'] = [page.id for page in sidebar_pages]


#     return make_response(json.dumps(response, default=default_json))

# @app.route('/sidebar/api')
# def show_sidebar_api():
#     pages = (
#         db.session.query(Page)
#         .filter_by(parent_page_id=None)
#         .outerjoin(Page.block)
#         .all()
#     )

#     # query = (
#     #     db.session.query(Block).
#     #     filter_by(ancestor_page_id=page_id)
#     #     # outerjoin(Page, Page.id == Block.id).
#     #     # outerjoin(Bookmark, Bookmark.id == Block.id)
#     # )

    
#     response = {}
#     # response['blocks'] = {x.id: model_to_dict(x) for x in blocks}
#     response['pages'] = {page.id: model_to_dict(page) for page in pages}
#     response['sidebar'] = [page.id for page in pages]
    
#     return make_response(json.dumps(response, default=default_json))

def default_json(obj):
    if isinstance(obj, datetime):
        return int(datetime.timestamp(obj) * 1000)
    raise TypeError(f'Object of type {obj.__cls__.__name__} is not JSON serializable')

@app.route('/bookmarks')
def show_bookmarks():

    bookmarks = (
        db.session.query(Bookmark)
    ).all()

    return render_template('show_bookmarks.html', bookmarks=bookmarks)


@app.route('/edit', methods=['POST'])
def edit_request():
    edits = request.get_json()
    response = controller.handle_request(edits)
    return make_response(response)

@app.route('/add-user', methods=['POST', 'GET'])
def add_user():

    user_form = UserForm()

    if request.method == 'POST':
        if user_form.validate_on_submit():
            name = user_form.name.data
            email = user_form.email.data

            user = User(name, email)
            db.session.add(user)
            db.session.commit()

            flash('User successfully added')
            return redirect(url_for('show_users'))

    flash_errors(user_form)
    return render_template('add_user.html', form=user_form)

# Flash errors from the form if validation fails
def flash_errors(form):
    for field, errors in form.errors.items():
        for error in errors:
            flash(u"Error in the %s field - %s" % (
                getattr(form, field).label.text,
                error
            ))

###
# The functions below should be applicable to all Flask apps.
###

@app.route('/<file_name>.txt')
def send_text_file(file_name):
    """Send your static text file."""
    file_dot_text = file_name + '.txt'
    return app.send_static_file(file_dot_text)


@app.after_request
def add_header(response):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """

    response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE'

    if True:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, public, max-age=0"
        # response.headers["Pragma"] = "no-cache"
        # response.headers["Expires"] = "0"
    else:
        response.headers['Cache-Control'] = 'public, max-age=600'
    return response


@app.errorhandler(404)
def page_not_found(error):
    """Custom 404 page."""
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(debug=True,host="0.0.0.0",port="8080")
