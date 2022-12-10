from app import db
from sqlalchemy.orm import backref
from sqlalchemy import select
from sqlalchemy.sql import expression, functions
import sqlalchemy
from datetime import datetime

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
    _color = db.Column('color', db.String(255), default='gradient1')

    @property
    def color(self):
        return self._color or 'gradient1'

    @color.setter
    def color(self, value):
        self._color = value

    bookmark = db.relationship(
        "Bookmark",
        primaryjoin=(
            "foreign(Bookmark.id)==Block.reference_id"
        ),
        backref="block",
        uselist=False
    )

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

    blocks = db.relationship('Block', backref=db.backref('collection'), lazy='dynamic')

    owner = db.Column(db.String(255), db.ForeignKey("users.id"))
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    created_at = db.Column(db.DateTime, default=datetime.now)

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
    notes = db.Column(db.Text())

    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    created_at = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return '<Bookmark %r url=%r>' % (self.id, self.url)
