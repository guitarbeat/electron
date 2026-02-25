import re

with open('App.tsx', 'r') as f:
    content = f.read()

# Let's replace the whole 'case' block by finding unique markers
start_marker = "case 'quiz':"
end_marker = "break;" # Wait, it's a switch inside renderContent, so it returns directly.
# It ends with ')' followed by ';'
# Let's use string methods instead of regex for safety if unique.

start_idx = content.find(start_marker)
if start_idx != -1:
    # Find the matching return statement
    return_start = content.find("return", start_idx)
    # Find the end of the return statement (semicolon)
    # The return statement has nested parens, so simple find(';') might fail if inside string
    # But here it's likely safe.
    # Actually, let's just replace the exact string from read_file output earlier.

    snippet = r'''      case 'quiz':
        return (
          <div className="animate-fade-in">
            {showQuiz && quizData ? (
              <QuizFlow quizData={quizData} onComplete={handleQuizComplete} />
            ) : showQuizEditor ? (
              <QuizEditor onClose={() => setShowQuizEditor(false)} />
            ) : (
              <ExtrasHub
                currentUser={currentUser}
                quizCompleted={quizCompleted}
                onStartQuiz={handleStartQuiz}
                onRetakeQuiz={handleRetakeQuiz}
                onOpenQuizEditor={handleOpenQuizEditor}
                initialView="quiz"
              />
            )}
          </div>
        );'''

    replacement = r'''      case 'quiz': {
        let content;
        if (showQuiz && quizData) {
          content = <QuizFlow quizData={quizData} onComplete={handleQuizComplete} />;
        } else if (showQuizEditor) {
          content = <QuizEditor onClose={() => setShowQuizEditor(false)} />;
        } else {
          content = (
            <ExtrasHub
              currentUser={currentUser}
              quizCompleted={quizCompleted}
              onStartQuiz={handleStartQuiz}
              onRetakeQuiz={handleRetakeQuiz}
              onOpenQuizEditor={handleOpenQuizEditor}
              initialView="quiz"
            />
          );
        }
        return <div className="animate-fade-in">{content}</div>;
      }'''

    # Normalize newlines and spaces to try matching
    # Since I don't have the exact bytes, this is risky.
    # Better approach: Read the file, identify line numbers for 'case quiz', and overwrite those lines.

    lines = content.split('\n')
    start_line = -1
    end_line = -1

    for i, line in enumerate(lines):
        if "case 'quiz':" in line:
            start_line = i
        if start_line != -1 and "initialView=\"quiz\"" in line:
             # Assume end is close
             pass
        if start_line != -1 and line.strip() == ");" and i > start_line + 10:
             end_line = i
             break

    if start_line != -1 and end_line != -1:
        # Construct new lines
        new_lines = lines[:start_line] + [
            "      case 'quiz': {",
            "        let content;",
            "        if (showQuiz && quizData) {",
            "          content = <QuizFlow quizData={quizData} onComplete={handleQuizComplete} />;",
            "        } else if (showQuizEditor) {",
            "          content = <QuizEditor onClose={() => setShowQuizEditor(false)} />;",
            "        } else {",
            "          content = (",
            "            <ExtrasHub",
            "              currentUser={currentUser}",
            "              quizCompleted={quizCompleted}",
            "              onStartQuiz={handleStartQuiz}",
            "              onRetakeQuiz={handleRetakeQuiz}",
            "              onOpenQuizEditor={handleOpenQuizEditor}",
            "              initialView=\"quiz\"",
            "            />",
            "          );",
            "        }",
            "        return <div className=\"animate-fade-in\">{content}</div>;",
            "      }",
        ] + lines[end_line+1:]

        with open('App.tsx', 'w') as f:
            f.write('\n'.join(new_lines))
        print("Replacement successful via line replacement.")
    else:
        print(f"Could not find start/end lines. Start: {start_line}, End: {end_line}")
