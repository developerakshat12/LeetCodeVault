import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TOPIC_COLORS } from "@/lib/constants";

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export default function AddTopicModal({ isOpen, onClose, userId }: AddTopicModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTopicMutation = useMutation({
    mutationFn: async (topicData: any) => {
      const response = await apiRequest("POST", "/api/topics", topicData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Topic created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to create topic",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedColor("blue");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Topic name is required",
        variant: "destructive",
      });
      return;
    }

    createTopicMutation.mutate({
      name: name.trim(),
      description: description.trim() || null,
      color: selectedColor,
      isCustom: 1,
      userId: userId || null,
    });
  };

  const colorOptions = Object.keys(TOPIC_COLORS);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Topic</DialogTitle>
          <DialogDescription>
            Create a custom topic to organize your LeetCode problems.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="topic-name">Topic Name</Label>
            <Input
              id="topic-name"
              type="text"
              placeholder="e.g., Binary Search"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="topic-description">Description</Label>
            <Textarea
              id="topic-description"
              placeholder="Brief description of this topic..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Color Theme</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded ${TOPIC_COLORS[color]} ${
                    selectedColor === color ? "ring-2 ring-foreground ring-offset-2" : ""
                  }`}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createTopicMutation.isPending}
              className="flex-1"
            >
              {createTopicMutation.isPending ? "Creating..." : "Create Topic"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
