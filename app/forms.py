from flask_wtf import FlaskForm
from wtforms import StringField, HiddenField, TextAreaField
from wtforms.validators import InputRequired

class UserForm(FlaskForm):
    name = StringField('Name', validators=[InputRequired()])
    email = StringField('Email', validators=[InputRequired()])


def bookmark_data_from_block(block):
    return 

class BookmarkForm(FlaskForm):

    id = HiddenField('')
    collection_id = HiddenField('')
    url = StringField('URL')
    title = StringField('Title')
    image = StringField('Image')
    desc = TextAreaField('Description', render_kw={'height': '250px'})
    notes = TextAreaField('Notes', render_kw={'height': '250px'})

    @classmethod
    def from_block(cls, block, **kwargs):
        return cls(data={
            'id': block.id,
            'collection_id': block.ancestor_collection_id,
            'url': block.bookmark.url,
            'title': block.bookmark.title,
            'desc': block.bookmark.description,
            'image': '',
            'notes': '',
        }, **kwargs)

class NoteForm(FlaskForm):

    id = HiddenField('')
    collection_id = HiddenField('')
    color = StringField('Color')
    contents = TextAreaField('Content', render_kw={'height': '400px'})

    @classmethod
    def from_block(cls, block, **kwargs):
        return cls(data={
            'id': block.id,
            'collection_id': block.ancestor_collection_id,
            'color': '',
            'contents': block.contents,
        }, **kwargs)
