with open("apps/web/src/components/quiz/index.tsx", "r") as f:
    content = f.read()

# Update pages useMemo
old_pages = """  const pages: PageFlipLeaf[] = useMemo(() => {
    return questions.map((q, i) => {
      const answer = answers.find(a => a.questionId === q.id);
      return {
        id: q.id,
        front: (
          <div className="flex h-full w-full flex-col bg-[#14151a] text-white overflow-hidden" style={{ borderRadius: "inherit" }}>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                 {renderQuestion(q, answer)}
             </div>
          </div>
        ),
        back: (
          <div className="flex h-full w-full flex-col bg-[#0f1115] text-slate-400 items-center justify-center border-l border-white/5" style={{ borderRadius: "inherit" }}>
             <div className="opacity-30">
                <div className="text-4xl font-bold mb-2">Q{i + 1}</div>
                <div className="text-sm tracking-widest uppercase">Completed</div>
             </div>
          </div>
        )
      };
    });
  }, [questions, answers, renderQuestion]);"""

new_pages = """  const pages: PageFlipLeaf[] = useMemo(() => {
    const allPages: PageFlipLeaf[] = [];

    // Page 0: Cover
    allPages.push({
      id: "cover",
      front: (
        <div className="flex h-full w-full flex-col bg-[#0d111a] text-white overflow-hidden items-center justify-center p-6 border-r border-white/10 relative" style={{ borderRadius: "inherit" }}>
           <div className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(135deg, #f472b6, #a855f7, #38bdf8)" }} />
           <div className="relative text-center z-10">
               <span className="text-xs uppercase tracking-widest text-slate-300 mb-2 block">Movie-night personality</span>
               <h2 className="text-3xl font-bold mb-4 text-white">Which character are you?</h2>
           </div>
        </div>
      ),
      back: (
        <div className="flex h-full w-full flex-col bg-[#0d111a] text-slate-300 p-6 border-l border-white/10 justify-center text-center" style={{ borderRadius: "inherit" }}>
           <div className="opacity-60">
             <p className="text-lg">Seven quick questions.</p>
             <p className="text-sm mt-2">Go with your first instinct.</p>
           </div>
        </div>
      )
    });

    questions.forEach((q, i) => {
      const answer = answers.find(a => a.questionId === q.id);
      allPages.push({
        id: q.id,
        front: (
          <div className="flex h-full w-full flex-col bg-[#0d111a] text-white border-r border-white/10 overflow-hidden" style={{ borderRadius: "inherit" }}>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                 {renderQuestion(q, answer)}
             </div>
          </div>
        ),
        back: (
          <div className="flex h-full w-full flex-col bg-[#0d111a] text-slate-400 items-center justify-center border-l border-white/10" style={{ borderRadius: "inherit" }}>
             <div className="opacity-30">
                <div className="text-4xl font-bold mb-2">Q{i + 1}</div>
                <div className="text-sm tracking-widest uppercase">Completed</div>
             </div>
          </div>
        )
      });
    });
    
    return allPages;
  }, [questions, answers, renderQuestion]);"""

content = content.replace(old_pages, new_pages)

with open("apps/web/src/components/quiz/index.tsx", "w") as f:
    f.write(content)
