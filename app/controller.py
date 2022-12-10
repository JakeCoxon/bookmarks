import random
from app import db
from app.models import User, Collection, Block, Bookmark, Counter
from datetime import datetime, timedelta

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

        bk.block.created_at = created_at
        
        days = random.randrange(1, 3)
        created_at -= timedelta(days=days)

    bookmark_blocks = [x.block for x in bookmarks]
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

    for b in bookmarks:
        print(b.block.ancestor_collection_id)
