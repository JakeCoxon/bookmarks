from app import db
from sqlalchemy.orm import backref
from sqlalchemy import select
from sqlalchemy.sql import expression, functions
import sqlalchemy
from datetime import datetime

class BasicData(db.Model):
    __tablename__ = 'basicdata'
    __bind_key__ = 'basic'
    id = db.Column(db.Integer(), primary_key=True)
    contents = db.Column(db.Text())

    created_at = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return '<BasicData %r>' % self.id

class Url(db.Model):
    __tablename__ = 'urls'
    __bind_key__ = 'basic'
    id = db.Column(db.Integer(), primary_key=True)
    url = db.Column(db.Text())
    meta = db.Column(db.Text())
    caption = db.Column(db.Text())

    created_at = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return '<BasicData %r>' % self.id

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(255), primary_key=True)
    name = db.Column(db.String(255))
    email = db.Column(db.String(255), unique=True)

    collections = db.relationship("Collection")

    def __repr__(self):
        return '<User %r>' % self.name

class Counter(db.Model):
    __tablename__ = 'counters'

    id = db.Column(db.Integer, primary_key=True)
    counter = db.Column(db.Integer)

def default_id(prefix):
    def generate_new_id():
        m = db.session.query(Counter).first()
        c = m.counter
        db.session.query(Counter).update({'counter': Counter.counter + 1})
        return f"{prefix}{c}"
    return generate_new_id

class Block(db.Model):
    __tablename__ = 'blocks'
    id = db.Column(db.String(255), primary_key=True, default=default_id('bl_'))
    contents = db.Column(db.Text())

    reference_id = db.Column(db.String(255))

    # collection = db.relationship(
    #     "Collection",
    #     primaryjoin=(
    #         "foreign(Collection.id)==Block.reference_id"
    #     ),
    #     backref="block",
    #     uselist=False
    # )

    bookmark = db.relationship(
        "Bookmark",
        primaryjoin=(
            "foreign(Bookmark.id)==Block.reference_id"
        ),
        backref="block",
        uselist=False
    )

    # gallery = db.relationship(
    #     "Gallery",
    #     primaryjoin=(
    #         "foreign(Gallery.id)==Block.reference_id"
    #     ),
    #     backref="block",
    #     uselist=False
    # )

    def set_reference(self, reference):
        self.reference_id = reference.id
        reference.block = self
        # if isinstance(reference, Page):
        #     self.page = reference
        if isinstance(reference, Bookmark):
            self.bookmark = reference
        # elif isinstance(reference, Gallery):
        #     self.gallery = reference

    ancestor_collection_id = db.Column(db.String(255), db.ForeignKey("collections.id"))

    # first_child_id = db.Column(db.String(255), db.ForeignKey("blocks.id"))
    # next_sibling_id = db.Column(db.String(255), db.ForeignKey("blocks.id"))

    # parent_block_id = db.Column(db.String(255), db.ForeignKey("blocks.id"))
    # block_children = db.relationship("Block", foreign_keys=[parent_block_id])
    # parent_block = db.relationship("Block", foreign_keys=[parent_block_id], remote_side=[id], back_populates="block_children")

    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    @property
    def block(self):
        return self

    def __repr__(self):
        return '<Block %r reference=%r created_at=%r>' % (self.id, self.reference_id, self.created_at)

class Collection(db.Model):
    __tablename__ = 'collections'
    id = db.Column(db.String(255), primary_key=True, default=default_id('cl_'))
    title = db.Column(db.String(1024))

    # first_child_id = db.Column(db.String(255), db.ForeignKey("blocks.id"))
    
    # parent_page_id = db.Column(db.String(255), db.ForeignKey("pages.id"))
    # page_children = db.relationship("Page")
    # parent_page = db.relationship("Page", remote_side=[id], back_populates="page_children")

    # locked = db.Column(db.Boolean, default=False)

    owner = db.Column(db.String(255), db.ForeignKey("users.id"))

    def __repr__(self):
        return '<Collection %r parent=%r>' % (self.id, 0)

class Bookmark(db.Model):
    __tablename__ = 'bookmarks'
    id = db.Column(db.String(255), primary_key=True, default=default_id('bk_'))
    url = db.Column(db.Text())
    title = db.Column(db.Text())
    description = db.Column(db.Text())
    image = db.Column(db.Text())
    logo = db.Column(db.Text())
    caption = db.Column(db.Text())

    def __repr__(self):
        return '<Bookmark %r url=%r>' % (self.id, self.url)

# class Gallery(db.Model):
#     __tablename__ = 'galleries'
#     id = db.Column(db.String(255), primary_key=True, default=default_id('gl_'))
    
#     def __repr__(self):
#         return '<Gallery %r>' % (self.id, self.url)
