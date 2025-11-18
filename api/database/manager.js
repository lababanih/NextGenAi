// api/database/manager.js
// MULTI-DATABASE FEDERATION SYSTEM
// Manages multiple MongoDB + Supabase + Vercel KV as one distributed brain

import { MongoClient } from 'mongodb';

class DatabaseManager {
  constructor() {
    this.databases = [];
    this.initialized = false;
    this.healthStatus = new Map();
  }

  async initialize() {
    if (this.initialized) return;

    console.log('🚀 Initializing Multi-Database Federation...');

    await this.loadMongoDatabases();
    await this.loadSupabaseDatabases();
    await this.loadVercelKV();

    this.initialized = true;
    console.log(`✅ Federation ready with ${this.databases.length} databases`);
    
    this.startHealthMonitoring();
  }

  async loadMongoDatabases() {
    const mongoConfigs = this.getMongoConfigs();
    
    for (let i = 0; i < mongoConfigs.length; i++) {
      const config = mongoConfigs[i];
      try {
        const client = new MongoClient(config.uri, {
          maxPoolSize: 10,
          minPoolSize: 2,
          maxIdleTimeMS: 30000,
        });

        await client.connect();
        const db = client.db(config.dbName);

        await this.ensureCollections(db);

        this.databases.push({
          id: `mongodb_${i + 1}`,
          type: 'mongodb',
          name: config.name,
          client,
          db,
          status: 'active',
          priority: config.priority || i + 1,
          capacity: config.capacity || 512,
          currentSize: 0
        });

        console.log(`  ✅ MongoDB ${i + 1}: ${config.name} connected`);
      } catch (error) {
        console.error(`  ❌ MongoDB ${i + 1} failed:`, error.message);
      }
    }
  }

