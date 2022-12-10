# echo "from scripts.do_import import do_import; do_import()" | python3 -

import re
import json
from app import db
from app.models import Bookmark, Collection
from app.controller import create_bookmark
from datetime import timezone
import datetime

input_file = "/Users/jake/odrive/Jake personal/Five laptop backup/allfiles/scripts/whatsapp-data-clean.json"

def do_import():

    with open(input_file) as f:
        data = json.load(f)

    col = Collection()
    db.session.add(col)

    db.session.flush()

    bookmarks = []

    for row in data:

        bk = create_bookmark(title='', description=row['contents'], url=row['url'],
            collection=col)
        bk.block.created_at = datetime.datetime.fromtimestamp(row['timestamp'])
        bookmarks.append(bk)

        print(bk)

    print(col)

    db.session.flush()
    for bk in bookmarks:
        bk.block.set_reference(bk)

    db.session.commit()
    print(col)
