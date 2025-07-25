import { useState } from "react";
import UserProfile from "@/components/user-profile";
import TopicsGrid from "@/components/topics-grid";
import TopicModal from "@/components/topic-modal";
import AddTopicModal from "@/components/add-topic-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">LeetCode Tracker</h1>
              <span className="text-muted-foreground text-sm">
                Organize your practice by topic
              </span>
            </div>
            
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md mx-8">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search topics or problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button 
              onClick={() => setIsAddTopicModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Topic</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserProfile onUserUpdate={setCurrentUser} />
        <TopicsGrid 
          searchQuery={searchQuery}
          userId={currentUser?.id}
          onTopicClick={setSelectedTopicId}
        />
      </main>

      {/* Modals */}
      <TopicModal
        topicId={selectedTopicId}
        isOpen={!!selectedTopicId}
        onClose={() => setSelectedTopicId(null)}
      />
      
      <AddTopicModal
        isOpen={isAddTopicModalOpen}
        onClose={() => setIsAddTopicModalOpen(false)}
        userId={currentUser?.id}
      />
    </div>
  );
}
