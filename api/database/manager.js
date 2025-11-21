// api/database/manager.js
// MULTI-DATABASE FEDERATION MANAGER
// Manages unlimited storage using multiple free database tiers

class DatabaseManager {
  constructor() {
    this.databases = {
      mongodb: [],
      supabase: [],
      vercelKV: null
    };
    
    this.status = {
      initialized: false,
      totalCapacity: 0,
      usedSpace: 0,
      databases: []
    };
    
    this.initialized = false;
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  async initialize(config = null) {
    if (this.initialized) {
      console.log('📦 Database manager already initialized');
      return;
    }

    console.log('🚀 Initializing database federation...');

    try {
      // Load configuration
      const dbConfig = config || this.loadFromEnv();
      
      // Initialize MongoDB connections
      await this.initializeMongoDB(dbConfig.mongodb);
      
      // Initialize Supabase connections
      await this.initializeSupabase(dbConfig.supabase);
      
      // Initialize Vercel KV
      if (dbConfig.vercelKV) {
        await this.initializeVercelKV(dbConfig.vercelKV);
      }
      
      // Calculate total capacity
      this.calculateCapacity();
      
      this.initialized = true;
      
      console.log(`✅ Database federation initialized:
        - MongoDB: ${this.databases.mongodb.length} instances
        - Supabase: ${this.databases.supabase.length} instances
        - Vercel KV: ${this.databases.vercelKV ? '1' : '0'} instance
        - Total Capacity: ${this.status.totalCapacity} MB
      `);
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  loadFromEnv() {
    const config = {
      mongodb: [],
      supabase: [],
      vercelKV: null
    };

    // Load MongoDB (up to 10)
    for (let i = 1; i <= 10; i++) {
      const uri = process.env[`MONGODB_URI_${i}`];
      const db = process.env[`MONGODB_DB_${i}`] || 'nextgenai';
      const name = process.env[`MONGODB_NAME_${i}`] || `MongoDB ${i}`;

      if (uri) {
        config.mongodb.push({ id: `mongodb-${i}`, name, uri, database: db, capacity: 512 });
      }
    }

    // Load Supabase (up to 5)
    for (let i = 1; i <= 5; i++) {
      const url = process.env[`SUPABASE_URL_${i}`];
      const key = process.env[`SUPABASE_KEY_${i}`];
      const name = process.env[`SUPABASE_NAME_${i}`] || `Supabase ${i}`;

      if (url && key) {
        config.supabase.push({ id: `supabase-${i}`, name, url, key, capacity: 500 });
      }
    }

    // Load Vercel KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      config.vercelKV = {
        id: 'vercel-kv',
        name: 'Vercel KV',
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
        capacity: 256
      };
    }

    return config;
  }

  async initializeMongoDB(configs) {
    if (!configs || configs.length === 0) {
      console.log('⚠️  No MongoDB configured');
      return;
    }

    const { MongoClient } = await import('mongodb');
    
    for (const config of configs) {
      try {
        const client = new MongoClient(config.uri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000
        });
        
        await client.connect();
        const db = client.db(config.database);
        
        // Create indexes for fast search
        await db.collection('knowledge').createIndex({ topic: 'text', content: 'text', tags: 1 });
        await db.collection('knowledge').createIndex({ createdAt: -1 });
        await db.collection('knowledge').createIndex({ language: 1 });
        
        this.databases.mongodb.push({
          ...config,
          client,
          db,
          type: 'mongodb',
          status: 'connected',
          usedSpace: 0 // Will be calculated
        });
        
        console.log(`  ✅ ${config.name} connected`);
        
      } catch (error) {
        console.error(`  ❌ ${config.name} failed:`, error.message);
        this.databases.mongodb.push({
          ...config,
          type: 'mongodb',
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async initializeSupabase(configs) {
    if (!configs || configs.length === 0) {
      console.log('⚠️  No Supabase configured');
      return;
    }

    const { createClient } = await import('@supabase/supabase-js');
    
    for (const config of configs) {
      try {
        const supabase = createClient(config.url, config.key);
        
        // Test connection
        const { error } = await supabase.from('knowledge').select('count', { count: 'exact', head: true });
        
        if (error && error.code === '42P01') {
          // Table doesn't exist, create it
          console.log(`  🔨 Creating knowledge table in ${config.name}...`);
          // Note: You need to create table via Supabase dashboard or SQL
          // This is just a check
        }
        
        this.databases.supabase.push({
          ...config,
          client: supabase,
          type: 'supabase',
          status: 'connected',
          usedSpace: 0
        });
        
        console.log(`  ✅ ${config.name} connected`);
        
      } catch (error) {
        console.error(`  ❌ ${config.name} failed:`, error.message);
        this.databases.supabase.push({
          ...config,
          type: 'supabase',
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async initializeVercelKV(config) {
    try {
      const { kv } = await import('@vercel/kv');
      
      // Test connection
      await kv.ping();
      
      this.databases.vercelKV = {
        ...config,
        client: kv,
        type: 'vercel-kv',
        status: 'connected',
        usedSpace: 0
      };
      
      console.log(`  ✅ Vercel KV connected`);
      
    } catch (error) {
      console.error(`  ❌ Vercel KV failed:`, error.message);
      this.databases.vercelKV = {
        ...config,
        type: 'vercel-kv',
        status: 'failed',
        error: error.message
      };
    }
  }

  calculateCapacity() {
    let total = 0;
    
    this.databases.mongodb.forEach(db => {
      if (db.status === 'connected') total += db.capacity;
    });
    
    this.databases.supabase.forEach(db => {
      if (db.status === 'connected') total += db.capacity;
    });
    
    if (this.databases.vercelKV?.status === 'connected') {
      total += this.databases.vercelKV.capacity;
    }
    
    this.status.totalCapacity = total;
  }

  // ==========================================
  // SMART ROUTING: Select best database
  // ==========================================

  selectDatabase(dataSize = 1) {
    // Priority: MongoDB → Supabase → Vercel KV
    
    // 1. Try MongoDB (best for large data)
    const availableMongoDB = this.databases.mongodb
      .filter(db => db.status === 'connected')
      .filter(db => (db.capacity - db.usedSpace) > dataSize)
      .sort((a, b) => (b.capacity - b.usedSpace) - (a.capacity - a.usedSpace));
    
    if (availableMongoDB.length > 0) {
      return availableMongoDB[0];
    }
    
    // 2. Try Supabase
    const availableSupabase = this.databases.supabase
      .filter(db => db.status === 'connected')
      .filter(db => (db.capacity - db.usedSpace) > dataSize)
      .sort((a, b) => (b.capacity - b.usedSpace) - (a.capacity - a.usedSpace));
    
    if (availableSupabase.length > 0) {
      return availableSupabase[0];
    }
    
    // 3. Try Vercel KV (for small data only)
    if (this.databases.vercelKV?.status === 'connected' && dataSize < 1) {
      return this.databases.vercelKV;
    }
    
    throw new Error('No available database with sufficient space');
  }

  // ==========================================
  // SAVE KNOWLEDGE
  // ==========================================

  async saveKnowledge(data) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('💾 Saving knowledge to database...');

    // Estimate data size (rough)
    const dataSize = JSON.stringify(data).length / (1024 * 1024); // MB
    
    try {
      // Select best database
      const db = this.selectDatabase(dataSize);
      
      console.log(`  📦 Selected: ${db.name} (${db.capacity - db.usedSpace} MB free)`);
      
      // Prepare document
      const document = {
        id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        topic: data.topic,
        language: data.language || 'general',
        content: data.content,
        code: data.code || null,
        tags: data.tags || [],
        metadata: data.metadata || {},
        source_db: db.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: data.version || 1
      };
      
      // Save to selected database
      let result;
      
      if (db.type === 'mongodb') {
        result = await db.db.collection('knowledge').insertOne(document);
        document._id = result.insertedId;
      } else if (db.type === 'supabase') {
        const { data: inserted, error } = await db.client
          .from('knowledge')
          .insert([document])
          .select();
        
        if (error) throw error;
        document.id = inserted[0].id;
      } else if (db.type === 'vercel-kv') {
        await db.client.set(`knowledge:${document.id}`, JSON.stringify(document));
      }
      
      // Update used space estimate
      db.usedSpace += dataSize;
      
      console.log(`  ✅ Saved to ${db.name}: ${document.id}`);
      
      return {
        success: true,
        id: document.id,
        database: db.name,
        size: dataSize
      };
      
    } catch (error) {
      console.error('❌ Save failed:', error);
      throw error;
    }
  }

  // ==========================================
  // SEARCH KNOWLEDGE (Federated Search)
  // ==========================================

  async searchKnowledge(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`🔍 Searching for: "${query}"`);

    const {
      language = null,
      tags = [],
      limit = 10
    } = options;

    try {
      const results = [];
      
      // Search in all MongoDB databases
      const mongoSearches = this.databases.mongodb
        .filter(db => db.status === 'connected')
        .map(db => this.searchMongoDB(db, query, language, tags, limit));
      
      // Search in all Supabase databases
      const supabaseSearches = this.databases.supabase
        .filter(db => db.status === 'connected')
        .map(db => this.searchSupabase(db, query, language, tags, limit));
      
      // Execute all searches in parallel
      const allResults = await Promise.allSettled([
        ...mongoSearches,
        ...supabaseSearches
      ]);
      
      // Collect successful results
      allResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(...result.value);
        }
      });
      
      // Sort by relevance and remove duplicates
      const uniqueResults = this.deduplicateResults(results);
      const sortedResults = this.sortByRelevance(uniqueResults, query);
      
      console.log(`  ✅ Found ${sortedResults.length} results`);
      
      return sortedResults.slice(0, limit);
      
    } catch (error) {
      console.error('❌ Search failed:', error);
      return [];
    }
  }

  async searchMongoDB(db, query, language, tags, limit) {
    try {
      const filter = {
        $text: { $search: query }
      };
      
      if (language) filter.language = language;
      if (tags.length > 0) filter.tags = { $in: tags };
      
      const results = await db.db.collection('knowledge')
        .find(filter)
        .project({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .toArray();
      
      return results.map(r => ({
        ...r,
        source_db: db.name,
        relevance: r.score
      }));
      
    } catch (error) {
      console.error(`Search failed in ${db.name}:`, error.message);
      return [];
    }
  }

  async searchSupabase(db, query, language, tags, limit) {
    try {
      let supabaseQuery = db.client
        .from('knowledge')
        .select('*')
        .textSearch('content', query);
      
      if (language) supabaseQuery = supabaseQuery.eq('language', language);
      if (tags.length > 0) supabaseQuery = supabaseQuery.contains('tags', tags);
      
      const { data, error } = await supabaseQuery.limit(limit);
      
      if (error) throw error;
      
      return data.map(r => ({
        ...r,
        source_db: db.name,
        relevance: 1 // Supabase doesn't return text score
      }));
      
    } catch (error) {
      console.error(`Search failed in ${db.name}:`, error.message);
      return [];
    }
  }

  deduplicateResults(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = `${result.topic}-${result.language}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  sortByRelevance(results, query) {
    return results.sort((a, b) => {
      // Sort by relevance score if available
      if (a.relevance && b.relevance) {
        return b.relevance - a.relevance;
      }
      // Otherwise sort by date
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  // ==========================================
  // STATUS & MONITORING
  // ==========================================

  getStatus() {
    const connectedMongoDB = this.databases.mongodb.filter(db => db.status === 'connected');
    const connectedSupabase = this.databases.supabase.filter(db => db.status === 'connected');
    
    return {
      initialized: this.initialized,
      totalDatabases: connectedMongoDB.length + connectedSupabase.length + (this.databases.vercelKV?.status === 'connected' ? 1 : 0),
      totalCapacity: this.status.totalCapacity,
      databases: {
        mongodb: connectedMongoDB.map(db => ({
          name: db.name,
          capacity: db.capacity,
          used: db.usedSpace,
          free: db.capacity - db.usedSpace
        })),
        supabase: connectedSupabase.map(db => ({
          name: db.name,
          capacity: db.capacity,
          used: db.usedSpace,
          free: db.capacity - db.usedSpace
        })),
        vercelKV: this.databases.vercelKV?.status === 'connected' ? {
          name: this.databases.vercelKV.name,
          capacity: this.databases.vercelKV.capacity,
          used: this.databases.vercelKV.usedSpace,
          free: this.databases.vercelKV.capacity - this.databases.vercelKV.usedSpace
        } : null
      }
    };
  }

  async getStorageStats() {
    const stats = {
      totalDocuments: 0,
      totalSize: 0,
      byDatabase: []
    };

    // Get stats from MongoDB
    for (const db of this.databases.mongodb.filter(d => d.status === 'connected')) {
      try {
        const count = await db.db.collection('knowledge').countDocuments();
        const dbStats = await db.db.stats();
        
        stats.totalDocuments += count;
        stats.totalSize += dbStats.dataSize / (1024 * 1024); // Convert to MB
        
        stats.byDatabase.push({
          name: db.name,
          type: 'mongodb',
          documents: count,
          size: dbStats.dataSize / (1024 * 1024)
        });
        
      } catch (error) {
        console.error(`Stats failed for ${db.name}:`, error.message);
      }
    }

    return stats;
  }
}

// Singleton instance
const dbManager = new DatabaseManager();

export default dbManager;

// Export for direct use
export { DatabaseManager };
