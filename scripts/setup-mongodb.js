#!/usr/bin/env node

/**
 * MongoDB Setup Script for LeetCode Vault
 * This script helps you initialize your MongoDB database with default topics
 */

import mongoose from 'mongoose';
import { TopicModel } from '../shared/schema.js';

const defaultTopics = [
  { name: "Array", description: "Linear data structures and manipulation techniques", color: "blue", icon: "grid", isCustom: 0 },
  { name: "String", description: "String manipulation and pattern matching", color: "purple", icon: "text", isCustom: 0 },
  { name: "Dynamic Programming", description: "Optimization problems and memoization", color: "green", icon: "chart", isCustom: 0 },
  { name: "Tree", description: "Binary trees, BST, and tree traversals", color: "orange", icon: "tree", isCustom: 0 },
  { name: "Graph", description: "Graph algorithms, DFS, BFS, shortest paths", color: "red", icon: "network", isCustom: 0 },
  { name: "Linked List", description: "Singly, doubly linked lists and operations", color: "cyan", icon: "link", isCustom: 0 },
  { name: "Hash Table", description: "Hash maps, sets, and hashing techniques", color: "pink", icon: "hash", isCustom: 0 },
  { name: "Stack & Queue", description: "LIFO and FIFO data structure operations", color: "indigo", icon: "stack", isCustom: 0 },
];

async function setupMongoDB() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is required');
      console.log('💡 Add MONGODB_URI to your .env file');
      console.log('   Example: MONGODB_URI=mongodb://localhost:27017/leetcodevault');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Check if topics already exist
    const existingTopics = await TopicModel.countDocuments({ isCustom: 0 });
    
    if (existingTopics > 0) {
      console.log(`ℹ️  Found ${existingTopics} existing default topics. Skipping seeding.`);
      console.log('🎉 Database is already set up!');
    } else {
      console.log('🌱 Seeding database with default topics...');
      
      for (const topic of defaultTopics) {
        try {
          const newTopic = new TopicModel(topic);
          await newTopic.save();
          console.log(`  ✅ Created topic: ${topic.name}`);
        } catch (error) {
          console.log(`  ❌ Error creating topic ${topic.name}:`, error.message);
        }
      }
      
      console.log('🎉 Database setup completed successfully!');
    }

    // Display stats
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    const topicCount = await mongoose.connection.db.collection('topics').countDocuments();
    const problemCount = await mongoose.connection.db.collection('problems').countDocuments();

    console.log('\n📊 Database Statistics:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Topics: ${topicCount}`);
    console.log(`   Problems: ${problemCount}`);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Tips:');
      console.log('   - Make sure MongoDB is running');
      console.log('   - Check your MONGODB_URI in .env file');
      console.log('   - For local MongoDB: mongodb://localhost:27017/leetcodevault');
      console.log('   - For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/leetcodevault');
    }
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

setupMongoDB();
