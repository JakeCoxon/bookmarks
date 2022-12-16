import random
from app import db
from app.models import User, Collection, Block, Bookmark, Counter
from sqlalchemy import select, case, func
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
        outerjoin(Bookmark, Bookmark.id == Block.id).
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
        .outerjoin(Block)
        .group_by(Collection)
    )

def query_multiple_ids(ids):
    return (
        db.session.query(Block).
        filter(Block.id.in_(ids)).
        outerjoin(Bookmark, Bookmark.id == Block.id)
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

def init_db():
    db.create_all()

    db.session.add(Counter(counter=1000))
    db.session.commit()
    db.session.flush()

    collection1 = create_collection("Inbox")

    bookmarks = []

    created_at = datetime.now()
    for i in range(1,100):
        bk = create_bookmark(
            title=f"cool bookmark {i}", description="here", 
            url="http://cool.com", collection=collection1)
        bookmarks.append(bk)

        bk.created_at = created_at
        bk.block.created_at = created_at
        
        days = random.randrange(1, 3)
        created_at -= timedelta(days=days)

    bookmark_blocks = [x.block for x in bookmarks]

    for i in range(1,4):
        bl = bookmark_blocks[random.randrange(0, len(bookmark_blocks))]
        bl.pinned_at = datetime.now()
        
    db.session.commit()

    for bk, bl in zip(bookmarks, bookmark_blocks):
        bl.set_reference(bk)
    db.session.commit()

    b7 = create_block("Unlinked 1", collection=collection1)
    b8 = create_block("Unlinked 1", collection=collection1)
    db.session.flush()
    
    # create_inbox()



    db.session.commit()

    q = (
        db.session.query(Block)
        # outerjoin(Page, Page.id == Block.id)
        # outerjoin(Block.bookmark_ref)
    )
    # print(q)
    # all = {x.id: x for x in q.all()}
    # print(all)
