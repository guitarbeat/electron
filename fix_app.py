import re

with open('App.tsx', 'r') as f:
    content = f.read()

# Fix nested ternary in 'quiz' case
old_quiz_block = r'''case 'quiz':
        return \(
          <div className="animate-fade-in">
            {showQuiz && quizData \? \(
              <QuizFlow quizData={quizData} onComplete={handleQuizComplete} />
            \) : showQuizEditor \? \(
              <QuizEditor onClose={\(\) => setShowQuizEditor\(false\)} />
            \) : \(
              <ExtrasHub
                currentUser={currentUser}
                quizCompleted={quizCompleted}
                onStartQuiz={handleStartQuiz}
                onRetakeQuiz={handleRetakeQuiz}
                onOpenQuizEditor={handleOpenQuizEditor}
                initialView="quiz"
              />
            \)}
          </div>
        \);'''

# Construct the new block using a helper variable
new_quiz_block = r'''case 'quiz':
        let quizContent;
        if (showQuiz && quizData) {
          quizContent = <QuizFlow quizData={quizData} onComplete={handleQuizComplete} />;
        } else if (showQuizEditor) {
          quizContent = <QuizEditor onClose={() => setShowQuizEditor(false)} />;
        } else {
          quizContent = (
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
        return <div className="animate-fade-in">{quizContent}</div>;'''

# Use regex to find and replace because of whitespace variations
# Actually, since I have the file content, I can match the structure more loosely or just rewrite the renderContent function logic slightly if I parse it well.
# Let's try a simpler approach: replace the specific block directly if exact match works, or use a more robust regex.

regex_pattern = r"case 'quiz':\s+return \(\s+<div className=\"animate-fade-in\">\s+\{showQuiz && quizData \? \(\s+<QuizFlow quizData=\{quizData\} onComplete=\{handleQuizComplete\} />\s+\) : showQuizEditor \? \(\s+<QuizEditor onClose=\{\(\) => setShowQuizEditor\(false\)\} />\s+\) : \(\s+<ExtrasHub\s+currentUser=\{currentUser\}\s+quizCompleted=\{quizCompleted\}\s+onStartQuiz=\{handleStartQuiz\}\s+onRetakeQuiz=\{handleRetakeQuiz\}\s+onOpenQuizEditor=\{handleOpenQuizEditor\}\s+initialView=\"quiz\"\s+/>\s+\)\}\s+</div>\s+\);"

replacement = r'''case 'quiz': {
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

new_content = re.sub(regex_pattern, replacement, content, flags=re.DOTALL)

if new_content == content:
    print("No replacement made! Check regex.")
else:
    with open('App.tsx', 'w') as f:
        f.write(new_content)
    print("Replacement successful.")
