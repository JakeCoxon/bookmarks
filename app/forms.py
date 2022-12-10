from flask import Markup
from flask_wtf import FlaskForm
from wtforms import StringField, HiddenField, TextAreaField, RadioField
from wtforms.widgets.core import ListWidget, RadioInput
from wtforms.validators import InputRequired
from wtforms.meta import DefaultMeta

class UserForm(FlaskForm):
    name = StringField('Name', validators=[InputRequired()])
    email = StringField('Email', validators=[InputRequired()])


class AlpineMeta(DefaultMeta):

    def render_field(self, field, render_kw):
        """See https://github.com/wtforms/wtforms/blob/2.2.1/wtforms/meta.py"""

        other_kw = getattr(field, 'render_kw', None)
        if other_kw is not None:
            render_kw = dict(other_kw, **render_kw)

        height = render_kw.pop('height', None)
        if height:
            render_kw['style'] = f"height: {height};"

        if not isinstance(field.widget, ListWidget):
            render_kw['x-model'] = field.name

        return field.widget(field, **render_kw)

def ColorRadio(field, **kwargs):
    value = field._value()
    return Markup(f"""
        <input x-model="{field.name}" type="radio" value="{value}" id="{field.id}" hidden />
        <label for="{field.id}" class="colorradio">
            <div class="colorradio-inner colorstyle-{value}"></div>
        </label>
    """)

def ColorContainer(field, **kwargs):
    html = []
    for subfield in field:
        html.append(f"""{subfield()}""")
    markup = f"""<div class="flex flex-row gap-4">{"".join(html)}</div>"""
    return Markup(markup)

ColorField = RadioField('Color',
    widget=ColorContainer,
    option_widget=ColorRadio,
    choices=[
        ('gradient1', ''),
        ('gradient2', ''),
        ('gradient3', ''),
        ('gradient4', ''),
        ('gradient5', ''),
    ])

class BookmarkForm(FlaskForm):

    Meta = AlpineMeta

    id = HiddenField('')
    collection_id = HiddenField('')
    url = StringField('URL')
    title = StringField('Title')
    color = ColorField

    image = StringField('Image')
    desc = TextAreaField('Description', render_kw={'height': '250px'})
    notes = TextAreaField('Notes', render_kw={'height': '250px'})

    @classmethod
    def from_block(cls, block, **kwargs):
        return cls(data={
            'id': block.id,
            'collection_id': block.ancestor_collection_id,
            'color': block.color,
            'url': block.bookmark.url,
            'title': block.bookmark.title,
            'desc': block.bookmark.description,
            'notes': block.bookmark.notes,
            'image': block.bookmark.image,
        }, **kwargs)

class NoteForm(FlaskForm):

    Meta = AlpineMeta

    id = HiddenField('')
    collection_id = HiddenField('')
    color = ColorField
    contents = TextAreaField('Content', render_kw={'height': '400px'})

    @classmethod
    def from_block(cls, block, **kwargs):
        return cls(data={
            'id': block.id,
            'collection_id': block.ancestor_collection_id,
            'color': block.color,
            'contents': block.contents,
        }, **kwargs)
