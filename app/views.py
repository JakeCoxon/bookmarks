"""
Flask Documentation:     http://flask.pocoo.org/docs/
Jinja2 Documentation:    http://jinja.pocoo.org/2/documentation/
Werkzeug Documentation:  http://werkzeug.pocoo.org/documentation/
This file creates your application.
"""

import time
import flask
from functools import partial
from flask import json
from app import app, db
from flask import render_template, request, redirect, url_for, flash, make_response, get_flashed_messages, Markup
from app.forms import UserForm, BookmarkForm, NoteForm, AddBookmarkForm
from app.models import User, Collection, Block, Bookmark
from app.controller import create_bookmark, query_today_blocks, query_collections_and_block_count, query_multiple_ids, query_blocks_and_time_period
from app import controller
from datetime import datetime
from sqlalchemy import func

@app.route('/')
def home():

    query = query_collections_and_block_count()
    collections = [x for x, y in query]
    for col, count in query:
        col.block_count = count

    return htmx(render_template('home.html', collections=collections))


@app.route('/empty')
def home_empty():
    return htmx(render_template('home.html', collections=[]))

@app.route('/users')
def show_users():
    users = db.session.query(User).all() # or you could have used User.query.all()

    return render_template('show_users.html', users=users)

@app.route('/create', methods=['POST'])
def create_bookmark_view():

    data = request.form

    collection_id = data['collection_id']
    col = Collection.query.get(collection_id)

    title = data.get('title')
    bk = create_bookmark(title=title, description=data['desc'], 
        url=data['url'], collection=col)

    bl = bk.block
    db.session.flush()

    bk.block.set_reference(bk)
    db.session.commit()

    flash(Toast.success("New bookmark added"))

    today_blocks = query_today_blocks(collection_id).all()

    return render_template('collection_group.html',
        group='day', label="Today", blocks=today_blocks)

@app.route('/save', methods=['POST'])
def save_bookmark_view():

    time.sleep(0.4)

    data = request.form

    query = (
        db.session.query(Block).
        filter_by(id=data['id']).
        outerjoin(Bookmark, Bookmark.id == Block.id)
    )
    bl = query.first()

    if bl.bookmark:
        title = data.get('title')
        bl.bookmark.title = title
        bl.bookmark.url = data['url']
        bl.bookmark.image = data['image']
        bl.bookmark.description = data['desc']
        bl.bookmark.notes = data['notes']
    else:
        bl.contents = data['contents']
    bl.color = data['color']

    db.session.commit()
    flash(Toast.success("Bookmark is saved"))

    return render_template('bookmark.html', block=bl)

@app.route('/sidebar', methods=['POST'])
def sidebar():

    ids = request.form.getlist('ids')

    query = query_multiple_ids(ids)
    blocks = query.all()
    if len(blocks) == 1:
        block = blocks[0]
        FormType = BookmarkForm if block.bookmark else NoteForm
        form = FormType.from_block(block, formdata=None)

        return render_template('sidebar_single.html', block=block, form=form)
    return render_template('sidebar_multi.html', blocks=blocks)


@app.route('/create-collection', methods=['POST'])
def create_collection():
    col = Collection(title="New collection")
    db.session.add(col)
    db.session.commit()
    flash(Toast.success("New collection created"))
    return htmx_redirect(f"/collection/{col.id}")

@app.route('/collection/<collection_id>')
def show_collection(collection_id):
    collection = db.session.query(Collection).get(collection_id)

    query = query_blocks_and_time_period(collection_id)
    groups = group_by_date(query)

    add_form = AddBookmarkForm(data={'collection_id': collection_id})

    return htmx(render_template('show_collection.html', 
        collection=collection, groups=groups, query=query,
        add_form=add_form))

def group_to_label(group):
    return {'day': "Today", 'week': "This week", 'month': "This month", '3month': "A few months ago", 'year': "This year", 'other': "Older than a year"}[group]

def group_by_date(rows):
    from itertools import groupby

    def groupfunc(row):
        return row.time_period

    group_iter = groupby(rows, key=groupfunc)

    groups = [(group, group_to_label(group), [row.Block for row in blocks]) 
        for group, blocks in group_iter]
    return groups


def model_to_dict(self):
    keys = self.__mapper__.columns.keys()
    attrs = vars(self)
    return { k : attrs[k] for k in keys if k in attrs}
    

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


def htmx(content):
    is_hx = request.headers.get('HX-Request')
    if is_hx:
        return content
    return render_template('html_layout.html', content=Markup(content))


def htmx_redirect(url):
    resp = flask.Response("")
    resp.headers['HX-Location'] = url
    return resp

@app.after_request
def add_toasts(response):

    is_hx = request.headers.get('HX-Request')

    messages = get_flashed_messages()
    if is_hx and messages:
        data = {'showToasts': messages}
        response.headers['HX-Trigger'] = json.dumps(data)

    return response

class Toast:
    classes = "rounded px-4 py-4 mb-4 mr-6 flex items-center justify-center text-white shadow-lg cursor-pointer"
    markup = Markup("""<div class="%(status_class)s %(classes)s">%(html)s</div>""")

    def __init__(self, status_class, html):
        self.status_class = status_class
        self.html = html

    def __html__(self):
        return self.markup % { 'status_class': self.status_class, 
            'classes': self.classes, 'html': self.html}

Toast.success = staticmethod(partial(Toast, 'bg-emerald-600'))
Toast.info = staticmethod(partial(Toast, 'bg-blue-600'))
Toast.warning = staticmethod(partial(Toast, 'bg-orange-600'))
Toast.error = staticmethod(partial(Toast, 'bg-chestnut-600'))

@app.errorhandler(404)
def page_not_found(error):
    """Custom 404 page."""
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(debug=True,host="0.0.0.0",port="8080")
