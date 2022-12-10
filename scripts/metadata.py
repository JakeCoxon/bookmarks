import re
import json
from app import db
from app.models import BasicData, Url
from datetime import timezone
import datetime


def fetch_metadata(urls):
    import os

    urls_string = " ".join([f'"{x}"' for x in urls])
    stream = os.popen(f'node fetch/fetch.js {urls_string}')
    output = stream.read()
    # print(output)
    try:
        return json.loads(output)
    except Exception as e:
        print(e)
        print(output)
        raise e


def chunks(xs, n):
    n = max(1, n)
    return (xs[i:i+n] for i in range(0, len(xs), n))

def scrape():

    all_data = db.session.query(BasicData).all()
    all_urls = {x.url: x for x in db.session.query(Url).all()}

    to_scape_urls = []
    for data in all_data:
        if re.search('https?://', data.contents):
            url = ""
            try:
                m = re.search(URL_PATTERN, data.contents)
                url = m.group(0)
                if not url:
                    raise Error("Could not parse URL")

                if url in all_urls:
                    obj = all_urls[url]
                    obj.created_at = data.created_at
                    continue

                to_scape_urls.append({ 'data': data, 'url': url })

            except Exception as e:
                print("Could not handle url ", url)
                print("Contents", data.contents)
                print(e)

    db.session.commit()
    # print(to_scape_urls)

    for chunk in chunks(to_scape_urls, 10):
        urls = [x['url'] for x in chunk]
        # print(urls)
        json_output = fetch_metadata(urls)

        for i, metadata in enumerate(json_output):

            url = chunk[i]['url']
            caption = chunk[i]['data'].contents
            created_at = chunk[i]['data'].created_at

            if 'error' in metadata:
                print(caption)
                print(metadata)
                print("")
                continue
            
            print(caption)
            print(metadata)
            print("")

            url_obj = Url(url=url, meta=json.dumps(metadata), caption=caption,
                created_at=created_at)
            db.session.add(url_obj)

        db.session.commit()

        
def add_column(table, column_key):
    column = getattr(table, column_key)
    engine = db.get_engine(bind=table.__bind_key__)

    table_name = table.__table__.name
    column_name = column.compile(dialect=engine.dialect)
    column_type = column.type.compile(engine.dialect)
    query = 'ALTER TABLE %s ADD COLUMN %s %s' % (table_name, column_key, column_type)
    print(query)
    engine.execute(query)

def migrate():

    # column = Column('new_column_name', String(100), primary_key=True)
    # add_column(db.engine, table_name, column)
    # add_column(Url, 'created_at')
    pass