from app import db
from app.models import User, Page, Block, Bookmark, Counter, Url

def create_page(title):
    page = Page(title=title)

    db.session.add(page)
    return page


def create_block(contents, reference=None):
    block = Block(contents=contents)
    if reference:
        block.set_reference(reference)

    db.session.add(block)
    return block

def insert_x_into_page_y(block, into_page):
    if block.page:
        block.parent_page_id = into_page.id
        # original_next_id = into_page.first_child_id
        # into_page.first_child_id = obj.id
        # obj.next_sibling_id = original_next_id

    # block = obj.block
    
    original_child_id = into_page.first_child_id
    into_page.first_child_id = block.id
    block.next_sibling_id = original_child_id

    block.ancestor_page_id = into_page.id

def insert_x_after_y(block, after_block):
    after_block = after_block

    if block.page:
        block.parent_page_id = after_block.ancestor_page_id
    
    block.ancestor_page_id = after_block.ancestor_page_id

    original_next_id = after_block.next_sibling_id
    after_block.next_sibling_id = block.id
    block.next_sibling_id = original_next_id

def create_inbox():
    import json

    inbox = create_page("Inbox")

    inbox_urls = db.session.query(Url).all()
    def create_bookmark_from_url(url):
        m = json.loads(url.meta)
        bk = Bookmark(url=m['url'], title=m['title'], description=m['description'],
            caption=url.caption, logo=m['logo'], image=m['image'])
        db.session.add(bk)
        return bk
    
    bookmarks = [
        create_bookmark_from_url(url)
        for url in inbox_urls
    ]
    db.session.flush()

    blocks = [create_block("", reference=bk) for bk in bookmarks]
    db.session.flush()

    if blocks:
        insert_x_into_page_y(blocks[0], inbox)
        last = blocks[0]
        for b in blocks:
            insert_x_after_y(b, last)
            last = b

    db.session.flush()
    print("Inbox is ", inbox.id)


def init_db():
    db.create_all()

    db.session.add(Counter(counter=0))
    db.session.commit()

    page1 = create_page("Home page")

    bk3 = Bookmark(title="cool bookmark", description="here", url="http://cool.com")
    db.session.add(bk3)

    page2 = create_page("Sub page 1")
    page3 = create_page("Sub page 2")
    page4 = create_page("Sub page 3")
    db.session.flush()

    b2 = create_block("", reference=page2)
    b3 = create_block("", reference=page3)
    b4 = create_block("", reference=page4)
    b5 = create_block("Cool")
    b6 = create_block("Cool", reference=bk3)
    b7 = create_block("Unlinked 1")
    b8 = create_block("Unlinked 1")
    db.session.flush()
    
    insert_x_into_page_y(b2, page1)
    insert_x_after_y(b3, b2)
    insert_x_after_y(b4, b3)
    insert_x_after_y(b5, b4)
    insert_x_after_y(b6, b5)

    b7.ancestor_page_id = page1.id
    b8.ancestor_page_id = page1.id
    
    create_inbox()

    db.session.commit()

    print(db.session.query(Page).all())
    print(db.session.query(Block).all())
    print(db.session.query(Bookmark).all())

    q = (
        db.session.query(Block)
        # outerjoin(Page, Page.id == Block.id)
        # outerjoin(Block.bookmark_ref)
    )
    print(q)
    all = {x.id: x for x in q.all()}
    print(all)

    def print_tree(block, indent=0):
        print("  " * indent, end='')
        print(block)
        if block.first_child_id:
            print_siblings(block.first_child_id, indent+1)

    def print_siblings(block_id, indent=0):
        child_id = block_id
        while child_id:
            print_tree(all[child_id], indent)
            child_id = all[child_id].next_sibling_id

    for block in all.values():
        print(block)
        print(" page", getattr(block, 'page', None))
        print(" bookmark", getattr(block, 'bookmark', None))
        print(" ancestor_page_id", block.ancestor_page_id)
        try:
            print(" block.page.first_child_id", block.page.first_child_id)
        except:
            pass
        try:
            print(" block.next_sibling_id", block.next_sibling_id)
        except:
            pass
        # if getattr(block, 'page'):
        #     print("  " * 1, end='')
        #     print(block.page)
        #     if block.page.first_child_id:
        #         print_siblings(block.page.first_child_id, 1)
        print("")



    # print([getattr(getattr(x, 'bookmark_ref', None),'bookmark',None) for x in all])

def move_to_top(context, block_id):
    block = (
        db.session.query(Block).
        filter_by(id=block_id)
    ).one()

    page = (
        db.session.query(Page).
        filter_by(id=block.ancestor_page_id)
    ).one()

    before = (
        db.session.query(Block).
        filter_by(next_sibling_id=block_id)
    ).first()

    if before: # Unlink
        before.next_sibling_id = block.next_sibling_id

    if page.first_child_id != block.id:
        block.next_sibling_id = page.first_child_id
        page.first_child_id = block.id

    db.session.flush()

def move_after(context, block_id, after_id):
    block = (
        db.session.query(Block).
        filter_by(id=block_id)
    ).one()

    after = (
        db.session.query(Block).
        filter_by(id=after_id)
    ).one()

    before = (
        db.session.query(Block).
        filter_by(next_sibling_id=block_id)
    ).first()

    if before: # Unlink
        before.next_sibling_id = block.next_sibling_id
    else:
        page = (
            db.session.query(Page).
            filter_by(id=block.ancestor_page_id)
        ).one()
        if page.first_child_id == block.id:
            page.first_child_id = block.next_sibling_id

    original_next_id = after.next_sibling_id
    after.next_sibling_id = block.id
    block.next_sibling_id = original_next_id

    db.session.flush()

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
    'move_after': move_after,
    'move_to_top': move_to_top,
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