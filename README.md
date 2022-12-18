# Bookmarks

WIP bookmarks thing

## Instructions
As always ensure you create a virtual environment for this application and install
the necessary libraries from the `requirements.txt` file.

```
$ virtualenv venv
$ source venv/bin/activate
$ pip install -r requirements.txt
```

Start the development server

```
$ python run.py
```

## Init DB

First init
```rm mydatabase.db; echo "from scripts.init_db import init_db; init_db()" | python3 -```

Do import 
```echo "from scripts.do_import import do_import; do_import()" | python3 -```