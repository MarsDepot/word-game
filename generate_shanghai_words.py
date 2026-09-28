import re
import random

# We will read from words_full.txt or embed/read the text
with open('words_full.txt', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(
    r'(\d+)\.\s+(.*?)\s+(\/[^\/]+\/)\s+\(([^)]+)\)\s+(.*?)\s+'
    r'例句:\s*(.*?)\s+'
    r'译文:\s*(.+?)(?=\n\s*\d+\.|\Z)',
    re.DOTALL
)

matches = pattern.findall(content)
print(f"Parsed {len(matches)} words successfully!")
