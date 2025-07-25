export const TOPIC_COLORS: Record<string, string> = {
  blue: "bg-gradient-to-br from-blue-500 to-blue-700",
  purple: "bg-gradient-to-br from-purple-500 to-purple-700", 
  green: "bg-gradient-to-br from-green-500 to-green-700",
  orange: "bg-gradient-to-br from-orange-500 to-orange-700",
  red: "bg-gradient-to-br from-red-500 to-red-700",
  cyan: "bg-gradient-to-br from-cyan-500 to-cyan-700",
  pink: "bg-gradient-to-br from-pink-500 to-pink-700",
  indigo: "bg-gradient-to-br from-indigo-500 to-indigo-700",
};

export const DIFFICULTY_COLORS = {
  Easy: "bg-green-500 text-white",
  Medium: "bg-yellow-500 text-black", 
  Hard: "bg-red-500 text-white",
};

export const DEFAULT_TOPICS = [
  {
    name: "Arrays",
    description: "Linear data structures and manipulation techniques",
    color: "blue",
    icon: "grid"
  },
  {
    name: "Strings", 
    description: "String manipulation and pattern matching",
    color: "purple",
    icon: "text"
  },
  {
    name: "Dynamic Programming",
    description: "Optimization problems and memoization", 
    color: "green",
    icon: "chart"
  },
  {
    name: "Trees",
    description: "Binary trees, BST, and tree traversals",
    color: "orange", 
    icon: "tree"
  },
  {
    name: "Graphs",
    description: "Graph algorithms, DFS, BFS, shortest paths",
    color: "red",
    icon: "network"
  },
  {
    name: "Linked Lists",
    description: "Singly, doubly linked lists and operations",
    color: "cyan",
    icon: "link"
  },
  {
    name: "Hash Tables", 
    description: "Hash maps, sets, and hashing techniques",
    color: "pink",
    icon: "hash"
  },
  {
    name: "Stack & Queue",
    description: "LIFO and FIFO data structure operations",
    color: "indigo",
    icon: "stack"
  }
];
