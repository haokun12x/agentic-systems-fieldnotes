#!/usr/bin/env python3
"""Refresh implementation modules and the optional engineering reference."""
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parent.parent
# Reading order: overview, then Part I (behaviour), Part II (internals), Part III (design choices).
MODULES = ('overview',
           'part-1', 'journey', 'cases',
           'part-2', 'workspaces', 'control', 'protocol',
           'part-3', 'backends', 'patterns', 'compatibility', 'landscape')
# Numbered chapters, in order: (fragment, anchor, title shown in the "next chapter" link).
CHAPTERS = (('journey', 'request-lifecycle', 'The Agent loop'),
            ('cases', 'cases', 'Six real use cases'),
            ('workspaces', 'workspaces', 'Files & storage'),
            ('control', 'access-routing', 'Access & routing'),
            ('protocol', 'protocol', 'What crosses the wire'),
            ('backends', 'backend-routes', 'Backend routes'),
            ('patterns', 'agent-patterns', 'Agent strategies'),
            ('compatibility', 'compatibility', 'Deployment compatibility'),
            ('landscape', 'positioning', 'Where it fits'))
# Shared assets every page load needs, plus per-module assets when they exist in dist/.
SHARED = ('guide',)
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

def next_link(name):
    names = [c[0] for c in CHAPTERS]
    if name not in names:
        return ''
    i = names.index(name)
    if i + 1 < len(CHAPTERS):
        _, anchor, title = CHAPTERS[i + 1]
        label, target = f'{i + 2:02d} · {title}', f'#{anchor}'
    else:
        label, target = 'Optional reference labs', '#engineering-reference'
    return (f'\n<nav class="chapter-next shell" aria-label="Continue reading"><span>END OF CHAPTER {i + 1:02d}</span>'
            f'<a href="{target}">Next: <strong>{label}</strong> <b aria-hidden="true">→</b></a></nav>')

page = ROOT / 'dist/index.html'
text = page.read_text()
parts = [(ROOT / 'src/sections' / f'{name}.html').read_text().strip() + next_link(name) for name in MODULES]
block = START + '\n' + '\n\n'.join(parts) + '\n    ' + END
if '<!-- INTERACTIVE_ATLAS -->' in text:
    text = text.replace('<!-- INTERACTIVE_ATLAS -->', block)
else:
    before, remainder = text.split(START, 1)
    _, after = remainder.split(END, 1)
    text = before + block + after
reference = (ROOT / 'src/sections/mechanisms.html').read_text().strip()
reference = reference.replace('02 / MECHANISM ATLAS', 'REFERENCE / MECHANISM ATLAS')
reference = reference.replace('Eight mechanisms that make an agent system operable.', 'Eight general engineering mechanisms; conceptual models, not a claim of shipped functionality.')
a, rest = text.split('<!-- REFERENCE_MECHANISMS_START -->', 1)
_, b = rest.split('<!-- REFERENCE_MECHANISMS_END -->', 1)
text = a + '<!-- REFERENCE_MECHANISMS_START -->\n' + reference + '\n<!-- REFERENCE_MECHANISMS_END -->' + b
for name in (*MODULES, 'mechanisms', *SHARED):
    for ext, tag in (('css', f'  <link rel="stylesheet" href="./{name}.css">'), ('js', f'  <script src="./{name}.js" defer></script>')):
        if (ROOT / 'dist' / f'{name}.{ext}').exists() and tag not in text:
            text = text.replace('</head>', tag + '\n</head>')
IdCheck().feed(text)
page.write_text(text)
print(f'Assembled {len(MODULES)} main fragments ({len(CHAPTERS)} chapters) and the reference atlas; HTML IDs are unique.')
