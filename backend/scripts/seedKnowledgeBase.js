/**
 * Seed Knowledge Base
 * Populates the knowledge collection with sample educational content
 *
 * Usage: node backend/scripts/seedKnowledgeBase.js
 */

import aiOrchestrator from '../services/aiOrchestrator.js';

const sampleKnowledge = [
  {
    content: `Python is a high-level, interpreted programming language known for its simplicity and readability.
It's an excellent language for beginners due to its clear syntax that emphasizes readability and reduces the cost of program maintenance.
Python supports multiple programming paradigms, including procedural, object-oriented, and functional programming.`,
    metadata: {
      title: 'Introduction to Python',
      topic: 'Python Basics',
      difficulty: 'beginner',
      tags: ['python', 'programming', 'beginner'],
    },
  },
  {
    content: `To start learning Python, you'll need to install Python on your computer.
Visit python.org and download the latest version for your operating system.
After installation, you can write Python code in a text editor and run it using the python command in your terminal,
or use an Interactive Development Environment (IDE) like PyCharm, VS Code, or Jupyter Notebook.`,
    metadata: {
      title: 'Getting Started with Python',
      topic: 'Python Setup',
      difficulty: 'beginner',
      tags: ['python', 'setup', 'installation'],
    },
  },
  {
    content: `Python basics include variables, data types, operators, and control flow.
Variables store data values and don't require explicit declaration. Common data types include integers (int),
floating-point numbers (float), strings (str), booleans (bool), and collections like lists, tuples, dictionaries, and sets.
Control flow is managed through if/elif/else statements, for and while loops, and functions.`,
    metadata: {
      title: 'Python Fundamentals',
      topic: 'Python Basics',
      difficulty: 'beginner',
      tags: ['python', 'variables', 'data-types', 'control-flow'],
    },
  },
  {
    content: `JavaScript is the programming language of the web, used to create interactive and dynamic web pages.
It runs in the browser and can manipulate HTML and CSS, respond to user events, and communicate with servers.
Modern JavaScript (ES6+) includes features like arrow functions, promises, async/await, classes, and modules.`,
    metadata: {
      title: 'Introduction to JavaScript',
      topic: 'JavaScript Basics',
      difficulty: 'beginner',
      tags: ['javascript', 'web-development', 'programming'],
    },
  },
  {
    content: `Data structures are ways of organizing and storing data efficiently.
Common data structures include arrays (ordered collections), linked lists (nodes connected by pointers),
stacks (Last-In-First-Out), queues (First-In-First-Out), trees (hierarchical structures),
graphs (networks of nodes), and hash tables (key-value pairs).
Choosing the right data structure is crucial for algorithm efficiency.`,
    metadata: {
      title: 'Data Structures Overview',
      topic: 'Data Structures',
      difficulty: 'intermediate',
      tags: ['data-structures', 'algorithms', 'computer-science'],
    },
  },
  {
    content: `Machine Learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed.
Types include supervised learning (learning from labeled data), unsupervised learning (finding patterns in unlabeled data),
and reinforcement learning (learning through trial and error). Popular ML frameworks include TensorFlow, PyTorch, and scikit-learn.`,
    metadata: {
      title: 'Introduction to Machine Learning',
      topic: 'Machine Learning',
      difficulty: 'advanced',
      tags: ['machine-learning', 'ai', 'data-science'],
    },
  },
  {
    content: `Web development involves creating websites and web applications.
Frontend development focuses on what users see and interact with, using HTML, CSS, and JavaScript.
Backend development handles server-side logic, databases, and APIs, using languages like Python, Node.js, Java, or PHP.
Full-stack developers work on both frontend and backend.`,
    metadata: {
      title: 'Web Development Basics',
      topic: 'Web Development',
      difficulty: 'beginner',
      tags: ['web-development', 'frontend', 'backend', 'full-stack'],
    },
  },
  {
    content: `Git is a distributed version control system used to track changes in source code during software development.
It allows multiple developers to work on the same project simultaneously. Basic Git commands include git init (initialize repository),
git add (stage changes), git commit (save changes), git push (upload to remote), git pull (download from remote),
and git branch (manage branches).`,
    metadata: {
      title: 'Git Version Control',
      topic: 'Version Control',
      difficulty: 'beginner',
      tags: ['git', 'version-control', 'collaboration'],
    },
  },
  {
    content: `Object-Oriented Programming (OOP) is a programming paradigm based on objects containing data and methods.
Key concepts include classes (blueprints for objects), objects (instances of classes), inheritance (classes inheriting from parent classes),
encapsulation (bundling data and methods), polymorphism (objects taking multiple forms), and abstraction (hiding complex implementation details).`,
    metadata: {
      title: 'Object-Oriented Programming Principles',
      topic: 'OOP',
      difficulty: 'intermediate',
      tags: ['oop', 'programming', 'design-patterns'],
    },
  },
  {
    content: `SQL (Structured Query Language) is used to manage and query relational databases.
Basic operations include SELECT (retrieve data), INSERT (add new data), UPDATE (modify existing data),
DELETE (remove data), JOIN (combine data from multiple tables), and WHERE (filter results).
Popular SQL databases include MySQL, PostgreSQL, SQLite, and Microsoft SQL Server.`,
    metadata: {
      title: 'SQL Database Basics',
      topic: 'Databases',
      difficulty: 'beginner',
      tags: ['sql', 'databases', 'data-management'],
    },
  },
  {
    content: `Algorithms are step-by-step procedures for solving problems or performing tasks.
Important algorithm types include sorting (bubble sort, merge sort, quick sort),
searching (linear search, binary search), graph algorithms (BFS, DFS, Dijkstra's),
dynamic programming (breaking problems into subproblems), and greedy algorithms (making locally optimal choices).`,
    metadata: {
      title: 'Algorithm Fundamentals',
      topic: 'Algorithms',
      difficulty: 'intermediate',
      tags: ['algorithms', 'problem-solving', 'computer-science'],
    },
  },
  {
    content: `REST (Representational State Transfer) APIs are architectural styles for building web services.
RESTful APIs use HTTP methods: GET (retrieve), POST (create), PUT/PATCH (update), DELETE (remove).
They are stateless, meaning each request contains all necessary information.
REST APIs typically return data in JSON format and use standard HTTP status codes (200 OK, 404 Not Found, 500 Server Error).`,
    metadata: {
      title: 'RESTful API Design',
      topic: 'APIs',
      difficulty: 'intermediate',
      tags: ['rest', 'api', 'web-services', 'http'],
    },
  },
];

