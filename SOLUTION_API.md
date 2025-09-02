# Solution API Documentation

## Overview
The Solution API allows you to manage multiple solutions for each LeetCode problem. Each solution contains detailed information about the approach, complexity analysis, code, and notes.

## Solution Schema
```typescript
interface Solution {
  id: string;
  problemId: string;         // Reference to the problem
  name: string;              // Solution name (e.g., "Two Pointers Approach")
  approach: string;          // Algorithm approach description
  timeComplexity: string;    // Big O time complexity (e.g., "O(n)")
  spaceComplexity: string;   // Big O space complexity (e.g., "O(1)")
  explanation: string;       // Detailed explanation of the solution
  code: string;              // The actual code implementation
  language: string;          // Programming language (e.g., "cpp", "python")
  notes: string;             // Additional notes or observations
  userId?: string;           // User who created the solution
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### 1. Get Solutions for a Problem
**GET** `/api/problems/:problemId/solutions`

**Query Parameters:**
- `userId` (optional): Filter solutions by user

**Response:**
```json
[
  {
    "id": "solution_id",
    "problemId": "problem_id",
    "name": "Two Pointers Solution",
    "approach": "Use two pointers from start and end",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)",
    "explanation": "We use two pointers...",
    "code": "class Solution {\npublic:\n    ...\n};",
    "language": "cpp",
    "notes": "This is optimal for sorted arrays",
    "userId": "user_id",
    "createdAt": "2025-07-26T...",
    "updatedAt": "2025-07-26T..."
  }
]
```

### 2. Get Specific Solution
**GET** `/api/solutions/:solutionId`

**Response:**
```json
{
  "id": "solution_id",
  "problemId": "problem_id",
  "name": "Dynamic Programming Solution",
  "approach": "Bottom-up DP with memoization",
  "timeComplexity": "O(n²)",
  "spaceComplexity": "O(n)",
  "explanation": "We build the solution iteratively...",
  "code": "def solution(nums):\n    dp = [0] * len(nums)\n    ...",
  "language": "python",
  "notes": "Can be optimized to O(1) space",
  "userId": "user_id",
  "createdAt": "2025-07-26T...",
  "updatedAt": "2025-07-26T..."
}
```

### 3. Create New Solution
**POST** `/api/solutions`

**Request Body:**
```json
{
  "problemId": "problem_id",
  "name": "Recursive Solution",
  "approach": "Divide and conquer with recursion",
  "timeComplexity": "O(2^n)",
  "spaceComplexity": "O(n)",
  "explanation": "We recursively solve subproblems...",
  "code": "int solve(vector<int>& nums) {\n    if (nums.empty()) return 0;\n    ...\n}",
  "language": "cpp",
  "notes": "Not optimal but easy to understand",
  "userId": "user_id"
}
```

**Response:**
```json
{
  "id": "new_solution_id",
  "problemId": "problem_id",
  "name": "Recursive Solution",
  "approach": "Divide and conquer with recursion",
  "timeComplexity": "O(2^n)",
  "spaceComplexity": "O(n)",
  "explanation": "We recursively solve subproblems...",
  "code": "int solve(vector<int>& nums) {\n    if (nums.empty()) return 0;\n    ...\n}",
  "language": "cpp",
  "notes": "Not optimal but easy to understand",
  "userId": "user_id",
  "createdAt": "2025-07-26T...",
  "updatedAt": "2025-07-26T..."
}
```

### 4. Update Solution
**PATCH** `/api/solutions/:solutionId`

**Request Body:**
```json
{
  "timeComplexity": "O(n log n)",
  "spaceComplexity": "O(log n)",
  "notes": "Updated after optimization"
}
```

**Response:**
```json
{
  "id": "solution_id",
  "problemId": "problem_id",
  "name": "Optimized Solution",
  "approach": "Sort then binary search",
  "timeComplexity": "O(n log n)",
  "spaceComplexity": "O(log n)",
  "explanation": "After sorting the array...",
  "code": "// Updated code here",
  "language": "cpp",
  "notes": "Updated after optimization",
  "userId": "user_id",
  "createdAt": "2025-07-26T...",
  "updatedAt": "2025-07-26T..."
}
```

### 5. Delete Solution
**DELETE** `/api/solutions/:solutionId`

**Response:**
```json
{
  "message": "Solution deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid solution data",
  "errors": [
    {
      "path": ["name"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

### 404 Not Found
```json
{
  "message": "Solution not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to create solution"
}
```

## Usage Examples

### Frontend Integration (React)
```typescript
import { apiRequest } from "@/lib/queryClient";

// Get solutions for a problem
const solutions = await apiRequest("GET", `/api/problems/${problemId}/solutions`);

// Create a new solution
const newSolution = await apiRequest("POST", "/api/solutions", {
  problemId,
  name: "Hash Map Solution",
  approach: "Use hash map for O(1) lookups",
  timeComplexity: "O(n)",
  spaceComplexity: "O(n)",
  explanation: "We iterate through the array once...",
  code: "// C++ code here",
  language: "cpp",
  notes: "Trade space for time",
  userId: currentUserId
});

// Update a solution
const updatedSolution = await apiRequest("PATCH", `/api/solutions/${solutionId}`, {
  notes: "Added edge case handling"
});

// Delete a solution
await apiRequest("DELETE", `/api/solutions/${solutionId}`);
```

## Best Practices

1. **Descriptive Names**: Use clear, descriptive names for solutions (e.g., "Two Pointers", "Binary Search", "Dynamic Programming")

2. **Accurate Complexity**: Always provide accurate time and space complexity analysis

3. **Detailed Explanations**: Include step-by-step explanations of the algorithm

4. **Code Comments**: Add comments in the code to explain key parts

5. **Comparative Notes**: Use notes to compare with other approaches or mention trade-offs

6. **Version Control**: Create new solutions instead of overwriting to maintain solution history
