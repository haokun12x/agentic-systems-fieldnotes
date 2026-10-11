#!/usr/bin/env python3
"""Refresh the three generated section blocks in the buildless homepage."""
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parent.parent
MODULES = ('journey', 'mechanisms', 'protocol')
START, END = '<!-- INTERACTIVE_ATLAS_START -->', '<!-- INTERACTIVE_ATLAS_END -->'

class IdCheck(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key == 'id':
                if value in self.ids:
                    raise ValueError(f'Duplicate HTML id: {value}')
                self.ids.add(value)

page = ROOT / 'dist/index.html'
text = page.read_text()
parts = [(ROOT / 'src/sections' / f'{name}.html').read_text().strip() for name in MODULES]
block = START + '\n' + '\n\n'.join(parts) + '\n    ' + END
if '<!-- INTERACTIVE_ATLAS -->' in text:
    text = text.replace('<!-- INTERACTIVE_ATLAS -->', block)
else:
    before, remainder = text.split(START, 1)
    _, after = remainder.split(END, 1)
    text = before + block + after
for name in MODULES:
    css = f'  <link rel="stylesheet" href="./{name}.css">'
    js = f'  <script src="./{name}.js" defer></script>'
    if css not in text:
        text = text.replace('</head>', css + '\n' + js + '\n</head>')
IdCheck().feed(text)
page.write_text(text)
print('Assembled 3 interactive sections; HTML IDs are unique.')