async function seedKnowledgeBase() {
  console.log('🌱 Seeding Knowledge Base...\n');

  try {
    // Initialize AI pipeline
    console.log('Initializing AI pipeline...');
    const initResult = await aiOrchestrator.initialize();

    if (!initResult.success) {
      console.error('❌ Failed to initialize AI pipeline:', initResult.error);
      console.error('\nPlease ensure ChromaDB is running:');
      console.error('  pip install chromadb');
      console.error('  chroma run --path ./data/chromadb');
      process.exit(1);
    }

    if (!initResult.chromaAvailable) {
      console.error('❌ ChromaDB is not available');
      console.error('\nPlease start ChromaDB server first:');
      console.error('  pip install chromadb');
      console.error('  chroma run --path ./data/chromadb');
      process.exit(1);
    }

    console.log('✅ AI pipeline initialized\n');

    // Ingest knowledge documents
    console.log(`📚 Adding ${sampleKnowledge.length} knowledge documents...\n`);

    let successCount = 0;
    let failCount = 0;

    for (const doc of sampleKnowledge) {
      try {
        await aiOrchestrator.ingestContent('knowledge', doc.content, doc.metadata);
        console.log(`  ✓ Added: ${doc.metadata.title}`);
        successCount++;
      } catch (error) {
        console.error(`  ✗ Failed: ${doc.metadata.title} - ${error.message}`);
        failCount++;
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Success: ${successCount}/${sampleKnowledge.length}`);
    console.log(`   Failed: ${failCount}/${sampleKnowledge.length}`);

    // Get stats
    const stats = await aiOrchestrator.getStats();
    console.log('\n📊 Knowledge Base Stats:');
    console.log(`   Total documents: ${stats.vectorStore.totalDocuments}`);
    console.log(`   Knowledge collection: ${stats.vectorStore.collections.knowledge || 0}`);

    // Cleanup
    await aiOrchestrator.cleanup();

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding knowledge base:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedKnowledgeBase();
}

export default seedKnowledgeBase;
