import re
import json
from app import db
from app.models import BasicData, Url
from datetime import timezone
import datetime

def do_import():
    with open('/Users/jakecoxon/Dev/scripts/whatsapp-data.json') as f:
        data = json.load(f)

    for data, contents in data:
        m = re.search('\d?\d:\d\d .., \d\d\/\d\d/\d\d\d\d', data)
        date = m.group(0)

        date = datetime.datetime.strptime(
            date, "%H:%M %p, %d/%m/%Y"
        ).replace(tzinfo=timezone.utc)

        thing = BasicData(contents=contents, created_at=date)

        db.session.add(thing)
    db.session.commit()

URL_PATTERN = r'[A-Za-z0-9]+://[A-Za-z0-9%-_]+(/[A-Za-z0-9%-_])*(#|\\?)[A-Za-z0-9%-_&=]*'

def fetch_metadata(urls):
    import os

    urls_string = " ".join([f'"{x}"' for x in urls])
    stream = os.popen(f'node fetch/fetch.js {urls_string}')
    output = stream.read()
    # print(output)
    return json.loads(output)

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
                    continue

                if 'instagram.com' in url:
                    continue

                to_scape_urls.append({ 'data': data, 'url': url })

            except Exception as e:
                print("Could not handle url ", url)
                print("Contents", data.contents)
                print(e)

    # print(to_scape_urls)

    for chunk in chunks(to_scape_urls, 10):
        urls = [x['url'] for x in chunk]
        # print(urls)
        json_output = fetch_metadata(urls)

        for i, metadata in enumerate(json_output):

            url = chunk[i]['url']
            caption = chunk[i]['data'].contents

            if 'error' in metadata:
                print(caption)
                print(metadata)
                print("")
                continue
            
            print(caption)
            print(metadata)
            print("")

            url_obj = Url(url=url, meta=json.dumps(metadata), caption=caption)
            db.session.add(url_obj)

        db.session.commit()
        