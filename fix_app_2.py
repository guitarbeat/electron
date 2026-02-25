import re

with open('App.tsx', 'r') as f:
    content = f.read()

# Try matching just the nested ternary part
regex_pattern = r"\{showQuiz && quizData \? \(\s*<QuizFlow quizData=\{quizData\} onComplete=\{handleQuizComplete\} />\s*\) : showQuizEditor \? \(\s*<QuizEditor onClose=\{\(\) => setShowQuizEditor\(false\)\} />\s*\) : \(\s*<ExtrasHub[^>]*/>\s*\)\}"

replacement = r'''{(() => {
              if (showQuiz && quizData) {
                return <QuizFlow quizData={quizData} onComplete={handleQuizComplete} />;
              } else if (showQuizEditor) {
                return <QuizEditor onClose={() => setShowQuizEditor(false)} />;
              } else {
                return (
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
            })()}'''

# The ExtrasHub part has many props and might span multiple lines, let's make the regex more flexible for the ExtrasHub part
regex_pattern = r"\{showQuiz && quizData \? \(\s*<QuizFlow quizData=\{quizData\} onComplete=\{handleQuizComplete\} />\s*\) : showQuizEditor \? \(\s*<QuizEditor onClose=\{\(\) => setShowQuizEditor\(false\)\} />\s*\) : \(\s*<ExtrasHub[\s\S]*?/>\s*\)\}"

new_content = re.sub(regex_pattern, replacement, content)

if new_content == content:
    print("No replacement made! Check regex.")
else:
    with open('App.tsx', 'w') as f:
        f.write(new_content)
    print("Replacement successful.")
