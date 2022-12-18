import random
from app import db
from app.models import User, Collection, Block, Bookmark, Counter, Tag
from sqlalchemy import select, case, func
from datetime import datetime, timedelta


def init_db():
    db.create_all()

    db.session.add(Counter(counter=1000))
    db.session.commit()
    db.session.flush()

    collection1 = create_collection("Inbox")

    bookmarks = []

    images = [
        'http://localhost:8080/static/placeholders/a.jpg',
        'http://localhost:8080/static/placeholders/b.jpg',
        'http://localhost:8080/static/placeholders/c.jpg',
        'http://localhost:8080/static/placeholders/d.jpg',
        'http://localhost:8080/static/placeholders/e.jpg',
        'http://localhost:8080/static/placeholders/f.jpg',
        'http://localhost:8080/static/placeholders/g.jpg',
        'http://localhost:8080/static/placeholders/h.jpg',
        '',
        ''
    ]

    created_at = datetime.now()
    for i in range(1,100):
        bk = create_bookmark(
            title=f"cool bookmark {i}", description="here", 
            url="http://cool.com", collection=collection1)
        bookmarks.append(bk)

        bk.created_at = created_at
        bk.block.created_at = created_at

        bk.image = images[random.randrange(0, len(images))]
        
        days = random.randrange(1, 3)
        created_at -= timedelta(days=days)

        tag = Tag(label='Tag 1')
        bk.tags.append(tag)

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
