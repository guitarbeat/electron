import React from "react";
import { 
  Film, 
  MapPin, 
  MessageSquare, 
  StickyNote, 
  Settings2, 
  Dices, 
  Lock,
  Search,
  ArrowRight,
  User,
  Heart
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SoftEditorial() {
  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#2d2520] font-sans selection:bg-[#c4533a]/20 flex flex-col">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        
        .font-serif {
          font-family: 'Playfair Display', serif;
        }
        .font-sans {
          font-family: 'DM Sans', sans-serif;
        }
      `}} />

      {/* Top Navigation Strip */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#2d2520]/10">
        {/* Left Cluster */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2d2520] text-[#faf8f3]">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <div className="w-[1px] h-6 bg-[#2d2520]/20"></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2">
              <Avatar className="w-8 h-8 border-2 border-[#faf8f3]">
                <AvatarImage src="https://i.pravatar.cc/150?u=aaron" />
                <AvatarFallback className="bg-[#7a9e7e] text-white text-xs">A</AvatarFallback>
              </Avatar>
              <Avatar className="w-8 h-8 border-2 border-[#faf8f3]">
                <AvatarImage src="https://i.pravatar.cc/150?u=electra" />
                <AvatarFallback className="bg-[#c4533a] text-white text-xs">E</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex items-center gap-1.5 bg-[#2d2520]/5 px-2.5 py-1 rounded-full border border-[#2d2520]/10">
              <Lock className="w-3 h-3 text-[#c4533a]" />
              <span className="text-[11px] font-medium tracking-wide uppercase text-[#2d2520]/70">Pin Locked</span>
            </div>
          </div>
        </div>

        {/* Center Cluster */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-6 text-sm font-medium">
            <button className="flex items-center gap-2 text-[#c4533a]">
              <Film className="w-4 h-4" />
              <span>Movies</span>
            </button>
            <div className="w-1 h-1 rounded-full bg-[#2d2520]/30"></div>
            <button className="flex items-center gap-2 text-[#2d2520]/50 hover:text-[#2d2520] transition-colors">
              <MapPin className="w-4 h-4" />
              <span>Places</span>
            </button>
          </div>
          <p className="text-[11px] text-[#2d2520]/50 uppercase tracking-widest">Guest mode — Watchlist is ready</p>
        </div>

        {/* Right Cluster */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-full border-[#2d2520]/10 bg-transparent hover:bg-[#2d2520]/5 text-[#2d2520] gap-2 font-normal">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Messages</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-full border-[#2d2520]/10 bg-transparent hover:bg-[#2d2520]/5 text-[#2d2520] gap-2 font-normal">
            <StickyNote className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Notes</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-full border-[#2d2520]/10 bg-transparent hover:bg-[#2d2520]/5 text-[#2d2520] gap-2 font-normal">
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Edit Quiz</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-full border-[#c4533a]/20 bg-[#c4533a]/5 hover:bg-[#c4533a]/10 text-[#c4533a] gap-2 font-normal">
            <Dices className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Spin & Match</span>
          </Button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-semibold tracking-[0.2em] text-[#7a9e7e] uppercase">
              Movies Workspace
            </h2>
            <h1 className="font-serif text-5xl md:text-7xl font-medium tracking-tight text-[#2d2520]">
              Watchlist
            </h1>
            <p className="text-[#2d2520]/60 text-lg md:text-xl font-light max-w-md mx-auto leading-relaxed">
              Guest mode can still add titles and send suggestions for the evening.
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Queue Section */}
      <footer className="mt-auto border-t border-[#2d2520]/10 bg-[#faf8f3]">
        <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-1.5 max-w-sm">
            <h3 className="font-serif text-2xl font-medium text-[#2d2520]">Shared Queue</h3>
            <p className="text-sm text-[#2d2520]/60">Send a title to the queue to review together later.</p>
          </div>
          
          <div className="flex-1 w-full md:max-w-md">
            <div className="relative group flex items-center">
              <div className="absolute left-4 text-[#2d2520]/40 group-focus-within:text-[#c4533a] transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <Input 
                placeholder="Add a movie or show title..." 
                className="w-full pl-11 pr-12 h-14 rounded-full border-[#2d2520]/20 bg-white/50 focus-visible:ring-1 focus-visible:ring-[#c4533a] focus-visible:border-[#c4533a] placeholder:text-[#2d2520]/30 text-base shadow-sm backdrop-blur-sm transition-all"
              />
              <Button 
                size="icon" 
                className="absolute right-2 h-10 w-10 rounded-full bg-[#c4533a] hover:bg-[#c4533a]/90 text-white shadow-md transition-transform active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
