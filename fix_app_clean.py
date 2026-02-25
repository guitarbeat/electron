import re

with open('App.tsx', 'r') as f:
    lines = f.readlines()

# Locate the duplicated blocks
# It starts around line 108 in the provided output, repeating "} return <div...>{content}</div>; }"

# We want to keep the first valid block and remove the dupes.
# The structure should be:
# case 'quiz': { ... }
# case 'messages': ...

# Let's find the start of 'case messages'
start_messages_idx = -1
for i, line in enumerate(lines):
    if "case 'messages':" in line:
        start_messages_idx = i
        break

# Let's find the end of 'case quiz' block.
# It should end before 'case messages'.
# The dupes are between the end of the valid 'case quiz' and 'case messages'.

if start_messages_idx != -1:
    # Walk backwards to find the first closing brace of the case block
    # Actually, looking at the previous cat output:
    # 108: return <div ...>{content}</div>;
    # 109: }
    # 110: }
    # 111: return <div ...
    # ...

    # We want to remove lines from the first "}" (end of case quiz) until "case 'messages':"
    # But wait, the dupes are complete blocks of "return ...; }"

    # Let's verify the content around line 109 again with grep to be sure of line numbers
    pass

# Simplified approach: Read file, regex replace the repeated garbage.
with open('App.tsx', 'r') as f:
    content = f.read()

# The pattern of the garbage:
garbage = r'''        }
        return <div className="animate-fade-in">{content}</div>;
      }
'''
# We expect one occurrence, but there are multiple.
# We will replace all occurrences with a single one.

# Actually, the garbage might be slightly different in indentation or whitespace.
# Let's just find the range between "initialView=\"quiz\"" and "case 'messages':" and rewrite it.

start_marker = 'initialView="quiz"'
end_marker = "case 'messages':"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    # We need to keep the start_marker line (it's inside ExtrasHub props)
    # Then close the component: /> ); } return ...; }

    prefix = content[:start_idx]
    suffix = content[end_idx:]

    # Reconstruct the middle part
    middle = r'''initialView="quiz"
            />
          );
        }
        return <div className="animate-fade-in">{content}</div>;
      }
      '''

    new_content = prefix + middle + suffix

    with open('App.tsx', 'w') as f:
        f.write(new_content)
    print("Fixed App.tsx duplication.")
