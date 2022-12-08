from app import db
from app.models import User, Collection, Block, Bookmark, Counter, Url
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
        block.ancestor_collection_id = collection.id

    db.session.add(block)
    return block

# def create_inbox():
#     import json

#     inbox = create_collection("Inbox")
#     inbox.id = "pg_inbox"
#     inbox.locked = True

#     gallery = Gallery()
#     db.session.add(gallery)
#     db.session.flush()

#     gallery_block = create_block("", reference=gallery)

#     inbox_urls = db.session.query(Url).all()
#     def create_bookmark_from_url(url):
#         m = json.loads(url.meta)
#         bk = Bookmark(url=m['url'], title=m['title'], description=m['description'],
#             caption=url.caption, logo=m['logo'], image=m['image'])
#         db.session.add(bk)
#         return bk
    
#     bookmarks = [
#         create_bookmark_from_url(url)
#         for url in inbox_urls
#     ]
#     db.session.flush()

#     insert_x_into_page_y(gallery_block, inbox)

#     def create_block_for_bookmark(idx, bk):
#         block = create_block("", reference=bk)
#         block.created_at = inbox_urls[idx].created_at
#         block.parent_block_id = gallery_block.id
#         block.ancestor_page_id = inbox.id
#         return block
#     blocks = [create_block_for_bookmark(i, bk) for i, bk in enumerate(bookmarks)]
#     db.session.flush()
# 
 #     print("Inbox is ", inbox.id)

def create_bookmark(*args, collection, **kwargs):
    bk = Bookmark(*args, **kwargs)
    bl = create_block("", reference=bk, collection=collection)
    db.session.add(bk)
    db.session.add(bl)
    return bk

import random

def init_db():
    db.create_all()

    db.session.add(Counter(counter=0))
    db.session.commit()

    collection1 = create_collection("Home collection")
    collection1.id = "cl_home"

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
    all = {x.id: x for x in q.all()}
    print(all)

    for b in bookmarks:
        print(b.block)

    # def print_tree(block, indent=0):
    #     print("  " * indent, end='')
    #     print(block)
    #     if block.first_child_id:
    #         print_siblings(block.first_child_id, indent+1)

    # def print_siblings(block_id, indent=0):
    #     child_id = block_id
    #     while child_id:
    #         print_tree(all[child_id], indent)
    #         child_id = all[child_id].next_sibling_id

    # for block in all.values():
    #     print(block)
    #     print(" page", getattr(block, 'page', None))
    #     print(" bookmark", getattr(block, 'bookmark', None))
    #     print(" ancestor_page_id", block.ancestor_page_id)
    #     try:
    #         print(" block.page.first_child_id", block.page.first_child_id)
    #     except:
    #         pass
    #     try:
    #         print(" block.next_sibling_id", block.next_sibling_id)
    #     except:
    #         pass
    #     # if getattr(block, 'page'):
    #     #     print("  " * 1, end='')
    #     #     print(block.page)
    #     #     if block.page.first_child_id:
    #     #         print_siblings(block.page.first_child_id, 1)
    #     print("")



    # print([getattr(getattr(x, 'bookmark_ref', None),'bookmark',None) for x in all])


def add_block(context, page_id, contents):
    block = create_block(contents)
    block.ancestor_page_id = page_id

    page = (
        db.session.query(Page).
        filter_by(id=page_id)
    ).one()

    context.block_id = block.id

    db.session.flush()

def edit_block(context, block_id, contents):

    block = (
        db.session.query(Block).
        filter_by(id=block_id)
    ).one()

    block.contents = contents

    db.session.flush()

def delete_blocks(context, page_id, block_ids):

    page = (
        db.session.query(Page).
        filter_by(id=page_id)
    ).one()

    blocks = (
        db.session.query(Block).
        filter(Block.id.in_(block_ids))
    ).all()
    blocks_by_id = {block.id: block for block in blocks}

    before_blocks = (
        db.session.query(Block).
        filter(Block.next_sibling_id.in_(block_ids))
    ).all()
    only_before_blocks = [block for block in before_blocks if not blocks_by_id.get(block.id)]

    next_sibling_id = page.first_child_id
    while next_sibling_id and blocks_by_id.get(next_sibling_id):
        next_sibling_id = blocks_by_id.get(next_sibling_id).next_sibling_id
    page.first_child_id = next_sibling_id

    for block in only_before_blocks:
        next_sibling_id = block.next_sibling_id
        while next_sibling_id and blocks_by_id.get(next_sibling_id):
            next_sibling_id = blocks_by_id.get(next_sibling_id).next_sibling_id
        block.next_sibling_id = next_sibling_id



    db.session.flush()

edit_funcs = {
    # 'move_after': move_after,
    # 'move_to_top': move_to_top,
    'add_block': add_block,
    'edit_block': edit_block,
    'delete_blocks': delete_blocks,
}

class Context:
    block_id = None

def handle_request(edits):
    context = Context()

    for edit in edits:
        typ = edit.pop('type')
        func = edit_funcs[typ]
        
        if not edit.get('block_id'):
            if 'block_id' in func.__code__.co_varnames:
                edit['block_id'] = context.block_id

        print(typ, edit)
        func(context, **edit)
    
    db.session.commit()
    return {
        'block_id': context.block_id
    }