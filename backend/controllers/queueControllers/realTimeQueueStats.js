const QueueStatistics = require('../../models/queueStatistics');
const Queue = require('../../models/queue');

// In-memory cache for real-time queue statistics
const queueStatsCache = new Map();

// Helper function to get today's date key
const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// Initialize queue stats for today
const initializeQueueStats = (queueId, queueName) => {
  const todayKey = getTodayKey();
  const key = `${queueId}-${todayKey}`;
  
  if (!queueStatsCache.has(key)) {
    queueStatsCache.set(key, {
      queueId,
      queueName,
      date: todayKey,
      
      // Real-time counters
      totalCalls: 0,
      answeredCalls: 0,
      abandonedCalls: 0,
      missedCalls: 0,
      currentWaitingCallers: 0,
      
      // Time tracking
      totalWaitTime: 0,
      totalTalkTime: 0,
      totalHoldTime: 0,
      longestWaitTime: 0,
      shortestWaitTime: null,
      
      // Service level tracking
      callsWithinServiceLevel: 0,
      serviceLevelTarget: 60,
      
      // Current state
      activeAgents: 0,
      availableAgents: 0,
      busyAgents: 0,
      
      // Hourly breakdown
      hourlyStats: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        calls: 0,
        answered: 0,
        abandoned: 0,
        avgWaitTime: 0,
        avgTalkTime: 0,
        waitingCallers: 0
      })),
      
      lastUpdated: new Date()
    });
  }
  
  return queueStatsCache.get(key);
};

// Get current stats for a queue
const getQueueStats = (queueId) => {
  const todayKey = getTodayKey();
  const key = `${queueId}-${todayKey}`;
  return queueStatsCache.get(key);
};

// Update queue statistics in real-time
const updateQueueStats = (queueId, queueName, updates) => {
  const stats = initializeQueueStats(queueId, queueName);
  const currentHour = new Date().getHours();
  
  // Apply updates
  Object.keys(updates).forEach(key => {
    if (key === 'hourlyUpdate') {
      // Update hourly stats
      const hourlyData = updates[key];
      Object.keys(hourlyData).forEach(hourlyKey => {
        stats.hourlyStats[currentHour][hourlyKey] += hourlyData[hourlyKey];
      });
    } else if (typeof updates[key] === 'number') {
      stats[key] += updates[key];
    } else {
      stats[key] = updates[key];
    }
  });
  
  // Recalculate derived metrics
  if (stats.totalCalls > 0) {
    stats.averageWaitTime = Math.round(stats.totalWaitTime / stats.totalCalls);
    stats.serviceLevelPercentage = Math.round((stats.callsWithinServiceLevel / stats.totalCalls) * 100 * 100) / 100;
  }
  
  if (stats.answeredCalls > 0) {
    stats.averageTalkTime = Math.round(stats.totalTalkTime / stats.answeredCalls);
    stats.averageHoldTime = Math.round(stats.totalHoldTime / stats.answeredCalls);
  }
  
  stats.answerRate = stats.totalCalls > 0 ? Math.round((stats.answeredCalls / stats.totalCalls) * 100 * 100) / 100 : 0;
  stats.abandonmentRate = stats.totalCalls > 0 ? Math.round((stats.abandonedCalls / stats.totalCalls) * 100 * 100) / 100 : 0;
  
  stats.lastUpdated = new Date();
  
  return stats;
};

// Handle queue caller join event
const handleQueueCallerJoin = (event, io) => {
  const { Queue: queueId, CallerIDNum, Position } = event;
  
  // Get queue name from global state or database
  const queueName = global.queueNameMap?.[queueId] || queueId;
  
  const stats = updateQueueStats(queueId, queueName, {
    totalCalls: 1,
    currentWaitingCallers: 1,
    hourlyUpdate: {
      calls: 1,
      waitingCallers: 1
    }
  });
  
  // Emit real-time update
  io.emit('queueStatsUpdate', {
    queueId,
    stats: {
      ...stats,
      event: 'caller_joined',
      callerInfo: {
        callerId: CallerIDNum,
        position: Position,
        timestamp: new Date()
      }
    }
  });
  
  console.log(`📊 Queue ${queueId}: Caller joined, total calls today: ${stats.totalCalls}`);
};

