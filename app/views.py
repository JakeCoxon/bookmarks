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
from datetime import datetime
from flask import render_template, request, redirect, url_for, flash, make_response
from app.forms import UserForm, BookmarkForm, NoteForm, AddBookmarkForm
from app.models import User, Collection, Block, Bookmark
from app.controller import (create_bookmark, query_today_blocks, query_collections_and_block_count,
    query_multiple_ids, query_blocks_and_time_period, query_pinned)
from app.htmx_integration import htmx_redirect, Toast, htmx_optional, htmx_required


@app.route('/')
@htmx_optional
def home():

    query = query_collections_and_block_count()
    collections = [x for x, y in query]
    for col, count in query:
        col.block_count = count

    return render_template('home.html', collections=collections)

@app.route('/empty')
@htmx_optional
def home_empty():
    return render_template('home.html', collections=[])

@app.route('/create', methods=['POST'])
@htmx_required
def create_bookmark_view():

    data = request.form

    collection_id = data['collection_id']
    col = Collection.query.get(collection_id)

    title = data.get('title')
    bk = create_bookmark(title=title, description=data['desc'], 
        url=data['url'], collection=col)

    db.session.flush()

    bk.block.set_reference(bk)
    db.session.commit()

    flash(Toast.success("New bookmark added"))

    today_blocks = query_today_blocks(collection_id).all()

    return render_template('collection_group.html',
        group='day', label="Today", blocks=today_blocks)

@app.route('/save', methods=['POST'])
@htmx_required
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
@htmx_required
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

@app.route('/block/<block_id>/pinned', methods=['POST'])
@htmx_required
def set_pinned(block_id):

    pinned = request.args.get('pinned') != 'false'

    bl = Block.query.get(block_id)
    
    toast = None
    if pinned and not bl.pinned_at:
        bl.pinned_at = datetime.now()
        toast = Toast.success("Block pinned")
    elif not pinned and bl.pinned_at:
        bl.pinned_at = None
        toast = Toast.success("Block unpinned")

    db.session.commit()
    if toast: flash(toast)

    return htmx_redirect(f'/collection/{bl.ancestor_collection_id}')

@app.route('/block/<block_id>/delete', methods=['POST'])
@htmx_required
def delete_block(block_id):

    bl = Block.query.get(block_id)
    bl.deleted_at = datetime.now()
    
    db.session.commit()
    flash(Toast.success("Block deleted"))
    return htmx_redirect(f'/collection/{bl.ancestor_collection_id}')


@app.route('/create-collection', methods=['POST'])
@htmx_required
def create_collection():
    col = Collection(title="New collection")
    db.session.add(col)
    db.session.commit()
    flash(Toast.success("New collection created"))
    return htmx_redirect(f"/collection/{col.id}")

@app.route('/collection/<collection_id>')
@htmx_optional
def show_collection(collection_id):
    collection = db.session.query(Collection).get(collection_id)

    query = query_blocks_and_time_period(collection_id)
    page = int(request.args.get('page', 1))
    pagination = query.paginate(page, 50)

    pinned = list(query_pinned(collection_id)) if page == 1 else []

    groups = group_by_date(pagination.items)

    add_form = AddBookmarkForm(data={'collection_id': collection_id})

    make_url_2 = partial(url_for, 'show_collection', collection_id=collection.id)
    def make_url(**kwargs):
        if kwargs.get('page') == 1:
            kwargs.pop('page')
        return make_url_2(**kwargs)

    return render_template('show_collection.html', 
        collection=collection, groups=groups, pagination=pagination,
        pinned=pinned, add_form=add_form, make_url=make_url)

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
