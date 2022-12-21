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
from app import app, db, forms
from datetime import datetime
from flask import render_template, request, redirect, url_for, flash, make_response, Markup
from app.forms import UserForm, BookmarkForm, NoteForm, AddBookmarkForm, RenameCollectionForm
from app.models import User, Collection, Block, Bookmark, Tag
from app import controller as query
from app.controller import (get_collection_or_404, create_bookmark, query_today_blocks, query_collections_and_block_count,
    query_multiple_ids, query_blocks_and_time_period, query_pinned, query_tags, search_blocks, create_block)
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
    col = get_collection_or_404(collection_id)

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

        new_tag_set = set(data.getlist('tags'))
        old_tag_set = set([x.label for x in bl.bookmark.tags])

        for tag in bl.bookmark.tags:
            if tag.label not in new_tag_set:
                db.session.delete(tag)

        for label in new_tag_set.difference(old_tag_set):
            db.session.add(Tag(label=label, bookmark_id=bl.bookmark.id))

    else:
        bl.contents = data['contents']
    bl.color = data['color']

    db.session.commit()
    flash(Toast.success("Bookmark is saved"))

    return render_template('bookmark.html', block=bl)

@app.route('/collection/<collection_id>/sidebar', methods=['POST'])
@htmx_required
def sidebar(collection_id):

    time.sleep(0.1)
    ids = request.form.getlist('ids')
    tag_autocomplete_url = url_for('tags_autocomplete', collection_id=collection_id)

    query = query_multiple_ids(collection_id, ids)
    blocks = query.all()
    if len(blocks) == 1:
        block = blocks[0]
        FormType = BookmarkForm if block.bookmark else NoteForm
        form = FormType.from_block(block, formdata=None)
        if block.bookmark:
            form.tags.render_kw = {'request_url': tag_autocomplete_url}

        return render_template('sidebar_single.html', block=block, form=form)
    return render_template('sidebar_multi.html', blocks=blocks, collection_id=collection_id)

@app.route('/collection/<collection_id>/tags-autocomplete', methods=['POST'])
@htmx_required
def tags_autocomplete(collection_id):

    given_tags = request.form.getlist('tags')
    input = request.form.get('input')

    found_tags = [x.label for x in 
        query_tags(collection_id, given_tags, input).limit(10).all()]

    return render_template("tag_autocomplete.html", tags=found_tags, input=input)

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


@app.route('/collection/<collection_id>/remove-blocks', methods=['POST'])
@htmx_required
def remove_blocks(collection_id):

    collection_title = get_collection_or_404(collection_id).title
    ids = request.form.getlist('ids')
    blocks = query_multiple_ids(collection_id, ids)

    if not request.form.get('confirm'):
        return render_template('modal_confirmation.html', 
            title=f"Confirm ?",
            description=(
                f"This will remove 1 block from the collection '{collection_title}'. It can be recovered in the trash"
                if blocks.count() == 1 else
                f"This will delete {blocks.count()} blocks from the collection '{collection_title}'. They can be recovered in the trash"
            ), 
            confirm_url=url_for('remove_blocks', collection_id=collection_id),
            ids=[bl.id for bl in blocks],
            collection_id=collection_id)

    for bl in blocks:
        bl.deleted_at = datetime.now()
    
    db.session.commit()
    flash(Toast.success(f"Removed {blocks.count()} blocks"))
    return htmx_redirect(url_for('show_collection', collection_id=collection_id))


@app.route('/collection/<collection_id>/copy-blocks', methods=['POST'])
@htmx_required
def copy_blocks(collection_id):
    collection = get_collection_or_404(collection_id)

    collection_title = get_collection_or_404(collection_id).title
    ids = request.form.getlist('ids')
    blocks = query_multiple_ids(collection_id, ids)

    collections = (db.session.query(Collection)
        .filter(Collection.id != collection_id)
        .filter(Collection.deleted_at == None)).all()
    form = forms.CopyBlocksForm(formdata=request.form, collections=collections)

    def handle():
        if form.confirm.data is None:
            return False

        collection_ids = form.collections.data
        collections = (db.session.query(Collection)
            .filter(Collection.id.in_(collection_ids))).all()
        print(collections)

        if not collections:
            flash(Toast.error(f"Select at least one"))
            return False

        num_created = 0
        for collection in collections:
            for bl in blocks:
                if bl.bookmark:
                    create_block(bl.contents, bl.bookmark, collection=collection)
                else:
                    create_block(bl.contents, None, collection=collection)
                num_created += 1

        if form.also_remove.data:
            for bl in blocks:
                bl.deleted_at = datetime.now()

        db.session.commit()
        
        flash(Toast.success(f"{num_created} new blocks in {len(collections)} collections"))
        return True

    result = handle()

    if not result:
        return render_template('modal_copy.html', 
            existing_collection=collection,
            blocks=blocks, form=form,
            confirm_url=url_for('copy_blocks', collection_id=collection_id))

    return htmx_redirect(url_for('show_collection', collection_id=collection_id))


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
    collection = get_collection_or_404(collection_id)

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


