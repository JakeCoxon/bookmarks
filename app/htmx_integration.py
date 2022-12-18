import flask
from functools import wraps
from functools import partial
from app import app
from flask import render_template, request, flash, make_response, get_flashed_messages, Markup
from flask import json

def htmx_optional(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        code = 200
        body = f(*args, **kwargs)
        if type(body) is tuple:
            body, code = body
        return htmx_wrap_layout(body), code
    return decorated_function

def htmx_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.headers.get('HX-Request'):
            return "HTMX request required", 400

        return f(*args, **kwargs)
    return decorated_function

def htmx_wrap_layout(content):
    is_hx = request.headers.get('HX-Request')
    if is_hx:
        return content
    return render_template('html_layout.html', content=Markup(content))


def htmx_redirect(url):
    resp = flask.Response("")
    resp.headers['HX-Location'] = url
    return resp

@app.after_request
def add_toasts(response):

    is_hx = request.headers.get('HX-Request')

    messages = get_flashed_messages()
    if is_hx and messages:
        data = {'showToasts': messages}
        response.headers['HX-Trigger'] = json.dumps(data)

    return response

class Toast:
    classes = "rounded px-4 py-4 mb-4 mr-6 flex items-center justify-center text-white shadow-lg cursor-pointer"
    markup = Markup("""<div class="%(status_class)s %(classes)s">%(html)s</div>""")

    def __init__(self, status_class, html):
        self.status_class = status_class
        self.html = html

    def __html__(self):
        return self.markup % { 'status_class': self.status_class, 
            'classes': self.classes, 'html': self.html}

Toast.success = staticmethod(partial(Toast, 'bg-emerald-600'))
Toast.info = staticmethod(partial(Toast, 'bg-blue-600'))
Toast.warning = staticmethod(partial(Toast, 'bg-orange-600'))
Toast.error = staticmethod(partial(Toast, 'bg-chestnut-600'))