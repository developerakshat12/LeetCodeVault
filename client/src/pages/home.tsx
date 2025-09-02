import { useState } from "react";
import UserProfile from "@/components/user-profile";
import TopicsGrid from "@/components/topics-grid";
import TopicModal from "@/components/topic-modal";
import AddTopicModal from "@/components/add-topic-modal";
import SettingsModal from "@/components/settings-modal";
import ResponsiveNavbar from "@/components/responsive-navbar";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Responsive Header */}
      <ResponsiveNavbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        onAddTopicClick={() => setIsAddTopicModalOpen(true)}
        currentUser={currentUser}
        showSearch={true}
        title="LeetCode Tracker"
        subtitle="Organize your practice by topic"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6">
          <UserProfile onUserUpdate={setCurrentUser} />
          <TopicsGrid 
            searchQuery={searchQuery}
            userId={currentUser?.id}
            onTopicClick={setSelectedTopicId}
          />
        </div>
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

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userId={currentUser?.id}
      />
      
      <Toaster />
    </div>
  );
}