  async loadSupabaseDatabases() {
    const supabaseConfigs = this.getSupabaseConfigs();
    
    for (let i = 0; i < supabaseConfigs.length; i++) {
      const config = supabaseConfigs[i];
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(config.url, config.key);

        const { error } = await supabase.from('knowledge_base').select('count').limit(1);
        if (!error || error.message.includes('does not exist')) {
          await this.ensureSupabaseTables(supabase);
        }

        this.databases.push({
          id: `supabase_${i + 1}`,
          type: 'supabase',
          name: config.name,
          client: supabase,
          status: 'active',
          priority: config.priority || (100 + i),
          capacity: config.capacity || 500
        });

        console.log(`  ✅ Supabase ${i + 1}: ${config.name} connected`);
      } catch (error) {
        console.error(`  ❌ Supabase ${i + 1} failed:`, error.message);
      }
    }
  }

  async loadVercelKV() {
    try {
      if (!process.env.KV_REST_API_URL) {
        console.log('  ⚠️  Vercel KV not configured');
        return;
      }

      const { kv } = await import('@vercel/kv');
      await kv.ping();

      this.databases.push({
        id: 'vercel_kv',
        type: 'vercel_kv',
        name: 'Vercel KV',
        client: kv,
        status: 'active',
        priority: 200,
        capacity: 256
      });

      console.log('  ✅ Vercel KV connected');
    } catch (error) {
      console.error('  ❌ Vercel KV failed:', error.message);
    }
  }

  getMongoConfigs() {
    const configs = [];
    
    for (let i = 1; i <= 10; i++) {
      const uri = process.env[`MONGODB_URI_${i}`] || (i === 1 ? process.env.MONGODB_URI : null);
      if (uri) {
        configs.push({
          uri,
          dbName: process.env[`MONGODB_DB_${i}`] || 'nextgenai',
          name: process.env[`MONGODB_NAME_${i}`] || `MongoDB ${i}`,
          priority: i,
          capacity: 512
        });
      }
    }

    return configs;
  }

  getSupabaseConfigs() {
    const configs = [];
    
    for (let i = 1; i <= 5; i++) {
      const url = process.env[`SUPABASE_URL_${i}`] || (i === 1 ? process.env.SUPABASE_URL : null);
      const key = process.env[`SUPABASE_KEY_${i}`] || (i === 1 ? process.env.SUPABASE_KEY : null);
      
      if (url && key) {
        configs.push({
          url,
          key,
          name: process.env[`SUPABASE_NAME_${i}`] || `Supabase ${i}`,
          priority: 100 + i
        });
      }
    }

    return configs;
  }

  async ensureCollections(db) {
    const collections = ['knowledge_base', 'conversations', 'learning_history'];
    
    for (const collName of collections) {
      try {
        await db.createCollection(collName);
      } catch (error) {
        // Collection might already exist
      }
    }

    await db.collection('knowledge_base').createIndex({ topic: 1, language: 1 });
    await db.collection('knowledge_base').createIndex({ tags: 1 });
    await db.collection('knowledge_base').createIndex({ createdAt: -1 });
  }

  async ensureSupabaseTables(supabase) {
    const createSQL = `
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic TEXT NOT NULL,
        language TEXT,
        content TEXT,
        code TEXT,
        tags TEXT[],
        source TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_knowledge_topic ON knowledge_base(topic);
      CREATE INDEX IF NOT EXISTS idx_knowledge_language ON knowledge_base(language);
      CREATE INDEX IF NOT EXISTS idx_knowledge_created ON knowledge_base(created_at);
    `;

    try {
      await supabase.rpc('exec_sql', { sql: createSQL });
    } catch (error) {
      console.log('  ℹ️  Could not auto-create tables, please create manually');
    }
  }

  getHealthyDatabases() {
    return this.databases
      .filter(db => db.status === 'active')
      .sort((a, b) => a.priority - b.priority);
  }

  selectDatabaseForWrite() {
    const healthy = this.getHealthyDatabases();
    
    if (healthy.length === 0) {
      throw new Error('No healthy databases available');
    }

    const available = healthy.filter(db => 
      !db.currentSize || db.currentSize < db.capacity * 0.9
    );

    if (available.length === 0) {
      throw new Error('All databases at capacity');
    }

    return available[0];
  }

  async saveKnowledge(data) {
    if (!this.initialized) await this.initialize();

    const db = this.selectDatabaseForWrite();
    
    try {
      if (db.type === 'mongodb') {
        const result = await db.db.collection('knowledge_base').insertOne({
          ...data,
          createdAt: new Date(),
          source: db.name
        });
        return { success: true, id: result.insertedId, database: db.name };
      }

      if (db.type === 'supabase') {
        const { data: inserted, error } = await db.client
          .from('knowledge_base')
          .insert({
            topic: data.topic,
            language: data.language,
            content: data.content,
            code: data.code,
            tags: data.tags,
            source: db.name
          })
          .select();

        if (error) throw error;
        return { success: true, id: inserted[0].id, database: db.name };
      }

      if (db.type === 'vercel_kv') {
        const key = `knowledge:${data.topic}:${Date.now()}`;
        await db.client.set(key, JSON.stringify(data));
        return { success: true, id: key, database: db.name };
      }

    } catch (error) {
      console.error(`❌ Failed to save to ${db.name}:`, error);
      db.status = 'error';
      return await this.saveKnowledge(data);
    }
  }

  async searchKnowledge(query, options = {}) {
    if (!this.initialized) await this.initialize();

    const { language, tags, limit = 10 } = options;
    const results = [];

    const searchPromises = this.getHealthyDatabases().map(async (db) => {
      try {
        if (db.type === 'mongodb') {
          const filter = { topic: new RegExp(query, 'i') };
          if (language) filter.language = language;
          if (tags) filter.tags = { $in: tags };

          const found = await db.db.collection('knowledge_base')
            .find(filter)
            .limit(limit)
            .sort({ createdAt: -1 })
            .toArray();

          return found.map(item => ({
            ...item,
            source_db: db.name,
            id: item._id.toString()
          }));
        }

        if (db.type === 'supabase') {
          let queryBuilder = db.client
            .from('knowledge_base')
            .select('*')
            .ilike('topic', `%${query}%`)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (language) queryBuilder = queryBuilder.eq('language', language);

          const { data, error } = await queryBuilder;
          if (error) throw error;

          return (data || []).map(item => ({
            ...item,
            source_db: db.name
          }));
        }

        if (db.type === 'vercel_kv') {
          const keys = await db.client.keys(`knowledge:*${query}*`);
          const items = await Promise.all(
            keys.slice(0, limit).map(async (key) => {
              const data = await db.client.get(key);
              return { ...JSON.parse(data), id: key, source_db: db.name };
            })
          );
          return items;
        }

        return [];
      } catch (error) {
        console.error(`Search error in ${db.name}:`, error);
        return [];
      }
    });

    const allResults = await Promise.all(searchPromises);
    allResults.forEach(dbResults => results.push(...dbResults));

    return results
      .sort((a, b) => {
        const dateA = a.createdAt || a.created_at || 0;
        const dateB = b.createdAt || b.created_at || 0;
        return new Date(dateB) - new Date(dateA);
      })
      .slice(0, limit);
  }

  startHealthMonitoring() {
    setInterval(() => this.checkHealth(), 60000);
  }

  async checkHealth() {
    for (const db of this.databases) {
      try {
        if (db.type === 'mongodb') {
          await db.client.db().admin().ping();
          db.status = 'active';
        } else if (db.type === 'supabase') {
          await db.client.from('knowledge_base').select('count').limit(1);
          db.status = 'active';
        } else if (db.type === 'vercel_kv') {
          await db.client.ping();
          db.status = 'active';
        }
      } catch (error) {
        console.error(`Health check failed for ${db.name}`);
        db.status = 'error';
      }
    }
  }

  getStatus() {
    return {
      total: this.databases.length,
      active: this.databases.filter(db => db.status === 'active').length,
      databases: this.databases.map(db => ({
        id: db.id,
        name: db.name,
        type: db.type,
        status: db.status,
        priority: db.priority
      }))
    };
  }
}

const dbManager = new DatabaseManager();

export default dbManager;