// Handle queue caller leave/abandon event
const handleQueueCallerLeave = (event, io, reason = 'answered') => {
  const { Queue: queueId, CallerIDNum, Uniqueid } = event;
  
  // Get queue name
  const queueName = global.queueNameMap?.[queueId] || queueId;
  
  // Calculate wait time if available from global state
  const waitTime = global.state?.queueCallers?.find(c => c.id === Uniqueid)?.waitTime || 0;
  
  const updates = {
    currentWaitingCallers: -1,
    totalWaitTime: waitTime
  };
  
  // Update based on reason
  if (reason === 'answered') {
    updates.answeredCalls = 1;
    updates.hourlyUpdate = { answered: 1 };
    
    // Check service level
    if (waitTime <= 60) { // 60 seconds service level
      updates.callsWithinServiceLevel = 1;
    }
  } else if (reason === 'abandoned') {
    updates.abandonedCalls = 1;
    updates.hourlyUpdate = { abandoned: 1 };
  }
  
  // Update wait time records
  const stats = getQueueStats(queueId);
  if (stats) {
    if (waitTime > stats.longestWaitTime) {
      updates.longestWaitTime = waitTime;
    }
    if (stats.shortestWaitTime === null || waitTime < stats.shortestWaitTime) {
      updates.shortestWaitTime = waitTime;
    }
  }
  
  const updatedStats = updateQueueStats(queueId, queueName, updates);
  
  // Emit real-time update
  io.emit('queueStatsUpdate', {
    queueId,
    stats: {
      ...updatedStats,
      event: `caller_${reason}`,
      callerInfo: {
        callerId: CallerIDNum,
        waitTime,
        timestamp: new Date()
      }
    }
  });
  
  console.log(`📊 Queue ${queueId}: Caller ${reason}, answer rate: ${updatedStats.answerRate}%`);
};

// Handle agent status changes in queue
const handleQueueAgentStatus = (queueId, agentExtension, status, io) => {
  const queueName = global.queueNameMap?.[queueId] || queueId;
  
  const updates = {};
  
  // Update agent counts based on status
  switch (status) {
    case 'available':
      updates.availableAgents = 1;
      updates.busyAgents = -1;
      break;
    case 'busy':
      updates.availableAgents = -1;
      updates.busyAgents = 1;
      break;
    case 'online':
      updates.activeAgents = 1;
      updates.availableAgents = 1;
      break;
    case 'offline':
      updates.activeAgents = -1;
      updates.availableAgents = -1;
      break;
  }
  
  const stats = updateQueueStats(queueId, queueName, updates);
  
  // Emit agent status update for queue
  io.emit('queueAgentStatusUpdate', {
    queueId,
    agentExtension,
    status,
    queueStats: {
      activeAgents: stats.activeAgents,
      availableAgents: stats.availableAgents,
      busyAgents: stats.busyAgents
    }
  });
};

// Get all queue statistics for dashboard
const getAllQueueStats = () => {
  const todayKey = getTodayKey();
  const allStats = [];
  
  queueStatsCache.forEach((stats, key) => {
    if (key.includes(todayKey)) {
      allStats.push(stats);
    }
  });
  
  return allStats.sort((a, b) => b.totalCalls - a.totalCalls);
};

// Emit all queue statistics
const emitAllQueueStats = (io) => {
  const allStats = getAllQueueStats();
  io.emit('allQueueStats', {
    timestamp: new Date(),
    queues: allStats,
    summary: {
      totalQueues: allStats.length,
      totalCalls: allStats.reduce((sum, q) => sum + q.totalCalls, 0),
      totalAnswered: allStats.reduce((sum, q) => sum + q.answeredCalls, 0),
      totalAbandoned: allStats.reduce((sum, q) => sum + q.abandonedCalls, 0),
      totalWaiting: allStats.reduce((sum, q) => sum + q.currentWaitingCallers, 0),
      avgAnswerRate: allStats.length > 0 ? 
        Math.round(allStats.reduce((sum, q) => sum + q.answerRate, 0) / allStats.length * 100) / 100 : 0
    }
  });
};

// Persist statistics to database (called periodically)
const persistQueueStats = async () => {
  const todayKey = getTodayKey();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const [key, stats] of queueStatsCache.entries()) {
    if (key.includes(todayKey)) {
      try {
        await QueueStatistics.findOneAndUpdate(
          { queueId: stats.queueId, date: today },
          {
            ...stats,
            date: today,
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error(`Error persisting queue stats for ${stats.queueId}:`, error);
      }
    }
  }
};

// Setup AMI event listeners for queue statistics
const setupQueueStatsListeners = (ami, io) => {
  // Load existing queues into cache
  Queue.find({}).then(queues => {
    console.log(`📊 Found ${queues.length} queues in database`);
    queues.forEach(queue => {
      initializeQueueStats(queue.queueId, queue.name);
    });
    console.log(`📊 Initialized stats for ${queues.length} queues`);
    
    // Emit initial stats
    setTimeout(() => {
      emitAllQueueStats(io);
    }, 2000);
  }).catch(error => {
    console.error('❌ Error loading queues:', error);
  });
  
  // Listen to queue events
  ami.on('QueueCallerJoin', (event) => {
    handleQueueCallerJoin(event, io);
  });
  
  ami.on('QueueCallerLeave', (event) => {
    handleQueueCallerLeave(event, io, 'answered');
  });
  
  ami.on('QueueCallerAbandon', (event) => {
    handleQueueCallerLeave(event, io, 'abandoned');
  });
  
  // Emit stats every 5 seconds
  setInterval(() => {
    emitAllQueueStats(io);
  }, 5000);
  
  // Persist to database every 5 minutes
  setInterval(() => {
    persistQueueStats();
  }, 5 * 60 * 1000);
  
  console.log('📊 Queue statistics listeners setup complete');
};

module.exports = {
  setupQueueStatsListeners,
  getQueueStats,
  getAllQueueStats,
  updateQueueStats,
  handleQueueAgentStatus,
  emitAllQueueStats,
  persistQueueStats
};