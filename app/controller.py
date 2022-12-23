import random
import flask
from app import db
from app.models import User, Collection, Block, Bookmark, Counter, Tag
from sqlalchemy import select, case, func, or_, and_, distinct
from datetime import datetime, timedelta
from functools import cached_property

class Context:
    def __init__(self, user, collection_id):
        self.user = user
        self.collection_id = collection_id

    @cached_property
    def collection(self):
        return get_collection_or_404(self)

block_created_at_period = case([
    (Block.created_at >= func.date('now'), 'day'),
    (Block.created_at >= func.date('now', '-6 days'), 'week'),
    (Block.created_at >= func.date('now', '-1 month'), 'month'),
    (Block.created_at >= func.date('now', '-3 month'), '3month'),
    (Block.created_at >= func.date('now', '-1 year'), 'year')
], else_='other')

def query_blocks_and_time_period(context):
    return (
        db.session.query(Block, block_created_at_period.label('time_period')).
        filter_by(ancestor_collection_id=context.collection_id).
        filter(Block.pinned_at == None).
        filter(Block.deleted_at == None).
        join(Collection, Block.ancestor_collection_id == Collection.id).
        filter_by(owner=context.user.id).
        outerjoin(Bookmark, Bookmark.id == Block.reference_id).
        order_by(Block.created_at.desc())
    )

def get_collection_or_404(context):
    collection = (
        db.session.query(Collection)
        .filter(Collection.deleted_at == None)
        .filter_by(owner=context.user.id)
        .filter_by(id=context.collection_id)
        .first()
    )
    if not collection:
       flask.abort(404)
    return collection

def search_blocks(context, search):
    return (
        db.session.query(Block).
        filter_by(ancestor_collection_id=context.collection_id).
        filter(Block.deleted_at == None).
        join(Collection, Block.ancestor_collection_id == Collection.id).
        filter_by(owner=context.user.id).
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

def query_pinned(context):
    return (
        db.session.query(Block).
        join(Collection, Block.ancestor_collection_id == Collection.id).
        filter_by(owner=context.user.id).
        filter(Block.ancestor_collection_id == context.collection_id).
        filter(Block.pinned_at != None).
        filter(Block.deleted_at == None).
        outerjoin(Bookmark, Bookmark.id == Block.id).
        order_by(Block.pinned_at.asc())
    )

def query_today_blocks(context):
    # Filter by today, make sure this is the same way as block_created_at_period
    return (
        db.session.query(Block).
        join(Collection, Block.ancestor_collection_id == Collection.id).
        filter_by(owner=context.user.id).
        filter(Block.ancestor_collection_id == context.collection_id).
        filter(Block.created_at >= func.date('now')).
        filter(Block.created_at < func.date('now', '+1 day')).
        outerjoin(Collection, Collection.id == Block.id).
        outerjoin(Bookmark, Bookmark.id == Block.id).
        order_by(Block.created_at.desc())
    )

def query_block(context, block_id):
    return (
        db.session.query(Block).
        join(Collection, Block.ancestor_collection_id == Collection.id).
        filter_by(owner=context.user.id).
        filter_by(id=block_id).
        outerjoin(Bookmark, Bookmark.id == Block.id)
    )

def query_collections_and_block_count(context):
    return (
        db.session.query(Collection, func.count(Block.id))
        .filter_by(owner=context.user.id)
        .filter(Collection.deleted_at == None)
        .outerjoin(Block)
        .group_by(Collection)
    )

def query_multiple_ids(context, ids):
    return (
        db.session.query(Block).
        join(Collection, Block.ancestor_collection_id == Collection.id).
        filter_by(owner=context.user.id).
        filter(Block.ancestor_collection_id == context.collection_id).
        filter(Block.id.in_(ids)).
        outerjoin(Bookmark, Bookmark.id == Block.id).
        outerjoin(Tag, Tag.bookmark_id == Bookmark.id)
    )


def query_tags(context, given_tags, input):
    return (
        db.session.query(Tag.label).
        filter(Tag.label.contains(input)).
        distinct(Tag.label)
    )

def query_common_tags(block_ids):
    stmt = select([Tag.label, func.count(distinct(Block.id))]).where(and_(
        Tag.bookmark_id == Bookmark.id,
        Block.reference_id == Bookmark.id,
        Block.id.in_(block_ids)
    )).group_by(Tag.label)

    return db.session.execute(stmt)

def create_collection(title, **kwargs):
    collection = Collection(title=title, **kwargs)

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
