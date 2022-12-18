import random
import flask
from app import db
from app.models import User, Collection, Block, Bookmark, Counter, Tag
from sqlalchemy import select, case, func, or_
from datetime import datetime, timedelta


block_created_at_period = case([
    (Block.created_at >= func.date('now'), 'day'),
    (Block.created_at >= func.date('now', '-6 days'), 'week'),
    (Block.created_at >= func.date('now', '-1 month'), 'month'),
    (Block.created_at >= func.date('now', '-3 month'), '3month'),
    (Block.created_at >= func.date('now', '-1 year'), 'year')
], else_='other')

def query_blocks_and_time_period(collection_id):
    return (
        db.session.query(Block, block_created_at_period.label('time_period')).
        filter_by(ancestor_collection_id=collection_id).
        filter(Block.pinned_at == None).
        filter(Block.deleted_at == None).
        outerjoin(Bookmark, Bookmark.id == Block.reference_id).
        order_by(Block.created_at.desc())
    )

def get_collection_or_404(collection_id):
    collection = (
        db.session.query(Collection)
        .filter(Collection.deleted_at == None)
        .filter_by(id=collection_id)
        .first()
    )
    if not collection:
       flask.abort(404)
    return collection

def search_blocks(collection_id, search):
    return (
        db.session.query(Block).
        filter_by(ancestor_collection_id=collection_id).
        filter(Block.deleted_at == None).
        outerjoin(Bookmark, Bookmark.id == Block.reference_id).
        outerjoin(Tag, Tag.bookmark_id == Bookmark.id).
        filter(or_(
            Tag.label == search,
            Bookmark.title.like(f'%{search}%'),
            Bookmark.url.like(f'%{search}%'),
            Bookmark.notes.like(f'%{search}%'),
            Bookmark.description.like(f'%{search}%')
        )).
        order_by(Block.created_at.desc())
    )

def query_pinned(collection_id):
    return (
        db.session.query(Block).
        filter_by(ancestor_collection_id=collection_id).
        filter(Block.pinned_at != None).
        filter(Block.deleted_at == None).
        outerjoin(Bookmark, Bookmark.id == Block.id).
        order_by(Block.pinned_at.asc())
    )

def query_today_blocks(collection_id):
    # Filter by today, make sure this is the same way as block_created_at_period
    return (
        db.session.query(Block).
        filter_by(ancestor_collection_id=collection_id).
        filter(Block.created_at >= func.date('now')).
        filter(Block.created_at < func.date('now', '+1 day')).
        outerjoin(Collection, Collection.id == Block.id).
        outerjoin(Bookmark, Bookmark.id == Block.id).
        order_by(Block.created_at.desc())
    )

def query_collections_and_block_count():
    return (
        db.session.query(Collection, func.count(Block.id))
        .filter(Collection.deleted_at == None)
        .outerjoin(Block)
        .group_by(Collection)
    )

def query_multiple_ids(collection_id, ids):
    return (
        db.session.query(Block).
        filter_by(ancestor_collection_id=collection_id).
        filter(Block.id.in_(ids)).
        outerjoin(Bookmark, Bookmark.id == Block.id).
        outerjoin(Tag, Tag.bookmark_id == Bookmark.id)
    )


def query_tags(collection_id, given_tags, input):
    return (
        db.session.query(Tag.label).
        filter(Tag.label.contains(input)).
        distinct(Tag.label)
    )

def create_collection(title):
    collection = Collection(title=title)

    db.session.add(collection)
    return collection


def create_block(contents, reference=None, collection=None):
    block = Block(contents=contents)
    if reference:
        block.set_reference(reference)
    if collection:
        block.collection = collection

    db.session.add(block)
    return block

def create_bookmark(*args, collection, **kwargs):
    bk = Bookmark(*args, **kwargs)
    bl = create_block("", reference=bk, collection=collection)
    db.session.add(bk)
    db.session.add(bl)
    return bk
