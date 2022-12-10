# echo "from scripts.clean_whatsapp import do_convert; do_convert()" | python3 -

import re
import json
from datetime import timezone
import datetime

URL_PATTERN = r'[A-Za-z0-9]+://([A-Za-z0-9%\.\-_]+)(/[A-Za-z0-9%\-\._])*(#|\\?)[A-Za-z0-9%-\_\.&=]*'
input_file = "/Users/jake/odrive/Jake personal/Five laptop backup/allfiles/scripts/whatsapp-data.json"

def do_convert():
    with open(input_file) as f:
        data = json.load(f)

    output_data = []
    try:
        for date, contents in data:
            m = re.search('\d?\d:\d\d .., \d\d\/\d\d/\d\d\d\d', date)
            fmt = "%H:%M %p, %d/%m/%Y"
            if not m:
                m = re.search('\d\d:\d\d, \d\d\/\d\d/\d\d\d\d', date)
                fmt = "%H:%M, %d/%m/%Y"

            date = m.group(0)
            date = datetime.datetime.strptime(
                date, fmt
            ).replace(tzinfo=timezone.utc)

            m = re.search(URL_PATTERN, contents)
            url = m and m.group(0)
            if url:
                contents = contents.replace(url, '')
                # remove some times where the host name is copied
                contents = contents.replace(m.group(1), '')
            contents = contents.strip()

            output_data.append({
                'timestamp': int(datetime.datetime.timestamp(date)),
                'url': url,
                'contents': contents
            })
    except Exception as e:
        print("Error", e)
        print(date)
        print(contents)
    
    with open("output.json", "w+") as f:
        json.dump(output_data, f, indent=2)