@app.route('/collection/<collection_id>/delete', methods=['POST'])
@htmx_required
def delete_collection(collection_id):
    collection = get_collection_or_404(collection_id)
    num_blocks = (db.session.query(Block).
        filter_by(ancestor_collection_id=collection_id).
        filter(Block.deleted_at == None).
        count())

    should_confirm = num_blocks > 0

    if should_confirm and not request.form.get('confirm'):
        blocks_label = '1 block' if num_blocks == 1 else f'{num_blocks} blocks'
        return render_template('modal_confirmation.html', 
            title=f"Confirm ?",
            description=f"""This will delete the collection '{collection.title}' along 
                with {blocks_label}. They can be recovered in the trash""", 
            confirm_url=f"/collection/{collection_id}/delete",
            collection_id=collection_id)

    collection.deleted_at = datetime.now()
    db.session.commit()
    
    flash(Toast.success(f"'{collection.title}' deleted"))
    return htmx_redirect(url_for('home'))


@app.route('/collection/<collection_id>/rename', methods=['POST'])
@htmx_required
def rename_collection(collection_id):
    collection = get_collection_or_404(collection_id)

    form = RenameCollectionForm(formdata=request.form, obj=collection)

    if form.confirm.data is None:
        return render_template('modal_rename.html', 
            form=form,
            confirm_url=f"/collection/{collection_id}/rename",
            collection=collection)

    collection.title = form.title.data
    db.session.commit()
    flash(Toast.success(f"'{collection.title}' renamed"))
    return htmx_redirect(url_for('show_collection', collection_id=collection_id))


@app.route('/collection/<collection_id>/tags', methods=['POST'])
@htmx_required
def manage_tags(collection_id):
    tag_autocomplete_url = url_for('tags_autocomplete', collection_id=collection_id)
    
    collection = get_collection_or_404(collection_id)

    ids = request.form.getlist('ids')
    blocks = query_multiple_ids(collection_id, ids)

    tags = query.query_common_tags(ids).all()
    common_tags = [label for label, count in tags if count == len(ids)]
    uncommon_tags = [label for label, count in tags if count != len(ids)]

    confirmed = request.form.get('confirm') is not None
    form = forms.ManageTagsForm(formdata=request.form if confirmed else None, data={'tags': common_tags})
    form.tags.render_kw = {'request_url': tag_autocomplete_url}

    if form.confirm.data is None:
        return render_template('modal_tags.html', 
            form=form,
            uncommon_tags=uncommon_tags,
            confirm_url=f"/collection/{collection_id}/tags",
            collection=collection, blocks=blocks)

    new_tag_set = set(request.form.getlist('tags'))
    old_tag_set = set(common_tags)
    
    added = 0
    removed = 0
    for bl in blocks:
        if bl.bookmark:
            existing_tag_set = set([x.label for x in bl.bookmark.tags])

            to_remove = old_tag_set.difference(new_tag_set)
            for tag in bl.bookmark.tags:
                if tag.label in to_remove:
                    db.session.delete(tag)
                    removed += 1

            to_add = new_tag_set.difference(old_tag_set).difference(existing_tag_set)
            for label in to_add:
                db.session.add(Tag(label=label, bookmark_id=bl.bookmark.id))
                added += 1

    db.session.commit()
    flash(Toast.success(f"{added} tags added, {removed} tags removed"))
    return htmx_redirect(url_for('show_collection', collection_id=collection_id))

        
@app.route('/collection/<collection_id>/search', methods=['POST'])
@htmx_required
def search_collection(collection_id):
    collection = get_collection_or_404(collection_id)
    
    search = request.form.get('search')
    query = search_blocks(collection_id, search)
    count = query.count()
    page = int(request.args.get('page', 1))
    pagination = query.paginate(page, 50)

    groups = [
        ('search', f'Search results ({count})', pagination.items)
    ]

    add_form = AddBookmarkForm(data={'collection_id': collection_id})

    make_url_2 = partial(url_for, 'show_collection', collection_id=collection.id)
    def make_url(**kwargs):
        if kwargs.get('page') == 1:
            kwargs.pop('page')
        return make_url_2(**kwargs)

    return render_template('show_collection.html', 
        collection=collection, groups=groups, pagination=pagination,
        pinned=[], add_form=add_form, make_url=make_url)


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
@htmx_optional
def page_not_found(error):
    """Custom 404 page."""
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(debug=True,host="0.0.0.0",port="8080")
