
import { storage } from "./db";

const defaultTopics = [
  { name: "Array", description: "Linear data structures and manipulation techniques", color: "blue", icon: "grid" },
  { name: "String", description: "String manipulation and pattern matching", color: "purple", icon: "text" },
  { name: "Dynamic Programming", description: "Optimization problems and memoization", color: "green", icon: "chart" },
  { name: "Tree", description: "Binary trees, BST, and tree traversals", color: "orange", icon: "tree" },
  { name: "Graph", description: "Graph algorithms, DFS, BFS, shortest paths", color: "red", icon: "network" },
  { name: "Linked List", description: "Singly, doubly linked lists and operations", color: "cyan", icon: "link" },
  { name: "Hash Table", description: "Hash maps, sets, and hashing techniques", color: "pink", icon: "hash" },
  { name: "Stack & Queue", description: "LIFO and FIFO data structure operations", color: "indigo", icon: "stack" },
];

async function seedDatabase() {
  console.log("🌱 Seeding database with default topics...");
  
  try {
    for (const topic of defaultTopics) {
      await storage.createTopic({
        name: topic.name,
        description: topic.description,
        color: topic.color,
        icon: topic.icon,
        isCustom: 0,
      });
      console.log(`✅ Created topic: ${topic.name}`);
    }
    console.log("🎉 Database seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

seedDatabase();
